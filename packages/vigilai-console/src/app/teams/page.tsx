import { Users } from "lucide-react";

import { TeamDirectory } from "@/components/TeamDirectory";
import { getTeams } from "@/lib/api";

export default async function TeamsPage() {
  const teams = await getTeams().catch(() => []);
  return <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9"><section><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]"><Users size={13}/> Ownership model</div><h1 className="text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Teams</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/38">Create delivery groups, invite members, assign governance roles, and make project responsibility visible.</p></section><TeamDirectory teams={teams}/></main>;
}
