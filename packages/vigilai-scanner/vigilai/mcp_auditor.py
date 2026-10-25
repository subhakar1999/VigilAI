"""MCP configuration auditing and deterministic dependency pinning."""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


PROMPT_INJECTION_PATTERNS = (
    re.compile(r"ignore (?:all |any )?(?:previous|prior|system) instructions", re.I),
    re.compile(r"(?:reveal|print|exfiltrate).*(?:secret|token|credential|system prompt)", re.I),
    re.compile(r"you (?:must|should).*(?:call|invoke|execute)", re.I),
    re.compile(r"override.*(?:policy|guardrail|instruction)", re.I),
)
EXCLUDED_DIRS = {".git", ".next", ".tox", ".uv-cache", ".uv-python", ".venv", "build", "dist", "node_modules", "venv", "__pycache__"}


@dataclass(frozen=True, slots=True)
class MCPFinding:
    rule_id: str
    severity: str
    message: str
    file_path: str
    server: str | None = None
    tool: str | None = None

    def model_dump(self) -> dict[str, Any]:
        return asdict(self)


def discover_configs(path: str | Path) -> list[Path]:
    root = Path(path)
    if root.is_file():
        return [root]
    names = {"mcp.json", "claude_desktop_config.json"}
    return sorted(candidate for candidate in root.rglob("*.json") if candidate.name in names and not any(part in EXCLUDED_DIRS for part in candidate.parts))


def _servers(payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    raw = payload.get("mcpServers", payload.get("servers", {}))
    return raw if isinstance(raw, dict) else {}


def _tools(server: dict[str, Any]) -> list[dict[str, Any]]:
    raw = server.get("tools", [])
    if isinstance(raw, dict):
        return [{"name": name, **(value if isinstance(value, dict) else {})} for name, value in raw.items()]
    return [tool for tool in raw if isinstance(tool, dict)] if isinstance(raw, list) else []


def audit_mcp(path: str | Path) -> list[MCPFinding]:
    findings: list[MCPFinding] = []
    owners: dict[str, tuple[str, str]] = {}
    for config in discover_configs(path):
        try:
            payload = json.loads(config.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            findings.append(MCPFinding("ASI04", "HIGH", f"Invalid MCP configuration: {exc}", str(config)))
            continue
        for server_name, server in _servers(payload).items():
            if not isinstance(server, dict):
                continue
            for tool in _tools(server):
                tool_name = str(tool.get("name", "<unnamed>"))
                description = str(tool.get("description", ""))
                if any(pattern.search(description) for pattern in PROMPT_INJECTION_PATTERNS):
                    findings.append(MCPFinding("ASI03", "HIGH", f"Tool description contains prompt-injection directives: {tool_name}", str(config), server_name, tool_name))
                if tool_name in owners and owners[tool_name][0] != server_name:
                    owner, owner_path = owners[tool_name]
                    findings.append(MCPFinding("ASI04", "HIGH", f"Tool '{tool_name}' shadows the same name from server '{owner}' ({owner_path}).", str(config), server_name, tool_name))
                else:
                    owners[tool_name] = (server_name, str(config))
    return findings


def build_lock_document(path: str | Path) -> dict[str, Any]:
    root = Path(path)
    locked: dict[str, Any] = {}
    for config in discover_configs(root):
        try:
            payload = json.loads(config.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError):
            # audit_mcp emits the actionable finding; lock generation omits invalid inputs.
            continue
        for server_name, server in sorted(_servers(payload).items()):
            if not isinstance(server, dict):
                continue
            canonical = {
                "command": server.get("command"),
                "args": server.get("args", []),
                "tools": _tools(server),
            }
            encoded = json.dumps(canonical, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
            locked[server_name] = {**canonical, "sha256": hashlib.sha256(encoded).hexdigest(), "source": str(config)}
    return {"schema_version": 1, "algorithm": "sha256", "servers": locked}


def generate_lock(path: str | Path, output: str | Path | None = None) -> dict[str, Any]:
    root = Path(path)
    document = build_lock_document(root)
    destination = Path(output) if output else (root if root.is_dir() else root.parent) / ".mcp-lock.json"
    destination.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return document

