"""Explicit outbound target policy for agent endpoint discovery."""
import os
from urllib.parse import urlsplit


def require_allowed_endpoint(url: str) -> None:
    parsed = urlsplit(url)
    allowed = {host.strip().lower().rstrip(".") for host in os.getenv("VIGILAI_ALLOWED_AGENT_HOSTS", "localhost,127.0.0.1,::1,host.docker.internal,test-agents").split(",") if host.strip()}
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password or parsed.hostname.lower().rstrip(".") not in allowed:
        raise ValueError("Endpoint host is not in VIGILAI_ALLOWED_AGENT_HOSTS")
