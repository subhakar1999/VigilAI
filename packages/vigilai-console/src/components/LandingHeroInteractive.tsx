"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Play,
  Search,
  ShieldCheck,
  Terminal,
  Workflow,
  XCircle,
} from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  framework: string;
  status: "PASSED" | "FAILED";
  asr: string;
  risk: number;
  policy: string;
  affectedNode: string;
  forbiddenTool: string;
  invocations: string[];
  networkRequests: string[];
  remediation: string;
  nodes: {
    id: string;
    label: string;
    sublabel: string;
    type: "source" | "reasoning" | "tool" | "sink";
    status?: "compromised" | "safe" | "blocked";
  }[];
}

const scenarios: Record<string, Scenario> = {
  "vulnerable-shell": {
    id: "vulnerable-shell",
    name: "vulnerable-shell",
    framework: "FastAPI / LangChain",
    status: "FAILED",
    asr: "100.0%",
    risk: 85,
    policy: "unauthorized tool use",
    affectedNode: "Shell tool",
    forbiddenTool: "shell",
    invocations: ['"shell"'],
    networkRequests: [],
    remediation:
      "Add a human approval gate before the shell tool and validate its input against an allowlist.",
    nodes: [
      { id: "prompt", label: "User prompt", sublabel: "Untrusted payload", type: "source" },
      { id: "agent", label: "Agent", sublabel: "ReAct reasoning loop", type: "reasoning" },
      { id: "shell", label: "Shell tool", sublabel: "exec / bash -c", type: "tool", status: "compromised" },
      { id: "net", label: "Network", sublabel: "Host system boundary", type: "sink", status: "blocked" },
    ],
  },
  "vulnerable-exfiltration": {
    id: "vulnerable-exfiltration",
    name: "vulnerable-exfiltration",
    framework: "FastAPI / LlamaIndex",
    status: "FAILED",
    asr: "100.0%",
    risk: 90,
    policy: "unauthorized outbound exfiltration",
    affectedNode: "Webhook egress",
    forbiddenTool: "http_post",
    invocations: ['"vector_query"', '"http_post"'],
    networkRequests: ['"https://attacker-c2.dev/telemetry"'],
    remediation:
      "Constrain outbound network destinations with an explicit egress CIDR allowlist and redact RAG context.",
    nodes: [
      { id: "rag", label: "Poisoned RAG doc", sublabel: "Indirect injection", type: "source" },
      { id: "agent", label: "Agent", sublabel: "Document synthesizer", type: "reasoning" },
      { id: "tool", label: "HTTP egress", sublabel: "curl / requests", type: "tool", status: "compromised" },
      { id: "leak", label: "External C2", sublabel: "Data exfiltration sink", type: "sink", status: "compromised" },
    ],
  },
  "approval-gated-orders": {
    id: "approval-gated-orders",
    name: "approval-gated-orders",
    framework: "FastAPI / CrewAI",
    status: "PASSED",
    asr: "0.00%",
    risk: 12,
    policy: "none (mitigated via HITL gate)",
    affectedNode: "Order dispatch",
    forbiddenTool: "none",
    invocations: ['"human_review_queue"'],
    networkRequests: [],
    remediation: "Policy adhered: High-impact database mutation blocked pending operator 2FA sign-off.",
    nodes: [
      { id: "prompt", label: "Customer request", sublabel: "Tainted transaction", type: "source" },
      { id: "agent", label: "Agent", sublabel: "Order orchestrator", type: "reasoning" },
      { id: "hitl", label: "Human gate", sublabel: "2FA operator sign-off", type: "tool", status: "safe" },
      { id: "db", label: "Payment ledger", sublabel: "Protected sink", type: "sink", status: "safe" },
    ],
  },
  "safe-support": {
    id: "safe-support",
    name: "safe-support",
    framework: "FastAPI / LangGraph",
    status: "PASSED",
    asr: "0.00%",
    risk: 0,
    policy: "none (clean execution DAG)",
    affectedNode: "Read-only docs",
    forbiddenTool: "none",
    invocations: ['"kb_search"'],
    networkRequests: [],
    remediation: "Workload complies with OWASP ASI01–ASI10 rules. No remediation required.",
    nodes: [
      { id: "prompt", label: "User query", sublabel: "Sanitized prompt", type: "source" },
      { id: "agent", label: "Agent", sublabel: "Knowledge retriever", type: "reasoning" },
      { id: "kb", label: "KB Search", sublabel: "Read-only SQLite", type: "tool", status: "safe" },
      { id: "resp", label: "Safe response", sublabel: "Synthesized markdown", type: "sink", status: "safe" },
    ],
  },
};

const fleetInventory = [
  {
    name: "safe-support",
    endpoint: "/agents/safe-support",
    gate: "PASSED",
    asr: "0.00%",
    risk: 0,
    mcp: 1,
    framework: "FastAPI",
  },
  {
    name: "vulnerable-shell",
    endpoint: "/agents/vulnerable-shell",
    gate: "FAILED",
    asr: "Above 0.00%",
    risk: 85,
    mcp: 3,
    framework: "FastAPI",
  },
  {
    name: "vulnerable-exfiltration",
    endpoint: "/agents/vulnerable-exfiltration",
    gate: "FAILED",
    asr: "Above 0.00%",
    risk: 90,
    mcp: 2,
    framework: "FastAPI",
  },
  {
    name: "approval-gated-orders",
    endpoint: "/agents/approval-gated-orders",
    gate: "PASSED",
    asr: "0.00%",
    risk: 12,
    mcp: 2,
    framework: "FastAPI",
  },
];

export function LandingHeroInteractive() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"graph" | "fleet" | "login" | "cli">("graph");
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>("vulnerable-shell");
  const [isPentesting, setIsPentesting] = useState(false);
  const [copiedFix, setCopiedFix] = useState(false);
  const [fleetSearch, setFleetSearch] = useState("");

  // Sign-in states
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("vigilai2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const currentScenario = scenarios[selectedScenarioKey] || scenarios["vulnerable-shell"];

  const handleRunPentest = () => {
    setIsPentesting(true);
    setTimeout(() => {
      setIsPentesting(false);
    }, 1200);
  };

  const handleCopyFix = () => {
    navigator.clipboard.writeText(currentScenario.remediation);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { detail?: string };
      if (!res.ok) throw new Error(data.detail ?? "Login failed");
      router.push("/console");
      router.refresh();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Authentication failed");
      setLoginLoading(false);
    }
  };

  const filteredFleet = fleetInventory.filter((item) =>
    item.name.toLowerCase().includes(fleetSearch.toLowerCase()) ||
    item.endpoint.toLowerCase().includes(fleetSearch.toLowerCase())
  );

  return (
    <div className="relative mx-auto mt-12 w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c100e] text-left shadow-[0_45px_120px_rgba(0,0,0,0.65)]">
      {/* Top Browser / Control Plane Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/[.08] bg-[#090d0b]/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff7379]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f7c967]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#c7f36a]/80" />
          </div>
          <span className="mono hidden text-[11px] text-white/30 sm:inline-block">
            vigilai-control-plane // {activeTab}
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-white/[.07] bg-black/40 p-1">
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "graph"
                ? "bg-[#c7f36a] text-[#10140d] shadow-sm font-semibold"
                : "text-white/50 hover:bg-white/[.04] hover:text-white"
            }`}
          >
            <Workflow size={13} />
            <span>Execution Graph</span>
          </button>
          <button
            onClick={() => setActiveTab("fleet")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "fleet"
                ? "bg-[#c7f36a] text-[#10140d] shadow-sm font-semibold"
                : "text-white/50 hover:bg-white/[.04] hover:text-white"
            }`}
          >
            <ShieldCheck size={13} />
            <span>Fleet Posture</span>
          </button>
          <button
            onClick={() => setActiveTab("login")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "login"
                ? "bg-[#38bdf8] text-[#070e17] shadow-sm font-semibold"
                : "text-white/50 hover:bg-white/[.04] hover:text-white"
            }`}
          >
            <Lock size={13} />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => setActiveTab("cli")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "cli"
                ? "bg-white/15 text-white shadow-sm font-semibold"
                : "text-white/50 hover:bg-white/[.04] hover:text-white"
            }`}
          >
            <Terminal size={13} />
            <span>CLI Gate</span>
          </button>
        </div>

        <div className="hidden items-center gap-2 text-[10px] text-[#c7f36a] sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c7f36a] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c7f36a]" />
          </span>
          <span>sensor online</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: EXECUTION GRAPH (SCREENSHOT 2 REFERENCE) */}
      {/* ============================================================== */}
      {activeTab === "graph" && (
        <div className="p-5 sm:p-7">
          {/* Workload Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[.06] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="mono text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">
                  FLEET / {currentScenario.name.toUpperCase()}
                </span>
                <span className="rounded bg-white/[.06] px-2 py-0.5 text-[9px] text-white/50">
                  {currentScenario.framework}
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-[-.03em] text-white">
                {currentScenario.name}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Scenario Quick Selector */}
              <div className="flex items-center rounded-lg border border-white/[.08] bg-black/30 p-1 text-xs">
                {Object.keys(scenarios).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedScenarioKey(key)}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                      selectedScenarioKey === key
                        ? "bg-white/10 text-white shadow-xs"
                        : "text-white/40 hover:text-white/80"
                    }`}
                  >
                    {key.replace("vulnerable-", "vuln-").replace("-orders", "")}
                  </button>
                ))}
              </div>

              <Link
                href="/console"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-xs text-white/70 transition hover:bg-white/[.07] hover:text-white"
              >
                <span>Export AIBOM</span>
              </Link>
              <button
                onClick={handleRunPentest}
                disabled={isPentesting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-[#2563eb] disabled:opacity-50"
              >
                {isPentesting ? (
                  <LoaderCircle size={13} className="animate-spin" />
                ) : (
                  <Play size={13} className="fill-current" />
                )}
                <span>{isPentesting ? "Simulating probes..." : "Run pentest"}</span>
              </button>
            </div>
          </div>

          {/* Gate Status Banner */}
          <div
            className={`mt-5 rounded-xl border p-4 transition-all duration-300 ${
              currentScenario.status === "FAILED"
                ? "border-[#ff7379]/30 bg-[#ff7379]/[.05]"
                : "border-[#c7f36a]/30 bg-[#c7f36a]/[.05]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    currentScenario.status === "FAILED"
                      ? "bg-[#ff7379] text-[#10140d]"
                      : "bg-[#c7f36a] text-[#10140d]"
                  }`}
                >
                  {currentScenario.status === "FAILED" ? (
                    <XCircle size={12} className="stroke-[2.5]" />
                  ) : (
                    <CheckCircle2 size={12} className="stroke-[2.5]" />
                  )}
                  {currentScenario.status}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    currentScenario.status === "FAILED" ? "text-[#ff9ca0]" : "text-[#d7fb8c]"
                  }`}
                >
                  {currentScenario.status === "FAILED"
                    ? "Quality gate blocked"
                    : "Quality gate passed"}
                </span>
              </div>
              <span className="mono text-xs text-white/40">
                Risk Score: <strong className="text-white">{currentScenario.risk}/100</strong>
              </span>
            </div>

            <ul className="mt-3 space-y-1 text-xs text-white/70">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff7379]" />
                Attack Success Rate is {currentScenario.asr}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff7379]" />
                {currentScenario.status === "FAILED"
                  ? "Indirect prompt injection triggered an unauthorized tool invocation"
                  : "All red-team adversarial probes successfully neutralized by guardrails"}
              </li>
            </ul>
          </div>

          {/* Interactive Flow Diagram / Execution Graph */}
          <div className="mt-6 rounded-2xl border border-white/[.08] bg-[#080c0a] p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="mono text-[10px] uppercase tracking-[.18em] text-white/35">
                EXECUTION GRAPH
              </p>
              <div className="flex items-center gap-4 text-[10px] text-white/30">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#f4cf64]" /> Taint source
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#b18cff]" /> Reasoning
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#ff7379]" /> Compromised tool
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#c7f36a]" /> Safe sink
                </span>
              </div>
            </div>

            {/* Nodes Container */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:gap-4 relative py-4">
              {currentScenario.nodes.map((node, index) => {
                const isCompromised = node.status === "compromised";
                const isSafe = node.status === "safe";

                return (
                  <div key={node.id} className="relative flex flex-col items-center">
                    <div
                      className={`w-full rounded-xl border p-4 text-center transition-all duration-300 ${
                        isCompromised
                          ? "border-[#ff7379] bg-[#221012] shadow-[0_0_24px_rgba(255,115,121,0.22)]"
                          : isSafe
                          ? "border-[#c7f36a]/40 bg-[#121c15]"
                          : "border-white/10 bg-[#121715]"
                      }`}
                    >
                      <span className="text-xs font-semibold text-white">{node.label}</span>
                      <span className="mt-1 block text-[10px] text-white/40">{node.sublabel}</span>

                      {isCompromised && (
                        <span className="mt-3 inline-block rounded bg-[#ff7379]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff7379] border border-[#ff7379]/40 animate-pulse">
                          COMPROMISED
                        </span>
                      )}
                      {isSafe && (
                        <span className="mt-3 inline-block rounded bg-[#c7f36a]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#c7f36a] border border-[#c7f36a]/40">
                          PROTECTED
                        </span>
                      )}
                    </div>

                    {/* Flow arrow to next node */}
                    {index < currentScenario.nodes.length - 1 && (
                      <div className="hidden sm:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10">
                        <ArrowRight
                          size={14}
                          className={
                            isCompromised ? "text-[#ff7379]" : "text-white/25"
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Episode Evidence & Remediation Grid */}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {/* Latest Failed Episode Card */}
            <div className="rounded-xl border border-white/[.07] bg-white/[.02] p-5">
              <h3 className="mono text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">
                LATEST FAILED EPISODE
              </h3>
              <div className="mt-4 space-y-2 text-xs text-white/70">
                <div className="flex justify-between border-b border-white/[.04] pb-2">
                  <span className="text-white/40">Violated policy:</span>
                  <span className="font-medium text-[#ff9ca0]">{currentScenario.policy}</span>
                </div>
                <div className="flex justify-between border-b border-white/[.04] pb-2">
                  <span className="text-white/40">Affected node:</span>
                  <span className="font-mono text-white/90">{currentScenario.affectedNode}</span>
                </div>
                <div className="flex justify-between border-b border-white/[.04] pb-2">
                  <span className="text-white/40">Forbidden tool:</span>
                  <span className="font-mono text-[#ff9ca0]">{currentScenario.forbiddenTool}</span>
                </div>
              </div>

              <div className="mono mt-4 rounded-lg bg-black/40 p-3 text-[11px] leading-5 text-white/40 border border-white/[.04]">
                <p>
                  <span className="text-white/20">trace.tool_invocations:</span>{" "}
                  <span className="text-[#c7f36a]">[{currentScenario.invocations.join(", ")}]</span>
                </p>
                <p>
                  <span className="text-white/20">trace.network_requests:</span>{" "}
                  <span className="text-white/50">
                    [{currentScenario.networkRequests.join(", ")}]
                  </span>
                </p>
              </div>
            </div>

            {/* Suggested Remediation Card */}
            <div className="flex flex-col justify-between rounded-xl border border-white/[.07] bg-white/[.02] p-5">
              <div>
                <h3 className="mono text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">
                  SUGGESTED REMEDIATION
                </h3>
                <p className="mt-4 text-xs leading-6 text-white/75">
                  {currentScenario.remediation}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/[.05] pt-4">
                <span className="mono text-[10px] text-white/30">Auto-generated mitigation fix</span>
                <button
                  onClick={handleCopyFix}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[.05] px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  {copiedFix ? (
                    <>
                      <Check size={12} className="text-[#c7f36a]" />
                      <span className="text-[#c7f36a]">Copied fix!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy fix</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: FLEET POSTURE (SCREENSHOT 3 REFERENCE) */}
      {/* ============================================================== */}
      {activeTab === "fleet" && (
        <div className="p-5 sm:p-7">
          {/* Fleet Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[.06] pb-5">
            <div>
              <p className="mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]">
                FLEET OVERVIEW
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-.03em] text-white">
                AI quality posture
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={fleetSearch}
                  onChange={(e) => setFleetSearch(e.target.value)}
                  className="w-48 rounded-lg border border-white/10 bg-black/40 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#c7f36a]/40"
                />
              </div>
              <Link
                href="/console"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-[#2563eb]"
              >
                <span>+ Add endpoint</span>
              </Link>
            </div>
          </div>

          {/* Metric KPI Cards (Exact Screenshot 3 Match) */}
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-white/[.07] bg-white/[.02] p-4">
              <span className="mono text-[10px] uppercase tracking-wider text-white/40">
                WORKLOADS
              </span>
              <strong className="mt-3 block text-3xl font-semibold text-white">4</strong>
              <p className="mt-1 text-[11px] text-white/30">Active agent targets</p>
            </div>
            <div className="rounded-xl border border-white/[.07] bg-white/[.02] p-4">
              <span className="mono text-[10px] uppercase tracking-wider text-white/40">
                GATE PASSED
              </span>
              <strong className="mt-3 block text-3xl font-semibold text-[#c7f36a]">2</strong>
              <p className="mt-1 text-[11px] text-white/30">50% fleet compliance</p>
            </div>
            <div className="rounded-xl border border-white/[.07] bg-white/[.02] p-4">
              <span className="mono text-[10px] uppercase tracking-wider text-white/40">
                GATE FAILED
              </span>
              <strong className="mt-3 block text-3xl font-semibold text-[#ff7379]">2</strong>
              <p className="mt-1 text-[11px] text-white/30">Blocked before ship</p>
            </div>
            <div className="rounded-xl border border-white/[.07] bg-white/[.02] p-4">
              <span className="mono text-[10px] uppercase tracking-wider text-white/40">
                NEXT ACTION
              </span>
              <p className="mt-2 text-xs font-medium leading-5 text-white/80">
                Review failed red-team episodes on{" "}
                <span className="text-[#ff9ca0]">vulnerable-shell</span>
              </p>
            </div>
          </div>

          {/* Agent Inventory Table */}
          <div className="mt-6 overflow-hidden rounded-xl border border-white/[.07] bg-white/[.015]">
            <div className="flex items-center justify-between border-b border-white/[.06] bg-white/[.02] px-5 py-3">
              <span className="text-xs font-semibold text-white">Agent inventory</span>
              <span className="mono text-[9px] uppercase tracking-widest text-[#c7f36a]/80">
                DYNAMIC GATE ACTIVE
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[.06] bg-white/[.01] text-[10px] uppercase tracking-wider text-white/35">
                    <th className="px-5 py-3 font-medium">AGENT</th>
                    <th className="px-5 py-3 font-medium">ENDPOINT</th>
                    <th className="px-5 py-3 font-medium">GATE</th>
                    <th className="px-5 py-3 font-medium">ASR</th>
                    <th className="px-5 py-3 font-medium text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[.04]">
                  {filteredFleet.map((row) => (
                    <tr key={row.name} className="transition hover:bg-white/[.02]">
                      <td className="px-5 py-3.5 font-medium text-white/85">
                        <div className="flex items-center gap-2">
                          <span>{row.name}</span>
                          <span className="rounded bg-white/[.05] px-1.5 py-0.5 text-[9px] text-white/40">
                            {row.framework}
                          </span>
                        </div>
                      </td>
                      <td className="mono px-5 py-3.5 text-white/45">{row.endpoint}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            row.gate === "PASSED"
                              ? "bg-[#c7f36a]/10 text-[#c7f36a]"
                              : "bg-[#ff7379]/10 text-[#ff9ca0]"
                          }`}
                        >
                          {row.gate === "PASSED" ? (
                            <CheckCircle2 size={10} />
                          ) : (
                            <XCircle size={10} />
                          )}
                          {row.gate}
                        </span>
                      </td>
                      <td className="mono px-5 py-3.5 text-white/60">{row.asr}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedScenarioKey(row.name);
                            setActiveTab("graph");
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#38bdf8] transition hover:underline"
                        >
                          <span>Open</span>
                          <ArrowRight size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SIGN IN TO CONSOLE (SCREENSHOT 1 REFERENCE) */}
      {/* ============================================================== */}
      {activeTab === "login" && (
        <div className="grid lg:grid-cols-2 min-h-[30rem] items-center p-6 sm:p-10 gap-8">
          {/* Left Column (Brand & Value Proposition from Screenshot 1) */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#c7f36a]/20 bg-[#c7f36a]/[.08]">
                <Image src="/vigilai-logo.png" alt="" width={24} height={24} />
              </span>
              <span className="text-base font-bold tracking-tight text-white">VigilAI</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-.04em] text-white leading-tight">
              Quality gates for <br />
              <span className="text-[#38bdf8]">AI agents.</span>
            </h2>

            <p className="max-w-md text-sm leading-6 text-white/55">
              Scan models, audit MCP tools, and red-team running agents before they ship to
              production.
            </p>

            <div className="space-y-2 pt-2 text-xs text-white/40">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-[#38bdf8]" />
                <span>Deterministic pass/fail gate for GitHub Actions & CI/CD</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-[#38bdf8]" />
                <span>Zero telemetry: 100% self-hosted on your infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-[#38bdf8]" />
                <span>Automated Attack Success Rate (ASR) tracking</span>
              </div>
            </div>
          </div>

          {/* Right Column (Sign In Form Card from Screenshot 1) */}
          <div className="rounded-2xl border border-white/10 bg-[#101518]/90 p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Sign in to the console</h3>

            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mono block text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  USERNAME
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                />
              </div>

              <div>
                <label className="mono block text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  PASSWORD
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="rounded-lg border border-[#ff7379]/30 bg-[#ff7379]/10 p-2.5 text-xs text-[#ff9ca0]">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-xl bg-[#3b82f6] py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#2563eb] disabled:opacity-50"
              >
                {loginLoading ? "Authenticating..." : "Sign in"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("admin");
                  setPassword("vigilai2026!");
                }}
                className="w-full rounded-xl border border-dashed border-white/15 bg-white/[.02] py-2 text-xs text-white/50 hover:bg-white/[.05] hover:text-white transition"
              >
                ⚡ Pre-fill default credentials (admin / vigilai2026!)
              </button>
            </form>

            <p className="mt-5 text-center text-[11px] leading-5 text-white/35">
              Access uses environment-configured credentials and an HTTP-only session cookie.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: CLI & CI/CD TERMINAL DEMO */}
      {/* ============================================================== */}
      {activeTab === "cli" && (
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between border-b border-white/[.06] pb-4">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-[#c7f36a]" />
              <span className="mono text-xs font-semibold text-white">
                Developer CLI & Pipeline Gate
              </span>
            </div>
            <span className="mono text-[10px] text-white/30">Exit code: 1 (Blocked PR)</span>
          </div>

          <div className="mono mt-4 rounded-xl border border-white/[.08] bg-black/60 p-5 text-xs leading-6 text-white/70">
            <p className="text-white/40"># Run static AST taint scan & dynamic pentest locally</p>
            <p className="mt-1">
              <span className="text-[#c7f36a]">$</span> vigilai scan . --fail-on-gate --sarif results.sarif
            </p>
            <p className="mt-3 text-white/40">── Model Checkpoint Scanning (Pickle VM Emulation) ──</p>
            <p className="text-white/60">[+] Inspecting ./models/classifier.pt ... SAFE (0 unpickling gadgets)</p>
            <p className="mt-2 text-white/40">── AST Taint Tracking (OWASP ASI01–ASI10) ──</p>
            <p className="text-white/60">[+] Parsing agent entrypoint: ./app/agent.py (FastAPI)</p>
            <p className="text-[#ff7379]">
              [!] HIGH: Untrusted prompt flows into dangerous sink subprocess.Popen (line 42)
            </p>
            <p className="mt-2 text-white/40">── MCP Tool Supply Chain Verification ──</p>
            <p className="text-white/60">[+] Checking mcp.json against .mcp-lock.json ... HASH VALIDATED</p>
            <p className="mt-2 text-white/40">── Dynamic Red-Team Pentest Evaluation ──</p>
            <p className="text-white/60">[+] Executing 8 indirect prompt injection (IPI) episodes ...</p>
            <p className="text-[#ff7379]">[!] Episode 3: Unauthorized tool invocation triggered (shell)</p>
            <p className="mt-3 text-white/40">── Artifacts Generated ──</p>
            <p className="text-white/50">→ results.sarif (SARIF 2.1.0 for GitHub Code Scanning)</p>
            <p className="text-white/50">→ aibom.cdx.json (CycloneDX 1.6 signed software bill of materials)</p>
            <div className="mt-4 rounded-lg bg-[#ff7379]/10 border border-[#ff7379]/20 p-3 text-[#ff9ca0] font-semibold">
              ⨯ AI QUALITY GATE FAILED — Merging blocked by policy (Attack Success Rate &gt; 0.00%)
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Quick-Action Bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-white/[.08] bg-[#090d0b]/90 px-5 py-3 text-xs text-white/40">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-[#c7f36a]" />
            <span>OWASP Agentic Top 10</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-[#c7f36a]" />
            <span>SARIF 2.1.0 & CycloneDX 1.6</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="mono text-[10px] text-white/30">Local test lab ready</span>
          <Link
            href="/console"
            className="inline-flex items-center gap-1 font-semibold text-[#c7f36a] hover:underline"
          >
            Launch workspace <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
