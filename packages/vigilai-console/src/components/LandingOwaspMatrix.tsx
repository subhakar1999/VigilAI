"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

interface OwaspItem {
  id: string;
  name: string;
  category: "Static AST" | "Model Scanner" | "MCP Lock" | "Dynamic Pentest";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  threat: string;
  detection: string;
  remediation: string;
}

const owaspAgenticList: OwaspItem[] = [
  {
    id: "ASI01",
    name: "Goal Hijacking & Prompt Injection",
    category: "Dynamic Pentest",
    severity: "CRITICAL",
    threat: "Adversarial prompts override system instructions and divert the agent toward attacker goals.",
    detection: "Autonomous red-team daemon executes multi-turn indirect prompt injections and evaluates behavioral deviation.",
    remediation: "Isolate system prompt in immutable system role context; enforce prompt validation boundary.",
  },
  {
    id: "ASI02",
    name: "Tool Misuse & Unauthorized Invocations",
    category: "Static AST",
    severity: "CRITICAL",
    threat: "Agent executes high-consequence tools (bash, rm, curl) without authorization or sanity checks.",
    detection: "AST taint sensor maps untrusted parameters flowing directly into subprocess, eval, or exec calls.",
    remediation: "Add human review approval gate before shell execution; restrict tool access to strict allowlist.",
  },
  {
    id: "ASI03",
    name: "Identity & Credential Exfiltration",
    category: "Dynamic Pentest",
    severity: "CRITICAL",
    threat: "Agent is coerced into outputting API keys, environment variables, or private internal credentials.",
    detection: "Red-team probe tests token canary triggers; monitors network egress requests for secret leaks.",
    remediation: "Redact environment secrets from LLM context; enforce strict egress network perimeter.",
  },
  {
    id: "ASI04",
    name: "Uncontrolled Agent Recursion",
    category: "Static AST",
    severity: "HIGH",
    threat: "ReAct reasoning loops enter unbounded recursive cycles, draining API wallet or crashing workers.",
    detection: "Static AST scanner verifies presence of explicit max_iterations and timeout constraints in loops.",
    remediation: "Enforce max_iterations <= 10 on all ReAct or LangGraph agent graphs.",
  },
  {
    id: "ASI05",
    name: "MCP Tool Shadowing & Supply Chain",
    category: "MCP Lock",
    severity: "CRITICAL",
    threat: "Rogue or third-party MCP servers shadow core tools with malicious payloads or mutate schemas post-approval.",
    detection: "MCP auditor checks mcp.json against .mcp-lock.json SHA-256 cryptographic hashes.",
    remediation: "Pin all MCP tool definitions in version-controlled .mcp-lock.json and block unpinned tools in CI.",
  },
  {
    id: "ASI06",
    name: "Untrusted Memory & RAG Poisoning",
    category: "Static AST",
    severity: "HIGH",
    threat: "Unvalidated external documents or user transcripts inject instructions into vector knowledge embeddings.",
    detection: "Data-flow graph tracks vector_store.upsert and similarity search results entering planner prompts.",
    remediation: "Tag retrieved chunks with untrusted taint metadata and enforce output synthesis escaping.",
  },
  {
    id: "ASI07",
    name: "Insecure Inter-Agent Communication",
    category: "Dynamic Pentest",
    severity: "MEDIUM",
    threat: "Subagents blindly execute untrusted instructions passed by upstream compromised agents.",
    detection: "Multi-agent topology simulator tests untrusted payload handoffs across agent boundaries.",
    remediation: "Require mutual authentication and structured JSON schema validation for inter-agent messages.",
  },
  {
    id: "ASI08",
    name: "Model Checkpoint Deserialization RCE",
    category: "Model Scanner",
    severity: "CRITICAL",
    threat: "Unsafe pickle/PyTorch model weights execute arbitrary OS commands upon torch.load().",
    detection: "Pickletools symbolic opcode stream scanner intercepts STACK_GLOBAL and REDUCE gadgets without executing.",
    remediation: "Reject unvalidated .pt/.bin checkpoints; convert to safe tensor formats (Safetensors).",
  },
  {
    id: "ASI09",
    name: "Missing Human-in-the-Loop Safeguards",
    category: "Static AST",
    severity: "HIGH",
    threat: "Irreversible actions (financial wire, database drop, order mutation) execute without manual confirmation.",
    detection: "AST scanner detects mutating tools lacking approval decorator or 2FA callback verification.",
    remediation: "Introduce @require_human_approval decorator on all destructive or high-impact actions.",
  },
  {
    id: "ASI10",
    name: "Inadequate Observability & Auditability",
    category: "Dynamic Pentest",
    severity: "MEDIUM",
    threat: "Agent actions, tool invocations, and network requests lack immutable audit traces for forensics.",
    detection: "Checks for standardized trace logging of tool_invocations and network_requests in responses.",
    remediation: "Standardize on CycloneDX 1.6+ AIBOM and export SARIF v2.1.0 traces on every execution.",
  },
];

export function LandingOwaspMatrix() {
  const [selectedId, setSelectedId] = useState<string>("ASI01");
  const selectedItem = owaspAgenticList.find((item) => item.id === selectedId) || owaspAgenticList[0];

  return (
    <section id="owasp" className="px-5 py-24 sm:px-8 sm:py-32 bg-[#070a08]">
      <div className="mx-auto max-w-[1360px]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c7f36a]/20 bg-[#c7f36a]/[.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]">
            <ShieldAlert size={12} /> Complete Threat Coverage
          </div>
          <h2 className="mt-5 text-4xl font-bold tracking-[-.05em] text-white sm:text-6xl">
            Built for the OWASP <br />
            <span className="text-[#c7f36a]">Agentic AI Top 10.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
            Every gate in VigilAI maps directly to known agentic failure modes. From prompt
            injection to MCP supply-chain tampering and pickle deserialization.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          {/* Left Column: 10 Vulnerability Buttons (7 cols) */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:col-span-7">
            {owaspAgenticList.map((item) => {
              const isSelected = item.id === selectedId;
              const isCrit = item.severity === "CRITICAL";

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-[#c7f36a] bg-[#121915] shadow-[0_0_20px_rgba(199,243,106,0.15)]"
                      : "border-white/[.07] bg-white/[.02] hover:border-white/15 hover:bg-white/[.04]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-xs font-bold text-[#c7f36a]">{item.id}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        isCrit
                          ? "bg-[#ff7379]/15 text-[#ff8b90]"
                          : "bg-[#f7c967]/15 text-[#f7c967]"
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xs font-semibold text-white/90 line-clamp-1">{item.name}</h3>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-white/40 border-t border-white/[.04] pt-2">
                    <span>{item.category}</span>
                    <span className="text-white/20">→</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Threat Detail Card (5 cols) */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0d1210] p-6 lg:col-span-5 shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-white/[.07] pb-4">
                <div className="flex items-center gap-2">
                  <span className="mono text-base font-bold text-[#c7f36a]">
                    {selectedItem.id}
                  </span>
                  <span className="rounded bg-white/[.06] px-2 py-0.5 text-[10px] text-white/50">
                    {selectedItem.category}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    selectedItem.severity === "CRITICAL"
                      ? "bg-[#ff7379]/20 text-[#ff8b90]"
                      : "bg-[#f7c967]/20 text-[#f7c967]"
                  }`}
                >
                  {selectedItem.severity} RISK
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">{selectedItem.name}</h3>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <span className="mono text-[10px] uppercase tracking-wider text-white/40">
                    The Threat Vector:
                  </span>
                  <p className="mt-1 leading-5 text-white/70">{selectedItem.threat}</p>
                </div>

                <div className="rounded-xl border border-white/[.06] bg-black/40 p-4">
                  <span className="mono text-[10px] uppercase tracking-wider text-[#c7f36a]">
                    VigilAI Detection Method:
                  </span>
                  <p className="mt-1 leading-5 text-white/80">{selectedItem.detection}</p>
                </div>

                <div>
                  <span className="mono text-[10px] uppercase tracking-wider text-white/40">
                    Prescribed Remediation:
                  </span>
                  <p className="mt-1 leading-5 text-[#d7fb8c]">{selectedItem.remediation}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/[.06] pt-4 flex items-center justify-between text-xs text-white/40">
              <span className="mono text-[11px]">Enforced by VigilAI Quality Gate</span>
              <span className="flex items-center gap-1 text-[#c7f36a]">
                <CheckCircle2 size={13} /> Gated in CI/CD
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
