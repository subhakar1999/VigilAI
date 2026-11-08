"use client";

import Image from "next/image";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json() as { detail?: string };
      if (!response.ok) throw new Error(payload.detail ?? "Login failed");
      router.replace(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/console");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login failed");
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-white/[.09] bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c7f36a]/55 focus:ring-2 focus:ring-[#c7f36a]/10";
  return <div className="grid min-h-screen place-items-center overflow-hidden px-5 py-10">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(199,243,106,.12),transparent_34%)]"/>
    <div className="relative w-full max-w-md">
      <div className="mb-7 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#c7f36a]/20 bg-[#c7f36a]/[.06]"><Image src="/vigilai-logo.png" alt="VigilAI" width={48} height={48} priority/></span><h1 className="mt-5 text-2xl font-semibold tracking-[-.04em]">Welcome to VigilAI</h1><p className="mt-2 text-sm text-white/38">Sign in to the AI security control plane.</p></div>
      <form onSubmit={submit} className="surface rounded-2xl p-6 shadow-2xl sm:p-7">
        <div className="mb-5 flex items-center gap-2 text-xs font-medium text-white/55"><LockKeyhole size={14} className="text-[#c7f36a]"/> Protected workspace</div>
        <label className="block text-xs font-medium text-white/60" htmlFor="username">Username<input id="username" name="username" autoComplete="username" required autoFocus value={username} onChange={(event) => setUsername(event.target.value)} className={`mt-2 ${inputClass}`} placeholder="Workspace username"/></label>
        <label className="mt-4 block text-xs font-medium text-white/60" htmlFor="password">Password<span className="relative mt-2 block"><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pr-12`} placeholder="Workspace password"/><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-white/30 hover:text-white/60" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></span></label>
        {error ? <div role="alert" className="mt-4 rounded-lg border border-[#ff7379]/20 bg-[#ff7379]/[.07] p-3 text-sm text-[#ff9ca0]">{error}</div> : null}
        <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c7f36a] px-4 py-3 text-sm font-semibold text-[#10140d] transition hover:bg-[#d3fa82] disabled:cursor-wait disabled:opacity-60">{loading ? <LoaderCircle size={17} className="animate-spin"/> : <ArrowRight size={17}/>} {loading ? "Signing in..." : "Sign in"}</button>
      </form>
      <p className="mt-5 text-center text-[11px] text-white/25">Credentials are managed through server environment variables.</p>
    </div>
  </div>;
}
