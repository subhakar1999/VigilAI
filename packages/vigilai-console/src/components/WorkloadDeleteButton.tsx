"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_URL = "/api/control";

export function WorkloadDeleteButton({ workloadId, workloadName, redirectAfterDelete = false }: { workloadId: string; workloadName: string; redirectAfterDelete?: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    const confirmed = window.confirm(`Remove the scan for “${workloadName}”? This permanently deletes its findings, topology, pentest history, and project assignments.`);
    if (!confirmed) return;
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/workloads/${encodeURIComponent(workloadId)}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { detail?: string };
        throw new Error(payload.detail ?? `Removal failed (${response.status})`);
      }
      if (redirectAfterDelete) router.replace("/console");
      router.refresh();
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "The scan could not be removed.");
      setDeleting(false);
    }
  }

  return <button type="button" onClick={remove} disabled={deleting} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff7379]/20 bg-[#ff7379]/[.04] px-3 py-2 text-[11px] font-medium text-[#ff9ca0]/75 transition hover:bg-[#ff7379]/[.09] hover:text-[#ffb2b5] disabled:cursor-wait disabled:opacity-50">{deleting ? <LoaderCircle size={13} className="animate-spin"/> : <Trash2 size={13}/>} {deleting ? "Removing..." : "Remove scan"}</button>;
}
