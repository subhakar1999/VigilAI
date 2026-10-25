import type { Metadata } from "next";
import { Activity, Github, Shield } from "lucide-react";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "VigilAI — AI Security Control Plane",
  description: "Security quality gates for AI models, agents, and workflows.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="noise">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080b0a]/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5 lg:px-8">
            <Link href="/" className="flex items-center gap-3" aria-label="VigilAI home">
              <span className="grid h-9 w-9 place-items-center rounded-lg border border-[#b7f34b]/40 bg-[#b7f34b]/10 text-[#b7f34b]"><Shield size={19} strokeWidth={1.8} /></span>
              <span><b className="text-[15px] tracking-tight">VIGILAI</b><span className="ml-2 text-[10px] uppercase tracking-[.22em] text-white/35">Control plane</span></span>
            </Link>
            <div className="flex items-center gap-3 text-xs text-white/55">
              <span className="hidden items-center gap-2 sm:flex"><Activity size={14} className="text-[#b7f34b]" /> Scanner online</span>
              <span className="h-4 w-px bg-white/10" />
              <a href="https://github.com" aria-label="GitHub repository" className="rounded-md p-2 transition hover:bg-white/5 hover:text-white"><Github size={17} /></a>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

