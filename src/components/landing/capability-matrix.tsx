import { Reveal } from "./reveal";

const ROWS: Array<{ fn: string; owner: string; kind: "engine" | "us" }> = [
  { fn: "Connect accounts, schedule, cross-post, queue", owner: "Zernio", kind: "engine" },
  { fn: "Analytics, best time to post, comments/mentions inbox", owner: "Zernio", kind: "engine" },
  { fn: "Images, videos, voiceover, dubbing", owner: "Higgsfield", kind: "engine" },
  { fn: "Long-form video → shorts, analysis, translation", owner: "CloneViral", kind: "engine" },
  { fn: "Brand context store", owner: "Nexusply", kind: "us" },
  { fn: "AI calendar generator", owner: "Nexusply", kind: "us" },
  { fn: "Script generation in your voice", owner: "Nexusply", kind: "us" },
  { fn: "Trend + competitor research", owner: "Nexusply", kind: "us" },
  { fn: "Credit metering + African billing", owner: "Nexusply", kind: "us" },
];

export function CapabilityMatrix() {
  return (
    <section className="nx-gradient-panel relative py-24">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            We Don't Reinvent Wheels. We Ship the Car.
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Three production-grade engines under the hood, plus the four pieces that make
            them yours.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-14 overflow-hidden rounded-[25px] border border-white/10 bg-white/[0.02]">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/10 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              <span>Function</span>
              <span>Owned by</span>
            </div>
            <ul>
              {ROWS.map((row) => (
                <li
                  key={row.fn}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/5 px-6 py-4 last:border-b-0"
                >
                  <span className="text-sm text-slate-300">{row.fn}</span>
                  <span
                    className={
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold " +
                      (row.kind === "us"
                        ? "bg-[color:var(--nx-blue)] text-white"
                        : "border border-white/15 text-[color:var(--nx-blue-soft)]")
                    }
                  >
                    {row.owner}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
