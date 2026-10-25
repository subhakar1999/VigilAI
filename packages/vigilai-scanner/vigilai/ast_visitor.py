"""AST-based taint analysis and workflow topology extraction."""

from __future__ import annotations

import ast
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


SINKS = {
    "eval": "code execution",
    "exec": "code execution",
    "subprocess.run": "process execution",
    "subprocess.call": "process execution",
    "subprocess.Popen": "process execution",
    "os.system": "shell execution",
    "cursor.execute": "database execution",
    "upsert": "vector-store mutation",
}
LLM_CALLS = {"ChatCompletion.create", "litellm.chat"}
DESTRUCTIVE_WORDS = {"delete", "remove", "destroy", "send", "transfer", "pay", "write", "execute", "shell"}


@dataclass(slots=True)
class Finding:
    rule_id: str
    severity: str
    message: str
    file_path: str
    line: int
    remediation: str

    def model_dump(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class GraphNode:
    id: str
    label: str
    category: str
    file_path: str
    line: int
    is_vulnerable: bool = False
    rule_id: str | None = None
    remediation: str | None = None

    def model_dump(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class GraphEdge:
    source: str
    target: str
    is_tainted: bool = False

    def model_dump(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class AnalysisResult:
    findings: list[Finding] = field(default_factory=list)
    nodes: list[GraphNode] = field(default_factory=list)
    edges: list[GraphEdge] = field(default_factory=list)

    def graph(self) -> dict[str, list[dict[str, Any]]]:
        return {
            "nodes": [node.model_dump() for node in self.nodes],
            "edges": [edge.model_dump() for edge in self.edges],
        }


def _name(node: ast.AST) -> str:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        prefix = _name(node.value)
        return f"{prefix}.{node.attr}" if prefix else node.attr
    if isinstance(node, ast.Call):
        return _name(node.func)
    return ""


class AgentASTVisitor(ast.NodeVisitor):
    """Conservative, intra-procedural agent security analyzer."""

    def __init__(self, file_path: str) -> None:
        self.file_path = file_path
        self.result = AnalysisResult()
        self._function_summaries: dict[str, set[int]] = {}
        self._node_ids: set[str] = set()
        self._langgraph_builders: set[str] = set()
        self._langgraph_apps: set[str] = set()

    def analyze(self, source: str) -> AnalysisResult:
        try:
            tree = ast.parse(source, filename=self.file_path)
        except SyntaxError as exc:
            self._finding("ASI10", "HIGH", f"Python source could not be parsed: {exc.msg}", exc.lineno or 1, "Fix syntax errors before security analysis.")
            return self.result
        self._discover_langgraph_variables(tree)
        self._build_function_summaries(tree)
        self.visit(tree)
        return self.result

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._analyze_function(node)
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        call_name = _name(node.func)
        if call_name.endswith("AgentExecutor") or call_name.endswith("create_react_agent"):
            keyword_names = {keyword.arg for keyword in node.keywords}
            if "max_iterations" not in keyword_names and "recursion_limit" not in keyword_names:
                self._finding("ASI08", "HIGH", "Agent loop has no explicit iteration limit.", node.lineno, "Set max_iterations or recursion_limit to a bounded value.")
        receiver = call_name.rsplit(".", 1)[0] if "." in call_name else ""
        if call_name.endswith(".invoke") and receiver in self._langgraph_apps and not self._has_iteration_guard(node):
            self._finding(
                "ASI08",
                "HIGH",
                "LangGraph invocation has no explicit recursion_limit.",
                node.lineno,
                "Pass a bounded recursion_limit in the invocation config.",
            )
        self.generic_visit(node)

    def _discover_langgraph_variables(self, tree: ast.Module) -> None:
        assignments = [item for item in ast.walk(tree) if isinstance(item, (ast.Assign, ast.AnnAssign))]
        assignments.sort(key=lambda item: getattr(item, "lineno", 0))
        for assignment in assignments:
            value = assignment.value
            if not isinstance(value, ast.Call):
                continue
            targets = assignment.targets if isinstance(assignment, ast.Assign) else [assignment.target]
            names = {name.id for target in targets for name in ast.walk(target) if isinstance(name, ast.Name)}
            call_name = _name(value.func)
            if call_name.endswith("StateGraph"):
                self._langgraph_builders.update(names)
            elif call_name.endswith(".compile") and call_name.rsplit(".", 1)[0] in self._langgraph_builders:
                self._langgraph_apps.update(names)

    @staticmethod
    def _has_iteration_guard(call: ast.Call) -> bool:
        if any(keyword.arg in {"max_iterations", "recursion_limit"} for keyword in call.keywords):
            return True
        values = [*call.args, *(keyword.value for keyword in call.keywords)]
        for value in values:
            if not isinstance(value, ast.Dict):
                continue
            keys = {key.value for key in value.keys if isinstance(key, ast.Constant) and isinstance(key.value, str)}
            if keys & {"max_iterations", "recursion_limit"}:
                return True
        return False

    def _build_function_summaries(self, tree: ast.Module) -> None:
        for item in tree.body:
            if not isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            parameters = [*item.args.posonlyargs, *item.args.args, *item.args.kwonlyargs]
            parameter_index = {argument.arg: index for index, argument in enumerate(parameters)}
            dangerous: set[int] = set()
            for child in ast.walk(item):
                if isinstance(child, ast.Call) and self._sink_kind(_name(child.func)):
                    for argument in [*child.args, *(kw.value for kw in child.keywords)]:
                        for name in {n.id for n in ast.walk(argument) if isinstance(n, ast.Name)}:
                            if name in parameter_index:
                                dangerous.add(parameter_index[name])
            if dangerous:
                self._function_summaries[item.name] = dangerous

    def _analyze_function(self, node: ast.FunctionDef | ast.AsyncFunctionDef) -> None:
        decorators = {_name(decorator.func if isinstance(decorator, ast.Call) else decorator) for decorator in node.decorator_list}
        is_tool = any(name == "tool" or name.endswith(".tool") for name in decorators)
        arguments = [*node.args.posonlyargs, *node.args.args, *node.args.kwonlyargs]
        tainted: set[str] = {argument.arg for argument in arguments} if is_tool else set()
        origins: dict[str, str] = {}

        tool_node = self._add_node(
            f"function:{self.file_path}:{node.lineno}:{node.name}",
            node.name,
            "TOOL" if is_tool else "REASONING",
            node.lineno,
        )
        if is_tool:
            for argument in arguments:
                source_id = self._add_node(
                    f"source:{self.file_path}:{argument.lineno}:{node.name}:{argument.arg}",
                    argument.arg,
                    "TAINT_SOURCE",
                    argument.lineno,
                )
                origins[argument.arg] = source_id
                self._edge(source_id, tool_node, True)
            if self._is_destructive(node.name) and not self._has_guard(node.decorator_list):
                self._finding("ASI02", "HIGH", f"Destructive tool '{node.name}' has no human approval or checkpointer gate.", node.lineno, "Require human_in_the_loop=True or a durable checkpointer before side effects.")

        statements = [child for child in ast.walk(node) if isinstance(child, (ast.Assign, ast.AnnAssign, ast.Call))]
        statements.sort(key=lambda item: (getattr(item, "lineno", 0), getattr(item, "col_offset", 0)))
        for statement in statements:
            if isinstance(statement, (ast.Assign, ast.AnnAssign)):
                value = statement.value
                if value is None:
                    continue
                targets = statement.targets if isinstance(statement, ast.Assign) else [statement.target]
                names = {n.id for target in targets for n in ast.walk(target) if isinstance(n, ast.Name)}
                call = value if isinstance(value, ast.Call) else None
                call_name = _name(call.func) if call else ""
                is_llm = bool(call and (call_name in LLM_CALLS or call_name.endswith(".invoke")))
                value_taint = self._expression_tainted(value, tainted) or is_llm
                if value_taint:
                    tainted.update(names)
                    if is_llm:
                        llm_id = self._add_node(f"llm:{self.file_path}:{statement.lineno}", call_name, "REASONING", statement.lineno)
                        for name in names:
                            origins[name] = llm_id
                    else:
                        origin = self._first_origin(value, origins)
                        for name in names:
                            if origin:
                                origins[name] = origin
            elif isinstance(statement, ast.Call):
                self._analyze_call(statement, tainted, origins, tool_node)

    def _analyze_call(self, call: ast.Call, tainted: set[str], origins: dict[str, str], parent_id: str) -> None:
        call_name = _name(call.func)
        dangerous_arguments: list[ast.AST] = []
        sink_kind = self._sink_kind(call_name)
        if sink_kind:
            dangerous_arguments = [*call.args, *(keyword.value for keyword in call.keywords)]
        else:
            summary = self._function_summaries.get(call_name.split(".")[-1], set())
            dangerous_arguments = [call.args[index] for index in summary if index < len(call.args)]
            if summary:
                sink_kind = "one-hop dangerous call"

        tainted_args = [argument for argument in dangerous_arguments if self._expression_tainted(argument, tainted)]
        if not sink_kind or not tainted_args:
            return

        sink_id = self._add_node(
            f"sink:{self.file_path}:{call.lineno}:{call.col_offset}",
            call_name,
            "DANGEROUS_SINK",
            call.lineno,
            True,
            "ASI02",
            "Validate against an allowlist and avoid shell/eval execution for untrusted values.",
        )
        self._edge(parent_id, sink_id, True)
        for argument in tainted_args:
            origin = self._first_origin(argument, origins)
            if origin:
                self._edge(origin, sink_id, True)
        shell_true = call_name in {"subprocess.run", "subprocess.call", "subprocess.Popen"} and any(
            kw.arg == "shell" and isinstance(kw.value, ast.Constant) and kw.value.value is True for kw in call.keywords
        )
        detail = " with shell=True" if shell_true else ""
        self._finding(
            "ASI02",
            "CRITICAL" if shell_true or sink_kind == "code execution" else "HIGH",
            f"Untrusted agent data reaches {sink_kind} sink '{call_name}'{detail}.",
            call.lineno,
            "Use structured APIs, strict allowlists, parameterized queries, and an explicit approval gate.",
        )

    @staticmethod
    def _expression_tainted(expression: ast.AST, tainted: set[str]) -> bool:
        return bool({node.id for node in ast.walk(expression) if isinstance(node, ast.Name)} & tainted)

    @staticmethod
    def _first_origin(expression: ast.AST, origins: dict[str, str]) -> str | None:
        for node in ast.walk(expression):
            if isinstance(node, ast.Name) and node.id in origins:
                return origins[node.id]
        return None

    @staticmethod
    def _sink_kind(call_name: str) -> str | None:
        if call_name in SINKS:
            return SINKS[call_name]
        if call_name.endswith(".execute"):
            return "database execution"
        if call_name.endswith(".upsert"):
            return "vector-store mutation"
        return None

    @staticmethod
    def _is_destructive(name: str) -> bool:
        lowered = name.lower()
        return any(word in lowered for word in DESTRUCTIVE_WORDS)

    @staticmethod
    def _has_guard(decorators: list[ast.expr]) -> bool:
        for decorator in decorators:
            if not isinstance(decorator, ast.Call):
                continue
            for keyword in decorator.keywords:
                if keyword.arg in {"human_in_the_loop", "checkpointer"}:
                    if not isinstance(keyword.value, ast.Constant) or bool(keyword.value.value):
                        return True
        return False

    def _finding(self, rule_id: str, severity: str, message: str, line: int, remediation: str) -> None:
        finding = Finding(rule_id, severity, message, self.file_path, line, remediation)
        if not any(existing.message == message and existing.line == line for existing in self.result.findings):
            self.result.findings.append(finding)

    def _add_node(
        self,
        node_id: str,
        label: str,
        category: str,
        line: int,
        vulnerable: bool = False,
        rule_id: str | None = None,
        remediation: str | None = None,
    ) -> str:
        if node_id not in self._node_ids:
            self._node_ids.add(node_id)
            self.result.nodes.append(GraphNode(node_id, label, category, self.file_path, line, vulnerable, rule_id, remediation))
        return node_id

    def _edge(self, source: str, target: str, tainted: bool) -> None:
        edge = GraphEdge(source, target, tainted)
        if not any(e.source == source and e.target == target for e in self.result.edges):
            self.result.edges.append(edge)


def analyze_path(path: str | Path) -> AnalysisResult:
    root = Path(path)
    candidates = [root] if root.is_file() else sorted(root.rglob("*.py"))
    combined = AnalysisResult()
    excluded = {".git", ".next", ".tox", ".uv-cache", ".uv-python", ".venv", "build", "dist", "node_modules", "venv", "__pycache__"}
    for candidate in candidates:
        if any(part in excluded for part in candidate.parts):
            continue
        try:
            source = candidate.read_text(encoding="utf-8")
        except (OSError, UnicodeError):
            continue
        result = AgentASTVisitor(str(candidate)).analyze(source)
        combined.findings.extend(result.findings)
        combined.nodes.extend(result.nodes)
        combined.edges.extend(result.edges)
    return combined

