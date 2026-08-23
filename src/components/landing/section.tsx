import { Reveal } from "./reveal";

/**
 * Shared chrome for the marketing sections, so headings, spacing and the
 * entrance animation stay identical down the page.
 */
export function Section({
  id,
  title,
  lead,
  sub,
  children,
  narrow = false,
  tone = "dark",
}: {
  id?: string;
  title: React.ReactNode;
  /** Bold line under the title, used for the copy's secondary headline. */
  lead?: React.ReactNode;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  narrow?: boolean;
  tone?: "dark" | "glow";
}) {
  return (
    <section
      id={id}
      className={(tone === "glow" ? "nx-glow-top " : "") + "relative py-24"}
    >
      <div className={"mx-auto px-6 " + (narrow ? "max-w-3xl" : "max-w-6xl")}>
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {title}
          </h2>
          {lead && (
            <p className="font-display mt-4 text-2xl font-semibold text-slate-200">
              {lead}
            </p>
          )}
          {sub && <p className="mt-4 text-lg text-slate-400">{sub}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}

/** Standard edge-lit tile used across the feature/benefit grids. */
export function Tile({
  title,
  body,
  index,
}: {
  title: string;
  body?: string;
  index?: number;
}) {
  return (
    <Reveal delay={index ? Math.min(index * 0.05, 0.3) : 0}>
      <article className="nx-card nx-card--soft h-full p-6">
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        {body && <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>}
      </article>
    </Reveal>
  );
}

/** The copy leans on short stacked statements; this keeps them readable. */
export function Statements({ lines }: { lines: string[] }) {
  return (
    <div className="mx-auto mt-12 max-w-xl space-y-3">
      {lines.map((line, i) => (
        <Reveal key={line} delay={Math.min(i * 0.04, 0.3)}>
          <p className="rounded-[14px] border border-white/8 bg-white/[0.03] px-5 py-3 text-center text-slate-300">
            {line}
          </p>
        </Reveal>
      ))}
    </div>
  );
}

export function Accent({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-[#73b4ff] via-[#0a63f4] to-[#73b4ff] bg-clip-text italic text-transparent">
      {children}
    </span>
  );
}
