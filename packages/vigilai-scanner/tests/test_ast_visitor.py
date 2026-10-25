from vigilai.ast_visitor import AgentASTVisitor


def test_tool_input_reaching_shell_is_critical() -> None:
    result = AgentASTVisitor("agent.py").analyze(
        """
import subprocess

@tool
def run_command(command: str):
    return subprocess.run(command, shell=True)
"""
    )
    assert any(finding.severity == "CRITICAL" and "subprocess.run" in finding.message for finding in result.findings)
    assert any(edge.is_tainted for edge in result.edges)


def test_llm_output_reaching_one_hop_sink_is_detected() -> None:
    result = AgentASTVisitor("agent.py").analyze(
        """
import os

def execute(value):
    os.system(value)

def agent(prompt):
    answer = model.invoke(prompt)
    execute(answer)
"""
    )
    assert any("one-hop dangerous call" in finding.message for finding in result.findings)
    assert any(node.category == "DANGEROUS_SINK" for node in result.nodes)


def test_langgraph_invocation_requires_recursion_limit() -> None:
    result = AgentASTVisitor("graph.py").analyze(
        """
from langgraph.graph import StateGraph

builder = StateGraph(dict)
app = builder.compile()
app.invoke({"messages": []})
"""
    )
    assert any("LangGraph invocation" in finding.message for finding in result.findings)

