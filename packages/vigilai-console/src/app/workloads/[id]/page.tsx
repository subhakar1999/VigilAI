import { ArrowLeft, Box, Bug, FileWarning, Route } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FlowGraph } from "@/components/FlowGraph";
import { ArtifactActions } from "@/components/ArtifactActions";
import { QualityGateBadge } from "@/components/QualityGateBadge";
import { getWorkload } from "@/lib/api";

export default async function WorkloadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let workload;
  try { workload = await getWorkload(id); } catch { notFound(); }
  const tainted = workload.graph.edges.filter((edge) => edge.is_tainted).length;
  const asr = Number(workload.pentest_stats.attack_success_rate ?? 0);
  return (
    <main className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
      <Link href="/" className="mb-7 inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"><ArrowLeft size={14}/> Back to fleet</Link>
      <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#b7f34b]">Workload / {workload.framework}</p><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-[-.035em] sm:text-4xl">{workload.name}</h1><QualityGateBadge status={workload.quality_gate_status}/></div>{workload.endpoint_url ? <div className="mono mt-3 max-w-2xl break-all text-xs text-white/40">Endpoint · <span className="text-white/65">{workload.endpoint_url}</span></div> : null}<div className="mt-4"><ArtifactActions workloadId={workload.id} workloadName={workload.name} aibom={workload.aibom} canPentest={Boolean(workload.endpoint_url)} /></div></div>
        <div className="flex gap-px self-end overflow-hidden rounded-lg border border-white/10 bg-white/10">
          {[{label:"Findings", value: workload.findings.length, icon: FileWarning}, {label:"Tainted paths", value:tainted, icon:Route}, {label:"Attack success", value:`${(asr*100).toFixed(0)}%`, icon:Bug}].map(({label,value,icon:Icon}) => <div key={label} className="min-w-28 bg-[#111715] px-4 py-3"><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/35"><Icon size={12}/>{label}</div><strong className="mono text-lg font-medium">{value}</strong></div>)}
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-medium"><Box size={15} className="text-[#b7f34b]"/> Execution topology</h2><p className="hidden text-xs text-white/35 sm:block">Select a node to inspect evidence and remediation</p></div>
      {workload.graph.nodes.length ? <FlowGraph graph={workload.graph}/> : <div className="grid h-96 place-items-center rounded-xl border border-dashed border-white/10 text-sm text-white/35">No workflow topology was extracted in the latest scan.</div>}
    </main>
  );
}

