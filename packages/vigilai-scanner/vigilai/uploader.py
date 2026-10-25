"""Control-plane upload client."""

from __future__ import annotations

from typing import Any

import httpx


def submit_scan(server: str, payload: dict[str, Any], timeout: float = 30.0) -> dict[str, Any]:
    response = httpx.post(f"{server.rstrip('/')}/api/v1/scans/submit", json=payload, timeout=timeout)
    response.raise_for_status()
    return response.json()


def submit_endpoint(
    server: str,
    endpoint_url: str,
    name: str | None = None,
    timeout: float = 30.0,
) -> dict[str, Any]:
    payload: dict[str, Any] = {"endpoint_url": endpoint_url}
    if name:
        payload["name"] = name
    response = httpx.post(f"{server.rstrip('/')}/api/v1/endpoints/onboard", json=payload, timeout=timeout)
    response.raise_for_status()
    return response.json()

