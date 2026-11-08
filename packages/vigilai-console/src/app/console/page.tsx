import { Activity, Boxes, CircleAlert, Network, ShieldCheck, Sparkles } from "lucide-react";

import { EndpointOnboardForm } from "@/components/EndpointOnboardForm";
import { WorkloadInventory } from "@/components/WorkloadInventory";
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
  const passRate = items.length ? Math.round((passed / items.length) * 100) : 0;
  const averageRisk = items.length ? Math.round(items.reduce((total, item) => total + item.risk_score, 0) / items.length) : 0;
  const mcpServers = items.reduce((total, item) => total + item.mcp_count, 0);
  const metrics = [
    { label: "Registered agents", value: items.length.toString().padStart(2, "0"), detail: `${mcpServers} MCP integrations`, icon: Boxes, tone: "text-white" },
    { label: "Passing gates", value: `${passRate}%`, detail: `${passed} of ${items.length || 0} workloads`, icon: ShieldCheck, tone: "text-[#c7f36a]" },
    { label: "Action required", value: failed.toString().padStart(2, "0"), detail: failed ? "Review blocking evidence" : "No blocking evidence", icon: CircleAlert, tone: failed ? "text-[#ff8b90]" : "text-white" },
    { label: "Average risk", value: averageRisk.toString().padStart(2, "0"), detail: "Weighted security score", icon: Activity, tone: averageRisk >= 50 ? "text-[#ff8b90]" : "text-white" },
  ];

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <section className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]"><Sparkles size={13}/> Live security posture</div>
          <h1 className="text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">Agent fleet</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/38">Monitor quality gates, attack paths, model artifacts, and runtime evidence from one operational workspace.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="#workloads" className="inline-flex items-center gap-2 rounded-lg border border-white/[.08] bg-white/[.025] px-4 py-2.5 text-xs font-medium text-white/55 transition hover:bg-white/[.05] hover:text-white"><Network size={15}/> Browse inventory</a>
          <EndpointOnboardForm />
        </div>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <article key={label} className="surface rounded-2xl p-5">
            <div className="flex items-start justify-between"><span className="text-xs text-white/38">{label}</span><span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[.06] bg-white/[.025] text-white/35"><Icon size={15}/></span></div>
            <strong className={`mt-5 block text-3xl font-semibold tracking-[-.04em] ${tone}`}>{value}</strong>
            <p className="mt-2 text-[11px] text-white/28">{detail}</p>
          </article>
        ))}
      </section>

      <WorkloadInventory items={items} unavailable={unavailable}/>
    </main>
  );
}
