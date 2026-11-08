import httpx
import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.database import get_session
from app.main import app


@pytest.mark.asyncio
async def test_team_member_and_project_onboarding_flow() -> None:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)

    def test_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = test_session
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            team_response = await client.post(
                "/api/v1/teams",
                json={"name": "AI Platform", "description": "Owns production agents"},
            )
            assert team_response.status_code == 201
            team_id = team_response.json()["id"]

            member_response = await client.post(
                f"/api/v1/teams/{team_id}/members",
                json={"name": "Asha", "email": "ASHA@example.com", "role": "MAINTAINER", "status": "ACTIVE"},
            )
            assert member_response.status_code == 201
            assert member_response.json()["email"] == "asha@example.com"
            member_id = member_response.json()["id"]

            scan_response = await client.post(
                "/api/v1/scans/submit",
                json={
                    "workload": {"name": "support-agent", "framework": "LangGraph"},
                    "findings": [],
                    "graph": {"nodes": [], "edges": []},
                    "aibom": {"components": []},
                    "sarif": {},
                },
            )
            workload_id = scan_response.json()["workload_id"]

            project_response = await client.post(
                "/api/v1/projects",
                json={
                    "key": "SUPPORT_AI",
                    "name": "Support AI",
                    "description": "Customer support automation",
                    "visibility": "PRIVATE",
                    "team_id": team_id,
                    "source_provider": "GITHUB",
                    "repository_url": "https://github.com/example/support-ai",
                    "workload_ids": [workload_id],
                },
            )
            assert project_response.status_code == 201
            project = project_response.json()
            assert project["key"] == "support_ai"
            assert project["team_name"] == "AI Platform"
            assert project["quality_gate_status"] == "PASSED"
            assert project["workload_count"] == 1

            teams = await client.get("/api/v1/teams")
            assert teams.json()[0]["member_count"] == 1
            assert teams.json()[0]["project_count"] == 1

            projects = await client.get("/api/v1/projects")
            assert projects.json()[0]["workload_ids"] == [workload_id]

            deleted_workload = await client.delete(f"/api/v1/workloads/{workload_id}")
            assert deleted_workload.status_code == 204
            project_after_delete = await client.get(f"/api/v1/projects/{project['id']}")
            assert project_after_delete.json()["workload_ids"] == []
            assert project_after_delete.json()["quality_gate_status"] == "UNKNOWN"

            removed = await client.delete(f"/api/v1/teams/{team_id}/members/{member_id}")
            assert removed.status_code == 204
            assert (await client.get(f"/api/v1/teams/{team_id}")).json()["member_count"] == 0
    finally:
        app.dependency_overrides.clear()
