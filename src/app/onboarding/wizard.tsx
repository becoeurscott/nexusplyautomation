"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, SkipForward } from "lucide-react";
import { Logo } from "@/components/landing/brand";
import { StaggerGroup, StaggerItem } from "@/components/motion-stagger";
import { saveBrandBasics, finishOnboarding, type ActionResult } from "./actions";

export type AccountSummary = { id: string; name: string; platform: string };

const EASE = [0.16, 1, 0.3, 1] as const;

const PLATFORMS = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X" },
];

const STEPS = ["About you", "Your platforms", "Ready"] as const;

/**
 * Directional slide — steps travel left going forward, right going back.
 *
 * The outgoing step keeps overlapping the incoming one for the length of the
 * animation (no `mode="wait"`, so a throttled rAF can't strand the user), so
 * `exit` also kills its pointer events: without that the invisible old panel
 * still sits on top of the stack and swallows the first click on the new one.
 */
const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0, pointerEvents: "auto" as const },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -48 : 48,
    pointerEvents: "none" as const,
  }),
};

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
  // Track direction alongside the index so AnimatePresence knows which way
  // to slide — forward on Continue, backward on Back.
  const [[step, direction], setStep] = useState<[number, number]>([0, 1]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const go = (next: number) => setStep([next, next > step ? 1 : -1]);

  return (
    <main className="nx-glow-top-strong relative flex min-h-dvh flex-col overflow-hidden bg-[color:var(--nx-bg)] px-6 py-10 text-white">
      <div className="absolute inset-0 nx-grid" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        <StaggerGroup className="flex items-center justify-between">
          <StaggerItem>
            <Logo size={28} />
          </StaggerItem>
          <StaggerItem>
            <form action={finishOnboarding}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.12 }}
                type="submit"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-white"
              >
                <SkipForward className="h-3.5 w-3.5" /> Skip setup
              </motion.button>
            </form>
          </StaggerItem>
        </StaggerGroup>

        <ProgressTrail step={step} />

        <div className="relative mt-9 flex-1">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: EASE }}
              className="absolute inset-0"
            >
              {step === 0 && (
                <BrandBasicsStep orgName={orgName} onNext={() => go(1)} />
              )}
              {step === 1 && (
                <PlatformsStep
                  hasCredential={hasCredential}
                  accounts={accounts}
                  selected={selected}
                  onToggle={(key) =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    })
                  }
                  onBack={() => go(0)}
                  onNext={() => go(2)}
                />
              )}
              {step === 2 && (
                <FinishStep
                  accountCount={accounts.length}
                  selectedCount={selected.size}
                  onBack={() => go(1)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Progress trail — numbered nodes with a filling connector line       */
/* ------------------------------------------------------------------ */

/**
 * Which step you're on is *state*, not decoration — so it's expressed with
 * CSS classes and CSS transitions rather than framer-motion `animate` props.
 * JS-driven animation is rAF-driven, and a throttled rAF (backgrounded tab,
 * heavy main thread) leaves those props stuck at their initial values, which
 * would make the indicator claim you're on step 1 while you're on step 3.
 * CSS still settles on the correct final value with no frames rendered.
 * Motion is kept only for the purely decorative halo and check-pop.
 */
function ProgressTrail({ step }: { step: number }) {
  return (
    <div className="nx-reveal is-visible mt-8 flex items-center gap-2">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="relative">
              {/* Decorative halo — glides between nodes via shared layout */}
              {active && (
                <motion.span
                  layoutId="onboarding-step-halo"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute -inset-1.5 rounded-full bg-[color:var(--nx-blue)]/30 blur-[6px]"
                  aria-hidden
                />
              )}
              <div
                aria-current={active ? "step" : undefined}
                className={
                  "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ease-out " +
                  (done
                    ? "scale-100 border-[color:var(--nx-blue)] bg-[color:var(--nx-blue)] text-white"
                    : active
                      ? "scale-110 border-[color:var(--nx-blue)] text-[color:var(--nx-blue-soft)]"
                      : "scale-100 border-white/15 text-slate-500")
                }
              >
                <AnimatePresence initial={false} mode="popLayout">
                  {done ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 24 }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="num"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {i + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {i < STEPS.length - 1 && (
              <div className="relative h-px flex-1 overflow-hidden bg-white/10">
                <div
                  className={
                    "absolute inset-0 origin-left bg-[color:var(--nx-blue)] transition-transform duration-500 ease-out " +
                    (done ? "scale-x-100" : "scale-x-0")
                  }
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared step chrome                                                  */
/* ------------------------------------------------------------------ */

/** Edge-lit card + under-glow, matching the landing hero's product frame. */
function StepCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative h-full">
      <div
        className={`nx-card nx-card--soft relative z-10 h-full overflow-y-auto p-7 ${className}`}
      >
        {children}
      </div>
      <div
        className="absolute inset-x-12 -bottom-5 h-20 rounded-full bg-[color:var(--nx-blue)]/20 blur-[60px]"
        aria-hidden
      />
    </div>
  );
}

function StepHeading({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display text-2xl font-bold leading-tight">{children}</h1>;
}

/** The landing's italic cobalt gradient accent, reused on step headings. */
function Accent({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-[#73b4ff] via-[#0a63f4] to-[#73b4ff] bg-clip-text italic text-transparent">
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  disabled,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-[10px] bg-[color:var(--nx-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(10,99,244,0.9)] transition-colors hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-60"
    >
      {children}
    </motion.button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.12 }}
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
    >
      {children}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — brand basics                                               */
/* ------------------------------------------------------------------ */

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
    <StepCard>
      <StaggerGroup delay={0.1}>
        <StaggerItem>
          <StepHeading>
            Tell us about <Accent>{orgName}</Accent>
          </StepHeading>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-2 text-sm text-slate-400">
            This shapes every AI caption, script, and calendar we generate for you. Skip
            any field you&apos;re not sure of yet.
          </p>
        </StaggerItem>

        <form action={submit} className="mt-6">
          <StaggerGroup className="space-y-4" delay={0.18}>
            <StaggerItem>
              <WizardField
                name="niche"
                label="What do you post about?"
                placeholder="e.g. immigration advice, school admissions, hair products"
              />
            </StaggerItem>
            <StaggerItem>
              <WizardField
                name="audience"
                label="Who's your audience?"
                placeholder="e.g. parents in Kenya looking for schools"
              />
            </StaggerItem>
            <StaggerItem>
              <WizardField
                name="tone"
                label="Describe your tone in a few words"
                placeholder="e.g. warm, direct, no jargon"
                hint="Separate with commas"
              />
            </StaggerItem>

            <AnimatePresence>
              {state && !state.ok && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="overflow-hidden rounded-[10px] border border-red-900/50 bg-red-950/50 p-2 text-sm text-red-300"
                >
                  {state.error}
                </motion.div>
              )}
            </AnimatePresence>

            <StaggerItem>
              <div className="flex items-center justify-between pt-2">
                <GhostButton onClick={onNext}>Skip for now</GhostButton>
                <PrimaryButton type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Continue"}
                  <ChevronRight className="h-4 w-4" />
                </PrimaryButton>
              </div>
            </StaggerItem>
          </StaggerGroup>
        </form>
      </StaggerGroup>
    </StepCard>
  );
}

function WizardField({
  name,
  label,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  placeholder: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm text-slate-300">
      {label}
      <input
        name={name}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[color:var(--nx-blue)] focus:bg-white/[0.07]"
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — platforms                                                  */
/* ------------------------------------------------------------------ */

function PlatformsStep({
  hasCredential,
  accounts,
  selected,
  onToggle,
  onBack,
  onNext,
}: {
  hasCredential: boolean;
  accounts: AccountSummary[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const connectedPlatforms = new Set(accounts.map((a) => a.platform.toLowerCase()));

  return (
    <StepCard>
      <StaggerGroup delay={0.1}>
        <StaggerItem>
          <StepHeading>
            Which <Accent>platforms</Accent> do you use?
          </StepHeading>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-2 text-sm text-slate-400">
            Pick account 1, 2, 3 — as many as you post to. We&apos;ll get them connected
            on our end, no setup needed from you.
          </p>
        </StaggerItem>

        {hasCredential && accounts.length > 0 && (
          <StaggerItem>
            <div className="mt-4 rounded-[10px] border border-emerald-900/40 bg-emerald-950/30 p-3 text-sm text-emerald-300">
              {accounts.length} account{accounts.length === 1 ? "" : "s"} already
              connected.
            </div>
          </StaggerItem>
        )}

        <StaggerGroup className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3" delay={0.2}>
          {PLATFORMS.map((p, i) => {
            const isConnected = connectedPlatforms.has(p.key);
            const isSelected = selected.has(p.key) || isConnected;
            return (
              <StaggerItem key={p.key}>
                <motion.button
                  whileHover={isConnected ? undefined : { scale: 1.03, y: -2 }}
                  whileTap={isConnected ? undefined : { scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  type="button"
                  disabled={isConnected}
                  onClick={() => onToggle(p.key)}
                  className={
                    "flex w-full items-center justify-between rounded-[10px] border px-3 py-2.5 text-left text-sm transition-colors " +
                    (isConnected
                      ? "border-emerald-900/40 bg-emerald-950/20 text-emerald-300"
                      : isSelected
                        ? "border-[color:var(--nx-blue)] bg-[color:var(--nx-blue)]/10 text-white shadow-[0_8px_28px_-10px_rgba(10,99,244,0.9)]"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25")
                  }
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">{i + 1}</span>
                    {p.label}
                  </span>
                  <AnimatePresence initial={false}>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      >
                        <Check className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerGroup>

        <StaggerItem>
          <p className="mt-3 text-xs text-slate-500">
            We&apos;ll reach out to help connect the platforms you picked — nothing to
            configure here.
          </p>
        </StaggerItem>

        <StaggerItem>
          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-4">
              <GhostButton onClick={onBack}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </GhostButton>
              <GhostButton onClick={onNext}>Skip for now</GhostButton>
            </div>
            <PrimaryButton onClick={onNext}>
              Continue <ChevronRight className="h-4 w-4" />
            </PrimaryButton>
          </div>
        </StaggerItem>
      </StaggerGroup>
    </StepCard>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — finish                                                     */
/* ------------------------------------------------------------------ */

function FinishStep({
  accountCount,
  selectedCount,
  onBack,
}: {
  accountCount: number;
  selectedCount: number;
  onBack: () => void;
}) {
  return (
    <StepCard className="flex flex-col items-center justify-center text-center">
      <StaggerGroup className="flex flex-col items-center" delay={0.1}>
        <StaggerItem>
          {/* Plain div, not a spring — a stalled rAF would leave the success
              mark pinned at scale 0, i.e. an empty circle-less "all set". */}
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--nx-blue)] shadow-[0_12px_44px_-8px_rgba(10,99,244,1)]">
            <Check className="h-7 w-7 text-white" />
          </div>
        </StaggerItem>

        <StaggerItem>
          <h1 className="font-display mt-5 text-2xl font-bold">
            You&apos;re <Accent>all set</Accent>
          </h1>
        </StaggerItem>

        <StaggerItem>
          <p className="mt-2 max-w-xs text-sm text-slate-400">
            {accountCount > 0
              ? `${accountCount} platform${accountCount === 1 ? "" : "s"} already connected. Your dashboard is ready.`
              : selectedCount > 0
                ? "We've noted the platforms you want to use — we'll be in touch to get them connected."
                : "Your dashboard is ready. Connect your platforms any time from Settings."}
          </p>
        </StaggerItem>

        <StaggerItem>
          <form action={finishOnboarding} className="mt-8">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12 }}
              type="submit"
              className="rounded-[10px] bg-[color:var(--nx-blue)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(10,99,244,0.9)] transition-colors hover:bg-[color:var(--nx-blue-hover)]"
            >
              Go to dashboard
            </motion.button>
          </form>
        </StaggerItem>

        <StaggerItem>
          <div className="mt-4">
            <GhostButton onClick={onBack}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </GhostButton>
          </div>
        </StaggerItem>
      </StaggerGroup>
    </StepCard>
  );
}
