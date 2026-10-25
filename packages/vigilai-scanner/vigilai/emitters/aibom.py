"""CycloneDX 1.6 AI/ML bill-of-materials emitter."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


MODEL_SUFFIXES = {".pt", ".bin", ".pkl", ".pickle", ".joblib", ".safetensors", ".onnx"}
DATA_SUFFIXES = {".csv", ".parquet", ".jsonl"}
EXCLUDED_DIRS = {".git", ".next", ".tox", ".uv-cache", ".uv-python", ".venv", "build", "dist", "node_modules", "venv", "__pycache__"}


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def emit_aibom(path: str | Path, mcp_dependencies: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    root = Path(path)
    files = [root] if root.is_file() else [candidate for candidate in root.rglob("*") if candidate.is_file() and not any(part in EXCLUDED_DIRS for part in candidate.parts)]
    components: list[dict[str, Any]] = []
    for candidate in sorted(files):
        suffix = candidate.suffix.lower()
        if suffix not in MODEL_SUFFIXES | DATA_SUFFIXES and "prompt" not in candidate.name.lower():
            continue
        kind = "machine-learning-model" if suffix in MODEL_SUFFIXES else "data"
        try:
            digest = _sha256_file(candidate)
        except OSError:
            continue
        components.append(
            {
                "type": kind,
                "name": candidate.name,
                "bom-ref": str(candidate),
                "hashes": [{"alg": "SHA-256", "content": digest}],
                "properties": [{"name": "vigilai:path", "value": str(candidate)}],
            }
        )
    for dependency in mcp_dependencies or []:
        properties = [
            {"name": "vigilai:kind", "value": "mcp-server"},
            {"name": "vigilai:command", "value": str(dependency.get("command") or "")},
            {"name": "vigilai:args", "value": json.dumps(dependency.get("args", []), sort_keys=True)},
            {"name": "vigilai:tools", "value": json.dumps(dependency.get("tools", []), sort_keys=True)},
        ]
        components.append(
            {
                "type": "application",
                "name": dependency.get("name", "mcp-server"),
                "bom-ref": dependency.get("sha256", dependency.get("name", "mcp-server")),
                "hashes": [{"alg": "SHA-256", "content": dependency["sha256"]}] if dependency.get("sha256") else [],
                "properties": properties,
            }
        )
    return {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "version": 1,
        "metadata": {"component": {"type": "application", "name": root.name or "workload"}},
        "components": components,
    }

