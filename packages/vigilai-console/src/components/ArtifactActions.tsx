"use client";

import { Check, Download, FlaskConical, LoaderCircle, TriangleAlert } from "lucide-react";
import { useState } from "react";

const API_URL = "/api/control";

export function ArtifactActions({
  workloadId,
  workloadName,
  aibom,
  canPentest,
}: {
  workloadId: string;
  workloadName: string;
  aibom: Record<string, unknown>;
  canPentest: boolean;
}) {
  const [state, setState] = useState<"idle" | "loading" | "queued" | "error">("idle");

  function downloadAibom() {
    const blob = new Blob([`${JSON.stringify(aibom, null, 2)}\n`], { type: "application/vnd.cyclonedx+json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${workloadName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "workload"}.cdx.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function triggerPentest() {
    setState("loading");
    try {
      const response = await fetch(`${API_URL}/pentest/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workload_id: workloadId }),
      });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      setState("queued");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={downloadAibom} className="inline-flex items-center gap-2 rounded-lg border border-white/[.08] bg-white/[.025] px-3 py-2.5 text-xs text-white/55 transition hover:bg-white/[.05] hover:text-white">
        <Download size={14} /> Export AIBOM
      </button>
      <button
        onClick={triggerPentest}
        disabled={!canPentest || state === "loading" || state === "queued"}
        title={canPentest ? "Queue a dynamic assessment" : "Onboard this workload with --endpoint to enable dynamic testing"}
        className="inline-flex items-center gap-2 rounded-lg bg-[#c7f36a] px-3 py-2.5 text-xs font-semibold text-[#10140d] transition hover:bg-[#d3fa82] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {state === "loading" ? <LoaderCircle size={14} className="animate-spin" /> : state === "queued" ? <Check size={14} /> : state === "error" ? <TriangleAlert size={14} /> : <FlaskConical size={14} />}
        {state === "queued" ? "Queued" : state === "error" ? "Retry pentest" : "Run pentest"}
      </button>
    </div>
  );
}
