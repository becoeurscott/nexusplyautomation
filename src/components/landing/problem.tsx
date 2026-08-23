import { Reveal } from "./reveal";
import { Section, Statements } from "./section";

const KNOW = [
  "You know you need to post.",
  "You know you need better content.",
  "You know you should be replying to customers.",
];

const TASKS = [
  "Planning what to publish",
  "Creating graphics",
  "Writing captions",
  "Finding ideas",
  "Scheduling posts",
  "Keeping every platform updated",
  "Checking analytics",
  "Responding to comments",
  "Following up with potential customers",
];

export function Problem() {
  return (
    <Section
      id="why"
      title="Stop spending your time managing social media."
      tone="glow"
    >
      <Statements lines={KNOW} />

      <Reveal className="mx-auto mt-10 max-w-2xl text-center">
        <p className="text-lg text-slate-400">
          But running a business already takes enough time.
        </p>
      </Reveal>

      <div className="mx-auto mt-10 grid max-w-4xl gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TASKS.map((task, i) => (
          <Reveal key={task} delay={Math.min(i * 0.04, 0.3)}>
            <div className="rounded-[12px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              {task}
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-10 max-w-2xl text-center">
        <p className="text-lg text-slate-400">It becomes a second job.</p>
        <p className="font-display mt-5 text-2xl font-bold text-white sm:text-3xl">
          NexusPly turns it into a system.
        </p>
      </Reveal>
    </Section>
  );
}
