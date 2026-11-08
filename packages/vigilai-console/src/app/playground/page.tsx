import type { Metadata } from "next";
import { AgentPlayground } from "@/components/AgentPlayground";

export const metadata: Metadata = {
  title: "Agent Playground — VigilAI",
  description: "Interactive adversarial probe and live execution DAG simulator for AI agents.",
};

export default function PlaygroundPage() {
  return (
    <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <AgentPlayground />
    </main>
  );
}
