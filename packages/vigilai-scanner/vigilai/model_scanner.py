"""Static, non-executing inspection of pickle-based model artifacts."""

from __future__ import annotations

import pickletools
import zipfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable


ALLOWED_GLOBALS = frozenset(
    {
        "torch._utils._rebuild_tensor_v2",
        "torch.FloatStorage",
        "collections.OrderedDict",
    }
)
MODEL_SUFFIXES = frozenset({".pt", ".bin", ".pkl", ".pickle", ".joblib"})
EXCLUDED_DIRS = frozenset({".git", ".next", ".tox", ".uv-cache", ".uv-python", ".venv", "build", "dist", "node_modules", "venv", "__pycache__"})
MAX_PICKLE_BYTES = 256 * 1024 * 1024
_UNKNOWN = object()


@dataclass(frozen=True, slots=True)
class ModelFinding:
    rule_id: str
    severity: str
    message: str
    file_path: str
    offset: int = 0

    def model_dump(self) -> dict[str, Any]:
        return asdict(self)


class SymbolicPVMScanner:
    """Inspect pickle opcodes without importing or deserializing the artifact."""

    allowed_globals: frozenset[str]

    def __init__(self, allowed_globals: Iterable[str] | None = None) -> None:
        self.allowed_globals = frozenset(allowed_globals or ALLOWED_GLOBALS)

    def scan_path(self, path: str | Path) -> list[ModelFinding]:
        target = Path(path)
        if target.is_dir():
            findings: list[ModelFinding] = []
            for candidate in sorted(target.rglob("*")):
                if not any(part in EXCLUDED_DIRS for part in candidate.parts) and candidate.is_file() and candidate.suffix.lower() in MODEL_SUFFIXES:
                    findings.extend(self.scan_file(candidate))
            return findings
        return self.scan_file(target)

    def scan_file(self, path: str | Path) -> list[ModelFinding]:
        target = Path(path)
        try:
            is_archive = zipfile.is_zipfile(target)
        except OSError as exc:
            return [self._blocked(target, f"Model artifact could not be read: {exc}")]

        streams: list[tuple[str, bytes]] = []
        if is_archive:
            try:
                with zipfile.ZipFile(target) as archive:
                    for entry in archive.infolist():
                        if not entry.filename.endswith((".pkl", ".pickle")):
                            continue
                        if entry.file_size > MAX_PICKLE_BYTES:
                            return [self._blocked(target, f"Pickle metadata stream exceeds the {MAX_PICKLE_BYTES}-byte inspection limit: {entry.filename}")]
                        streams.append((f"{target}!{entry.filename}", archive.read(entry)))
            except (OSError, zipfile.BadZipFile, RuntimeError) as exc:
                return [self._blocked(target, f"Model archive parsing failed closed: {exc}")]
            if not streams:
                return []
        else:
            try:
                if target.stat().st_size > MAX_PICKLE_BYTES:
                    return [self._blocked(target, f"Raw pickle artifact exceeds the {MAX_PICKLE_BYTES}-byte inspection limit; convert weights to SafeTensors.")]
                streams.append((str(target), target.read_bytes()))
            except OSError as exc:
                return [self._blocked(target, f"Model artifact could not be read: {exc}")]

        findings: list[ModelFinding] = []
        for label, stream in streams:
            findings.extend(self.scan_bytes(stream, label))
        return findings

    def scan_bytes(self, data: bytes, file_path: str = "<memory>") -> list[ModelFinding]:
        findings: list[ModelFinding] = []
        stack: list[object] = []
        marks: list[int] = []
        extension_mutation = False

        try:
            for opcode, argument, position in pickletools.genops(data):
                name = opcode.name
                if name in {"BINUNICODE", "SHORT_BINUNICODE", "UNICODE", "STRING"}:
                    stack.append(str(argument).strip("'\""))
                elif name == "GLOBAL":
                    module, symbol = str(argument).split(" ", 1)
                    qualified = f"{module}.{symbol}"
                    stack.append(qualified)
                    extension_mutation |= self._is_extension_mutator(qualified)
                    self._check_global(qualified, file_path, position, findings)
                elif name == "STACK_GLOBAL":
                    if len(stack) < 2 or not all(isinstance(v, str) for v in stack[-2:]):
                        raise ValueError("STACK_GLOBAL has unresolved module/name operands")
                    symbol = str(stack.pop())
                    module = str(stack.pop())
                    qualified = f"{module}.{symbol}"
                    stack.append(qualified)
                    extension_mutation |= self._is_extension_mutator(qualified)
                    self._check_global(qualified, file_path, position, findings)
                elif name == "MARK":
                    marks.append(len(stack))
                elif name in {"TUPLE", "LIST", "DICT", "FROZENSET"}:
                    if not marks:
                        raise ValueError(f"{name} encountered without MARK")
                    mark = marks.pop()
                    values = stack[mark:]
                    del stack[mark:]
                    stack.append(tuple(values))
                elif name in {"TUPLE1", "TUPLE2", "TUPLE3"}:
                    count = int(name[-1])
                    if len(stack) < count:
                        raise ValueError(f"{name} stack underflow")
                    values = tuple(stack[-count:])
                    del stack[-count:]
                    stack.append(values)
                elif name in {"EMPTY_TUPLE", "EMPTY_LIST", "EMPTY_DICT", "EMPTY_SET"}:
                    stack.append(())
                elif name in {"NONE", "NEWTRUE", "NEWFALSE", "BININT", "BININT1", "BININT2", "INT", "LONG", "LONG1", "LONG4", "BINFLOAT", "FLOAT", "BINBYTES", "SHORT_BINBYTES", "BYTEARRAY8", "BINUNICODE8", "BINBYTES8"}:
                    stack.append(argument)
                elif name in {"BINPUT", "LONG_BINPUT", "PUT", "MEMOIZE", "FRAME", "PROTO"}:
                    continue
                elif name in {"BINGET", "LONG_BINGET", "GET"}:
                    stack.append(_UNKNOWN)
                elif name == "POP":
                    if stack:
                        stack.pop()
                elif name == "POP_MARK":
                    if marks:
                        del stack[marks.pop():]
                elif name == "DUP":
                    stack.append(stack[-1] if stack else _UNKNOWN)
                elif name in {"REDUCE", "NEWOBJ", "NEWOBJ_EX", "BUILD", "SETITEM", "SETITEMS", "APPEND", "APPENDS", "ADDITEMS"}:
                    # Preserve enough symbolic shape for subsequent STACK_GLOBAL validation.
                    stack.append(_UNKNOWN)
                elif name in {"EXT1", "EXT2", "EXT4"}:
                    if extension_mutation:
                        findings.append(
                            ModelFinding(
                                "ASI04",
                                "CRITICAL",
                                f"Mutable copyreg extension state is used before {name}; opcode target cannot be trusted.",
                                file_path,
                                position,
                            )
                        )
                    else:
                        findings.append(
                            ModelFinding(
                                "ASI04",
                                "HIGH",
                                f"Unresolved pickle extension opcode {name} is outside the tensor allowlist.",
                                file_path,
                                position,
                            )
                        )
                    stack.append(_UNKNOWN)
        except Exception as exc:  # pickle parsers must fail closed (EDP-1)
            findings.append(self._blocked(file_path, f"Malformed or ambiguous pickle blocked (EDP-1): {exc}"))
        return self._deduplicate(findings)

    @staticmethod
    def _is_extension_mutator(qualified: str) -> bool:
        return qualified in {"copyreg.add_extension", "copyreg._inverted_registry"}

    def _check_global(
        self,
        qualified: str,
        file_path: str,
        offset: int,
        findings: list[ModelFinding],
    ) -> None:
        if qualified not in self.allowed_globals:
            findings.append(
                ModelFinding(
                    "ASI04",
                    "CRITICAL",
                    f"Pickle references non-allowlisted callable/global: {qualified}",
                    file_path,
                    offset,
                )
            )

    @staticmethod
    def _blocked(path: str | Path, message: str) -> ModelFinding:
        return ModelFinding("ASI04", "CRITICAL", message, str(path), 0)

    @staticmethod
    def _deduplicate(findings: list[ModelFinding]) -> list[ModelFinding]:
        return list(dict.fromkeys(findings))

