import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Github,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { LandingHeroInteractive } from "@/components/LandingHeroInteractive";
import { LandingArchitecture } from "@/components/LandingArchitecture";
import { LandingOwaspMatrix } from "@/components/LandingOwaspMatrix";
import { LandingBeyondOwasp } from "@/components/LandingBeyondOwasp";
import { LandingTestLab } from "@/components/LandingTestLab";
import { LandingComparison } from "@/components/LandingComparison";

export const metadata: Metadata = {
  title: "VigilAI — Quality Gates for AI Agents & Models",
  description:
    "Discover, scan, attack-test, and govern AI agents from one open-source security control plane. Model inspection, AST taint tracking, MCP lockfiles, and autonomous red-team pentesting.",
};

export default function LandingPage() {
  return (
    <main className="landing-page overflow-hidden text-white selection:bg-[#c7f36a] selection:text-[#10140d]">
      {/* ============================================================== */}
      {/* GLOBAL ANNOUNCEMENT BANNER */}
      {/* ============================================================== */}
      <div className="relative z-50 border-b border-white/[.08] bg-[#0c120e] px-4 py-2 text-center text-[11px] text-white/70">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-[#c7f36a] animate-pulse" />
          <span className="font-medium text-white">VigilAI v0.2.0 is live:</span>
          <span className="hidden sm:inline text-white/50">
            Symbolic Pickle VM scanning, AST tool taint tracking, MCP lock pinning & automated red-team pentesting.
          </span>
          <a
            href="https://github.com/subhakar1999/VigilAI"
            target="_blank"
            rel="noreferrer"
            className="ml-2 inline-flex items-center gap-1 font-semibold text-[#c7f36a] hover:underline"
          >
            Star on GitHub <ArrowRight size={11} />
          </a>
        </div>
      </div>

      {/* ============================================================== */}
      {/* STICKY NAVIGATION */}
      {/* ============================================================== */}
      <header className="fixed inset-x-0 top-[33px] z-40 border-b border-white/[.07] bg-[#070a08]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5" aria-label="VigilAI home">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#c7f36a]/25 bg-[#c7f36a]/[.08]">
              <Image src="/vigilai-logo.png" alt="VigilAI Logo" width={26} height={26} priority />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">VigilAI</span>
              <span className="mono rounded bg-white/[.06] px-1.5 py-0.5 text-[9px] text-white/40">
                v0.2.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav
            className="hidden items-center gap-7 text-xs font-medium text-white/50 lg:flex"
            aria-label="Marketing navigation"
          >
            <Link href="/playground" className="transition hover:text-white text-[#c7f36a] font-semibold flex items-center gap-1">
              <span>Live Playground</span>
              <span className="rounded bg-[#c7f36a]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#c7f36a]">NEW</span>
            </Link>
            <a href="#interactive-zone" className="transition hover:text-white">
              Command Stage
            </a>
            <a href="#platform" className="transition hover:text-white">
              Architecture
            </a>
            <a href="#owasp" className="transition hover:text-white">
              OWASP Top 10
            </a>
            <a href="#beyond-owasp" className="transition hover:text-white text-white/70">
              Beyond OWASP ✨
            </a>
            <a href="#test-lab" className="transition hover:text-white">
              Test Agent Lab
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <a
              href="https://github.com/subhakar1999/VigilAI"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.03] px-3.5 py-2 text-xs text-white/70 transition hover:bg-white/[.07] hover:text-white"
              aria-label="VigilAI on GitHub"
            >
              <Github size={14} />
              <span>Source</span>
            </a>
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs font-medium text-white/70 transition hover:text-white hover:bg-white/[.05]"
            >
              <Lock size={12} />
              <span>Sign in</span>
            </Link>
            <Link
              href="/console"
              className="inline-flex items-center gap-2 rounded-full bg-[#c7f36a] px-4 py-2 text-xs font-semibold text-[#10140d] shadow-[0_0_20px_rgba(199,243,106,0.25)] transition hover:bg-[#d7fb8c] hover:shadow-[0_0_25px_rgba(199,243,106,0.4)]"
            >
              <span>Open console</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* HERO SECTION ("THE LANDING ZONE") */}
      {/* ============================================================== */}
      <section className="landing-grid relative px-5 pb-20 pt-40 sm:px-8 sm:pb-28 sm:pt-48">
        <div className="landing-glow pointer-events-none absolute left-1/2 top-16 h-[36rem] w-[58rem] -translate-x-1/2 rounded-full" />
        <div className="relative mx-auto max-w-[1400px] text-center">
          {/* Eyebrow Pill */}
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#c7f36a]/25 bg-[#c7f36a]/[.07] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]">
            <Sparkles size={13} /> Open-Source AI Security Control Plane
          </div>

          {/* Main Title - Elevating User's Reference Screenshot */}
          <h1 className="landing-hero-title mx-auto mt-8 max-w-6xl font-bold tracking-[-.05em] text-white">
            Quality gates for <br className="hidden sm:inline" />
            <span className="text-[#c7f36a]">AI agents.</span>
          </h1>

          {/* Subtitle - Expanding the Value Proposition */}
          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-white/60 sm:text-lg">
            Scan model checkpoints, trace AST tool taint, audit MCP supply chains, and red-team
            running agents before they ship to production. One explainable pass/fail gate for your
            delivery pipeline.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link
              href="/playground"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#c7f36a] px-7 py-3.5 text-sm font-semibold text-[#10140d] shadow-[0_0_30px_rgba(199,243,106,0.3)] transition hover:bg-[#d7fb8c] hover:shadow-[0_0_40px_rgba(199,243,106,0.5)] sm:w-auto"
            >
              <span>Launch Live Playground</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/console"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[.04] px-7 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/[.08] hover:text-white sm:w-auto"
            >
              <span>Explore Agent Fleet</span>
            </Link>
            <a
              href="https://github.com/subhakar1999/VigilAI"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-transparent px-5 py-3.5 text-sm font-medium text-white/50 transition hover:bg-white/[.04] hover:text-white sm:w-auto"
            >
              <Github size={16} />
              <span>Source</span>
            </a>
          </div>

          {/* Value Highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[.14em] text-white/40">
            <span className="flex items-center gap-1.5">
              <Check size={13} className="text-[#c7f36a]" /> 100% Local & Air-Gapped
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={13} className="text-[#c7f36a]" /> Model-Free Deterministic Lab
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={13} className="text-[#c7f36a]" /> SARIF 2.1.0 & CycloneDX 1.6
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={13} className="text-[#c7f36a]" /> Zero Telemetry
            </span>
          </div>

          {/* ============================================================== */}
          {/* THE INTERACTIVE COMMAND CENTER (MATCHING USER SCREENSHOTS 1, 2, 3) */}
          {/* ============================================================== */}
          <div id="interactive-zone" className="pt-6">
            <LandingHeroInteractive />
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4-LAYER DEFENSE IN DEPTH ARCHITECTURE */}
      {/* ============================================================== */}
      <LandingArchitecture />

      {/* ============================================================== */}
      {/* OWASP AGENTIC TOP 10 (ASI01 - ASI10) COVERAGE */}
      {/* ============================================================== */}
      <LandingOwaspMatrix />

      {/* ============================================================== */}
      {/* BEYOND OWASP: CHAOS, ECONOMICS, STATE MACHINES & TRAJECTORIES */}
      {/* ============================================================== */}
      <LandingBeyondOwasp />

      {/* ============================================================== */}
      {/* DETERMINISTIC TEST AGENT LABORATORY */}
      {/* ============================================================== */}
      <LandingTestLab />

      {/* ============================================================== */}
      {/* COMPETITIVE MATRIX: VIGILAI VS LEGACY SAST */}
      {/* ============================================================== */}
      <LandingComparison />

      {/* ============================================================== */}
      {/* ENTERPRISE GOVERNANCE, PROJECTS & TEAMS */}
      {/* ============================================================== */}
      <section id="governance" className="border-t border-white/[.07] bg-[#070a08] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1360px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c7f36a]/20 bg-[#c7f36a]/[.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#c7f36a]">
                <Users size={12} /> SonarQube-Style Governance
              </div>
              <h2 className="mt-5 text-4xl font-bold tracking-[-.05em] text-white sm:text-5xl leading-tight">
                Quality ownership across <br />
                <span className="text-[#c7f36a]">teams and projects.</span>
              </h2>
              <p className="mt-6 text-sm leading-7 text-white/55">
                VigilAI organizes agents into SonarQube-inspired project portfolios. Group workloads
                by department, bind Git repository metadata, assign team ownership, and roll up risk
                scores into portfolio-wide quality gates.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-4">
                  <h4 className="text-xs font-semibold text-white">Role-Based Team Directory</h4>
                  <p className="mt-1 text-[11px] text-white/40">
                    Assign Owner, Admin, Maintainer, Analyst, and Viewer roles with explicit project scope.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-4">
                  <h4 className="text-xs font-semibold text-white">Signed CycloneDX AIBOM</h4>
                  <p className="mt-1 text-[11px] text-white/40">
                    Export machine-readable software bill of materials ready for EU AI Act Article 53 audits.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <Link
                  href="/console"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/[.08] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <span>Explore Teams & Projects</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Visual Portfolio Mockup */}
            <div className="rounded-2xl border border-white/10 bg-[#0c110e] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[.06] pb-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded bg-[#c7f36a]/10 text-[#c7f36a]">
                    <ShieldCheck size={14} />
                  </span>
                  <span className="text-xs font-semibold text-white">Project: Customer AI Experience</span>
                </div>
                <span className="rounded bg-[#ff7379]/15 px-2 py-0.5 text-[9px] font-bold text-[#ff9ca0]">
                  PORTFOLIO BLOCKED
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/[.06] bg-black/40 p-3.5 text-xs">
                  <div>
                    <span className="font-medium text-white">customer-support-agent</span>
                    <span className="mono ml-2 text-[10px] text-white/30">FastAPI</span>
                  </div>
                  <span className="rounded-full bg-[#c7f36a]/15 px-2 py-0.5 text-[9px] font-bold text-[#c7f36a]">
                    PASSED
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#ff7379]/30 bg-[#ff7379]/[.05] p-3.5 text-xs">
                  <div>
                    <span className="font-medium text-white">vulnerable-shell-worker</span>
                    <span className="mono ml-2 text-[10px] text-white/30">LangChain</span>
                  </div>
                  <span className="rounded-full bg-[#ff7379]/20 px-2 py-0.5 text-[9px] font-bold text-[#ff9ca0]">
                    FAILED · RISK 85
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/[.06] bg-black/40 p-3.5 text-xs">
                  <div>
                    <span className="font-medium text-white">approval-gated-orders</span>
                    <span className="mono ml-2 text-[10px] text-white/30">CrewAI</span>
                  </div>
                  <span className="rounded-full bg-[#c7f36a]/15 px-2 py-0.5 text-[9px] font-bold text-[#c7f36a]">
                    PASSED
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-white/[.05] pt-4 text-[11px] text-white/40 flex items-center justify-between">
                <span>Owning Team: AI Platform Engineering</span>
                <span className="mono text-[#ff9ca0]">Blocked: 1 critical finding</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* FINAL CALL TO ACTION */}
      {/* ============================================================== */}
      <section className="px-5 py-24 sm:px-8 sm:py-32 bg-[#090d0b]">
        <div className="mx-auto max-w-[1280px]">
          <div className="landing-card relative overflow-hidden rounded-[2.5rem] p-8 text-center sm:p-16 border border-white/10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(199,243,106,.15),transparent_60%)]" />

            <div className="relative">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#c7f36a]/30 bg-[#c7f36a]/[.08] text-[#c7f36a]">
                <ShieldCheck size={28} />
              </span>

              <p className="mt-6 text-[11px] font-bold uppercase tracking-[.2em] text-[#c7f36a]">
                Apache 2.0 Open Source Control Plane
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-[-.05em] text-white sm:text-6xl">
                Ready to secure your AI agent fleet?
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/60">
                Deploy the full control plane locally in seconds. Discover endpoints, trace taint paths,
                and prevent untrusted AI actions from reaching production.
              </p>

              {/* One-click Terminal Command */}
              <div className="mx-auto mt-8 max-w-md rounded-xl border border-white/10 bg-black/60 p-3 text-left">
                <span className="mono text-[10px] text-white/30 block mb-1"># Quickstart with Docker</span>
                <div className="mono text-xs text-[#c7f36a] flex items-center justify-between">
                  <span>git clone https://github.com/subhakar1999/VigilAI.git &amp;&amp; docker compose up -d</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
                <Link
                  href="/console"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c7f36a] px-8 py-3.5 text-sm font-semibold text-[#10140d] shadow-[0_0_25px_rgba(199,243,106,0.3)] transition hover:bg-[#d7fb8c]"
                >
                  <span>Launch VigilAI Console</span>
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="https://github.com/subhakar1999/VigilAI"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[.03] px-8 py-3.5 text-sm text-white/70 transition hover:bg-white/[.07] hover:text-white"
                >
                  <Github size={16} />
                  <span>View Repository</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* FOOTER */}
      {/* ============================================================== */}
      <footer className="border-t border-white/[.07] bg-[#070a08] px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#c7f36a]/20 bg-[#c7f36a]/[.06]">
              <Image src="/vigilai-logo.png" alt="VigilAI" width={22} height={22} />
            </span>
            <div>
              <p className="text-xs font-bold text-white">VigilAI</p>
              <p className="text-[11px] text-white/40">Open-Source AI Security &amp; Quality Gate Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-white/45">
            <a href="#interactive-zone" className="transition hover:text-white">
              Command Stage
            </a>
            <a href="#platform" className="transition hover:text-white">
              Architecture
            </a>
            <a href="#owasp" className="transition hover:text-white">
              OWASP Top 10
            </a>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="transition hover:text-white">
              API Docs
            </a>
            <a href="https://github.com/subhakar1999/VigilAI" target="_blank" rel="noreferrer" className="transition hover:text-white">
              GitHub
            </a>
            <Link href="/login" className="transition hover:text-white">
              Operator Sign-in
            </Link>
          </div>

          <div className="mono text-[10px] text-white/25">
            Apache 2.0 License · Built for Agentic AI Safety
          </div>
        </div>
      </footer>
    </main>
  );
}
