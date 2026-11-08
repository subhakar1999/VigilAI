"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Github,
  Send,
  Terminal,
} from "lucide-react";

export function CicdWebhookGenerator() {
  const [activeTab, setActiveTab] = useState<"github" | "gitlab" | "precommit" | "webhooks">("github");
  const [failOnGate, setFailOnGate] = useState<boolean>(true);
  const [exportSarif, setExportSarif] = useState<boolean>(true);
  const [exportAibom, setExportAibom] = useState<boolean>(true);
  const [runRedteam, setRunRedteam] = useState<boolean>(true);
  const [targetBranch, setTargetBranch] = useState<string>("main");
  const [workloadName, setWorkloadName] = useState<string>("ai-support-agent");

  // Webhook states
  const [webhookUrl, setWebhookUrl] = useState<string>("https://hooks.slack.com/services/T00/B00/XXXXX");
  const [webhookPlatform, setWebhookPlatform] = useState<"slack" | "discord" | "teams" | "pagerduty">("slack");
  const [sendingWebhook, setSendingWebhook] = useState<boolean>(false);
  const [webhookSent, setWebhookSent] = useState<boolean>(false);

  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Generate GitHub Actions Workflow YAML
  const generateGithubYaml = () => {
    return `name: VigilAI Quality Gate

on:
  push:
    branches: [ ${targetBranch} ]
  pull_request:
    branches: [ ${targetBranch} ]

jobs:
  vigilai-security-gate:
    name: AI Agent Security & Quality Gate
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write # Required for GitHub Code Scanning SARIF upload

    steps:
      - name: Checkout agent source
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install VigilAI Scanner
        run: |
          pip install --upgrade pip
          pip install vigilai-scanner

      - name: Run AST Taint, Model & MCP Lockfile Inspection
        run: |
          vigilai scan . \\
            --name "${workloadName}" \\
            ${failOnGate ? "--fail-on-gate" : ""} \\
            ${exportSarif ? "--sarif results.sarif" : ""} \\
            ${exportAibom ? "--aibom aibom.cdx.json" : ""}

      ${
        exportSarif
          ? `- name: Upload SARIF report to GitHub Code Scanning
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: results.sarif
`
          : ""
      }${
      exportAibom
        ? `- name: Archive CycloneDX 1.6+ AIBOM
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: cyclone-dx-aibom
          path: aibom.cdx.json
`
        : ""
    }${
      runRedteam
        ? `- name: Execute Dynamic Adversarial Pentest
        run: |
          python -m vigilai_redteam.cli run \\
            --workload "${workloadName}" \\
            --max-asr 0.00 \\
            --fail-on-exploit
`
        : ""
    }`;
  };

  // Generate GitLab CI YAML
  const generateGitlabYaml = () => {
    return `stages:
  - test
  - quality-gate

vigilai_agent_gate:
  stage: quality-gate
  image: python:3.11-slim
  script:
    - pip install vigilai-scanner
    - vigilai scan . --name "${workloadName}" ${failOnGate ? "--fail-on-gate" : ""} ${exportSarif ? "--sarif gl-sast-report.json" : ""}
  artifacts:
    reports:
      sast: gl-sast-report.json
    paths:
      - aibom.cdx.json
    when: always
  rules:
    - if: '$CI_COMMIT_BRANCH == "${targetBranch}"'
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'`;
  };

  // Generate Pre-commit Hook
  const generatePrecommitYaml = () => {
    return `# .pre-commit-config.yaml
repos:
  - repo: https://github.com/subhakar1999/VigilAI
    rev: v0.2.0
    hooks:
      - id: vigilai-scan
        name: VigilAI Pre-Commit Sensor (Pickle VM & AST Taint)
        entry: vigilai scan
        language: python
        types: [python]
        args: ["--fail-on-gate", "--local-only"]
      - id: vigilai-mcp-verify
        name: VigilAI MCP Lockfile Verification
        entry: vigilai mcp-lock --verify
        files: ^mcp\\.json$
        language: python`;
  };

  // Webhook JSON Payload
  const generateWebhookPayload = () => {
    return {
      event: "vigilai.quality_gate.failed",
      timestamp: new Date().toISOString(),
      workload: workloadName,
      branch: targetBranch,
      quality_gate_status: "FAILED",
      attack_success_rate: "100.0%",
      violations: [
        "ASI02: Indirect prompt injection triggered unauthorized tool invocation (shell)",
        "Missing Human Approval gate on high-impact subprocess sink",
      ],
      remediation_summary: "Add human review gate and input allowlist validation before terminal tool.",
      dashboard_url: "http://localhost:3000/workloads/vulnerable-shell",
    };
  };

  const activeContent =
    activeTab === "github"
      ? generateGithubYaml()
      : activeTab === "gitlab"
      ? generateGitlabYaml()
      : activeTab === "precommit"
      ? generatePrecommitYaml()
      : JSON.stringify(generateWebhookPayload(), null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      activeTab === "github"
        ? "vigilai-gate.yml"
        : activeTab === "gitlab"
        ? ".gitlab-ci.yml"
        : activeTab === "precommit"
        ? ".pre-commit-config.yaml"
        : "webhook-payload.json";

    const element = document.createElement("a");
    const file = new Blob([activeContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSendTestWebhook = () => {
    setSendingWebhook(true);
    setWebhookSent(false);
    setTimeout(() => {
      setSendingWebhook(false);
      setWebhookSent(true);
      setTimeout(() => setWebhookSent(false), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="surface rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-white/[.07] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]">
                PIPELINE &amp; INTEGRATIONS HUB
              </span>
              <span className="rounded bg-white/[.06] px-2 py-0.5 text-[9px] text-white/50">
                CI/CD ENFORCEMENT
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              CI/CD &amp; Alert Webhook Generator
            </h1>
            <p className="mt-1 text-xs text-white/45">
              Export ready-to-use GitHub Actions, GitLab CI, pre-commit sensors, and real-time incident webhooks.
            </p>
          </div>

          {/* Quick Tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[.08] bg-black/40 p-1 text-xs">
            <button
              onClick={() => setActiveTab("github")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "github" ? "bg-[#c7f36a] text-[#10140d] font-semibold shadow-xs" : "text-white/50 hover:text-white"
              }`}
            >
              <Github size={13} />
              <span>GitHub Actions</span>
            </button>
            <button
              onClick={() => setActiveTab("gitlab")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "gitlab" ? "bg-[#c7f36a] text-[#10140d] font-semibold shadow-xs" : "text-white/50 hover:text-white"
              }`}
            >
              <span>GitLab CI</span>
            </button>
            <button
              onClick={() => setActiveTab("precommit")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "precommit" ? "bg-[#c7f36a] text-[#10140d] font-semibold shadow-xs" : "text-white/50 hover:text-white"
              }`}
            >
              <span>Pre-Commit</span>
            </button>
            <button
              onClick={() => setActiveTab("webhooks")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "webhooks" ? "bg-[#38bdf8] text-[#070e17] font-semibold shadow-xs" : "text-white/50 hover:text-white"
              }`}
            >
              <Bell size={13} />
              <span>Webhooks</span>
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        {activeTab !== "webhooks" ? (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div>
              <label className="mono text-[10px] uppercase tracking-wider text-white/40 block mb-1">
                Target Workload Name:
              </label>
              <input
                type="text"
                value={workloadName}
                onChange={(e) => setWorkloadName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-[#c7f36a]"
              />
            </div>

            <div>
              <label className="mono text-[10px] uppercase tracking-wider text-white/40 block mb-1">
                Target Branch:
              </label>
              <input
                type="text"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-[#c7f36a]"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-4 text-xs text-white/70 pt-4 sm:pt-0">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={failOnGate}
                  onChange={(e) => setFailOnGate(e.target.checked)}
                  className="rounded accent-[#c7f36a]"
                />
                <span>Fail PR on Blocked Gate</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportSarif}
                  onChange={(e) => setExportSarif(e.target.checked)}
                  className="rounded accent-[#c7f36a]"
                />
                <span>Export SARIF 2.1.0</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportAibom}
                  onChange={(e) => setExportAibom(e.target.checked)}
                  className="rounded accent-[#c7f36a]"
                />
                <span>Sign CycloneDX AIBOM</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={runRedteam}
                  onChange={(e) => setRunRedteam(e.target.checked)}
                  className="rounded accent-[#c7f36a]"
                />
                <span>Run Adversarial Pentest</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="mono text-[10px] uppercase tracking-wider text-white/40 block mb-1">
                Notification Platform:
              </label>
              <select
                value={webhookPlatform}
                onChange={(e) => setWebhookPlatform(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
              >
                <option value="slack">Slack Incoming Webhook</option>
                <option value="discord">Discord Channel Webhook</option>
                <option value="teams">Microsoft Teams Webhook</option>
                <option value="pagerduty">PagerDuty Events API v2</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mono text-[10px] uppercase tracking-wider text-white/40 block mb-1">
                Webhook URL Endpoint:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                />
                <button
                  onClick={handleSendTestWebhook}
                  disabled={sendingWebhook}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#38bdf8] px-4 py-2 text-xs font-semibold text-[#070e17] hover:bg-[#7dd3fc] transition disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{sendingWebhook ? "Dispatching..." : "Send Test Alert"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated Code Window */}
      <div className="surface rounded-2xl p-5 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[.07] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Terminal size={15} className="text-[#c7f36a]" />
            <span className="mono text-xs font-semibold text-white">
              {activeTab === "github"
                ? ".github/workflows/vigilai.yml"
                : activeTab === "gitlab"
                ? ".gitlab-ci.yml"
                : activeTab === "precommit"
                ? ".pre-commit-config.yaml"
                : "Webhook Event JSON"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[.07] hover:text-white transition"
            >
              <Download size={13} />
              <span>Download File</span>
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#c7f36a] px-3.5 py-1.5 text-xs font-semibold text-[#10140d] hover:bg-[#d7fb8c] transition shadow-xs"
            >
              {copiedCode ? (
                <>
                  <Check size={13} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Box */}
        <pre className="mono rounded-xl border border-white/[.07] bg-black/60 p-5 text-xs leading-6 text-white/80 overflow-x-auto whitespace-pre">
          {activeContent}
        </pre>

        {webhookSent && (
          <div className="mt-4 rounded-xl border border-[#c7f36a]/30 bg-[#c7f36a]/10 p-3 text-xs text-[#d7fb8c] flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>Simulated webhook alert payload dispatched successfully to {webhookPlatform.toUpperCase()}!</span>
          </div>
        )}
      </div>

      {/* Feature Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="rounded-xl border border-white/[.06] bg-black/30 p-4 space-y-1.5">
          <span className="mono text-[10px] uppercase tracking-wider text-[#c7f36a] font-bold block">
            GitHub Code Scanning SARIF
          </span>
          <p className="text-white/50 leading-5">
            Findings appear natively in the GitHub Pull Request &ldquo;Security&rdquo; tab with inline code annotations and severity badges.
          </p>
        </div>

        <div className="rounded-xl border border-white/[.06] bg-black/30 p-4 space-y-1.5">
          <span className="mono text-[10px] uppercase tracking-wider text-[#38bdf8] font-bold block">
            Zero Telemetry Air-Gapped
          </span>
          <p className="text-white/50 leading-5">
            The scanner CLI runs entirely on your GitHub Actions or GitLab runner. No models or weights are sent to third-party clouds.
          </p>
        </div>

        <div className="rounded-xl border border-white/[.06] bg-black/30 p-4 space-y-1.5">
          <span className="mono text-[10px] uppercase tracking-wider text-[#f7c967] font-bold block">
            Automated PR Blocking
          </span>
          <p className="text-white/50 leading-5">
            Sets exit code 1 whenever critical findings, unvalidated taint paths, or dynamic attack bypasses exist.
          </p>
        </div>
      </div>
    </div>
  );
}
