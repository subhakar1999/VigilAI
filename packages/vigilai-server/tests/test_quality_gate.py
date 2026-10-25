from app.quality_gate import evaluate_quality_gate


def test_gate_fails_tainted_sink_path() -> None:
    graph = {
        "nodes": [
            {"id": "source", "category": "TAINT_SOURCE"},
            {"id": "sink", "category": "DANGEROUS_SINK", "is_protected": False},
        ],
        "edges": [{"source": "source", "target": "sink", "is_tainted": True}],
    }
    decision = evaluate_quality_gate([], graph)
    assert decision.status == "FAILED"
    assert decision.risk_score > 0

