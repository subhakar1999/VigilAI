import httpx
import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.database import get_session
from app.main import app


@pytest.mark.asyncio
async def test_scan_to_pentest_quality_gate_flow() -> None:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)

    def test_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = test_session
    transport = httpx.ASGITransport(app=app)
    try:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            submitted = await client.post(
                "/api/v1/scans/submit",
                json={
                    "workload": {"name": "safe-agent", "framework": "LangGraph", "endpoint_url": "http://agent.test/vigilai"},
                    "findings": [],
                    "graph": {"nodes": [{"id": "planner", "label": "Planner", "category": "REASONING", "file_path": "agent.py", "line": 1}], "edges": []},
                    "aibom": {
                        "components": [
                            {
                                "name": "operations-mcp",
                                "properties": [
                                    {"name": "vigilai:kind", "value": "mcp-server"},
                                    {"name": "vigilai:tools", "value": "[{\"name\": \"delete_order\"}]"},
                                ],
                            }
                        ]
                    },
                    "sarif": {},
                },
            )
            assert submitted.status_code == 201
            scan = submitted.json()
            assert scan["quality_gate_status"] == "PASSED"

            triggered = await client.post(
                "/api/v1/pentest/trigger",
                json={"workload_id": scan["workload_id"]},
            )
            assert triggered.status_code == 202
            request_id = triggered.json()["request_id"]

            duplicate = await client.post(
                "/api/v1/pentest/trigger",
                json={"workload_id": scan["workload_id"]},
            )
            assert duplicate.json()["request_id"] == request_id

            lease = await client.get(
                "/api/v1/pentest/requests/next",
                params={"worker_id": "test-worker"},
            )
            assert lease.status_code == 200
            assert lease.json()["request_id"] == request_id
            assert lease.json()["endpoint_url"] == "http://agent.test/vigilai"
            assert lease.json()["tool_schemas"] == [{"name": "delete_order"}]

            callback = await client.post(
                "/api/v1/pentest/callback",
                json={
                    "workload_id": scan["workload_id"],
                    "request_id": request_id,
                    "worker_id": "test-worker",
                    "successful_exploits": 1,
                    "total_episodes": 2,
                    "attack_success_rate": 0.5,
                    "compromised_node_ids": ["planner"],
                    "logs": [],
                },
            )
            assert callback.status_code == 200
            assert callback.json()["quality_gate_status"] == "FAILED"

            detail = await client.get(f"/api/v1/workloads/{scan['workload_id']}")
            assert detail.status_code == 200
            assert detail.json()["graph"]["nodes"][0]["is_vulnerable"] is True

            empty = await client.get(
                "/api/v1/pentest/requests/next",
                params={"worker_id": "test-worker"},
            )
            assert empty.status_code == 204
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_endpoint_only_onboarding(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)

    def test_session():
        with Session(engine) as session:
            yield session

    async def fake_discovery(endpoint_url: str, name: str | None):
        bundle = {
            "workload": {
                "name": name or "Discovered Agent",
                "framework": "OpenAPI",
                "endpoint_url": endpoint_url,
                "source_path": None,
            },
            "findings": [],
            "graph": {
                "nodes": [
                    {
                        "id": "endpoint",
                        "label": name or "Discovered Agent",
                        "category": "REASONING",
                        "file_path": endpoint_url,
                        "line": 1,
                    }
                ],
                "edges": [],
            },
            "aibom": {"components": []},
            "sarif": {},
        }
        return bundle, {
            "endpoint_url": endpoint_url,
            "http_status": 200,
            "openapi_detected": True,
            "discovered_routes": 3,
        }

    monkeypatch.setattr("app.main.discover_endpoint_bundle", fake_discovery)
    app.dependency_overrides[get_session] = test_session
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/endpoints/onboard",
                json={"endpoint_url": "http://agent.test/vigilai-test", "name": "portal-agent"},
            )
            assert response.status_code == 201
            payload = response.json()
            assert payload["discovered_routes"] == 3
            assert payload["quality_gate_status"] == "PASSED"

            detail = await client.get(f"/api/v1/workloads/{payload['workload_id']}")
            assert detail.status_code == 200
            assert detail.json()["name"] == "portal-agent"
            assert detail.json()["source_path"] is None
    finally:
        app.dependency_overrides.clear()
