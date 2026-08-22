"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signUp.email({ email, password, name });
    setLoading(false);
    if (res.error) {
      setErr(res.error.message ?? "Sign-up failed");
      return;
    }
    router.push("/app");
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-xl font-bold">
            <span className="text-indigo-400">◆</span> Zernio Studio
          </div>
          <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </label>
          {err && <div className="rounded-md bg-red-950 p-2 text-sm text-red-200">{err}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-500 py-2 font-medium hover:bg-indigo-400 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <div className="text-center text-sm text-slate-400">
          Already have one?{" "}
          <Link href="/sign-in" className="text-indigo-400 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
