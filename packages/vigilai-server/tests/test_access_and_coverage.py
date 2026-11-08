import httpx
import pytest

from app.auth import require_api_token
from app.endpoint_policy import require_allowed_endpoint
from app.main import app
from app.quality_gate import assessment_incomplete, evaluate_quality_gate


@pytest.mark.asyncio
async def test_api_requires_configured_token(monkeypatch):
    app.dependency_overrides.pop(require_api_token, None)
    monkeypatch.setenv("VIGILAI_API_TOKEN", "a" * 32)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        assert (await client.get("/health")).status_code == 200
        assert (await client.get("/api/v1/workloads")).status_code == 401
        assert (await client.post("/api/v1/scans/submit", headers={"Authorization": "Bearer " + "a" * 32}, json={})).status_code == 422
        monkeypatch.delenv("VIGILAI_API_TOKEN")
        assert (await client.get("/api/v1/workloads")).status_code == 503


def test_outbound_allowlist(monkeypatch):
    monkeypatch.setenv("VIGILAI_ALLOWED_AGENT_HOSTS", "localhost,agent.test")
    require_allowed_endpoint("http://agent.test/agent")
    with pytest.raises(ValueError):
        require_allowed_endpoint("http://metadata.google.internal/")
    with pytest.raises(ValueError):
        require_allowed_endpoint("http://agent.test@evil.test/")


def test_incomplete_evidence_is_unknown_and_findings_still_fail():
    graph = {"nodes": [{"id": "endpoint", "file_path": "http://agent.test/agent"}], "edges": []}
    reason = assessment_incomplete(None, "http://agent.test/agent", graph, {})
    assert evaluate_quality_gate([], graph, incomplete_reason=reason).status == "UNKNOWN"
    assert evaluate_quality_gate([{"severity": "HIGH"}], graph, incomplete_reason=reason).status == "FAILED"
    assert assessment_incomplete("agent.py", "http://agent.test/agent", {}, {"total_episodes": 1, "logs": [{"trace": {}}]})
