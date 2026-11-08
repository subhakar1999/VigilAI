import type { Metadata } from "next";
import { CicdWebhookGenerator } from "@/components/CicdWebhookGenerator";

export const metadata: Metadata = {
  title: "CI/CD & Alert Webhooks — VigilAI",
  description: "Generate copyable GitHub Actions, GitLab CI workflows, and real-time alert webhooks for AI agent security gates.",
};

export default function IntegrationsPage() {
  return (
    <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <CicdWebhookGenerator />
    </main>
  );
}
