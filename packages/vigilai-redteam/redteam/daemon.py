"""CLI entry point for one-shot and queued deterministic assessments."""

from __future__ import annotations

import asyncio
import socket

import httpx
import typer

from .harness import RedTeamHarness, claim_next, http_executor, post_callback, post_failure


app = typer.Typer(no_args_is_help=True)


async def _assess(
    server: str,
    workload_id: str,
    endpoint: str,
    request_id: str | None = None,
    worker_id: str | None = None,
    tool_schemas: list[dict[str, object]] | None = None,
) -> dict[str, object]:
    async def execute(episode):
        return await http_executor(endpoint, episode)

    assessment = await RedTeamHarness(execute).run(tool_schemas=tool_schemas)
    callback = await post_callback(server, workload_id, assessment, request_id, worker_id)
    typer.echo(f"episodes={assessment.total_episodes} successes={assessment.successful_exploits} asr={assessment.attack_success_rate:.2%} gate={callback['quality_gate_status']}")
    return callback


async def _run(server: str, workload_id: str) -> None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{server.rstrip('/')}/api/v1/workloads/{workload_id}")
        response.raise_for_status()
        workload = response.json()
    endpoint = workload.get("endpoint_url")
    if not endpoint:
        raise typer.BadParameter("Workload has no endpoint_url configured")

    await _assess(server, workload_id, endpoint)


async def _watch(server: str, worker_id: str, poll_interval: float, once: bool) -> None:
    while True:
        lease = await claim_next(server, worker_id)
        if lease is None:
            if once:
                return
            await asyncio.sleep(poll_interval)
            continue
        request_id = str(lease["request_id"])
        try:
            await _assess(
                server,
                str(lease["workload_id"]),
                str(lease["endpoint_url"]),
                request_id,
                worker_id,
                list(lease.get("tool_schemas", [])),
            )
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            await post_failure(server, request_id, worker_id, f"{type(exc).__name__}: {exc}")
            typer.echo(f"request={request_id} failed: {exc}", err=True)
        if once:
            return


@app.command()
def run(server: str = typer.Option(...), workload_id: str = typer.Option(...)) -> None:
    """Run all probes once and submit the results."""
    asyncio.run(_run(server, workload_id))


@app.command()
def watch(
    server: str = typer.Option(..., help="VigilAI control-plane URL."),
    worker_id: str = typer.Option(socket.gethostname(), help="Stable worker identity used for leases."),
    poll_interval: float = typer.Option(5.0, min=0.25, help="Seconds between empty-queue polls."),
    once: bool = typer.Option(False, help="Process at most one request, or exit if the queue is empty."),
) -> None:
    """Poll the control plane and execute queued pentest requests."""
    asyncio.run(_watch(server, worker_id, poll_interval, once))


if __name__ == "__main__":
    app()

