import { Check, X } from "lucide-react";

import { GateStatus } from "@/lib/types";

export function QualityGateBadge({ status }: { status: GateStatus }) {
  const passed = status === "PASSED";
  const failed = status === "FAILED";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-[.08em] ${passed ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : failed ? "border-red-400/25 bg-red-400/10 text-red-300" : "border-white/10 bg-white/5 text-white/45"}`}>
      {passed ? <Check size={12} /> : failed ? <X size={12} /> : null}{status}
    </span>
  );
}

