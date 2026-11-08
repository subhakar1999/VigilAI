import { ArrowLeft, Box, Bug, ExternalLink, FileWarning, Fingerprint, Route } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FlowGraph } from "@/components/FlowGraph";
import { ArtifactActions } from "@/components/ArtifactActions";
import { GateFailureDetails } from "@/components/GateFailureDetails";
import { StaticFindings } from "@/components/FindingRemediation";
import { QualityGateBadge } from "@/components/QualityGateBadge";
import { WorkloadDeleteButton } from "@/components/WorkloadDeleteButton";
import { getWorkload } from "@/lib/api";

export default async function WorkloadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let workload;
  try { workload = await getWorkload(id); } catch { notFound(); }
  const tainted = workload.graph.edges.filter((edge) => edge.is_tainted).length;
  const asr = Number(workload.pentest_stats.attack_success_rate ?? 0);
  return (
    <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <Link href="/console" className="mb-5 inline-flex items-center gap-2 text-xs text-white/35 transition hover:text-white"><ArrowLeft size={14}/> Agent fleet</Link>

      <section className="surface mb-4 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-md border border-white/[.07] bg-white/[.025] px-2 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-white/35">{workload.framework}</span><QualityGateBadge status={workload.quality_gate_status}/></div>
            <h1 className="truncate text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{workload.name}</h1>
            <div className="mt-3 flex max-w-3xl items-start gap-2 text-xs text-white/35"><Fingerprint className="mt-0.5 shrink-0" size={13}/><span className="mono break-all">{workload.id}</span></div>
            {workload.endpoint_url ? <a href={workload.endpoint_url} target="_blank" rel="noreferrer" className="mt-2 flex max-w-3xl items-start gap-2 text-xs text-white/35 transition hover:text-[#c7f36a]"><ExternalLink className="mt-0.5 shrink-0" size={13}/><span className="mono break-all">{workload.endpoint_url}</span></a> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2"><ArtifactActions workloadId={workload.id} workloadName={workload.name} aibom={workload.aibom} canPentest={Boolean(workload.endpoint_url)}/><WorkloadDeleteButton workloadId={workload.id} workloadName={workload.name} redirectAfterDelete/></div>
        </div>
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {label:"Risk score", value: workload.risk_score, detail:"Weighted exposure", icon: Box, alert:workload.risk_score >= 50},
          {label:"Findings", value:workload.findings.length, detail:"Static scan evidence", icon:FileWarning, alert:workload.findings.length > 0},
          {label:"Tainted paths", value:tainted, detail:"Untrusted data flows", icon:Route, alert:tainted > 0},
          {label:"Attack success", value:workload.pentest_stats.total_episodes ? `${(asr*100).toFixed(0)}%` : "—", detail:workload.pentest_stats.total_episodes ? "Latest dynamic run" : "Not assessed", icon:Bug, alert:asr > 0},
        ].map(({label,value,detail,icon:Icon,alert}) => <article key={label} className="surface rounded-xl p-4"><div className="flex items-center justify-between text-[11px] text-white/35"><span>{label}</span><Icon size={14}/></div><strong className={`mt-4 block text-2xl font-semibold tracking-[-.03em] ${alert ? "text-[#ff8b90]" : "text-white"}`}>{value}</strong><p className="mt-1 text-[10px] text-white/25">{detail}</p></article>)}
      </section>

      <GateFailureDetails status={workload.quality_gate_status} reasons={workload.quality_gate_reasons} logs={workload.pentest_stats.logs ?? []} findings={workload.findings}/>
      {workload.quality_gate_status === "UNKNOWN" && <section className="mb-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4"><h2 className="text-sm font-semibold text-amber-200">Assessment inconclusive</h2><p className="mt-2 text-xs leading-5 text-white/65">{workload.quality_gate_reasons.join(" ") || "More evidence is needed before this workload can be assessed."}</p></section>}
      <StaticFindings findings={workload.findings}/>

      <section className="surface overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><Box size={15} className="text-[#c7f36a]"/> Execution topology</h2><p className="mt-1 text-xs text-white/30">Trace sources, reasoning nodes, tools, and sensitive sinks</p></div><p className="hidden text-[11px] text-white/28 sm:block">Select a node for evidence</p></div>
        <div className="p-3">{workload.graph.nodes.length ? <FlowGraph graph={workload.graph}/> : <div className="grid h-96 place-items-center rounded-xl border border-dashed border-white/[.08] text-sm text-white/30">No workflow topology was extracted in the latest scan.</div>}</div>
      </section>
    </main>
  );
}

