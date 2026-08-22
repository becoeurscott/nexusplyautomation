"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { signUp } from "@/lib/auth-client";
import { Logo } from "@/components/landing/brand";
import { StaggerGroup, StaggerItem } from "@/components/motion-stagger";

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
    <main className="nx-glow-top-strong relative grid min-h-dvh place-items-center overflow-hidden bg-[color:var(--nx-bg)] px-6 py-12 text-white">
      <div className="absolute inset-0 nx-grid" aria-hidden />

      <StaggerGroup className="relative w-full max-w-sm">
        <StaggerItem className="flex justify-center">
          <Logo size={32} />
        </StaggerItem>

        <StaggerItem>
          <h1 className="font-display mt-6 text-center text-3xl font-bold leading-[1.1]">
            Create your{" "}
            <span className="bg-gradient-to-r from-[#73b4ff] via-[#0a63f4] to-[#73b4ff] bg-clip-text italic text-transparent">
              account
            </span>
          </h1>
        </StaggerItem>

        <StaggerItem>
          <p className="mt-2 text-center text-sm text-slate-400">
            30 free credits, no card required
          </p>
        </StaggerItem>

        <StaggerItem className="relative mt-7">
          <form onSubmit={onSubmit} className="nx-card nx-card--soft relative z-10 p-6">
            <StaggerGroup className="space-y-4" delay={0.12}>
              <StaggerItem>
                <Field
                  label="Name"
                  type="text"
                  value={name}
                  onChange={setName}
                  disabled={busy}
                  required
                />
              </StaggerItem>
              <StaggerItem>
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  disabled={busy}
                  required
                />
              </StaggerItem>
              <StaggerItem>
                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  disabled={busy}
                  required
                  minLength={8}
                />
              </StaggerItem>

              {status === "error" && err && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-[10px] border border-red-900/50 bg-red-950/50 p-2 text-sm text-red-300"
                >
                  {err}
                </motion.div>
              )}

              <StaggerItem>
                <motion.button
                  whileHover={busy ? undefined : { scale: 1.015 }}
                  whileTap={busy ? undefined : { scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[color:var(--nx-blue)] py-2.5 font-semibold text-white shadow-[0_12px_40px_-8px_rgba(10,99,244,0.9)] transition-colors hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-70"
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
              </StaggerItem>
            </StaggerGroup>
          </form>

          {/* Under-glow — same treatment as the landing hero's product shot */}
          <div
            className="absolute inset-x-10 -bottom-6 h-20 rounded-full bg-[color:var(--nx-blue)]/25 blur-[60px]"
            aria-hidden
          />
        </StaggerItem>

        <StaggerItem>
          <p className="mt-6 text-center text-sm text-slate-400">
            Already have one?{" "}
            <Link
              href="/sign-in"
              className="text-[color:var(--nx-blue-soft)] transition-colors hover:text-white hover:underline"
            >
              Sign in
            </Link>
          </p>
        </StaggerItem>
      </StaggerGroup>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  disabled,
  required,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block text-sm text-slate-300">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        disabled={disabled}
        className="mt-1 block w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition-colors focus:border-[color:var(--nx-blue)] focus:bg-white/[0.07] disabled:opacity-60"
      />
    </label>
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
