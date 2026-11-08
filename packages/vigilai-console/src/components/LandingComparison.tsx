import { Check, Sparkles, X } from "lucide-react";

interface ComparisonFeature {
  feature: string;
  category: string;
  traditionalSast: boolean | string;
  runtimeGuardrails: boolean | string;
  vigilai: boolean | string;
}

const comparisonFeatures: ComparisonFeature[] = [
  {
    feature: "Symbolic Pickle VM Model Checkpoint Inspection",
    category: "Artifact Security",
    traditionalSast: false,
    runtimeGuardrails: false,
    vigilai: "Zero-execution bytecode scanner",
  },
  {
    feature: "Agent AST Tool Taint & Dangerous Sink Mapping",
    category: "Static Code Analysis",
    traditionalSast: "Generic AST only",
    runtimeGuardrails: false,
    vigilai: "Specialized @tool & reasoning taint graph",
  },
  {
    feature: "MCP Supply Chain Auditing & Cryptographic Hash Pinning",
    category: "Tool Ecosystem",
    traditionalSast: false,
    runtimeGuardrails: false,
    vigilai: ".mcp-lock.json SHA-256 pinning",
  },
  {
    feature: "Autonomous Multi-Turn Indirect Prompt Injection Pentesting",
    category: "Dynamic Red-Teaming",
    traditionalSast: false,
    runtimeGuardrails: "Basic regex/filter",
    vigilai: "Deterministic multi-turn ASR testing",
  },
  {
    feature: "Automated Execution Graph & Compromised Node Visualization",
    category: "Observability",
    traditionalSast: false,
    runtimeGuardrails: false,
    vigilai: "Interactive React Flow topology canvas",
  },
  {
    feature: "CI/CD PR Merge Blocking with SARIF 2.1.0 Export",
    category: "Enterprise Gating",
    traditionalSast: "Standard SARIF",
    runtimeGuardrails: false,
    vigilai: "Native SARIF 2.1.0 + GitHub PR annotations",
  },
  {
    feature: "Cryptographically Signed CycloneDX 1.6+ AIBOM",
    category: "Compliance",
    traditionalSast: false,
    runtimeGuardrails: false,
    vigilai: "EU AI Act & NIST AI RMF compliant AIBOM",
  },
  {
    feature: "100% Air-Gapped Local Operation (Zero Cloud Dependency)",
    category: "Infrastructure",
    traditionalSast: true,
    runtimeGuardrails: "Cloud API required",
    vigilai: "100% self-hosted Docker / loopback",
  },
];

export function LandingComparison() {
  return (
    <section className="px-5 py-24 sm:px-8 sm:py-32 bg-[#090d0b]">
      <div className="mx-auto max-w-[1360px]">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c7f36a]/20 bg-[#c7f36a]/[.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]">
            <Sparkles size={12} /> The New Security Standard
          </div>
          <h2 className="mt-5 text-4xl font-bold tracking-[-.05em] text-white sm:text-6xl">
            Why traditional security <br />
            <span className="text-[#c7f36a]">misses AI agents.</span>
          </h2>
          <p className="mt-5 text-sm leading-7 text-white/50 sm:text-base">
            Standard code linters have no concept of prompt injection or tool loops. Cloud prompt
            filters can’t inspect model weights or MCP configurations. VigilAI protects the full
            lifecycle.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1210]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[.08] bg-white/[.02]">
                  <th className="px-6 py-4 font-semibold text-white/70 w-2/5">Capability</th>
                  <th className="px-6 py-4 font-medium text-white/40">Legacy SAST / Linters</th>
                  <th className="px-6 py-4 font-medium text-white/40">Cloud Prompt Filters</th>
                  <th className="px-6 py-4 font-bold text-[#c7f36a] bg-[#c7f36a]/[.06]">
                    VigilAI Control Plane
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.05]">
                {comparisonFeatures.map((row) => (
                  <tr key={row.feature} className="transition hover:bg-white/[.015]">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white/90">{row.feature}</div>
                      <div className="mono mt-0.5 text-[10px] text-white/35">{row.category}</div>
                    </td>
                    <td className="px-6 py-4 text-white/50">
                      {typeof row.traditionalSast === "boolean" ? (
                        row.traditionalSast ? (
                          <Check size={16} className="text-white/60" />
                        ) : (
                          <X size={16} className="text-white/20" />
                        )
                      ) : (
                        <span>{row.traditionalSast}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white/50">
                      {typeof row.runtimeGuardrails === "boolean" ? (
                        row.runtimeGuardrails ? (
                          <Check size={16} className="text-white/60" />
                        ) : (
                          <X size={16} className="text-white/20" />
                        )
                      ) : (
                        <span>{row.runtimeGuardrails}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-[#d7fb8c] bg-[#c7f36a]/[.04]">
                      {typeof row.vigilai === "boolean" ? (
                        row.vigilai ? (
                          <Check size={16} className="text-[#c7f36a]" />
                        ) : (
                          <X size={16} className="text-white/20" />
                        )
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Check size={14} className="text-[#c7f36a] shrink-0" />
                          <span>{row.vigilai}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
