import { ArrowUpRight, Boxes, CircleAlert, Network, ScanLine } from "lucide-react";
import Link from "next/link";

import { EndpointOnboardForm } from "@/components/EndpointOnboardForm";
import { QualityGateBadge } from "@/components/QualityGateBadge";
import { getWorkloads } from "@/lib/api";
import { WorkloadSummary } from "@/lib/types";

async function loadWorkloads(): Promise<{ items: WorkloadSummary[]; unavailable: boolean }> {
  try { return { items: await getWorkloads(), unavailable: false }; }
  catch { return { items: [], unavailable: true }; }
}

export default async function OverviewPage() {
  const { items, unavailable } = await loadWorkloads();
  const passed = items.filter((item) => item.quality_gate_status === "PASSED").length;
  const failed = items.filter((item) => item.quality_gate_status === "FAILED").length;

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8 lg:py-14">
      <section className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="mono mb-3 text-[11px] uppercase tracking-[.24em] text-[#b7f34b]">Fleet / Overview</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-.045em] sm:text-5xl">Every agent. Every path.<br/><span className="text-white/38">One security gate.</span></h1>
        </div>
        <div className="flex gap-2">
          <a href="#workloads" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm text-white/75 transition hover:bg-white/[.08]"><ScanLine size={16}/> View scans</a>
          <EndpointOnboardForm />
        </div>
      </section>

      <section className="mb-6 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-3">
        {[
          { label: "Protected workloads", value: items.length, icon: Boxes, tone: "text-white" },
          { label: "Gates passing", value: passed, icon: Network, tone: "text-[#b7f34b]" },
          { label: "Needs attention", value: failed, icon: CircleAlert, tone: failed ? "text-[#ff7379]" : "text-white/50" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="bg-[#101513] px-6 py-5">
            <div className="mb-6 flex items-center justify-between text-xs text-white/45"><span>{label}</span><Icon size={16}/></div>
            <strong className={`text-3xl font-medium tracking-tight ${tone}`}>{value.toString().padStart(2, "0")}</strong>
          </div>
        ))}
      </section>

      <section id="workloads" className="panel overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div><h2 className="text-sm font-semibold">Workload inventory</h2><p className="mt-1 text-xs text-white/40">Latest static and dynamic security posture</p></div>
          <span className="mono text-[10px] uppercase tracking-[.15em] text-white/30">Live control plane</span>
        </div>
        {unavailable ? (
          <div className="m-5 rounded-lg border border-amber-300/15 bg-amber-300/[.06] p-4 text-sm text-amber-100/70">The control plane is not reachable. Start the server at <span className="mono text-amber-100">localhost:8000</span>.</div>
        ) : items.length === 0 ? (
          <div className="grid min-h-64 place-items-center p-8 text-center"><div><ScanLine className="mx-auto mb-4 text-white/20" size={30}/><h3 className="text-sm font-medium">No workloads onboarded</h3><p className="mt-2 max-w-sm text-sm leading-6 text-white/40">Select <span className="font-medium text-[#b7f34b]">Add endpoint</span> to discover a running agent, or use the CLI to scan local source code.</p></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="mono border-b border-white/10 text-[10px] uppercase tracking-[.13em] text-white/35"><tr><th className="px-5 py-3 font-normal">Workload</th><th className="px-5 py-3 font-normal">Framework</th><th className="px-5 py-3 font-normal">Quality gate</th><th className="px-5 py-3 font-normal">Risk</th><th className="px-5 py-3 font-normal">MCP</th><th className="px-5 py-3 font-normal text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-white/[.06]">
                {items.map((workload) => (
                  <tr key={workload.id} className="group transition hover:bg-white/[.025]">
                    <td className="px-5 py-4"><div className="font-medium">{workload.name}</div><div className="mono mt-1 text-[10px] text-white/25">{workload.id.slice(0, 12)}</div></td>
                    <td className="px-5 py-4 text-white/60">{workload.framework}</td>
                    <td className="px-5 py-4"><QualityGateBadge status={workload.quality_gate_status}/></td>
                    <td className="px-5 py-4"><div className="flex w-32 items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${workload.risk_score >= 50 ? "bg-[#ff5c63]" : "bg-[#b7f34b]"}`} style={{width: `${workload.risk_score}%`}}/></div><span className="mono text-xs text-white/55">{workload.risk_score}</span></div></td>
                    <td className="px-5 py-4 text-white/55">{workload.mcp_count}</td>
                    <td className="px-5 py-4 text-right"><Link href={`/workloads/${workload.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/55 transition group-hover:text-[#b7f34b]">Inspect graph <ArrowUpRight size={14}/></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

