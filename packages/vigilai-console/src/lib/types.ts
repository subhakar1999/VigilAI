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

export interface WorkloadDetail extends WorkloadSummary {
  endpoint_url?: string;
  source_path?: string;
  findings: Array<Record<string, unknown>>;
  graph: { nodes: GraphNodeData[]; edges: GraphEdgeData[] };
  aibom: Record<string, unknown>;
  pentest_stats: Record<string, unknown>;
}

