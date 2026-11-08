"use client";

import { LoaderCircle, Plus, Trash2, UserPlus, Users, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { TeamDetail, TeamRole } from "@/lib/types";

const API_URL = "/api/control";
const roles: TeamRole[] = ["OWNER", "ADMIN", "MAINTAINER", "ANALYST", "VIEWER"];

export function TeamDirectory({ teams }: { teams: TeamDetail[] }) {
  const router = useRouter();
  const [teamModal, setTeamModal] = useState(false);
  const [memberTeam, setMemberTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [memberName, setMemberName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("ANALYST");
  const [removingMemberId, setRemovingMemberId] = useState("");

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/teams`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: teamName.trim(), description: teamDescription.trim() }) });
      const payload = await response.json() as { detail?: string };
      if (!response.ok) throw new Error(payload.detail ?? `Team creation failed (${response.status})`);
      setTeamModal(false); setTeamName(""); setTeamDescription(""); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Team creation failed"); }
    finally { setLoading(false); }
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!memberTeam) return; setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/teams/${memberTeam.id}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: memberName.trim(), email: email.trim(), role, status: "INVITED" }) });
      const payload = await response.json() as { detail?: string };
      if (!response.ok) throw new Error(payload.detail ?? `Member invitation failed (${response.status})`);
      setMemberTeam(null); setMemberName(""); setEmail(""); setRole("ANALYST"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Member invitation failed"); }
    finally { setLoading(false); }
  }

  async function removeMember(teamId: string, memberId: string) {
    if (!window.confirm("Remove this member from the team?")) return;
    setRemovingMemberId(memberId);
    try {
      const response = await fetch(`${API_URL}/teams/${teamId}/members/${memberId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("The member could not be removed.");
      router.refresh();
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "The member could not be removed.");
    } finally {
      setRemovingMemberId("");
    }
  }

  const inputClass = "w-full rounded-lg border border-white/[.08] bg-black/25 px-3 py-2.5 text-sm outline-none focus:border-[#c7f36a]/50";
  const modal = teamModal || memberTeam;
  return (
    <>
      <div className="flex justify-end"><button onClick={() => { setError(""); setTeamModal(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#c7f36a] px-4 py-2.5 text-xs font-semibold text-[#10140d]"><Plus size={15}/> New team</button></div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {teams.map((team) => <article key={team.id} className="surface rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#c7f36a]/10 text-[#c7f36a]"><Users size={15}/></span><h2 className="font-semibold">{team.name}</h2></div><p className="mt-3 min-h-5 text-xs leading-5 text-white/38">{team.description || "No team description provided."}</p></div><button onClick={() => { setError(""); setMemberTeam(team); }} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/[.08] px-3 py-2 text-xs text-white/55 hover:bg-white/[.05] hover:text-white"><UserPlus size={14}/> Add member</button></div>
          <div className="mt-4 flex gap-5 border-y border-white/[.06] py-3 text-[11px] text-white/35"><span><b className="mr-1 text-white/70">{team.member_count}</b> members</span><span><b className="mr-1 text-white/70">{team.project_count}</b> projects</span></div>
          <div className="mt-3 space-y-1">
            {team.members.map((member) => <div key={member.id} className="flex flex-wrap items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[.025]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[.05] text-[10px] font-semibold text-white/60">{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs text-white/70">{member.name}</p><p className="truncate text-[10px] text-white/28">{member.email}</p></div><span className="rounded-full border border-white/[.07] px-2 py-1 text-[9px] text-white/38">{member.role}</span><span className="rounded-full bg-[#c7f36a]/[.07] px-2 py-1 text-[9px] text-[#c7f36a]/70">{member.status}</span><button onClick={() => removeMember(team.id, member.id)} disabled={removingMemberId === member.id} aria-label={`Remove ${member.name}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff7379]/15 px-2.5 py-1.5 text-[10px] text-[#ff9ca0]/65 transition hover:bg-[#ff7379]/[.08] hover:text-[#ffb2b5] disabled:cursor-wait disabled:opacity-50">{removingMemberId === member.id ? <LoaderCircle size={12} className="animate-spin"/> : <Trash2 size={12}/>} Remove</button></div>)}
            {!team.members.length ? <p className="py-4 text-center text-xs text-white/25">No members yet. Invite the first owner or analyst.</p> : null}
          </div>
        </article>)}
        {!teams.length ? <div className="surface col-span-full rounded-2xl p-12 text-center"><Users className="mx-auto text-white/20"/><h2 className="mt-4 font-medium">No teams yet</h2><p className="mt-2 text-sm text-white/35">Create a team to assign project ownership and invite collaborators.</p></div> : null}
      </div>
      {modal ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm"><form onSubmit={teamModal ? createTeam : addMember} className="surface w-full max-w-lg rounded-2xl p-6 shadow-2xl"><div className="mb-6 flex justify-between"><div><h2 className="text-lg font-semibold">{teamModal ? "Create a team" : `Add member to ${memberTeam?.name}`}</h2><p className="mt-1 text-sm text-white/40">{teamModal ? "Establish ownership for a project portfolio." : "Assign a governance role. Access enforcement requires authentication."}</p></div><button type="button" onClick={() => { setTeamModal(false); setMemberTeam(null); }} className="p-1 text-white/40"><X size={18}/></button></div>{teamModal ? <div className="space-y-4"><label className="block text-xs text-white/65">Team name<input required autoFocus value={teamName} onChange={(event) => setTeamName(event.target.value)} className={`mt-2 ${inputClass}`}/></label><label className="block text-xs text-white/65">Description<textarea rows={3} value={teamDescription} onChange={(event) => setTeamDescription(event.target.value)} className={`mt-2 resize-none ${inputClass}`}/></label></div> : <div className="space-y-4"><label className="block text-xs text-white/65">Name<input required autoFocus value={memberName} onChange={(event) => setMemberName(event.target.value)} className={`mt-2 ${inputClass}`}/></label><label className="block text-xs text-white/65">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`mt-2 ${inputClass}`}/></label><label className="block text-xs text-white/65">Role<select value={role} onChange={(event) => setRole(event.target.value as TeamRole)} className={`mt-2 ${inputClass}`}>{roles.map((item) => <option key={item}>{item}</option>)}</select></label></div>}{error ? <div className="mt-4 rounded-lg border border-[#ff7379]/20 bg-[#ff7379]/[.07] p-3 text-sm text-[#ff9ca0]">{error}</div> : null}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => { setTeamModal(false); setMemberTeam(null); }} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/60">Cancel</button><button disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-[#c7f36a] px-4 py-2.5 text-sm font-semibold text-[#10140d] disabled:opacity-60">{loading ? <LoaderCircle size={15} className="animate-spin"/> : <Plus size={15}/>} {teamModal ? "Create team" : "Invite member"}</button></div></form></div> : null}
    </>
  );
}
