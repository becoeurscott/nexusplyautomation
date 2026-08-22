/**
 * Renders a platform as a name people recognise.
 *
 * The upstream value is a lowercase slug, and it can be missing — which used
 * to render as the literal word "UNKNOWN" next to someone's account. Anything
 * we don't recognise now falls back to neutral wording instead.
 */
const LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X",
  twitter: "X",
  threads: "Threads",
  pinterest: "Pinterest",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
};

export function platformLabel(platform?: string | null): string {
  if (!platform) return "Social account";
  return LABELS[platform.toLowerCase()] ?? "Social account";
}

export function PlatformBadge({ platform }: { platform?: string | null }) {
  return (
    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
      {platformLabel(platform)}
    </span>
  );
}
