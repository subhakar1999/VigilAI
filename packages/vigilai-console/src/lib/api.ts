import { WorkloadDetail, WorkloadSummary } from "./types";

const API_URL = process.env.VIGILAI_API_URL ?? process.env.NEXT_PUBLIC_VIGILAI_API_URL ?? "http://localhost:8000";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`VigilAI API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const getWorkloads = () => request<WorkloadSummary[]>("/api/v1/workloads");
export const getWorkload = (id: string) => request<WorkloadDetail>(`/api/v1/workloads/${encodeURIComponent(id)}`);

