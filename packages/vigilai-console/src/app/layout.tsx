import type { Metadata } from "next";

import { ConsoleShell } from "@/components/ConsoleShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "VigilAI — AI Security Control Plane",
  description: "Security quality gates for AI models, agents, and workflows.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/vigilai-favicon-v2.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="noise">
        <ConsoleShell>{children}</ConsoleShell>
      </body>
    </html>
  );
}

