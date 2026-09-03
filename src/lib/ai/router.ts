/**
 * Every LLM call in the product goes through OpenRouter — one key, one
 * account, one invoice. No provider SDKs are used directly.
 *
 * Tasks stay typed and are mapped to a model tier rather than to a vendor, so
 * changing which model serves a task is an env change and callers never learn
 * who answered. Slugs are verified against OpenRouter's model list; pick any
 * other from https://openrouter.ai/models and set the env var.
 *
 * OpenRouter is OpenAI-compatible, so this is a plain fetch — it deliberately
 * avoids adding an SDK dependency for what is one POST.
 */

const BASE = process.env.OPENROUTER_API_BASE ?? "https://openrouter.ai/api/v1";

/** Reasoning-heavy work: calendars, scripts, anything customer-facing and long. */
const MODEL_SMART = process.env.OPENROUTER_MODEL_SMART ?? "anthropic/claude-sonnet-5";
/** High-volume, low-difficulty work: polish, translation, summarising. */
const MODEL_FAST = process.env.OPENROUTER_MODEL_FAST ?? "google/gemini-2.5-flash";

type Tier = "smart" | "fast";

export type AiTask =
  | "script.generate"
  | "calendar.month.generate"
  | "reply.draft"
  | "caption.generate"
  | "caption.polish"
  | "translate"
  | "summarize"
  | "content.score"
  | "hashtags.generate"
  | "idea.generate"
  | "post.long_form"
  | "carousel.copy";

const TASK_TIER: Record<AiTask, Tier> = {
  "script.generate": "smart",
  "calendar.month.generate": "smart",
  "reply.draft": "smart",
  "caption.generate": "smart",
  "caption.polish": "fast",
  translate: "fast",
  summarize: "fast",
  // Both are clicked repeatedly while someone iterates on a draft, so they run
  // on the cheap tier — a score you hesitate to re-run is a score nobody uses.
  "content.score": "fast",
  "hashtags.generate": "fast",
  // Writing helpers. Fast tier deliberately: these are drafting aids someone
  // regenerates until it reads right, so latency and cost matter more than the
  // last few points of quality. `caption.generate` stays on smart because it's
  // the one whose output is most often published close to as-written.
  "idea.generate": "fast",
  "post.long_form": "fast",
  "carousel.copy": "fast",
};

export class AiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`OpenRouter ${status}`);
    this.name = "AiError";
  }
}

export type ChatInput = {
  task: AiTask;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  /** Overrides the tier's model for this call only. */
  model?: string;
  /**
   * Ask the model for a JSON object rather than prose. Callers that parse the
   * reply should set this AND still parse defensively — this raises the odds
   * of valid JSON, it does not guarantee it, and not every model on the other
   * side of OpenRouter honours the hint.
   */
  json?: boolean;
};

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

/**
 * Attribution headers OpenRouter uses to identify the calling app. Harmless
 * if the site URL isn't set, so they're built defensively.
 */
export function openRouterHeaders(): Record<string, string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  const site = process.env.NEXT_PUBLIC_APP_URL;
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...(site ? { "HTTP-Referer": site } : {}),
    "X-Title": "NexusPly",
  };
}

export async function chat(input: ChatInput): Promise<string> {
  const model =
    input.model ?? (TASK_TIER[input.task] === "smart" ? MODEL_SMART : MODEL_FAST);

  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: openRouterHeaders(),
    body: JSON.stringify({
      model,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 2_000,
      ...(input.json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });

  if (!res.ok) {
    throw new AiError(res.status, await res.text().catch(() => ""));
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}
