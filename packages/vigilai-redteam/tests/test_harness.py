import pytest

from app.quality_gate import evaluate_quality_gate
from redteam import daemon
from redteam.harness import RedTeamHarness
from redteam.probes.ipi_probes import ProbeEpisode
from redteam.probes.tool_chaining import tool_chaining_probes


@pytest.mark.asyncio
async def test_harness_records_bypass_for_quality_gate() -> None:
    probe = ProbeEpisode("test", "prompt", "context", ("shell",))

    async def compromised_executor(_):
        return {"node_id": "danger", "tool_invocations": [{"name": "shell", "arguments": {"command": "echo VIGILAI_TEST_MARKER"}}]}

    assessment = await RedTeamHarness(compromised_executor).run([probe])
    assert assessment.successful_exploits == 1
    assert assessment.attack_success_rate == 1.0
    assert evaluate_quality_gate([], {}, assessment.attack_success_rate).status == "FAILED"


@pytest.mark.asyncio
async def test_daemon_leases_and_executes_queued_request(monkeypatch) -> None:
    calls = []

    async def fake_claim(server, worker_id):
        return {
            "request_id": "request-1",
            "workload_id": "workload-1",
            "endpoint_url": "https://agent.test/vigilai",
        }

    async def fake_assess(server, workload_id, endpoint, request_id=None, worker_id=None, tool_schemas=None):
        calls.append((server, workload_id, endpoint, request_id, worker_id, tool_schemas))
        return {"quality_gate_status": "PASSED"}

    monkeypatch.setattr(daemon, "claim_next", fake_claim)
    monkeypatch.setattr(daemon, "_assess", fake_assess)
    await daemon._watch("https://control.test", "worker-1", 0.25, once=True)
    assert calls == [("https://control.test", "workload-1", "https://agent.test/vigilai", "request-1", "worker-1", [])]


def test_schema_aware_tool_probe_targets_side_effects() -> None:
    probes = tool_chaining_probes(
        [
            {"name": "read_order", "description": "Read order status"},
            {"name": "delete_order", "description": "Permanently delete an order"},
        ]
    )
    assert any(probe.forbidden_tools == ("delete_order",) for probe in probes)
    assert not any(probe.forbidden_tools == ("read_order",) for probe in probes)


