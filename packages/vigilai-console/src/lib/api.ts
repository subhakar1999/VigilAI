import { ProjectSummary, TeamDetail, WorkloadDetail, WorkloadSummary } from "./types";

const API_URL = process.env.VIGILAI_API_URL ?? "http://localhost:8000";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store", headers: { Authorization: `Bearer ${process.env.VIGILAI_API_TOKEN ?? ""}` } });
  if (!response.ok) throw new Error(`VigilAI API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const getWorkloads = () => request<WorkloadSummary[]>("/api/v1/workloads");
export const getWorkload = (id: string) => request<WorkloadDetail>(`/api/v1/workloads/${encodeURIComponent(id)}`);
export const getProjects = () => request<ProjectSummary[]>("/api/v1/projects");
export const getTeams = () => request<TeamDetail[]>("/api/v1/teams");

