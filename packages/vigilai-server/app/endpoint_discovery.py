"""Bounded, read-only discovery for endpoint-only workload onboarding."""

from __future__ import annotations

import json
import os
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import httpx


MAX_DISCOVERY_BYTES = 2 * 1024 * 1024
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}


class EndpointDiscoveryError(RuntimeError):
    """Raised when an endpoint cannot be reached or described."""


def _docker_host_url(endpoint_url: str) -> str | None:
    parsed = urlsplit(endpoint_url)
    if parsed.hostname not in LOCAL_HOSTS:
        return None
    gateway = os.getenv("VIGILAI_HOST_GATEWAY", "host.docker.internal")
    port = f":{parsed.port}" if parsed.port else ""
    return urlunsplit((parsed.scheme, f"{gateway}{port}", parsed.path, parsed.query, parsed.fragment))


def _origin(endpoint_url: str) -> str:
    parsed = urlsplit(endpoint_url)
    return urlunsplit((parsed.scheme, parsed.netloc, "", "", "")).rstrip("/")


async def _bounded_get(client: httpx.AsyncClient, url: str) -> tuple[int, dict[str, str], bytes]:
    async with client.stream("GET", url, headers={"Accept": "application/json"}) as response:
        body = bytearray()
        async for chunk in response.aiter_bytes():
            body.extend(chunk)
            if len(body) > MAX_DISCOVERY_BYTES:
                raise EndpointDiscoveryError(f"Discovery response exceeded {MAX_DISCOVERY_BYTES} bytes")
        return response.status_code, dict(response.headers), bytes(body)


def _json_document(body: bytes) -> dict[str, Any] | None:
    if not body:
        return None
    try:
        value = json.loads(body)
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
    return value if isinstance(value, dict) else None


def _operation_schema(operation: dict[str, Any]) -> dict[str, Any]:
    request_body = operation.get("requestBody", {})
    if not isinstance(request_body, dict):
        return {"type": "object"}
    content = request_body.get("content", {})
    if not isinstance(content, dict):
        return {"type": "object"}
    media = content.get("application/json")
    if not isinstance(media, dict):
        media = next((item for item in content.values() if isinstance(item, dict)), {})
    schema = media.get("schema", {}) if isinstance(media, dict) else {}
    return schema if isinstance(schema, dict) else {"type": "object"}


def _openapi_operations(document: dict[str, Any] | None) -> list[dict[str, Any]]:
    operations: list[dict[str, Any]] = []
    paths = document.get("paths", {}) if document else {}
    if not isinstance(paths, dict):
        return operations
    for path, path_item in sorted(paths.items()):
        if not isinstance(path_item, dict):
            continue
        for method in ("get", "post", "put", "patch", "delete"):
            operation = path_item.get(method)
            if not isinstance(operation, dict):
                continue
            operation_id = str(operation.get("operationId") or f"{method}_{str(path).strip('/').replace('/', '_') or 'root'}")
            operations.append(
                {
                    "name": operation_id,
                    "description": str(operation.get("summary") or operation.get("description") or f"{method.upper()} {path}"),
                    "method": method.upper(),
                    "path": str(path),
                    "inputSchema": _operation_schema(operation),
                }
            )
    return operations


def _framework(headers: dict[str, str], document: dict[str, Any] | None) -> str:
    server = headers.get("server", "").lower()
    if "uvicorn" in server:
        return "FastAPI"
    if "express" in headers.get("x-powered-by", "").lower():
        return "Express"
    generator = str((document or {}).get("x-generator", "")).lower()
    if generator:
        return generator[:100]
    return "OpenAPI" if document else "HTTP API"


def _sarif() -> dict[str, Any]:
    return {
        "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"tool": {"driver": {"name": "VigilAI endpoint discovery", "rules": []}}, "results": []}],
    }


async def discover_endpoint_bundle(
    endpoint_url: str,
    name: str | None = None,
    *,
    client: httpx.AsyncClient | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Probe an endpoint with GET requests and build a scan-compatible bundle."""

    candidates = [endpoint_url]
    docker_url = _docker_host_url(endpoint_url)
    if docker_url and docker_url not in candidates:
        candidates.append(docker_url)
    owns_client = client is None
    active_client = client or httpx.AsyncClient(timeout=httpx.Timeout(8.0), follow_redirects=False)
    errors: list[str] = []
    try:
        for candidate in candidates:
            try:
                endpoint_status, endpoint_headers, _ = await _bounded_get(active_client, candidate)
                openapi_url = f"{_origin(candidate)}/openapi.json"
                openapi_status, _, openapi_body = await _bounded_get(active_client, openapi_url)
                openapi = _json_document(openapi_body) if openapi_status == 200 else None
                if endpoint_status >= 500 and openapi is None:
                    errors.append(f"{candidate} returned HTTP {endpoint_status}")
                    continue

                operations = _openapi_operations(openapi)
                info = openapi.get("info", {}) if openapi else {}
                inferred_name = str(info.get("title") or urlsplit(candidate).hostname or "endpoint")
                workload_name = (name or inferred_name).strip()
                framework = _framework(endpoint_headers, openapi)
                root_node = {
                    "id": "endpoint",
                    "label": workload_name,
                    "category": "REASONING",
                    "file_path": candidate,
                    "line": 1,
                    "is_vulnerable": False,
                    "is_protected": False,
                }
                nodes = [root_node]
                edges: list[dict[str, Any]] = []
                for index, operation in enumerate(operations, start=1):
                    node_id = f"api:{operation['method'].lower()}:{operation['path']}"
                    nodes.append(
                        {
                            "id": node_id,
                            "label": f"{operation['method']} {operation['path']}",
                            "category": "TOOL",
                            "file_path": openapi_url,
                            "line": index,
                            "is_vulnerable": False,
                            "is_protected": False,
                        }
                    )
                    edges.append({"source": "endpoint", "target": node_id, "is_tainted": False})

                properties = [
                    {"name": "vigilai:kind", "value": "http-endpoint"},
                    {"name": "vigilai:endpoint", "value": candidate},
                    {"name": "vigilai:http-status", "value": str(endpoint_status)},
                    {"name": "vigilai:openapi", "value": "true" if openapi else "false"},
                    {"name": "vigilai:tools", "value": json.dumps(operations, sort_keys=True)},
                ]
                aibom = {
                    "bomFormat": "CycloneDX",
                    "specVersion": "1.6",
                    "version": 1,
                    "metadata": {"component": {"type": "application", "name": workload_name}},
                    "components": [
                        {
                            "type": "application",
                            "name": workload_name,
                            "bom-ref": candidate,
                            "properties": properties,
                        }
                    ],
                }
                bundle = {
                    "workload": {
                        "name": workload_name,
                        "framework": framework,
                        "endpoint_url": candidate,
                        "source_path": None,
                    },
                    "findings": [],
                    "graph": {"nodes": nodes, "edges": edges},
                    "aibom": aibom,
                    "sarif": _sarif(),
                }
                discovery = {
                    "endpoint_url": candidate,
                    "http_status": endpoint_status,
                    "openapi_detected": openapi is not None,
                    "discovered_routes": len(operations),
                }
                return bundle, discovery
            except (httpx.HTTPError, EndpointDiscoveryError) as exc:
                errors.append(f"{candidate}: {exc}")
    finally:
        if owns_client:
            await active_client.aclose()
    detail = "; ".join(errors) or "No reachable endpoint candidate"
    raise EndpointDiscoveryError(detail)
