"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, SkipForward } from "lucide-react";
import { Logo } from "@/components/landing/brand";
import { saveBrandBasics, finishOnboarding, type ActionResult } from "./actions";

export type AccountSummary = { id: string; name: string; platform: string };

const PLATFORMS = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X" },
];

const STEPS = ["About you", "Your platforms", "Ready"] as const;

export function OnboardingWizard({
  orgName,
  hasCredential,
  accounts,
}: {
  orgName: string;
  hasCredential: boolean;
  keyPreview?: string;
  accounts: AccountSummary[];
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <main className="nx-glow-top-strong relative flex min-h-dvh flex-col overflow-hidden bg-[color:var(--nx-bg)] px-6 py-10 text-white">
      <div className="absolute inset-0 nx-grid" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Logo size={28} />
          <form action={finishOnboarding}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white"
            >
              <SkipForward className="h-3.5 w-3.5" /> Skip setup
            </button>
          </form>
        </div>

        {/* Progress dots */}
        <div className="mt-8 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition " +
                  (i < step
                    ? "bg-[color:var(--nx-blue)] text-white"
                    : i === step
                      ? "border-2 border-[color:var(--nx-blue)] text-[color:var(--nx-blue-soft)]"
                      : "border border-white/15 text-slate-500")
                }
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={
                    "h-px flex-1 " + (i < step ? "bg-[color:var(--nx-blue)]" : "bg-white/10")
                  }
                />
              )}
            </div>
          ))}
        </div>

        <div className="relative mt-10 flex-1 overflow-hidden">
          <AnimatePresence initial={false}>
            {step === 0 && (
              <StepFrame key="step-0">
                <BrandBasicsStep orgName={orgName} onNext={() => setStep(1)} />
              </StepFrame>
            )}
            {step === 1 && (
              <StepFrame key="step-1">
                <PlatformsStep
                  hasCredential={hasCredential}
                  accounts={accounts}
                  selected={selected}
                  onToggle={(key) =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      next.has(key) ? next.delete(key) : next.add(key);
                      return next;
                    })
                  }
                  onNext={() => setStep(2)}
                />
              </StepFrame>
            )}
            {step === 2 && (
              <StepFrame key="step-2">
                <FinishStep
                  accountCount={accounts.length}
                  selectedCount={selected.size}
                />
              </StepFrame>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function StepFrame({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0"
    >
      {children}
    </motion.div>
  );
}

function BrandBasicsStep({ orgName, onNext }: { orgName: string; onNext: () => void }) {
  const [state, submit, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, fd) => {
      const res = await saveBrandBasics(_prev, fd);
      if (res.ok) onNext();
      return res;
    },
    null,
  );

  return (
    <div className="nx-card nx-card--soft h-full overflow-y-auto p-7">
      <h1 className="font-display text-2xl font-bold">Tell us about {orgName}</h1>
      <p className="mt-2 text-sm text-slate-400">
        This shapes every AI caption, script, and calendar we generate for you. Skip any
        field you're not sure of yet.
      </p>
      <form action={submit} className="mt-6 space-y-4">
        <label className="block text-sm text-slate-300">
          What do you post about?
          <input
            name="niche"
            placeholder="e.g. immigration advice, school admissions, hair products"
            className="mt-1 block w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[color:var(--nx-blue)]"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Who's your audience?
          <input
            name="audience"
            placeholder="e.g. parents in Kenya looking for schools"
            className="mt-1 block w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[color:var(--nx-blue)]"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Describe your tone in a few words
          <input
            name="tone"
            placeholder="e.g. warm, direct, no jargon"
            className="mt-1 block w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[color:var(--nx-blue)]"
          />
          <span className="mt-1 block text-xs text-slate-500">Separate with commas</span>
        </label>

        {state && !state.ok && (
          <div className="rounded-[10px] border border-red-900/50 bg-red-950/50 p-2 text-sm text-red-300">
            {state.error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onNext}
            className="text-sm font-medium text-slate-400 hover:text-white"
          >
            Skip for now
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.12 }}
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-[10px] bg-[color:var(--nx-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Continue"} <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}

function PlatformsStep({
  hasCredential,
  accounts,
  selected,
  onToggle,
  onNext,
}: {
  hasCredential: boolean;
  accounts: AccountSummary[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onNext: () => void;
}) {
  const connectedPlatforms = new Set(accounts.map((a) => a.platform.toLowerCase()));

  return (
    <div className="nx-card nx-card--soft h-full overflow-y-auto p-7">
      <h1 className="font-display text-2xl font-bold">Which platforms do you use?</h1>
      <p className="mt-2 text-sm text-slate-400">
        Pick account 1, 2, 3 — as many as you post to. We'll get them connected on our
        end, no setup needed from you.
      </p>

      {hasCredential && accounts.length > 0 && (
        <div className="mt-4 rounded-[10px] border border-emerald-900/40 bg-emerald-950/30 p-3 text-sm text-emerald-300">
          {accounts.length} account{accounts.length === 1 ? "" : "s"} already connected.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PLATFORMS.map((p, i) => {
          const isConnected = connectedPlatforms.has(p.key);
          const isSelected = selected.has(p.key) || isConnected;
          return (
            <button
              type="button"
              key={p.key}
              disabled={isConnected}
              onClick={() => onToggle(p.key)}
              className={
                "flex items-center justify-between rounded-[10px] border px-3 py-2.5 text-left text-sm transition " +
                (isConnected
                  ? "border-emerald-900/40 bg-emerald-950/20 text-emerald-300"
                  : isSelected
                    ? "border-[color:var(--nx-blue)] bg-[color:var(--nx-blue)]/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20")
              }
            >
              <span className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{i + 1}</span>
                {p.label}
              </span>
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        We'll reach out to help connect the platforms you picked — nothing to configure
        here.
      </p>

      <div className="flex items-center justify-between pt-6">
        <button
          type="button"
          onClick={onNext}
          className="text-sm font-medium text-slate-400 hover:text-white"
        >
          Skip for now
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
          type="button"
          onClick={onNext}
          className="flex items-center gap-1.5 rounded-[10px] bg-[color:var(--nx-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--nx-blue-hover)]"
        >
          Continue <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}

function FinishStep({
  accountCount,
  selectedCount,
}: {
  accountCount: number;
  selectedCount: number;
}) {
  return (
    <div className="nx-card nx-card--soft flex h-full flex-col items-center justify-center p-7 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--nx-blue)]">
        <Check className="h-7 w-7 text-white" />
      </div>
      <h1 className="font-display mt-5 text-2xl font-bold">You're all set</h1>
      <p className="mt-2 max-w-xs text-sm text-slate-400">
        {accountCount > 0
          ? `${accountCount} platform${accountCount === 1 ? "" : "s"} already connected. Your dashboard is ready.`
          : selectedCount > 0
            ? "We've noted the platforms you want to use — we'll be in touch to get them connected."
            : "Your dashboard is ready. Connect your platforms any time from Settings."}
      </p>
      <form action={finishOnboarding} className="mt-8">
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
          type="submit"
          className="rounded-[10px] bg-[color:var(--nx-blue)] px-6 py-3 text-sm font-semibold text-white hover:bg-[color:var(--nx-blue-hover)]"
        >
          Go to dashboard
        </motion.button>
      </form>
    </div>
  );
}
