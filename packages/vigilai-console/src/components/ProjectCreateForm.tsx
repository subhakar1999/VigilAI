"use client";

import { ArrowRight, LoaderCircle, Plus, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { TeamDetail, WorkloadSummary } from "@/lib/types";

const API_URL = "/api/control";

export function ProjectCreateForm({ teams, workloads }: { teams: TeamDetail[]; workloads: WorkloadSummary[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [teamId, setTeamId] = useState("");
  const [provider, setProvider] = useState("LOCAL");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const suggestedKey = useMemo(() => name.toLowerCase().trim().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, ""), [name]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          key: (key.trim() || suggestedKey),
          description: description.trim(),
          visibility,
          team_id: teamId || null,
          source_provider: provider,
          repository_url: repositoryUrl.trim() || null,
          quality_gate_policy: "VigilAI default",
          workload_ids: selected,
        }),
      });
      const payload = await response.json() as { detail?: string };
      if (!response.ok) throw new Error(payload.detail ?? `Project creation failed (${response.status})`);
      setOpen(false);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Project creation failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#c7f36a] px-4 py-2.5 text-xs font-semibold text-[#10140d] transition hover:bg-[#d3fa82]"><Plus size={15}/> New project</button>;

  const inputClass = "w-full rounded-lg border border-white/[.08] bg-black/25 px-3 py-2.5 text-sm outline-none transition placeholder:text-white/20 focus:border-[#c7f36a]/50";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-5 backdrop-blur-sm">
      <form onSubmit={submit} className="surface my-5 w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-semibold">Create a project</h2><p className="mt-1 text-sm leading-6 text-white/45">Group agent workloads under one owner, repository binding, visibility policy, and aggregate quality gate.</p></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white"><X size={18}/></button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-white/65">Project name<input required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Agent Security Platform" className={`mt-2 ${inputClass}`}/></label>
          <label className="text-xs font-medium text-white/65">Project key<input required value={key || suggestedKey} onChange={(event) => setKey(event.target.value)} placeholder="agent-security" pattern="[a-zA-Z0-9][a-zA-Z0-9._-]*" className={`mono mt-2 ${inputClass}`}/></label>
          <label className="text-xs font-medium text-white/65">Owning team<select value={teamId} onChange={(event) => setTeamId(event.target.value)} className={`mt-2 ${inputClass}`}><option value="">Unassigned</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
          <label className="text-xs font-medium text-white/65">Visibility<select value={visibility} onChange={(event) => setVisibility(event.target.value)} className={`mt-2 ${inputClass}`}><option>PRIVATE</option><option>INTERNAL</option><option>PUBLIC</option></select></label>
          <label className="text-xs font-medium text-white/65">Source provider<select value={provider} onChange={(event) => setProvider(event.target.value)} className={`mt-2 ${inputClass}`}><option>LOCAL</option><option>GITHUB</option><option>GITLAB</option><option>AZURE_DEVOPS</option><option>BITBUCKET</option></select></label>
          <label className="text-xs font-medium text-white/65">Repository URL <span className="text-white/30">(metadata)</span><input type="url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/org/repo" className={`mt-2 ${inputClass}`}/></label>
        </div>
        <label className="mt-4 block text-xs font-medium text-white/65">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder="What this project owns and protects" className={`mt-2 resize-none ${inputClass}`}/></label>
        <fieldset className="mt-5">
          <legend className="text-xs font-medium text-white/65">Agent workloads</legend>
          <p className="mt-1 text-[11px] text-white/30">Select previously discovered or scanned workloads. You can create an empty project and attach them later.</p>
          <div className="mt-3 grid max-h-36 gap-2 overflow-y-auto sm:grid-cols-2">
            {workloads.map((workload) => <label key={workload.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/[.07] bg-white/[.02] p-3 text-xs text-white/60"><input type="checkbox" checked={selected.includes(workload.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, workload.id] : selected.filter((id) => id !== workload.id))} className="accent-[#c7f36a]"/><span className="truncate">{workload.name}</span><span className="ml-auto text-[10px] text-white/25">{workload.quality_gate_status}</span></label>)}
            {!workloads.length ? <p className="text-xs text-white/30">No workloads are available yet.</p> : null}
          </div>
        </fieldset>
        {error ? <div className="mt-4 rounded-lg border border-[#ff7379]/20 bg-[#ff7379]/[.07] p-3 text-sm text-[#ff9ca0]">{error}</div> : null}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/[.05]">Cancel</button><button disabled={loading || !(key || suggestedKey)} className="inline-flex items-center gap-2 rounded-lg bg-[#c7f36a] px-4 py-2.5 text-sm font-semibold text-[#10140d] disabled:opacity-60">{loading ? <LoaderCircle size={16} className="animate-spin"/> : <ArrowRight size={16}/>} {loading ? "Creating..." : "Create project"}</button></div>
      </form>
    </div>
  );
}
