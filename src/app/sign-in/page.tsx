"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "@/lib/auth-client";
import { Logo } from "@/components/landing/brand";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn.email({ email, password });
    setLoading(false);
    if (res.error) {
      setErr(res.error.message ?? "Sign-in failed");
      return;
    }
    router.push("/app");
  }

  return (
    <main className="nx-glow-top-strong relative grid min-h-dvh place-items-center overflow-hidden bg-[color:var(--nx-bg)] px-6 text-white">
      <div className="absolute inset-0 nx-grid" aria-hidden />
      <div className="relative w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center">
            <Logo size={32} />
          </div>
          <h1 className="font-display mt-6 text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to your dashboard</p>
        </div>
        <form onSubmit={onSubmit} className="nx-card nx-card--soft space-y-4 p-6">
          <label className="block text-sm text-slate-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[color:var(--nx-blue)]"
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
              className="mt-1 block w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[color:var(--nx-blue)]"
            />
          </label>
          {err && (
            <div className="rounded-[10px] border border-red-900/50 bg-red-950/50 p-2 text-sm text-red-300">
              {err}
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.12 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] bg-[color:var(--nx-blue)] py-2.5 font-semibold text-white transition hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </motion.button>
        </form>
        <div className="text-center text-sm text-slate-400">
          No account?{" "}
          <Link href="/sign-up" className="text-[color:var(--nx-blue-soft)] hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
