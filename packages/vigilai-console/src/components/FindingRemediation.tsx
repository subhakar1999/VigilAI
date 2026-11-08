import { ExternalLink, ShieldCheck } from "lucide-react";

type Guidance = { text: string; href?: string; reference?: string };

const commandReference = "https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html";
const networkReference = "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html";
const promptReference = "https://genai.owasp.org/llmrisk/llm01-prompt-injection/";

export function findingGuidance(finding: Record<string, unknown>): Guidance {
  const supplied = typeof finding.remediation === "string" ? finding.remediation.trim() : "";
  if (supplied) return { text: supplied };
  const message = String(finding.message ?? "").toLowerCase();
  if (message.includes("tool description contains prompt-injection")) return { text: "Remove instruction-like content from the tool description, review the tool provider, and treat tool metadata as untrusted input. Restrict tool permissions and retest.", href: promptReference, reference: "OWASP prompt injection guidance" };
  if (message.includes("shadows the same name")) return { text: "Give tools unique, server-qualified names and explicitly allow only trusted tool providers. Review which tool the agent resolves before enabling it." };
  if (message.includes("invalid mcp configuration")) return { text: "Correct the reported configuration error, review the server and tool definitions, and rescan the configuration." };
  if (String(finding.rule_id ?? "").toUpperCase() === "ASI04" && /pickle|model|artifact|global|opcode|archive/.test(message)) return { text: "Do not load the artifact until its source and integrity are verified. Obtain a trusted replacement or use a non-executable weights format, then rescan it." };
  return { text: "No specific remediation was supplied for this finding. Review the evidence and affected location, apply a control appropriate to the cause, and rescan to verify it." };
}

export function violationGuidance(violation: string): Guidance {
  const value = violation.toLowerCase();
  if (value.startsWith("forbidden network destination reached:")) return { text: "Restrict outbound destinations at both the application and network layers, validate destinations and redirects, and prevent sensitive context from reaching unauthorized endpoints. Retest the recorded episode.", href: networkReference, reference: "OWASP network destination guidance" };
  if (value.startsWith("forbidden tool invoked:")) {
    if (/\b(shell|terminal|execute_command)\b/.test(value)) return { text: "Remove unnecessary shell access. Where execution is required, use a structured API, validate commands and arguments against allowlists, run with least privilege, and require approval for high-impact actions. Retest the episode.", href: commandReference, reference: "OWASP command injection defenses" };
    return { text: "Restrict this tool to authorized users and workflows, validate its inputs, and enforce approval before high-impact actions. Treat model instructions and retrieved content as untrusted; retest the episode.", href: promptReference, reference: "OWASP prompt injection guidance" };
  }
  return { text: "Review the recorded violation and trace, restrict the affected action at the application boundary, and rerun the assessment to verify the fix." };
}

export function Remediation({ guidance }: { guidance: Guidance }) {
  return <div className="mt-3 rounded-lg border border-[#b7f34b]/15 bg-[#b7f34b]/[.05] p-3"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#c7f36a]"><ShieldCheck size={13}/> Suggested remediation</div><p className="mt-2 text-xs leading-5 text-white/70">{guidance.text}</p>{guidance.href && <a href={guidance.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-[#c7f36a] hover:underline">{guidance.reference} <ExternalLink size={12}/></a>}</div>;
}

export function StaticFindings({ findings }: { findings: Array<Record<string, unknown>> }) {
  if (!findings.length) return null;
  return <section className="surface mb-5 rounded-2xl p-5 sm:p-6"><h2 className="text-sm font-semibold">Static findings ({findings.length})</h2><p className="mt-1 text-xs text-white/35">Evidence and suggested fixes from the latest scan. Review each fix and rescan after making changes.</p><div className="mt-4 grid gap-3 lg:grid-cols-2">{findings.map((finding, index) => <article key={`${String(finding.rule_id ?? "finding")}-${index}`} className="rounded-xl border border-white/[.07] bg-black/20 p-4"><div className="mono text-[10px] uppercase text-[#ff9ca0]">{String(finding.severity ?? "Unknown severity")} · {String(finding.rule_id ?? "Unknown rule")}</div><p className="mt-2 text-sm leading-6 text-white/75">{String(finding.message ?? "No description provided.")}</p>{typeof finding.file_path === "string" && <p className="mono mt-2 break-all text-[10px] text-white/40">{finding.file_path}{typeof finding.line === "number" ? `:${finding.line}` : typeof finding.offset === "number" ? ` (offset ${finding.offset})` : ""}</p>}<Remediation guidance={findingGuidance(finding)}/></article>)}</div></section>;
}
