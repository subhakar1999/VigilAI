import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-[70vh] place-items-center px-6 text-center"><div><p className="mono mb-3 text-xs text-[#b7f34b]">404 / NOT FOUND</p><h1 className="text-3xl font-semibold">Workload unavailable</h1><p className="mt-3 text-sm text-white/40">It may have been removed, or the control plane may be offline.</p><Link href="/" className="mt-6 inline-block rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Return to fleet</Link></div></main>;
}

