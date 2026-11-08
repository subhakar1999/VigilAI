"""Control-plane bearer token authentication."""
import hmac
import os

from fastapi import HTTPException, Request


def require_api_token(request: Request) -> None:
    if request.url.path == "/health" or request.method == "OPTIONS":
        return
    expected = os.getenv("VIGILAI_API_TOKEN", "")
    if len(expected) < 32:
        raise HTTPException(status_code=503, detail="Control plane API token is not configured")
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer ") or not hmac.compare_digest(authorization[7:].encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Valid API bearer token required", headers={"WWW-Authenticate": "Bearer"})
