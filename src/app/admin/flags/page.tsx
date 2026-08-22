import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { createFlag, toggleFlag } from "./actions";

const SUGGESTED = [
  "automations.enabled",
  "trends.enabled",
  "ai.calendar_generator.enabled",
  "media.video_generation.enabled",
  "media.long_form_repurposing.enabled",
  "payments.checkout.enabled",
];

export default async function AdminFlagsPage() {
  const rows = await db.select().from(featureFlags).orderBy(featureFlags.key);
  const existingKeys = new Set(rows.map((r) => r.key));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold">Feature flags</h1>
      <p className="mt-1 text-sm text-slate-500">
        Turn a function on or off platform-wide without a redeploy.
      </p>

      <div className="mt-6 space-y-2">
        {rows.map((f) => {
          const isOn = f.value === true;
          return (
            <div
              key={f.key}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
            >
              <div>
                <div className="font-mono text-sm">{f.key}</div>
                <div className="text-xs text-slate-500">
                  Updated {f.updatedAt.toLocaleString()}
                </div>
              </div>
              <form action={toggleFlag}>
                <input type="hidden" name="key" value={f.key} />
                <input type="hidden" name="nextValue" value={(!isOn).toString()} />
                <button
                  type="submit"
                  className={
                    "relative h-7 w-12 rounded-full transition " +
                    (isOn ? "bg-emerald-500" : "bg-white/15")
                  }
                  aria-pressed={isOn}
                >
                  <span
                    className={
                      "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition " +
                      (isOn ? "left-6" : "left-1")
                    }
                  />
                </button>
              </form>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
            No flags yet — add one below.
          </div>
        )}
      </div>

      <form action={createFlag} className="mt-6 flex items-center gap-3">
        <input
          type="text"
          name="key"
          list="suggested-flags"
          placeholder="e.g. automations.enabled"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm outline-none focus:border-[color:var(--nx-blue,#2563eb)]"
        />
        <datalist id="suggested-flags">
          {SUGGESTED.filter((s) => !existingKeys.has(s)).map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button
          type="submit"
          className="rounded-lg bg-[color:var(--nx-blue,#2563eb)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Add flag
        </button>
      </form>
    </div>
  );
}
