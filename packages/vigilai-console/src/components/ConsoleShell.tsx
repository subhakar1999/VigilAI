"use client";

import { Activity, BookOpen, Boxes, FolderKanban, Github, LogOut, Menu, Network, Shield, Users, Workflow, X, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

const navigation = [
  { label: "Agent fleet", href: "/console", icon: Boxes },
  { label: "Live Playground", href: "/playground", icon: Workflow },
  { label: "CI/CD & Webhooks", href: "/integrations", icon: Zap },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Teams", href: "/teams", icon: Users },
  { label: "Security posture", href: "/console#workloads", icon: Shield },
  { label: "API explorer", href: "http://localhost:8000/docs", icon: Network, external: true },
];

export function ConsoleShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isWorkload = pathname.startsWith("/workloads/");
  const pageContext = pathname.startsWith("/playground")
    ? { title: "Agent Playground", subtitle: "Interactive adversarial probe & execution DAG simulator" }
    : pathname.startsWith("/integrations")
      ? { title: "CI/CD & Webhooks", subtitle: "Copyable GitHub Actions, GitLab CI & Alert Webhooks" }
      : pathname.startsWith("/projects")
        ? { title: "Projects", subtitle: "Quality ownership across agent portfolios" }
        : pathname.startsWith("/teams")
          ? { title: "Teams", subtitle: "Members, roles and project responsibility" }
          : isWorkload
            ? { title: "Workload intelligence", subtitle: "Evidence, topology and remediation" }
            : { title: "Agent fleet", subtitle: "Security posture across every AI workload" };

  if (pathname === "/" || pathname === "/login") return <>{children}</>;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const sidebar = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-white/[.07] px-5">
        <Link href="/console" className="flex items-center gap-3" aria-label="VigilAI console home" onClick={() => setMobileOpen(false)}>
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#c7f36a]/20 bg-[#c7f36a]/[.06]"><Image src="/vigilai-logo.png" alt="" width={27} height={27} priority/></span>
          <span><b className="block text-[14px] tracking-[-.01em]">VigilAI</b><span className="block text-[10px] text-white/35">Security control plane</span></span>
        </Link>
        <button className="rounded-md p-1.5 text-white/45 hover:bg-white/[.06] hover:text-white lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={17}/></button>
      </div>

      <div className="px-3 py-4">
        <div className="mb-5 rounded-lg border border-white/[.07] bg-white/[.025] p-3">
          <div className="flex items-center justify-between"><span className="text-xs font-medium text-white/75">Local workspace</span><span className="h-2 w-2 rounded-full bg-[#c7f36a] shadow-[0_0_10px_#c7f36a80]"/></div>
          <p className="mt-1 text-[11px] text-white/32">Docker control plane</p>
        </div>
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-white/25">Workspace</p>
        <nav className="space-y-1" aria-label="Primary navigation">
          {navigation.map(({ label, href, icon: Icon, external }) => {
            const active = label === "Agent fleet"
              ? pathname === "/console"
              : label === "Live Playground"
                ? pathname.startsWith("/playground")
                : label === "CI/CD & Webhooks"
                  ? pathname.startsWith("/integrations")
                  : label === "Projects"
                    ? pathname.startsWith("/projects")
                    : label === "Teams"
                      ? pathname.startsWith("/teams")
                      : label === "Security posture" && isWorkload;
            const content = <><Icon size={15}/><span>{label}</span>{external ? <span className="ml-auto text-[9px] text-white/25">↗</span> : null}</>;
            const classes = `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${active ? "bg-white/[.07] text-white shadow-[inset_2px_0_0_#c7f36a]" : "text-white/45 hover:bg-white/[.04] hover:text-white/75"}`;
            return external ? <a key={label} href={href} target="_blank" rel="noreferrer" className={classes}>{content}</a> : <Link key={label} href={href} className={classes} onClick={() => setMobileOpen(false)}>{content}</Link>;
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/[.07] p-3">
        <a href="https://github.com/subhakar1999/VigilAI" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] text-white/40 transition hover:bg-white/[.04] hover:text-white/75" aria-label="Open the VigilAI GitHub repository">
          <Github size={15}/><span>Source repository</span><span className="ml-auto">↗</span>
        </a>
        <a href="https://github.com/subhakar1999/VigilAI#readme" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] text-white/40 transition hover:bg-white/[.04] hover:text-white/75">
          <BookOpen size={15}/><span>Documentation</span><span className="ml-auto">↗</span>
        </a>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] text-white/40 transition hover:bg-white/[.04] hover:text-white/75"><LogOut size={15}/><span>Sign out</span></button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-white/[.07] bg-[#0b0f0d] lg:flex">{sidebar}</aside>
      {mobileOpen ? <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay"/><aside className="relative flex h-full w-72 flex-col border-r border-white/[.08] bg-[#0b0f0d] shadow-2xl">{sidebar}</aside></div> : null}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/[.07] bg-[#080b0a]/88 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-white/[.08] p-2 text-white/50 hover:bg-white/[.05] hover:text-white lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={17}/></button>
            <div><p className="text-sm font-medium">{pageContext.title}</p><p className="hidden text-[11px] text-white/30 sm:block">{pageContext.subtitle}</p></div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/[.07] bg-white/[.025] px-3 py-1.5 text-[11px] text-white/45"><Activity size={13} className="text-[#c7f36a]"/><span className="hidden sm:inline">Control plane</span><span className="text-[#c7f36a]">online</span></div>
        </header>
        {children}
      </div>
    </div>
  );
}
