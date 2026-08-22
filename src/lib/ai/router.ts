/**
 * Multi-model AI router.
 * - Route hard tasks (calendars, scripts) → Anthropic Claude.
 * - Route cheap tasks (caption polish, translation, summarization) → Gemini Flash.
 * - Every call is task-typed so we can swap providers per task without touching callers.
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

type Provider = "claude" | "gemini";

export type AiTask =
  | "script.generate"
  | "calendar.month.generate"
  | "reply.draft"
  | "caption.generate"
  | "caption.polish"
  | "translate"
  | "summarize";

const TASK_PROVIDER: Record<AiTask, Provider> = {
  "script.generate": "claude",
  "calendar.month.generate": "claude",
  "reply.draft": "claude",
  "caption.generate": "claude",
  "caption.polish": "gemini",
  translate: "gemini",
  summarize: "gemini",
};

const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-5";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

let claude: Anthropic | null = null;
let gemini: GoogleGenAI | null = null;

function getClaude(): Anthropic {
  if (!claude) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    claude = new Anthropic({ apiKey });
  }
  return claude;
}

function getGemini(): GoogleGenAI {
  if (!gemini) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");
    gemini = new GoogleGenAI({ apiKey });
  }
  return gemini;
}

export type ChatInput = {
  task: AiTask;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
};

export async function chat(input: ChatInput): Promise<string> {
  const provider = TASK_PROVIDER[input.task];
  if (provider === "claude") {
    const c = getClaude();
    const res = await c.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: input.maxTokens ?? 2_000,
      temperature: input.temperature ?? 0.7,
      system: input.system,
      messages: [{ role: "user", content: input.user }],
    });
    return res.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .filter(Boolean)
      .join("\n");
  }
  const g = getGemini();
  const res = await g.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { role: "user", parts: [{ text: `${input.system}\n\n${input.user}` }] },
    ],
    config: {
      temperature: input.temperature ?? 0.7,
      maxOutputTokens: input.maxTokens ?? 2_000,
    },
  });
  return res.text ?? "";
}
