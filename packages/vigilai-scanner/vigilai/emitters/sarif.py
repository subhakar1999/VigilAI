"""SARIF 2.1.0 serializer."""

from __future__ import annotations

from typing import Any, Iterable


RULE_NAMES = {
    "ASI01": "Agent Goal Hijack",
    "ASI02": "Tool Misuse and Exploitation",
    "ASI03": "Identity and Privilege Abuse",
    "ASI04": "Agentic Supply Chain Vulnerabilities",
    "ASI05": "Unexpected Code Execution",
    "ASI06": "Memory and Context Poisoning",
    "ASI07": "Insecure Inter-Agent Communication",
    "ASI08": "Cascading Failures",
    "ASI09": "Human-Agent Trust Exploitation",
    "ASI10": "Rogue Agents",
}


def _dict(item: Any) -> dict[str, Any]:
    if isinstance(item, dict):
        return item
    if hasattr(item, "model_dump"):
        return item.model_dump()
    raise TypeError(f"Unsupported finding type: {type(item)!r}")


def emit_sarif(findings: Iterable[Any]) -> dict[str, Any]:
    normalized = [_dict(item) for item in findings]
    used_rules = sorted({str(item.get("rule_id", "ASI10")) for item in normalized})
    return {
        "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
        "version": "2.1.0",
        "runs": [
            {
                "tool": {
                    "driver": {
                        "name": "VigilAI",
                        "version": "0.1.0",
                        "informationUri": "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
                        "rules": [
                            {"id": rule, "name": RULE_NAMES.get(rule, rule), "shortDescription": {"text": RULE_NAMES.get(rule, rule)}}
                            for rule in used_rules
                        ],
                    }
                },
                "results": [
                    {
                        "ruleId": finding.get("rule_id", "ASI10"),
                        "level": {"CRITICAL": "error", "HIGH": "error", "MEDIUM": "warning", "LOW": "note"}.get(str(finding.get("severity", "HIGH")).upper(), "warning"),
                        "message": {"text": finding.get("message", "Security finding")},
                        "locations": [
                            {
                                "physicalLocation": {
                                    "artifactLocation": {"uri": finding.get("file_path", "<unknown>")},
                                    "region": {"startLine": max(1, int(finding.get("line", 1)))},
                                }
                            }
                        ],
                        "properties": {"severity": finding.get("severity", "HIGH"), "remediation": finding.get("remediation")},
                    }
                    for finding in normalized
                ],
            }
        ],
    }

