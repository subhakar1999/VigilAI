"""Async harness for executing probes and reporting verified bypasses."""

from __future__ import annotations

from typing import Any, Awaitable, Callable, Iterable

import httpx

from .assertions import Assessment, assess_episode, summarize
from .probes.ipi_probes import ProbeEpisode, indirect_prompt_injection_probes
from .probes.tool_chaining import tool_chaining_probes


ProbeExecutor = Callable[[ProbeEpisode], Awaitable[dict[str, Any]]]


class RedTeamHarness:
    def __init__(self, executor: ProbeExecutor) -> None:
        self.executor = executor

    async def run(
        self,
        probes: Iterable[ProbeEpisode] | None = None,
        tool_schemas: list[dict[str, Any]] | None = None,
    ) -> Assessment:
        episodes = list(probes or [*indirect_prompt_injection_probes(), *tool_chaining_probes(tool_schemas)])
        results = []
        for episode in episodes:
            trace = await self.executor(episode)
            results.append(assess_episode(episode, trace))
        return summarize(results)


async def http_executor(endpoint_url: str, episode: ProbeEpisode, timeout: float = 30.0) -> dict[str, Any]:
    """Invoke a target's explicit VigilAI test endpoint; never follows arbitrary links."""
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(endpoint_url, json={"prompt": episode.prompt, "context": episode.injected_context, "test_mode": True})
        response.raise_for_status()
        payload = response.json()
        return payload.get("trace", payload)


async def post_callback(
    server: str,
    workload_id: str,
    assessment: Assessment,
    request_id: str | None = None,
    worker_id: str | None = None,
) -> dict[str, Any]:
    compromised = sorted({str(result.trace.get("node_id")) for result in assessment.results if result.successful_exploit and result.trace.get("node_id")})
    payload = {
        "workload_id": workload_id,
        "request_id": request_id,
        "worker_id": worker_id,
        "successful_exploits": assessment.successful_exploits,
        "total_episodes": assessment.total_episodes,
        "attack_success_rate": assessment.attack_success_rate,
        "logs": [result.model_dump() for result in assessment.results],
        "compromised_node_ids": compromised,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{server.rstrip('/')}/api/v1/pentest/callback", json=payload)
        response.raise_for_status()
        return response.json()


async def claim_next(server: str, worker_id: str) -> dict[str, Any] | None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{server.rstrip('/')}/api/v1/pentest/requests/next",
            params={"worker_id": worker_id},
        )
        if response.status_code == 204:
            return None
        response.raise_for_status()
        return response.json()


async def post_failure(server: str, request_id: str, worker_id: str, error: str) -> None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{server.rstrip('/')}/api/v1/pentest/requests/{request_id}/fail",
            json={"worker_id": worker_id, "error": error[:4000]},
        )
        response.raise_for_status()

