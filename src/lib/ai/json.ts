/**
 * Pulling a JSON object out of a model reply.
 *
 * `chat({json: true})` asks OpenRouter for a JSON object, but that is a hint,
 * not a contract — not every model behind the gateway honours it, and the ones
 * that mostly do still occasionally wrap the object in a markdown fence or a
 * leading "Sure, here's the analysis:". Callers spend a credit before they see
 * the reply, so a parse failure has to degrade to a message rather than throw.
 *
 * Lives here rather than inside one server action because every JSON-shaped AI
 * feature needs exactly this, and a second copy would drift from the first.
 */
export function parseJsonReply(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidates = [trimmed];

  // ```json ... ``` or a bare ``` ... ``` fence.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  // The widest {...} span, for replies with prose on either side.
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(trimmed.slice(first, last + 1));

  for (const c of candidates) {
    try {
      const parsed: unknown = JSON.parse(c);
      // A bare string or number is valid JSON but never what a caller wants —
      // treating it as success would push the failure downstream.
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      /* try the next shape */
    }
  }
  return null;
}

/** Clamp anything the model returns into a sane 0-100 integer. */
export function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

/** Keep only real strings, trimmed and capped — models pad lists when unsure. */
export function asStringArray(v: unknown, limit: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, limit);
}
