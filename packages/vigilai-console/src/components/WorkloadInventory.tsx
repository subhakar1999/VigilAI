"use client";

import { ArrowUpRight, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { WorkloadSummary } from "@/lib/types";
import { QualityGateBadge } from "./QualityGateBadge";
import { WorkloadDeleteButton } from "./WorkloadDeleteButton";

type Filter = "ALL" | "PASSED" | "FAILED" | "UNKNOWN";

export function WorkloadInventory({ items, unavailable }: { items: WorkloadSummary[]; unavailable: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const visible = useMemo(() => items.filter((item) => {
    const matchesFilter = filter === "ALL" || item.quality_gate_status === filter;
    const haystack = `${item.name} ${item.framework} ${item.quality_gate_status}`.toLowerCase();
    return matchesFilter && haystack.includes(query.trim().toLowerCase());
  }), [filter, items, query]);

  return (
    <section id="workloads" className="surface overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-4 border-b border-white/[.07] px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
        <div><h2 className="text-sm font-semibold">Workload inventory</h2><p className="mt-1 text-xs text-white/35">Latest static and dynamic posture across registered agents</p></div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex rounded-lg border border-white/[.07] bg-black/15 p-1">
            {(["ALL", "PASSED", "FAILED", "UNKNOWN"] as Filter[]).map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-md px-3 py-1.5 text-[10px] font-semibold tracking-[.08em] transition ${filter === value ? "bg-white/[.09] text-white" : "text-white/32 hover:text-white/60"}`}>{value === "UNKNOWN" ? "INCONCLUSIVE" : value}</button>)}
          </div>
          <label className="flex min-w-64 items-center gap-2 rounded-lg border border-white/[.07] bg-black/15 px-3 py-2 text-white/35 focus-within:border-[#c7f36a]/35 focus-within:text-white/55"><Search size={14}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search workloads" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/25"/></label>
        </div>
      </div>

      {unavailable ? <div className="m-5 rounded-xl border border-amber-300/15 bg-amber-300/[.05] p-4 text-sm text-amber-100/70">The control plane is unavailable. Start the API at <span className="mono text-amber-100">localhost:8000</span>.</div> : items.length === 0 ? <div className="grid min-h-72 place-items-center p-8 text-center"><div><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-white/[.08] bg-white/[.03] text-white/25"><ShieldCheck size={21}/></span><h3 className="mt-4 text-sm font-medium">No agents registered</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/35">Use Add agent to discover a running endpoint, or onboard local source with the CLI.</p></div></div> : visible.length === 0 ? <div className="grid min-h-56 place-items-center p-8 text-center text-sm text-white/35"><div><SlidersHorizontal className="mx-auto mb-3" size={20}/><p>No workloads match this view.</p></div></div> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-white/[.07] bg-white/[.015] text-[10px] uppercase tracking-[.12em] text-white/28"><tr><th className="px-5 py-3.5 font-medium">Agent</th><th className="px-5 py-3.5 font-medium">Framework</th><th className="px-5 py-3.5 font-medium">Gate</th><th className="px-5 py-3.5 font-medium">Risk score</th><th className="px-5 py-3.5 font-medium">MCP</th><th className="px-5 py-3.5 font-medium text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-white/[.055]">{visible.map((workload) => (
              <tr key={workload.id} className="group transition hover:bg-white/[.025]">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-lg border text-xs font-semibold ${workload.quality_gate_status === "FAILED" ? "border-[#ff7379]/20 bg-[#ff7379]/[.08] text-[#ff9ca0]" : "border-[#c7f36a]/15 bg-[#c7f36a]/[.06] text-[#c7f36a]"}`}>{workload.name.slice(0, 1).toUpperCase()}</span><div><div className="font-medium text-white/85">{workload.name}</div><div className="mono mt-1 text-[9px] text-white/22">{workload.id.slice(0, 12)}</div></div></div></td>
                <td className="px-5 py-4 text-white/48">{workload.framework}</td>
                <td className="px-5 py-4"><QualityGateBadge status={workload.quality_gate_status}/></td>
                <td className="px-5 py-4"><div className="flex w-36 items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[.07]"><div className={`h-full rounded-full ${workload.risk_score >= 50 ? "bg-[#ff7379]" : "bg-[#c7f36a]"}`} style={{width: `${workload.risk_score}%`}}/></div><span className="mono w-6 text-right text-[11px] text-white/45">{workload.risk_score}</span></div></td>
                <td className="px-5 py-4 text-white/42">{workload.mcp_count}</td>
                <td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><Link href={`/workloads/${workload.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[.07] px-3 py-2 text-[11px] font-medium text-white/45 transition hover:border-white/15 hover:bg-white/[.04] hover:text-white">Open <ArrowUpRight size={13}/></Link><WorkloadDeleteButton workloadId={workload.id} workloadName={workload.name}/></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
