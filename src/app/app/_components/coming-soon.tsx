export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <div className="text-lg font-semibold text-slate-800">Coming in {phase}</div>
        <p className="mt-2 text-sm text-slate-500">
          The service layer already covers these endpoints — the UI ships next.
        </p>
      </div>
    </div>
  );
}
