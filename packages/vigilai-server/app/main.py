"""FastAPI application for VigilAI's control plane."""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
import os
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .database import create_db_and_tables, get_session
from .endpoint_discovery import EndpointDiscoveryError, discover_endpoint_bundle
from .models import PentestRequest, PentestRun, Scan, Workload
from .quality_gate import evaluate_quality_gate
from .schemas import (
    EndpointOnboardRequest,
    EndpointOnboardResponse,
    PentestCallback,
    PentestFailure,
    PentestLease,
    PentestTrigger,
    ScanResponse,
    ScanSubmission,
    WorkloadDetail,
    WorkloadSummary,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="VigilAI Control Plane", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["GET", "POST"], allow_headers=["*"])
SessionDependency = Annotated[Session, Depends(get_session)]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/scans/submit", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
def submit_scan(payload: ScanSubmission, session: SessionDependency) -> ScanResponse:
    return _persist_scan(payload, session)


def _persist_scan(payload: ScanSubmission, session: Session) -> ScanResponse:
    findings = [finding.model_dump(exclude_none=True) for finding in payload.findings]
    graph = payload.graph.model_dump(exclude_none=True)
    workload = session.exec(select(Workload).where(Workload.name == payload.workload.name)).first()
    if workload is None:
        workload = Workload(name=payload.workload.name)
    workload.framework = payload.workload.framework
    workload.endpoint_url = payload.workload.endpoint_url
    workload.source_path = payload.workload.source_path
    workload.findings = findings
    workload.graph = graph
    workload.aibom = payload.aibom
    workload.mcp_count = sum(1 for component in payload.aibom.get("components", []) if any(prop.get("value") == "mcp-server" for prop in component.get("properties", [])))
    current_asr = float(workload.pentest_stats.get("attack_success_rate", 0.0))
    decision = evaluate_quality_gate(findings, graph, current_asr)
    workload.quality_gate_status = decision.status
    workload.risk_score = decision.risk_score
    workload.updated_at = datetime.now(timezone.utc)
    session.add(workload)
    session.flush()

    scan = Scan(workload_id=workload.id, findings=findings, graph=graph, sarif=payload.sarif, quality_gate_status=decision.status)
    session.add(scan)
    session.commit()
    session.refresh(workload)
    session.refresh(scan)
    return ScanResponse(workload_id=workload.id, scan_id=scan.id, quality_gate_status=decision.status, risk_score=decision.risk_score)


@app.post("/api/v1/endpoints/onboard", response_model=EndpointOnboardResponse, status_code=status.HTTP_201_CREATED)
async def onboard_endpoint(payload: EndpointOnboardRequest, session: SessionDependency) -> EndpointOnboardResponse:
    try:
        bundle, discovery = await discover_endpoint_bundle(payload.endpoint_url, payload.name)
    except EndpointDiscoveryError as exc:
        raise HTTPException(status_code=502, detail=f"Endpoint discovery failed: {exc}") from exc
    scan = _persist_scan(ScanSubmission.model_validate(bundle), session)
    return EndpointOnboardResponse(**scan.model_dump(), **discovery)


@app.get("/api/v1/workloads", response_model=list[WorkloadSummary])
def list_workloads(session: SessionDependency) -> list[Workload]:
    return list(session.exec(select(Workload).order_by(Workload.updated_at.desc())).all())


@app.get("/api/v1/workloads/{workload_id}", response_model=WorkloadDetail)
def get_workload(workload_id: str, session: SessionDependency) -> Workload:
    workload = session.get(Workload, workload_id)
    if workload is None:
        raise HTTPException(status_code=404, detail="Workload not found")
    return workload


def _tool_schemas(aibom: dict[str, object]) -> list[dict[str, object]]:
    schemas: list[dict[str, object]] = []
    for component in aibom.get("components", []):
        if not isinstance(component, dict):
            continue
        properties = component.get("properties", [])
        for prop in properties if isinstance(properties, list) else []:
            if not isinstance(prop, dict) or prop.get("name") != "vigilai:tools":
                continue
            try:
                value = json.loads(str(prop.get("value", "[]")))
            except json.JSONDecodeError:
                continue
            if isinstance(value, list):
                schemas.extend(item for item in value if isinstance(item, dict))
    return schemas


@app.post("/api/v1/pentest/trigger", status_code=status.HTTP_202_ACCEPTED)
def trigger_pentest(payload: PentestTrigger, session: SessionDependency) -> dict[str, str]:
    workload = session.get(Workload, payload.workload_id)
    if workload is None:
        raise HTTPException(status_code=404, detail="Workload not found")
    if not workload.endpoint_url:
        raise HTTPException(status_code=409, detail="Workload has no endpoint_url configured")
    existing = session.exec(
        select(PentestRequest).where(
            PentestRequest.workload_id == payload.workload_id,
            PentestRequest.status.in_(["PENDING", "LEASED"]),
        )
    ).first()
    if existing is not None:
        return {"request_id": existing.id, "status": existing.status}
    request = PentestRequest(workload_id=payload.workload_id)
    session.add(request)
    session.commit()
    session.refresh(request)
    return {"request_id": request.id, "status": request.status}


@app.get("/api/v1/pentest/requests/next", response_model=None)
def lease_pentest_request(
    session: SessionDependency,
    worker_id: str = Query(min_length=1, max_length=200),
) -> PentestLease | Response:
    lease_timeout = max(30, int(os.getenv("VIGILAI_PENTEST_LEASE_TIMEOUT_SECONDS", "300")))
    cutoff = datetime.fromtimestamp(datetime.now(timezone.utc).timestamp() - lease_timeout, tz=timezone.utc)
    expired = session.exec(
        select(PentestRequest).where(
            PentestRequest.status == "LEASED",
            PentestRequest.leased_at < cutoff,
        )
    ).all()
    for stale in expired:
        stale.status = "PENDING"
        stale.worker_id = None
        stale.leased_at = None
        session.add(stale)
    if expired:
        session.flush()
    statement = (
        select(PentestRequest)
        .where(PentestRequest.status == "PENDING")
        .order_by(PentestRequest.requested_at)
        .with_for_update(skip_locked=True)
    )
    request = session.exec(statement).first()
    if request is None:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    workload = session.get(Workload, request.workload_id)
    if workload is None or not workload.endpoint_url:
        request.status = "FAILED"
        request.error = "Workload or endpoint is unavailable"
        request.completed_at = datetime.now(timezone.utc)
        session.add(request)
        session.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    request.status = "LEASED"
    request.worker_id = worker_id
    request.leased_at = datetime.now(timezone.utc)
    session.add(request)
    session.commit()
    return PentestLease(
        request_id=request.id,
        workload_id=workload.id,
        workload_name=workload.name,
        endpoint_url=workload.endpoint_url,
        tool_schemas=_tool_schemas(workload.aibom),
    )


@app.post("/api/v1/pentest/requests/{request_id}/fail")
def fail_pentest_request(request_id: str, payload: PentestFailure, session: SessionDependency) -> dict[str, str]:
    request = session.get(PentestRequest, request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Pentest request not found")
    if request.status != "LEASED" or request.worker_id != payload.worker_id:
        raise HTTPException(status_code=409, detail="Pentest request is not leased by this worker")
    request.status = "FAILED"
    request.error = payload.error
    request.completed_at = datetime.now(timezone.utc)
    session.add(request)
    session.commit()
    return {"request_id": request.id, "status": request.status}


@app.post("/api/v1/pentest/callback")
def pentest_callback(payload: PentestCallback, session: SessionDependency) -> dict[str, object]:
    workload = session.get(Workload, payload.workload_id)
    if workload is None:
        raise HTTPException(status_code=404, detail="Workload not found")
    asr = float(payload.attack_success_rate or 0.0)
    run = PentestRun(
        workload_id=payload.workload_id,
        successful_exploits=payload.successful_exploits,
        total_episodes=payload.total_episodes,
        attack_success_rate=asr,
        logs=payload.logs,
        compromised_node_ids=payload.compromised_node_ids,
    )
    compromised = set(payload.compromised_node_ids)
    graph = dict(workload.graph)
    graph["nodes"] = [{**node, "is_vulnerable": str(node.get("id")) in compromised} for node in graph.get("nodes", [])]
    workload.graph = graph
    workload.pentest_stats = {"latest_run_id": run.id, "successful_exploits": payload.successful_exploits, "total_episodes": payload.total_episodes, "attack_success_rate": asr}
    decision = evaluate_quality_gate(workload.findings, graph, asr)
    workload.quality_gate_status = decision.status
    workload.risk_score = decision.risk_score
    workload.updated_at = datetime.now(timezone.utc)
    if payload.request_id:
        request = session.get(PentestRequest, payload.request_id)
        if request is None or request.workload_id != payload.workload_id:
            raise HTTPException(status_code=400, detail="Invalid pentest request_id")
        if request.status != "LEASED" or request.worker_id != payload.worker_id:
            raise HTTPException(status_code=409, detail="Pentest request is not leased by this worker")
        request.status = "COMPLETED"
        request.error = None
        request.completed_at = datetime.now(timezone.utc)
        session.add(request)
    session.add(run)
    session.add(workload)
    session.commit()
    return {"pentest_run_id": run.id, "quality_gate_status": decision.status, "attack_success_rate": asr}

