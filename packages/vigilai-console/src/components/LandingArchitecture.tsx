"use client";

import { useState } from "react";
import {
  Binary,
  Lock,
  Radio,
  Shield,
  Workflow,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface Layer {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: typeof Shield;
  color: string;
  tag: string;
  description: string;
  capabilities: string[];
  codeSnippet: string;
  highlight: string;
}

const layers: Layer[] = [
  {
    id: "layer1",
    badge: "LAYER 1 · MODEL ARTIFACT",
    title: "Symbolic Model Byte-Stream Scanner",
    subtitle: "Emulated Pickle VM bytecode inspection without loading weights into memory.",
    icon: Binary,
    color: "#38bdf8",
    tag: "Pre-Commit / Registry",
    description:
      "VigilAI inspects PyTorch (.pt), pickle, and joblib weights via symbolic pickletools.genops analysis. It detects unpickling RCE gadgets, copyreg registry mutations, and malformed STACK_GLOBAL opcode injections before weights ever touch PyTorch or CUDA runtime memory.",
    capabilities: [
      "Zero-code execution: Emulates opcode sequences safely in memory",
      "Blocks extension registry tampering (copyreg.dispatch_table)",
      "Intercepts STACK_GLOBAL and REDUCE arbitrary callable gadgets",
      "Validates HuggingFace and local checkpoints in pre-commit hooks",
    ],
    codeSnippet: `# CLI scan of raw model weights
$ vigilai scan ./models/bert-finetuned.pt
[+] Emulating Pickle VM opcode stream (0 bytes executed)...
[!] CRITICAL (ASI08): Dangerous global 'os.system' in STACK_GLOBAL
[!] BLOCKED: Weight artifact contains arbitrary execution gadget`,
    highlight: "Zero-execution bytecode safety",
  },
  {
    id: "layer3",
    badge: "LAYER 3 · AGENT CODE & AST",
    title: "Agent AST & Taint Tracking Engine",
    subtitle: "Taint propagation through reasoning loops into high-consequence sinks.",
    icon: Workflow,
    color: "#c7f36a",
    tag: "Static Code Analysis",
    description:
      "Static AST analysis tracks untrusted user inputs, external documents, and LLM reasoning outputs into dangerous system sinks such as subprocess.Popen, eval, SQL cursors, and vector stores. Enforces recursion bounding and human approval policies.",
    capabilities: [
      "Traces @tool inputs and LLM synthesis outputs to dangerous sinks",
      "Enforces max_iterations on autonomous agent reasoning loops",
      "Verifies mandatory human-in-the-loop (HITL) gates for financial mutations",
      "Detects system prompt leaking and prompt template injections",
    ],
    codeSnippet: `@tool
def execute_query(query: str):
    # VigilAI AST sensor flags untrusted prompt -> raw SQL
    cursor.execute(f"SELECT * FROM users WHERE id = {query}")
    # [!] CRITICAL: Tainted prompt reaches SQL sink without sanitization
    # Remediation: Use parameterized cursor.execute(query, (id,))`,
    highlight: "Deep data-flow graph extraction",
  },
  {
    id: "layer7",
    badge: "LAYER 7 · SUPPLY CHAIN",
    title: "MCP Tool Supply Chain Auditor & Pinning",
    subtitle: "Cryptographic lockfiles against tool poisoning and runtime rug-pulls.",
    icon: Lock,
    color: "#f7c967",
    tag: "Model Context Protocol",
    description:
      "Inspects mcp.json tool manifests for tool poisoning and tool shadowing attacks. Generates and validates cryptographic SHA-256 .mcp-lock.json lockfiles so that compromised MCP servers cannot silently change tool schemas or elevate privileges after security sign-off.",
    capabilities: [
      "Detects tool shadowing where untrusted tools overwrite core system tools",
      "Generates .mcp-lock.json with cryptographically signed SHA-256 hashes",
      "Flags dynamic schema mutations and scope escalation between runs",
      "Prevents MCP rug-pull attacks during production agent execution",
    ],
    codeSnippet: `# Generate cryptographic MCP lockfile
$ vigilai mcp-lock .
[+] Auditing 8 MCP tool definitions in mcp.json...
[✓] Generated .mcp-lock.json (SHA-256 pinned)
[!] WARN: Tool 'github_mcp' requested unconstrained shell access
[✓] Lockfile committed to version control`,
    highlight: "Cryptographic MCP tamper prevention",
  },
  {
    id: "dynamic",
    badge: "DYNAMIC PENTEST · ADVERSARIAL",
    title: "Autonomous Red-Team Pentest Engine",
    subtitle: "Multi-turn indirect prompt injection (IPI) and tool-chaining probes.",
    icon: Radio,
    color: "#ff7379",
    tag: "Runtime Penetration Testing",
    description:
      "Launches deterministic adversarial probes against deployed agent endpoints. Simulates jailbreaks, multi-turn indirect prompt injections, and privilege escalations. Measures real-time Attack Success Rate (ASR) and records exact execution traces for instant remediation.",
    capabilities: [
      "Evaluates multi-turn prompt injection and document-embedded payloads",
      "Calculates empirical Attack Success Rate (ASR) against strict policies",
      "Provides visual graph node highlighting for compromised tools",
      "Outputs reproducible replayable curls and SARIF findings",
    ],
    codeSnippet: `# Trigger dynamic pentest against running endpoint
$ python -m redteam.daemon run --endpoint http://localhost:9000/agents/shell
[+] Launching 12 adversarial indirect prompt injection episodes...
[!] Episode 4: Unauthorized shell invocation triggered!
[!] Attack Success Rate: 100.0% -> Gate status: FAILED
[+] Remediation: Add human review gate before shell tool`,
    highlight: "Automated Attack Success Rate (ASR)",
  },
];

export function LandingArchitecture() {
  const [selectedLayerId, setSelectedLayerId] = useState<string>("layer3");
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || layers[1];

  return (
    <section id="platform" className="relative border-y border-white/[.07] bg-[#0a0e0c] px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1360px]">
        {/* Section Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c7f36a]/20 bg-[#c7f36a]/[.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]">
              <Sparkles size={12} /> Defense in Depth Architecture
            </div>
            <h2 className="mt-5 text-4xl font-bold tracking-[-.05em] text-white sm:text-6xl">
              Security that follows the agent, <br />
              <span className="text-[#c7f36a]">not the hype.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
              VigilAI unifies model checkpoints, AST static code taint, MCP tool manifests, and
              dynamic red-team testing into one unified evidence plane so teams can make
              definitive deployment decisions.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="mono rounded-md border border-white/10 bg-white/[.03] px-2.5 py-1">
              Deterministic Gate
            </span>
            <span className="mono rounded-md border border-white/10 bg-white/[.03] px-2.5 py-1">
              Zero Cloud Dependencies
            </span>
          </div>
        </div>

        {/* Layer Selector Bar */}
        <div className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {layers.map((layer) => {
            const isSelected = layer.id === selectedLayerId;
            const Icon = layer.icon;

            return (
              <button
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                  isSelected
                    ? "border-[#c7f36a] bg-[#121915] shadow-[0_0_30px_rgba(199,243,106,0.12)]"
                    : "border-white/[.08] bg-white/[.02] hover:border-white/20 hover:bg-white/[.04]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-xl"
                      style={{
                        backgroundColor: `${layer.color}15`,
                        color: layer.color,
                      }}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="mono text-[9px] uppercase tracking-wider text-white/35">
                      {layer.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-white">{layer.title}</h3>
                  <p className="mt-1 text-xs text-white/45 line-clamp-2">{layer.subtitle}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/[.06] pt-3 text-[11px]">
                  <span className="mono text-white/30">{layer.highlight}</span>
                  <ArrowRight
                    size={13}
                    className={isSelected ? "text-[#c7f36a]" : "text-white/20"}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Layer Deep-Dive Container */}
        <div className="mt-8 grid gap-6 rounded-3xl border border-white/10 bg-[#0c110e] p-6 lg:grid-cols-12 lg:p-8">
          {/* Left Details (7 cols) */}
          <div className="flex flex-col justify-between lg:col-span-7">
            <div>
              <div className="flex items-center gap-2">
                <span className="mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]">
                  {selectedLayer.badge}
                </span>
              </div>
              <h3 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {selectedLayer.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/60">{selectedLayer.description}</p>

              <div className="mt-6 space-y-3">
                <h4 className="mono text-[10px] uppercase tracking-wider text-white/40">
                  Key Verification Capabilities
                </h4>
                {selectedLayer.capabilities.map((cap) => (
                  <div key={cap} className="flex items-start gap-2.5 text-xs text-white/75">
                    <CheckCircle2
                      size={15}
                      className="mt-0.5 shrink-0"
                      style={{ color: selectedLayer.color }}
                    />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/[.06] pt-5">
              <span className="mono text-xs text-white/30">Output compatibility:</span>
              <span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1 text-[10px] text-white/60">
                SARIF 2.1.0
              </span>
              <span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1 text-[10px] text-white/60">
                CycloneDX 1.6 AIBOM
              </span>
              <span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1 text-[10px] text-white/60">
                JSON Execution DAG
              </span>
            </div>
          </div>

          {/* Right Code / Execution Output (5 cols) */}
          <div className="rounded-2xl border border-white/[.08] bg-black/60 p-5 lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/[.06] pb-3 text-xs">
                <span className="mono text-white/40">verification-terminal // live sensor</span>
                <span className="flex items-center gap-1.5 text-[10px] text-[#c7f36a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c7f36a]" /> active
                </span>
              </div>
              <pre className="mono mt-4 overflow-x-auto text-[11px] leading-6 text-white/70 whitespace-pre-wrap">
                {selectedLayer.codeSnippet}
              </pre>
            </div>

            <div className="mt-6 rounded-xl border border-white/[.06] bg-white/[.02] p-3 text-xs text-white/40 flex items-center justify-between">
              <span>Sensor latency: &lt;180ms</span>
              <span className="mono text-[10px] text-[#c7f36a]">Deterministic exit code</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
