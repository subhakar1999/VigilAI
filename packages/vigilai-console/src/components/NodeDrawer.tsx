"use client";

import { AlertTriangle, Check, Copy, FileCode2, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

import { GraphNodeData } from "@/lib/types";

export function NodeDrawer({ node, onClose }: { node: GraphNodeData | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!node) return null;
  const selectedNode = node;
  async function copyRemediation() {
    const text = `${selectedNode.file_path}:${selectedNode.line}\n${selectedNode.rule_id ? `[${selectedNode.rule_id}] ` : ""}${selectedNode.remediation ?? "Review and protect this node."}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <aside className="absolute inset-y-0 right-0 z-30 w-full max-w-sm border-l border-white/10 bg-[#0d1210]/95 p-6 shadow-2xl backdrop-blur-xl" aria-label="Node inspector">
      <button onClick={onClose} className="absolute right-4 top-4 rounded-md p-2 text-white/40 hover:bg-white/5 hover:text-white" aria-label="Close inspector"><X size={17}/></button>
      <p className="mono mb-4 text-[10px] uppercase tracking-[.2em] text-[#b7f34b]">Node inspector</p>
      <h2 className="pr-10 text-2xl font-semibold tracking-tight">{node.label}</h2>
      <span className="mono mt-3 inline-flex rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] tracking-wider text-white/55">{node.category}</span>
      <div className="mt-8 space-y-5">
        <div><div className="mb-2 flex items-center gap-2 text-xs text-white/35"><FileCode2 size={14}/> Source location</div><code className="block break-all rounded-lg border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/70">{node.file_path}:{node.line}</code></div>
        {node.rule_id ? <div><div className="mb-2 flex items-center gap-2 text-xs text-[#ff7d82]"><AlertTriangle size={14}/> Violated rule</div><p className="text-sm font-medium">{node.rule_id} · Agentic security control</p></div> : <div className="flex items-center gap-2 text-sm text-emerald-300"><ShieldCheck size={16}/> No direct violation detected</div>}
        {node.remediation && <div><p className="mb-2 text-xs text-white/35">Suggested remediation</p><p className="rounded-lg border border-[#b7f34b]/15 bg-[#b7f34b]/[.05] p-4 text-sm leading-6 text-white/70">{node.remediation}</p><button onClick={copyRemediation} className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:bg-white/5 hover:text-white">{copied ? <Check size={13}/> : <Copy size={13}/>} {copied ? "Copied" : "Copy remediation"}</button></div>}
      </div>
    </aside>
  );
}

