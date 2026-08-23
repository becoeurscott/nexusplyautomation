import { Reveal } from "./reveal";
import { Section, Tile } from "./section";

const PLATFORMS = [
  {
    title: "Instagram",
    body: "Visual content, reels, stories and promotional posts.",
  },
  {
    title: "Facebook",
    body: "Business updates, offers, community content and announcements.",
  },
  { title: "TikTok", body: "Short-form content designed for attention and discovery." },
  {
    title: "LinkedIn",
    body: "Professional content, thought leadership and business updates.",
  },
  { title: "YouTube", body: "Video-focused content and audience development." },
  { title: "X", body: "Short-form updates, conversations and brand visibility." },
  { title: "Threads", body: "Conversation-driven content and community engagement." },
  { title: "Pinterest", body: "Visual discovery and evergreen content." },
  {
    title: "Google Business",
    body: "Keep your local business presence active with regular updates.",
  },
];

export function Platforms() {
  return (
    <Section
      id="platforms"
      title="Everywhere your customers are."
      sub="NexusPly is designed to manage a multi-platform social presence from one workflow."
      tone="glow"
    >
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((p, i) => (
          <Tile key={p.title} title={p.title} body={p.body} index={i} />
        ))}
      </div>

      <Reveal className="mx-auto mt-10 max-w-2xl text-center">
        <p className="text-slate-400">
          And additional channels can be added as your business grows.
        </p>
        <p className="mt-3 text-xs italic text-slate-500">
          Available features vary by social platform and account type.
        </p>
      </Reveal>
    </Section>
  );
}
