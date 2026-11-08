"use client";

import { useState } from "react";
import {
  ArrowRight,
  Coins,
  Flame,
  Repeat,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

interface TestingDimension {
  id: string;
  title: string;
  badge: string;
  color: string;
  icon: typeof Zap;
  tagline: string;
  problem: string;
  vigilaiSolution: string;
  metrics: { label: string; value: string }[];
  codePreview: string;
}

const dimensions: TestingDimension[] = [
  {
    id: "chaos",
    title: "Chaos & Tool Fault Injection",
    badge: "FAULT RESILIENCE",
    color: "#ff7379",
    icon: Flame,
    tagline: "Agentic Chaos Monkey for MCP tools & APIs",
    problem:
      "When an external API returns 500, a 429 rate limit, or partial malformed JSON, 78% of autonomous agents crash or enter hallucinatory retry loops.",
    vigilaiSolution:
      "Injects synthetic latency, network drops, malformed schemas, and HTTP error codes into tool calls during pre-flight CI testing to verify circuit breakers and graceful fallbacks.",
    metrics: [
      { label: "Fault recovery rate", value: "99.4%" },
      { label: "Circuit breaker trigger", value: "<120ms" },
      { label: "Schema drift caught", value: "100%" },
    ],
    codePreview: `# Pre-flight Chaos Test in CI
$ vigilai test --chaos \\
    --fault "mcp.search:http_429" \\
    --fault "db.query:malformed_json"
[!] INJECTING: HTTP 429 into search tool...
[✓] Agent backed off exponentially (attempt 2 passed)
[!] INJECTING: Partial JSON into SQL parser...
[✓] Fallback schema validator caught syntax error
[✓] QUALITY GATE PASSED: Resilient to 8 tool failure scenarios`,
  },
  {
    id: "economics",
    title: "Denial-of-Wallet & Token Regression",
    badge: "FINANCIAL GOVERNANCE",
    color: "#f7c967",
    icon: Coins,
    tagline: "Catch prompt bloat and cost spikes in pull requests",
    problem:
      "A minor prompt change or system instruction edit can quietly double token consumption per workflow step, causing catastrophic monthly billing spikes.",
    vigilaiSolution:
      "Profiles token consumption (prompt + completion tokens) and end-to-end latency per agent task. Enforces PR merge blocks if token burn regresses by more than your set threshold.",
    metrics: [
      { label: "Token delta threshold", value: "±5%" },
      { label: "Context saturation warning", value: "85%" },
      { label: "Cost attribution per node", value: "$0.0001/step" },
    ],
    codePreview: `# Token Budget & Latency SLA Gate
$ vigilai test --budget-tokens 5000 --max-latency 4.0s
[+] Baseline: 2,410 tokens / 1.8s
[+] Candidate PR: 2,520 tokens / 1.9s (+4.5% delta)
[✓] Within 5.0% regression envelope
[!] Context utilization: 42% (SAFE)
[✓] QUALITY GATE PASSED: Zero financial regression`,
  },
  {
    id: "state",
    title: "Loop Deadlock & State Invariant Prover",
    badge: "FORMAL VERIFICATION",
    color: "#38bdf8",
    icon: Repeat,
    tagline: "Eliminate infinite ReAct loops & multi-agent livelocks",
    problem:
      "Multi-agent supervisor architectures easily fall into circular semantic ping-pong where Agent A asks Agent B, and Agent B asks Agent A endlessly without terminating.",
    vigilaiSolution:
      "Extracts the agent execution graph as a directed state machine. Statically and dynamically verifies acyclicity, mandatory termination bounds (max_iterations), and business invariants.",
    metrics: [
      { label: "Acyclic graph proof", value: "Formal" },
      { label: "Max iterations limit", value: "Enforced" },
      { label: "State transition checks", value: "100%" },
    ],
    codePreview: `# State Invariant & Livelock Scan
$ vigilai verify-graph ./workflows/order_fulfillment.py
[+] Analyzing ReAct loop termination bounds...
[!] ERROR: Peer-to-peer delegation missing termination condition
[!] Cycle detected: [order_agent -> inventory_agent -> order_agent]
[FAIL] QUALITY GATE BLOCKED: Unbounded recursive loop detected
[+] Remediation: Add acyclic supervisor gate or max_iterations <= 8`,
  },
  {
    id: "trajectory",
    title: "Trajectory Consistency & Golden Evals",
    badge: "BEHAVIORAL DETERMINISM",
    color: "#c7f36a",
    icon: Workflow,
    tagline: "Prove semantic stability across temperature seeds & typos",
    problem:
      "Non-deterministic LLMs make different tool decisions when users have typos, slight rewordings, or varying temperature seeds.",
    vigilaiSolution:
      "Runs automated prompt perturbation (adversarial typos, synonym swaps, reordered instructions) and evaluates adherence to golden reference tool call trajectories.",
    metrics: [
      { label: "Trajectory match", value: "98.2%" },
      { label: "Perturbation invariance", value: "99.1%" },
      { label: "Faithfulness score", value: "0.99" },
    ],
    codePreview: `# Golden Trajectory Eval Benchmark
$ vigilai eval --golden ./fixtures/gold_support_trajectory.json
[+] Running 10 perturbation suites across 3 temperature seeds...
[✓] Auth -> SearchDocs -> FormatMarkdown: 10/10 matches
[✓] Semantic Invariance Score: 98.6% (Threshold >= 95%)
[✓] Tool Argument Types: 100% Pydantic valid
[✓] QUALITY GATE PASSED: Deterministic behavior guaranteed`,
  },
];

export function LandingBeyondOwasp() {
  const [activeId, setActiveId] = useState<string>("chaos");
  const active = dimensions.find((d) => d.id === activeId) || dimensions[0];

  return (
    <section id="beyond-owasp" className="border-t border-white/[.07] bg-[#070a08] px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1360px]">
        {/* Section Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c7f36a]/25 bg-[#c7f36a]/[.07] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]">
              <Sparkles size={13} /> Comprehensive AgentOps &amp; Evaluation
            </div>
            <h2 className="mt-5 text-4xl font-bold tracking-[-.05em] text-white sm:text-6xl leading-tight">
              Beyond security. <br />
              <span className="text-[#c7f36a]">Full-lifecycle reliability.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
              OWASP covers security vulnerabilities—but production AI agent workflows fail just as often from
              tool timeouts, recursive deadlocks, token cost spikes, and non-deterministic trajectory drift.
              VigilAI gates them all.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
            <span className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-1.5 mono">
              Chaos Engineering
            </span>
            <span className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-1.5 mono">
              Token Regression
            </span>
            <span className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-1.5 mono">
              Formal Invariants
            </span>
          </div>
        </div>

        {/* 4 Feature Tabs */}
        <div className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {dimensions.map((dim) => {
            const isSelected = dim.id === activeId;
            const DimIcon = dim.icon;

            return (
              <button
                key={dim.id}
                onClick={() => setActiveId(dim.id)}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                  isSelected
                    ? "border-[#c7f36a] bg-[#101713] shadow-[0_0_30px_rgba(199,243,106,0.15)]"
                    : "border-white/[.08] bg-white/[.02] hover:border-white/20 hover:bg-white/[.04]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-xl"
                      style={{
                        backgroundColor: `${dim.color}15`,
                        color: dim.color,
                      }}
                    >
                      <DimIcon size={20} />
                    </span>
                    <span className="mono text-[9px] uppercase tracking-wider text-white/35">
                      {dim.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-semibold text-white">{dim.title}</h3>
                  <p className="mt-1 text-xs text-white/45 line-clamp-2">{dim.tagline}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/[.06] pt-3 text-[11px]">
                  <span className="mono text-white/35">Quality Gate Metric</span>
                  <ArrowRight
                    size={13}
                    className={isSelected ? "text-[#c7f36a]" : "text-white/20"}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Dimension Spotlight Container */}
        <div className="mt-8 grid gap-6 rounded-3xl border border-white/10 bg-[#0c110e] p-6 lg:grid-cols-12 lg:p-8 shadow-2xl">
          {/* Left Details (7 cols) */}
          <div className="flex flex-col justify-between lg:col-span-7">
            <div>
              <div className="flex items-center gap-2">
                <span className="mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]">
                  {active.badge} · EVALUATION DIMENSION
                </span>
              </div>
              <h3 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {active.title}
              </h3>
              <p className="mt-2 text-sm font-medium text-[#c7f36a]">{active.tagline}</p>

              {/* The Production Problem */}
              <div className="mt-5 rounded-xl border border-white/[.07] bg-black/30 p-4">
                <span className="mono text-[10px] uppercase tracking-wider text-[#ff7379] font-bold block mb-1">
                  The Production Failure Mode:
                </span>
                <p className="text-xs leading-5 text-white/70">{active.problem}</p>
              </div>

              {/* VigilAI Solution */}
              <div className="mt-4 rounded-xl border border-white/[.07] bg-black/30 p-4">
                <span className="mono text-[10px] uppercase tracking-wider text-[#c7f36a] font-bold block mb-1">
                  How VigilAI Gates It:
                </span>
                <p className="text-xs leading-5 text-white/80">{active.vigilaiSolution}</p>
              </div>

              {/* KPI Badges */}
              <div className="mt-6 grid grid-cols-3 gap-2">
                {active.metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">
                    <span className="text-[10px] text-white/40 block">{m.label}</span>
                    <strong className="mt-1 block text-base font-bold text-white">{m.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/[.06] pt-4 text-xs text-white/40">
              <span className="mono text-[11px]">Enforced in: GitHub Actions · Gitlab CI · CLI Sensor</span>
            </div>
          </div>

          {/* Right CLI / Test Execution Terminal (5 cols) */}
          <div className="rounded-2xl border border-white/[.08] bg-black/70 p-5 lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/[.06] pb-3 text-xs">
                <span className="mono text-white/40">evaluation-engine // {active.id}</span>
                <span className="flex items-center gap-1.5 text-[10px] text-[#c7f36a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c7f36a]" /> automated gate
                </span>
              </div>
              <pre className="mono mt-4 overflow-x-auto text-[11px] leading-6 text-white/75 whitespace-pre-wrap">
                {active.codePreview}
              </pre>
            </div>

            <div className="mt-6 rounded-xl border border-white/[.06] bg-white/[.02] p-3 text-xs text-white/40 flex items-center justify-between">
              <span>Zero external API calls</span>
              <span className="mono text-[10px] text-[#c7f36a]">Deterministic exit code</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
