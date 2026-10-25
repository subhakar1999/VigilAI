"use client";

import { ArrowRight, LoaderCircle, Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_VIGILAI_API_URL ?? "http://localhost:8000";

interface EndpointOnboardResult {
  workload_id: string;
  discovered_routes: number;
  openapi_detected: boolean;
}

export function EndpointOnboardForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [endpoint, setEndpoint] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/v1/endpoints/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint_url: endpoint, ...(name.trim() ? { name: name.trim() } : {}) }),
      });
      const payload = await response.json() as EndpointOnboardResult & { detail?: string };
      if (!response.ok) throw new Error(payload.detail ?? `Discovery failed (${response.status})`);
      router.push(`/workloads/${payload.workload_id}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Endpoint discovery failed");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#b7f34b] px-4 py-2.5 text-sm font-semibold text-[#0b100d] transition hover:bg-[#c6fb63]">
        <Plus size={16}/> Add endpoint
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm">
      <form onSubmit={submit} className="panel w-full max-w-xl rounded-xl p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-semibold">Discover an AI endpoint</h2><p className="mt-1 text-sm leading-6 text-white/45">Enter one URL. VigilAI checks reachability, discovers OpenAPI operations, creates an AIBOM, and prepares dynamic testing.</p></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white"><X size={18}/></button>
        </div>
        <label className="mb-2 block text-xs font-medium text-white/65" htmlFor="endpoint-url">Agent endpoint</label>
        <input id="endpoint-url" type="url" required autoFocus value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="http://localhost:9000/vigilai-test" className="mono w-full rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-[#b7f34b]/60"/>
        <p className="mt-2 text-xs leading-5 text-white/35">Localhost URLs are automatically translated for the Docker worker.</p>
        <label className="mb-2 mt-5 block text-xs font-medium text-white/65" htmlFor="workload-name">Name <span className="text-white/30">(optional)</span></label>
        <input id="workload-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Inferred from OpenAPI when omitted" className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-[#b7f34b]/60"/>
        {error ? <div className="mt-4 rounded-lg border border-[#ff7379]/20 bg-[#ff7379]/[.07] p-3 text-sm leading-5 text-[#ff9ca0]">{error}</div> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/[.05] hover:text-white">Cancel</button>
          <button disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-[#b7f34b] px-4 py-2.5 text-sm font-semibold text-[#0b100d] transition hover:bg-[#c6fb63] disabled:cursor-wait disabled:opacity-60">
            {loading ? <LoaderCircle size={16} className="animate-spin"/> : <ArrowRight size={16}/>}
            {loading ? "Discovering..." : "Discover endpoint"}
          </button>
        </div>
      </form>
    </div>
  );
}
