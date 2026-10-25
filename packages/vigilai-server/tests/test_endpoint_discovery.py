import httpx
import pytest

from app.endpoint_discovery import discover_endpoint_bundle


@pytest.mark.asyncio
async def test_discovers_openapi_routes_and_builds_endpoint_topology() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/vigilai-test":
            return httpx.Response(405, headers={"server": "uvicorn"})
        if request.url.path == "/openapi.json":
            return httpx.Response(
                200,
                json={
                    "openapi": "3.1.0",
                    "info": {"title": "Local Support Agent", "version": "1.0"},
                    "paths": {
                        "/vigilai-test": {
                            "post": {
                                "operationId": "test_agent",
                                "summary": "Run a safe agent test",
                                "requestBody": {
                                    "content": {
                                        "application/json": {
                                            "schema": {
                                                "type": "object",
                                                "properties": {"prompt": {"type": "string"}},
                                            }
                                        }
                                    }
                                },
                            }
                        }
                    },
                },
            )
        return httpx.Response(404)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        bundle, discovery = await discover_endpoint_bundle(
            "http://agent.test/vigilai-test",
            client=client,
        )

    assert bundle["workload"]["name"] == "Local Support Agent"
    assert bundle["workload"]["framework"] == "FastAPI"
    assert bundle["workload"]["source_path"] is None
    assert bundle["graph"]["nodes"][1]["label"] == "POST /vigilai-test"
    assert bundle["graph"]["edges"] == [{"source": "endpoint", "target": "api:post:/vigilai-test", "is_tainted": False}]
    assert discovery == {
        "endpoint_url": "http://agent.test/vigilai-test",
        "http_status": 405,
        "openapi_detected": True,
        "discovered_routes": 1,
    }


@pytest.mark.asyncio
async def test_translates_unreachable_localhost_for_docker() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "localhost":
            raise httpx.ConnectError("container loopback is unavailable", request=request)
        if request.url.path == "/vigilai-test":
            return httpx.Response(405)
        return httpx.Response(404)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        bundle, discovery = await discover_endpoint_bundle(
            "http://localhost:9000/vigilai-test",
            "my-agent",
            client=client,
        )

    assert discovery["endpoint_url"] == "http://host.docker.internal:9000/vigilai-test"
    assert bundle["workload"]["endpoint_url"] == discovery["endpoint_url"]
