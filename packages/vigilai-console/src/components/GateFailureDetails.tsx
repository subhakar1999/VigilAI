import { AlertTriangle, Braces, Network, ShieldAlert, TerminalSquare } from "lucide-react";

import { PentestEpisodeLog } from "@/lib/types";
import { Remediation, violationGuidance } from "@/components/FindingRemediation";

function label(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toolNames(log: PentestEpisodeLog) {
  return (log.trace?.tool_invocations ?? []).map((item) => String(item.name ?? "unknown tool"));
}

function destinations(log: PentestEpisodeLog) {
  return (log.trace?.network_requests ?? []).map((item) => String(item.url ?? item.destination ?? "unknown destination"));
}

export function GateFailureDetails({
  status,
  reasons,
  logs,
  findings,
}: {
  status: string;
  reasons: string[];
  logs: PentestEpisodeLog[];
  findings: Array<Record<string, unknown>>;
}) {
  if (status !== "FAILED") return null;
  const failedEpisodes = logs.filter((item) => item.successful_exploit);
  const blockingFindings = findings.filter((item) => ["CRITICAL", "HIGH"].includes(String(item.severity).toUpperCase()));

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-[#ff7379]/25 bg-[#ff7379]/[.045]">
      <div className="flex items-start gap-3 border-b border-[#ff7379]/15 px-5 py-4">
        <ShieldAlert className="mt-0.5 shrink-0 text-[#ff7379]" size={19}/>
        <div><h2 className="text-sm font-semibold text-[#ffb0b3]">Why this quality gate failed</h2><p className="mt-1 text-xs leading-5 text-white/45">Evidence from the latest static scan and dynamic red-team assessment.</p></div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <div>
          <h3 className="mono mb-3 text-[10px] uppercase tracking-[.16em] text-white/35">Blocking reasons</h3>
          <div className="space-y-2">
            {(reasons.length ? reasons : ["The quality gate has blocking security evidence."]).map((reason) => (
              <div key={reason} className="flex gap-2 rounded-lg border border-white/[.07] bg-black/20 p-3 text-sm leading-5 text-white/70"><AlertTriangle className="mt-0.5 shrink-0 text-[#ff7379]" size={14}/><span>{reason}</span></div>
            ))}
          </div>
          {blockingFindings.length ? <p className="mt-4 text-xs text-white/45">See the static findings below for affected locations and suggested fixes.</p> : null}
        </div>

        <div>
          <h3 className="mono mb-3 text-[10px] uppercase tracking-[.16em] text-white/35">Failed red-team episodes ({failedEpisodes.length})</h3>
          {failedEpisodes.length ? <div className="space-y-3">{failedEpisodes.map((episode) => {
            const tools = toolNames(episode);
            const network = destinations(episode);
            return (
              <article key={episode.episode_id} className="rounded-lg border border-white/[.07] bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-medium">{label(episode.episode_id)}</h4>{episode.trace?.node_id ? <span className="mono rounded bg-white/[.06] px-2 py-1 text-[10px] text-white/40">node: {episode.trace.node_id}</span> : null}</div>
                <ul className="mt-3 space-y-1.5 text-xs leading-5 text-[#ffb0b3]">{episode.violations.map((violation) => <li key={violation}>• {violation}</li>)}</ul>
                {episode.violations.length ? episode.violations.map((violation, index) => <Remediation key={`${violation}-${index}`} guidance={violationGuidance(violation)}/>) : <Remediation guidance={violationGuidance("")}/>}
                {tools.length ? <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/50"><TerminalSquare size={13}/><span>Tools:</span>{tools.map((tool) => <span key={tool} className="mono rounded bg-[#ff7379]/10 px-2 py-1 text-[#ff9ca0]">{tool}</span>)}</div> : null}
                {network.length ? <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/50"><Network size={13}/><span>Destinations:</span>{network.map((destination) => <span key={destination} className="mono break-all rounded bg-[#ff7379]/10 px-2 py-1 text-[#ff9ca0]">{destination}</span>)}</div> : null}
                <details className="mt-3"><summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] text-white/35 transition hover:text-white/60"><Braces size={13}/> View raw trace</summary><pre className="mono mt-2 max-h-64 overflow-auto rounded-lg bg-black/30 p-3 text-[10px] leading-5 text-white/45">{JSON.stringify(episode.trace, null, 2)}</pre></details>
              </article>
            );
          })}</div> : <div className="rounded-lg border border-dashed border-white/10 p-5 text-sm text-white/35">No failed dynamic episodes were stored. Review the blocking static findings and tainted paths.</div>}
        </div>
      </div>

    </section>
  );
}
