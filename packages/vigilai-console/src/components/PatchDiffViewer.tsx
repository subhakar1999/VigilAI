"use client";

import { useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Download,
  GitBranch,
  GitPullRequest,
  Sparkles,
} from "lucide-react";

interface PatchPreset {
  id: string;
  name: string;
  file: string;
  description: string;
  ruleId: string;
  vulnerableCode: string[];
  remediatedCode: string[];
  unifiedDiff: string;
}

const patchPresets: Record<string, PatchPreset> = {
  shell: {
    id: "shell",
    name: "Shell Tool Approval Gate & Input Allowlist",
    file: "app/tools/terminal.py",
    description: "Adds mandatory human approval decorator and input command allowlisting to prevent indirect prompt injection RCE.",
    ruleId: "ASI02: Tool Misuse & Unauthorized Invocations",
    vulnerableCode: [
      "import subprocess",
      "from langchain.tools import tool",
      "",
      "@tool",
      "def execute_shell(cmd: str) -> str:",
      "    # VULNERABLE: Direct execution of untrusted LLM prompt",
      "    return subprocess.check_output(cmd, shell=True).decode()",
    ],
    remediatedCode: [
      "import subprocess",
      "from langchain.tools import tool",
      "from vigilai.guardrails import require_approval, Allowlist",
      "",
      "@tool",
      "@require_approval(role=\"devops_admin\", timeout_sec=60)",
      "def execute_shell(cmd: str) -> str:",
      "    # REMEDIATED: Command validated against approved prefix allowlist",
      "    allowlist = Allowlist([\"ls\", \"git status\", \"pytest\", \"df -h\"])",
      "    safe_cmd = allowlist.validate(cmd)",
      "    return subprocess.check_output(safe_cmd, shell=False).decode()",
    ],
    unifiedDiff: `--- a/app/tools/terminal.py
+++ b/app/tools/terminal.py
@@ -1,7 +1,11 @@
 import subprocess
 from langchain.tools import tool
+from vigilai.guardrails import require_approval, Allowlist
 
 @tool
+@require_approval(role="devops_admin", timeout_sec=60)
 def execute_shell(cmd: str) -> str:
-    # VULNERABLE: Direct execution of untrusted LLM prompt
-    return subprocess.check_output(cmd, shell=True).decode()
+    # REMEDIATED: Command validated against approved prefix allowlist
+    allowlist = Allowlist(["ls", "git status", "pytest", "df -h"])
+    safe_cmd = allowlist.validate(cmd)
+    return subprocess.check_output(safe_cmd, shell=False).decode()`,
  },
  exfiltration: {
    id: "exfiltration",
    name: "Outbound Network Egress & RAG Sanitizer",
    file: "app/rag/retriever.py",
    description: "Restricts outbound network destinations to approved internal endpoints and redacts customer PII before LLM synthesis.",
    ruleId: "ASI03: Identity & Credential Exfiltration",
    vulnerableCode: [
      "import requests",
      "",
      "def dispatch_data(url: str, payload: dict):",
      "    # VULNERABLE: Unbounded network egress to attacker C2",
      "    return requests.post(url, json=payload)",
    ],
    remediatedCode: [
      "import requests",
      "from vigilai.network import EgressFirewall, redact_pii",
      "",
      "def dispatch_data(url: str, payload: dict):",
      "    # REMEDIATED: Verify URL against approved corporate CIDRs",
      "    firewall = EgressFirewall(allowed_domains=[\"api.company.internal\"])",
      "    firewall.assert_permitted(url)",
      "    sanitized_payload = redact_pii(payload)",
      "    return requests.post(url, json=sanitized_payload)",
    ],
    unifiedDiff: `--- a/app/rag/retriever.py
+++ b/app/rag/retriever.py
@@ -1,5 +1,9 @@
 import requests
+from vigilai.network import EgressFirewall, redact_pii
 
 def dispatch_data(url: str, payload: dict):
-    # VULNERABLE: Unbounded network egress to attacker C2
-    return requests.post(url, json=payload)
+    # REMEDIATED: Verify URL against approved corporate CIDRs
+    firewall = EgressFirewall(allowed_domains=["api.company.internal"])
+    firewall.assert_permitted(url)
+    sanitized_payload = redact_pii(payload)
+    return requests.post(url, json=sanitized_payload)`,
  },
  recursion: {
    id: "recursion",
    name: "Loop Bounding & Max Iterations Constraint",
    file: "app/agent/graph.py",
    description: "Enforces max_iterations and execution timeout bounds to prevent infinite ReAct cyclic livelocks.",
    ruleId: "ASI04: Uncontrolled Agent Recursion & Denial of Wallet",
    vulnerableCode: [
      "from langgraph.graph import StateGraph",
      "",
      "workflow = StateGraph(AgentState)",
      "# VULNERABLE: Unbounded reasoning cycle",
      "workflow.add_edge(\"tools\", \"agent\")",
      "app = workflow.compile()",
    ],
    remediatedCode: [
      "from langgraph.graph import StateGraph",
      "from vigilai.governance import with_recursion_bounds",
      "",
      "workflow = StateGraph(AgentState)",
      "# REMEDIATED: Bound execution with hard max_iterations limit",
      "workflow.add_edge(\"tools\", \"agent\")",
      "app = workflow.compile()",
      "app = with_recursion_bounds(app, max_iterations=8, timeout_sec=45)",
    ],
    unifiedDiff: `--- a/app/agent/graph.py
+++ b/app/agent/graph.py
@@ -1,6 +1,8 @@
 from langgraph.graph import StateGraph
+from vigilai.governance import with_recursion_bounds
 
 workflow = StateGraph(AgentState)
-    # VULNERABLE: Unbounded reasoning cycle
 workflow.add_edge("tools", "agent")
 app = workflow.compile()
+# REMEDIATED: Bound execution with hard max_iterations limit
+app = with_recursion_bounds(app, max_iterations=8, timeout_sec=45)`,
  },
};

export function PatchDiffViewer({
  defaultPreset = "shell",
  allowPresetSwitch = true,
}: {
  defaultPreset?: string;
  allowPresetSwitch?: boolean;
}) {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>(
    patchPresets[defaultPreset] ? defaultPreset : "shell"
  );
  const [diffMode, setDiffMode] = useState<"side-by-side" | "unified" | "command">("unified");
  const [copiedPatch, setCopiedPatch] = useState<boolean>(false);
  const [copiedCommand, setCopiedCommand] = useState<boolean>(false);

  const activePatch = patchPresets[selectedPresetKey] || patchPresets.shell;

  const handleCopyPatch = () => {
    navigator.clipboard.writeText(activePatch.unifiedDiff);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  const handleDownloadPatch = () => {
    const element = document.createElement("a");
    const file = new Blob([activePatch.unifiedDiff], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `vigilai-${activePatch.id}-fix.patch`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const gitCommand = `curl -sSL http://localhost:8000/patches/${activePatch.id}.diff | git apply -v && git commit -m "fix(security): remediate ${activePatch.ruleId.split(':')[0]} with VigilAI quality gate"`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(gitCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c110e] overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/[.07] bg-white/[.02] p-4 sm:p-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#c7f36a] flex items-center gap-1">
              <Sparkles size={12} /> 1-CLICK AUTO-REMEDIATION PATCH
            </span>
            <span className="rounded bg-white/[.06] px-2 py-0.5 text-[9px] text-white/50">
              {activePatch.file}
            </span>
          </div>
          <h3 className="mt-1 text-base font-bold text-white">{activePatch.name}</h3>
          <p className="mt-0.5 text-xs text-white/45">{activePatch.description}</p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[.08] bg-black/40 p-1 text-xs">
          <button
            onClick={() => setDiffMode("unified")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
              diffMode === "unified" ? "bg-white/15 text-white shadow-xs" : "text-white/40 hover:text-white"
            }`}
          >
            Unified Diff
          </button>
          <button
            onClick={() => setDiffMode("side-by-side")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
              diffMode === "side-by-side" ? "bg-white/15 text-white shadow-xs" : "text-white/40 hover:text-white"
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setDiffMode("command")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
              diffMode === "command" ? "bg-[#c7f36a] text-[#10140d] font-semibold shadow-xs" : "text-white/40 hover:text-white"
            }`}
          >
            Git Command
          </button>
        </div>
      </div>

      {/* Preset Selector Pills (if allowed) */}
      {allowPresetSwitch && (
        <div className="flex items-center gap-2 border-b border-white/[.05] bg-black/20 px-5 py-2.5 overflow-x-auto text-xs">
          <span className="mono text-[10px] text-white/30 uppercase tracking-wider shrink-0">Remediation Rules:</span>
          {Object.values(patchPresets).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPresetKey(p.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition ${
                selectedPresetKey === p.id
                  ? "bg-[#c7f36a]/15 text-[#c7f36a] border border-[#c7f36a]/30"
                  : "text-white/40 hover:text-white border border-transparent"
              }`}
            >
              {p.id.toUpperCase()} · {p.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Diff Content Body */}
      <div className="p-4 sm:p-5">
        {diffMode === "unified" && (
          <div className="mono rounded-xl border border-white/[.07] bg-black/60 p-4 text-xs leading-6 overflow-x-auto">
            {activePatch.unifiedDiff.split("\n").map((line, idx) => {
              const isAdd = line.startsWith("+") && !line.startsWith("+++");
              const isDel = line.startsWith("-") && !line.startsWith("---");
              const isMeta = line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++");

              return (
                <div
                  key={idx}
                  className={`flex items-start px-2 py-0.5 rounded ${
                    isAdd
                      ? "bg-[#c7f36a]/10 text-[#d7fb8c]"
                      : isDel
                      ? "bg-[#ff7379]/10 text-[#ff9ca0]"
                      : isMeta
                      ? "text-[#38bdf8] font-bold"
                      : "text-white/60"
                  }`}
                >
                  <span className="w-8 select-none text-[10px] text-white/20">{idx + 1}</span>
                  <span className="whitespace-pre">{line}</span>
                </div>
              );
            })}
          </div>
        )}

        {diffMode === "side-by-side" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Vulnerable (Before) */}
            <div className="rounded-xl border border-[#ff7379]/20 bg-[#ff7379]/[.03] p-4">
              <div className="flex items-center justify-between border-b border-[#ff7379]/15 pb-2 mb-3 text-xs">
                <span className="mono text-[#ff8b90] font-semibold">BEFORE (VULNERABLE)</span>
                <span className="mono text-[10px] text-white/30">{activePatch.file}</span>
              </div>
              <pre className="mono text-xs leading-6 text-white/60 whitespace-pre-wrap">
                {activePatch.vulnerableCode.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="w-6 text-white/20 select-none text-[10px]">{i + 1}</span>
                    <span className={line.includes("VULNERABLE") ? "text-[#ff9ca0] font-semibold" : ""}>{line}</span>
                  </div>
                ))}
              </pre>
            </div>

            {/* Remediated (After) */}
            <div className="rounded-xl border border-[#c7f36a]/20 bg-[#c7f36a]/[.03] p-4">
              <div className="flex items-center justify-between border-b border-[#c7f36a]/15 pb-2 mb-3 text-xs">
                <span className="mono text-[#c7f36a] font-semibold">AFTER (REMEDIATED)</span>
                <span className="mono text-[10px] text-white/30">{activePatch.file}</span>
              </div>
              <pre className="mono text-xs leading-6 text-white/80 whitespace-pre-wrap">
                {activePatch.remediatedCode.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="w-6 text-white/20 select-none text-[10px]">{i + 1}</span>
                    <span className={line.includes("@require_approval") || line.includes("REMEDIATED") || line.includes("Allowlist") ? "text-[#c7f36a] font-semibold" : ""}>
                      {line}
                    </span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}

        {diffMode === "command" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[.08] bg-black/60 p-5">
              <span className="mono text-[10px] uppercase tracking-wider text-white/40 block mb-2">
                Run directly in your local agent repository to apply:
              </span>
              <div className="mono text-xs text-[#c7f36a] bg-black/40 p-3 rounded-lg border border-white/[.06] flex items-center justify-between gap-3">
                <span className="break-all">{gitCommand}</span>
                <button
                  onClick={handleCopyCommand}
                  className="shrink-0 rounded-lg bg-white/10 p-1.5 hover:bg-white/20 text-white transition"
                  title="Copy command"
                >
                  {copiedCommand ? <Check size={14} className="text-[#c7f36a]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-white/40">
              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3 flex items-center gap-2">
                <GitBranch size={16} className="text-[#c7f36a]" />
                <span>Compatible with Git 2.20+ patch format</span>
              </div>
              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3 flex items-center gap-2">
                <GitPullRequest size={16} className="text-[#38bdf8]" />
                <span>Auto-generates verified security commit message</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="mt-5 flex flex-wrap items-center justify-between border-t border-white/[.06] pt-4 text-xs gap-3">
          <div className="flex items-center gap-2 text-white/40">
            <Code2 size={14} className="text-[#c7f36a]" />
            <span>Remediation verified against {activePatch.ruleId.split(":")[0]}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPatch}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[.03] px-3.5 py-2 text-xs font-medium text-white hover:bg-white/[.07] transition"
            >
              <Download size={13} />
              <span>Download .patch</span>
            </button>
            <button
              onClick={handleCopyPatch}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#c7f36a] px-4 py-2 text-xs font-semibold text-[#10140d] hover:bg-[#d7fb8c] transition shadow-sm"
            >
              {copiedPatch ? (
                <>
                  <Check size={13} />
                  <span>Copied Patch!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Git Patch</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
