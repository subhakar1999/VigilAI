"""VigilAI command line interface."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import typer
from rich.console import Console
from rich.table import Table

from .ast_visitor import analyze_path
from .emitters.aibom import emit_aibom
from .emitters.sarif import emit_sarif
from .mcp_auditor import audit_mcp, build_lock_document, generate_lock
from .model_scanner import SymbolicPVMScanner
from .uploader import submit_endpoint, submit_scan


app = typer.Typer(help="Security quality gates for AI models, agents, and MCP tools.", no_args_is_help=True)
console = Console()


def build_scan_bundle(path: Path, name: str | None = None) -> dict[str, Any]:
    ast_result = analyze_path(path)
    findings: list[Any] = [*ast_result.findings, *SymbolicPVMScanner().scan_path(path), *audit_mcp(path)]
    normalized = [finding.model_dump() for finding in findings]
    lock_document = build_lock_document(path)
    lock_dependencies = [{"name": name, **server} for name, server in lock_document["servers"].items()]
    return {
        "workload": {"name": name or path.resolve().name, "framework": _detect_framework(path), "source_path": str(path.resolve())},
        "findings": normalized,
        "graph": ast_result.graph(),
        "aibom": emit_aibom(path, lock_dependencies),
        "sarif": emit_sarif(normalized),
    }


def _detect_framework(path: Path) -> str:
    terms = {"langgraph": "LangGraph", "crewai": "CrewAI", "langchain": "LangChain"}
    candidates = [path] if path.is_file() else path.rglob("*.py")
    for candidate in candidates:
        try:
            content = candidate.read_text(encoding="utf-8").lower()
        except (OSError, UnicodeError):
            continue
        for term, label in terms.items():
            if term in content:
                return label
    return "Custom"


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def _render(findings: list[dict[str, Any]]) -> None:
    table = Table(title="VigilAI security findings")
    for column in ("Severity", "Rule", "Location", "Finding"):
        table.add_column(column)
    for finding in findings:
        location = f"{finding.get('file_path', '<unknown>')}:{finding.get('line', finding.get('offset', 1))}"
        table.add_row(str(finding.get("severity")), str(finding.get("rule_id")), location, str(finding.get("message")))
    console.print(table if findings else "[green]No security findings detected.[/green]")


@app.command()
def scan(
    path: Path = typer.Argument(Path("."), exists=True),
    output: Path = typer.Option(Path("results.sarif"), "--output", "-o"),
    fail_on_gate: bool = typer.Option(False, "--fail-on-gate"),
) -> None:
    """Scan a repository and emit SARIF."""
    bundle = build_scan_bundle(path)
    _write_json(output, bundle["sarif"])
    _render(bundle["findings"])
    console.print(f"SARIF written to {output}")
    if fail_on_gate and any(finding.get("severity") in {"CRITICAL", "HIGH"} for finding in bundle["findings"]):
        raise typer.Exit(1)


@app.command("mcp-lock")
def mcp_lock(path: Path = typer.Argument(Path("."), exists=True)) -> None:
    """Hash MCP commands, arguments, and tool schemas."""
    document = generate_lock(path)
    console.print(f"Locked {len(document['servers'])} MCP server(s) in .mcp-lock.json")


@app.command()
def onboard(
    path: Path | None = typer.Argument(None, exists=True),
    server: str = typer.Option(..., "--server"),
    name: str | None = typer.Option(None, "--name", help="Workload name; inferred when omitted."),
    endpoint: str | None = typer.Option(None, "--endpoint", help="HTTP endpoint used by dynamic pentest probes."),
) -> None:
    """Register an endpoint directly, or scan source and register the resulting workload."""
    if path is None and endpoint:
        result = submit_endpoint(server, endpoint, name)
        console.print(
            f"[green]Onboarded endpoint[/green] {name or endpoint}: "
            f"{result.get('quality_gate_status', 'UNKNOWN')} "
            f"({result.get('discovered_routes', 0)} route(s) discovered)"
        )
        return

    source = path or Path(".")
    workload_name = name or source.resolve().name
    bundle = build_scan_bundle(source, workload_name)
    bundle["workload"]["endpoint_url"] = endpoint
    result = submit_scan(server, bundle)
    console.print(f"[green]Onboarded[/green] {workload_name}: {result.get('quality_gate_status', 'UNKNOWN')}")


if __name__ == "__main__":
    app()

