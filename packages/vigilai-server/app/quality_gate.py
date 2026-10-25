"""Pure, deterministic quality-gate evaluation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable


@dataclass(frozen=True, slots=True)
class GateDecision:
    status: str
    risk_score: int
    reasons: tuple[str, ...]


def evaluate_quality_gate(
    findings: Iterable[dict[str, Any]],
    graph: dict[str, Any] | None = None,
    attack_success_rate: float = 0.0,
) -> GateDecision:
    normalized = list(findings)
    reasons: list[str] = []
    high_findings = [item for item in normalized if str(item.get("severity", "")).upper() in {"CRITICAL", "HIGH"}]
    if high_findings:
        reasons.append(f"{len(high_findings)} critical/high static finding(s)")

    topology = graph or {}
    nodes = {str(node.get("id")): node for node in topology.get("nodes", [])}
    unsafe_edges = []
    for edge in topology.get("edges", []):
        target = nodes.get(str(edge.get("target")), {})
        protected = bool(target.get("is_protected") or target.get("human_in_the_loop") or target.get("checkpointer"))
        if edge.get("is_tainted") is True and target.get("category") == "DANGEROUS_SINK" and not protected:
            unsafe_edges.append(edge)
    if unsafe_edges:
        reasons.append(f"{len(unsafe_edges)} tainted path(s) terminate at an unprotected dangerous sink")

    if attack_success_rate > 0.0:
        reasons.append(f"dynamic attack success rate is {attack_success_rate:.2%}")

    weights = {"CRITICAL": 40, "HIGH": 25, "MEDIUM": 10, "LOW": 3}
    static_risk = sum(weights.get(str(item.get("severity", "")).upper(), 0) for item in normalized)
    score = min(100, static_risk + len(unsafe_edges) * 25 + round(attack_success_rate * 100))
    return GateDecision("FAILED" if reasons else "PASSED", score, tuple(reasons))

