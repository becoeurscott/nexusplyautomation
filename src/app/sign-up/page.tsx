"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { signUp } from "@/lib/auth-client";
import { Logo } from "@/components/landing/brand";

type Status = "idle" | "submitting" | "redirecting" | "error";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const busy = status === "submitting" || status === "redirecting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setStatus("submitting");
    const res = await signUp.email({ email, password, name });
    if (res.error) {
      setStatus("error");
      setErr(res.error.message ?? "Sign-up failed");
      return;
    }
    // Keep the button in a busy state through the navigation itself — the
    // first hit to /app can take a few seconds (DB + account lookups), and
    // resetting to idle here made it look like nothing had happened.
    setStatus("redirecting");
    router.push("/onboarding");
  }

  return (
    <main className="nx-glow-top-strong relative grid min-h-dvh place-items-center overflow-hidden bg-[color:var(--nx-bg)] px-6 text-white">
      <div className="absolute inset-0 nx-grid" aria-hidden />
      <div className="relative w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center">
            <Logo size={32} />
          </div>
          <h1 className="font-display mt-6 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">30 free credits, no card required</p>
        </div>
        <form onSubmit={onSubmit} className="nx-card nx-card--soft space-y-4 p-6">
          <label className="block text-sm text-slate-300">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={busy}
              className="mt-1 block w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[color:var(--nx-blue)] disabled:opacity-60"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
              className="mt-1 block w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[color:var(--nx-blue)] disabled:opacity-60"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={busy}
              className="mt-1 block w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[color:var(--nx-blue)] disabled:opacity-60"
            />
          </label>
          {status === "error" && err && (
            <div className="rounded-[10px] border border-red-900/50 bg-red-950/50 p-2 text-sm text-red-300">
              {err}
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.12 }}
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[color:var(--nx-blue)] py-2.5 font-semibold text-white transition hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-70"
          >
            {status === "redirecting" ? (
              <>
                <Spinner /> Taking you to your dashboard…
              </>
            ) : status === "submitting" ? (
              <>
                <Spinner /> Creating your account…
              </>
            ) : (
              "Create account"
            )}
          </motion.button>
        </form>
        <div className="text-center text-sm text-slate-400">
          Already have one?{" "}
          <Link href="/sign-in" className="text-[color:var(--nx-blue-soft)] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
