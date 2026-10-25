"use client";

import { useMemo, useState } from "react";
import { Background, Controls, Edge, MarkerType, MiniMap, Node, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { GraphEdgeData, GraphNodeData } from "@/lib/types";
import { NodeDrawer } from "./NodeDrawer";

const palette: Record<string, { color: string; background: string }> = {
  TAINT_SOURCE: { color: "#f4cf64", background: "#211d11" },
  REASONING: { color: "#b18cff", background: "#191426" },
  TOOL: { color: "#ff9c59", background: "#24170f" },
  DANGEROUS_SINK: { color: "#ff666d", background: "#261214" },
};

export function FlowGraph({ graph }: { graph: { nodes: GraphNodeData[]; edges: GraphEdgeData[] } }) {
  const [selected, setSelected] = useState<GraphNodeData | null>(null);
  const nodes = useMemo<Node<GraphNodeData>[]>(() => graph.nodes.map((item, index) => {
    const colors = palette[item.category] ?? { color: "#d9e0dd", background: "#141a18" };
    const column = index % 4;
    const row = Math.floor(index / 4);
    return {
      id: item.id,
      data: item,
      position: { x: column * 245 + (row % 2) * 70, y: row * 165 + (column % 2) * 34 },
      style: { width: 190, borderRadius: 10, padding: "14px 16px", border: `1px solid ${colors.color}55`, background: colors.background, color: colors.color, fontSize: 12, fontWeight: 600, boxShadow: item.is_vulnerable ? `0 0 0 2px ${colors.color}30, 0 12px 30px #0007` : "0 10px 24px #0005" },
    };
  }), [graph.nodes]);
  const edges = useMemo<Edge[]>(() => graph.edges.map((edge, index) => ({
    id: `${edge.source}-${edge.target}-${index}`,
    source: edge.source,
    target: edge.target,
    animated: edge.is_tainted,
    markerEnd: { type: MarkerType.ArrowClosed, color: edge.is_tainted ? "#ff5c63" : "#6e7a75" },
    style: { stroke: edge.is_tainted ? "#ff5c63" : "#55615c", strokeWidth: edge.is_tainted ? 2.2 : 1.2 },
  })), [graph.edges]);

  return (
    <div className="relative h-[620px] overflow-hidden rounded-xl border border-white/10 bg-[#0b0f0d]">
      <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.25} maxZoom={2} onNodeClick={(_, node) => setSelected(node.data)}>
        <Background color="#53605a" gap={28} size={1} className="opacity-20" />
        <Controls position="bottom-left" />
        <MiniMap nodeColor={(node) => palette[(node.data as GraphNodeData).category]?.color ?? "#75817c"} maskColor="rgba(5,8,7,.7)" position="bottom-right" />
      </ReactFlow>
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-2">
        {Object.entries(palette).map(([label, colors]) => <span key={label} className="mono rounded-md border px-2 py-1 text-[9px] tracking-wider" style={{borderColor: `${colors.color}44`, color: colors.color, background: `${colors.background}dd`}}>{label.replaceAll("_", " ")}</span>)}
      </div>
      <NodeDrawer node={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

