import pytest

from app.auth import require_api_token
from app.main import app


@pytest.fixture(autouse=True)
def test_api_access(monkeypatch):
    """Existing API contract tests exercise business logic independently of authentication."""
    monkeypatch.setenv("VIGILAI_ALLOWED_AGENT_HOSTS", "localhost,127.0.0.1,::1,host.docker.internal,test-agents,agent.test")
    app.dependency_overrides[require_api_token] = lambda: None
    yield
    app.dependency_overrides.pop(require_api_token, None)
