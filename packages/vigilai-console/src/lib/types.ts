export type GateStatus = "PASSED" | "FAILED" | "UNKNOWN";

export interface WorkloadSummary {
  id: string;
  name: string;
  framework: string;
  quality_gate_status: GateStatus;
  risk_score: number;
  mcp_count: number;
}

export interface GraphNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  category: "TAINT_SOURCE" | "REASONING" | "TOOL" | "DANGEROUS_SINK" | string;
  file_path: string;
  line: number;
  is_vulnerable?: boolean;
  rule_id?: string;
  remediation?: string;
}

export interface GraphEdgeData {
  source: string;
  target: string;
  is_tainted: boolean;
}

export interface PentestTrace {
  node_id?: string;
  tool_invocations?: Array<Record<string, unknown>>;
  network_requests?: Array<Record<string, unknown>>;
  output?: unknown;
  [key: string]: unknown;
}

export interface PentestEpisodeLog {
  episode_id: string;
  successful_exploit: boolean;
  violations: string[];
  trace: PentestTrace;
}

export interface PentestStats {
  latest_run_id?: string;
  successful_exploits?: number;
  total_episodes?: number;
  attack_success_rate?: number;
  logs?: PentestEpisodeLog[];
  compromised_node_ids?: string[];
  created_at?: string;
}

export interface WorkloadDetail extends WorkloadSummary {
  endpoint_url?: string;
  source_path?: string;
  findings: Array<Record<string, unknown>>;
  graph: { nodes: GraphNodeData[]; edges: GraphEdgeData[] };
  aibom: Record<string, unknown>;
  pentest_stats: PentestStats;
  quality_gate_reasons: string[];
}

export type TeamRole = "OWNER" | "ADMIN" | "MAINTAINER" | "ANALYST" | "VIEWER";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "INVITED" | "ACTIVE";
  created_at: string;
}

export interface TeamDetail {
  id: string;
  name: string;
  description: string;
  member_count: number;
  project_count: number;
  members: TeamMember[];
}

export interface ProjectSummary {
  id: string;
  key: string;
  name: string;
  description: string;
  visibility: "PRIVATE" | "INTERNAL" | "PUBLIC";
  team_id?: string;
  team_name?: string;
  source_provider: "LOCAL" | "GITHUB" | "GITLAB" | "AZURE_DEVOPS" | "BITBUCKET";
  repository_url?: string;
  quality_gate_policy: string;
  workload_ids: string[];
  workload_count: number;
  quality_gate_status: GateStatus;
  risk_score: number;
}

