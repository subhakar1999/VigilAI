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
from .auth import require_api_token
from .endpoint_discovery import EndpointDiscoveryError, discover_endpoint_bundle
from .models import PentestRequest, PentestRun, Project, Scan, Team, TeamMember, Workload
from .quality_gate import assessment_incomplete, evaluate_quality_gate
from .schemas import (
    EndpointOnboardRequest,
    EndpointOnboardResponse,
    PentestCallback,
    PentestFailure,
    PentestLease,
    PentestTrigger,
    ProjectCreate,
    ProjectDetail,
    ProjectSummary,
    ProjectWorkloadLink,
    ScanResponse,
    ScanSubmission,
    TeamCreate,
    TeamDetail,
    TeamMemberCreate,
    TeamMemberView,
    WorkloadDetail,
    WorkloadSummary,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="VigilAI Control Plane", version="0.1.0", lifespan=lifespan, dependencies=[Depends(require_api_token)])
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["GET", "POST", "DELETE"], allow_headers=["*"])
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
    decision = evaluate_quality_gate(findings, graph, current_asr, assessment_incomplete(workload.source_path, workload.endpoint_url, graph, workload.pentest_stats))
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
    workloads = list(session.exec(select(Workload).order_by(Workload.updated_at.desc())).all())
    for workload in workloads:
        decision = evaluate_quality_gate(workload.findings, workload.graph, float(workload.pentest_stats.get("attack_success_rate", 0.0)), assessment_incomplete(workload.source_path, workload.endpoint_url, workload.graph, workload.pentest_stats))
        workload.quality_gate_status = decision.status
    return workloads


@app.get("/api/v1/workloads/{workload_id}", response_model=WorkloadDetail)
def get_workload(workload_id: str, session: SessionDependency) -> WorkloadDetail:
    workload = session.get(Workload, workload_id)
    if workload is None:
        raise HTTPException(status_code=404, detail="Workload not found")
    latest_run = session.exec(
        select(PentestRun)
        .where(PentestRun.workload_id == workload.id)
        .order_by(PentestRun.created_at.desc())
    ).first()
    pentest_stats = dict(workload.pentest_stats)
    if latest_run is not None:
        pentest_stats.update(
            {
                "latest_run_id": latest_run.id,
                "successful_exploits": latest_run.successful_exploits,
                "total_episodes": latest_run.total_episodes,
                "attack_success_rate": latest_run.attack_success_rate,
                "logs": latest_run.logs,
                "compromised_node_ids": latest_run.compromised_node_ids,
                "created_at": latest_run.created_at.isoformat(),
            }
        )
    asr = float(pentest_stats.get("attack_success_rate", 0.0))
    decision = evaluate_quality_gate(workload.findings, workload.graph, asr, assessment_incomplete(workload.source_path, workload.endpoint_url, workload.graph, pentest_stats))
    return WorkloadDetail.model_validate(
        {
            **workload.model_dump(),
            "quality_gate_status": decision.status,
            "pentest_stats": pentest_stats,
            "quality_gate_reasons": list(decision.reasons),
        }
    )


@app.delete("/api/v1/workloads/{workload_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workload(workload_id: str, session: SessionDependency) -> Response:
    workload = session.get(Workload, workload_id)
    if workload is None:
        raise HTTPException(status_code=404, detail="Workload not found")

    for record_type in (Scan, PentestRun, PentestRequest):
        records = session.exec(select(record_type).where(record_type.workload_id == workload_id)).all()
        for record in records:
            session.delete(record)

    projects = session.exec(select(Project)).all()
    for project in projects:
        if workload_id not in project.workload_ids:
            continue
        project.workload_ids = [item for item in project.workload_ids if item != workload_id]
        project.updated_at = datetime.now(timezone.utc)
        session.add(project)

    session.delete(workload)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _team_view(team: Team, session: Session) -> TeamDetail:
    members = list(session.exec(select(TeamMember).where(TeamMember.team_id == team.id).order_by(TeamMember.created_at)).all())
    projects = list(session.exec(select(Project).where(Project.team_id == team.id)).all())
    return TeamDetail(
        id=team.id,
        name=team.name,
        description=team.description,
        member_count=len(members),
        project_count=len(projects),
        members=[TeamMemberView.model_validate(member) for member in members],
    )


@app.get("/api/v1/teams", response_model=list[TeamDetail])
def list_teams(session: SessionDependency) -> list[TeamDetail]:
    teams = session.exec(select(Team).order_by(Team.name)).all()
    return [_team_view(team, session) for team in teams]


@app.post("/api/v1/teams", response_model=TeamDetail, status_code=status.HTTP_201_CREATED)
def create_team(payload: TeamCreate, session: SessionDependency) -> TeamDetail:
    duplicate = next((team for team in session.exec(select(Team)).all() if team.name.casefold() == payload.name.strip().casefold()), None)
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="A team with this name already exists")
    team = Team(name=payload.name.strip(), description=payload.description.strip())
    session.add(team)
    session.commit()
    session.refresh(team)
    return _team_view(team, session)


@app.get("/api/v1/teams/{team_id}", response_model=TeamDetail)
def get_team(team_id: str, session: SessionDependency) -> TeamDetail:
    team = session.get(Team, team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return _team_view(team, session)


@app.post("/api/v1/teams/{team_id}/members", response_model=TeamMemberView, status_code=status.HTTP_201_CREATED)
def add_team_member(team_id: str, payload: TeamMemberCreate, session: SessionDependency) -> TeamMember:
    if session.get(Team, team_id) is None:
        raise HTTPException(status_code=404, detail="Team not found")
    existing = session.exec(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.email == payload.email)
    ).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="This email is already a member of the team")
    member = TeamMember(team_id=team_id, **payload.model_dump())
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@app.delete("/api/v1/teams/{team_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(team_id: str, member_id: str, session: SessionDependency) -> Response:
    member = session.get(TeamMember, member_id)
    if member is None or member.team_id != team_id:
        raise HTTPException(status_code=404, detail="Team member not found")
    session.delete(member)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _project_workloads(project: Project, session: Session) -> list[Workload]:
    workloads = [workload for workload_id in project.workload_ids if (workload := session.get(Workload, workload_id)) is not None]
    for workload in workloads:
        workload.quality_gate_status = evaluate_quality_gate(workload.findings, workload.graph, float(workload.pentest_stats.get("attack_success_rate", 0.0)), assessment_incomplete(workload.source_path, workload.endpoint_url, workload.graph, workload.pentest_stats)).status
    return workloads


def _project_summary(project: Project, session: Session) -> ProjectSummary:
    workloads = _project_workloads(project, session)
    statuses = {evaluate_quality_gate(workload.findings, workload.graph, float(workload.pentest_stats.get("attack_success_rate", 0.0)), assessment_incomplete(workload.source_path, workload.endpoint_url, workload.graph, workload.pentest_stats)).status for workload in workloads}
    quality_status = "FAILED" if "FAILED" in statuses else "PASSED" if workloads and statuses == {"PASSED"} else "UNKNOWN"
    team = session.get(Team, project.team_id) if project.team_id else None
    return ProjectSummary(
        id=project.id,
        key=project.key,
        name=project.name,
        description=project.description,
        visibility=project.visibility,
        team_id=project.team_id,
        team_name=team.name if team else None,
        source_provider=project.source_provider,
        repository_url=project.repository_url,
        quality_gate_policy=project.quality_gate_policy,
        workload_ids=project.workload_ids,
        workload_count=len(workloads),
        quality_gate_status=quality_status,
        risk_score=max((workload.risk_score for workload in workloads), default=0),
    )


@app.get("/api/v1/projects", response_model=list[ProjectSummary])
def list_projects(session: SessionDependency) -> list[ProjectSummary]:
    projects = session.exec(select(Project).order_by(Project.updated_at.desc())).all()
    return [_project_summary(project, session) for project in projects]


@app.post("/api/v1/projects", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, session: SessionDependency) -> ProjectDetail:
    project_key = payload.key.strip().lower()
    if session.exec(select(Project).where(Project.key == project_key)).first() is not None:
        raise HTTPException(status_code=409, detail="A project with this key already exists")
    if payload.team_id and session.get(Team, payload.team_id) is None:
        raise HTTPException(status_code=404, detail="Team not found")
    workload_ids = list(dict.fromkeys(payload.workload_ids))
    missing = [workload_id for workload_id in workload_ids if session.get(Workload, workload_id) is None]
    if missing:
        raise HTTPException(status_code=400, detail=f"Unknown workload ids: {', '.join(missing)}")
    project = Project(
        **payload.model_dump(exclude={"key", "workload_ids"}),
        key=project_key,
        workload_ids=workload_ids,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    summary = _project_summary(project, session)
    return ProjectDetail(**summary.model_dump(), workloads=[WorkloadSummary.model_validate(item) for item in _project_workloads(project, session)])


@app.get("/api/v1/projects/{project_id}", response_model=ProjectDetail)
def get_project(project_id: str, session: SessionDependency) -> ProjectDetail:
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    summary = _project_summary(project, session)
    return ProjectDetail(**summary.model_dump(), workloads=[WorkloadSummary.model_validate(item) for item in _project_workloads(project, session)])


@app.post("/api/v1/projects/{project_id}/workloads", response_model=ProjectDetail)
def link_project_workload(project_id: str, payload: ProjectWorkloadLink, session: SessionDependency) -> ProjectDetail:
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if session.get(Workload, payload.workload_id) is None:
        raise HTTPException(status_code=404, detail="Workload not found")
    project.workload_ids = list(dict.fromkeys([*project.workload_ids, payload.workload_id]))
    project.updated_at = datetime.now(timezone.utc)
    session.add(project)
    session.commit()
    session.refresh(project)
    summary = _project_summary(project, session)
    return ProjectDetail(**summary.model_dump(), workloads=[WorkloadSummary.model_validate(item) for item in _project_workloads(project, session)])


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
    workload = session.get(Workload, request.workload_id)
    if workload is not None:
        workload.pentest_stats = {**workload.pentest_stats, "assessment_error": payload.error}
        decision = evaluate_quality_gate(workload.findings, workload.graph, float(workload.pentest_stats.get("attack_success_rate", 0.0)), assessment_incomplete(workload.source_path, workload.endpoint_url, workload.graph, workload.pentest_stats))
        workload.quality_gate_status = decision.status
        session.add(workload)
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
    workload.pentest_stats = {
        "latest_run_id": run.id,
        "successful_exploits": payload.successful_exploits,
        "total_episodes": payload.total_episodes,
        "attack_success_rate": asr,
        "logs": payload.logs,
        "compromised_node_ids": payload.compromised_node_ids,
    }
    decision = evaluate_quality_gate(workload.findings, graph, asr, assessment_incomplete(workload.source_path, workload.endpoint_url, graph, workload.pentest_stats))
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

