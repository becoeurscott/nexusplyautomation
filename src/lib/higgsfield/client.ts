/**
 * Typed HTTP client for the Higgsfield REST API.
 * Wraps every capability we expose to the app; adds new endpoints here rather
 * than sprinkling `fetch` calls across the codebase.
 *
 * Base URL and auth header format are configurable via env in case Higgsfield
 * moves them; defaults match their current MCP-adjacent REST surface.
 */

const BASE = process.env.HIGGSFIELD_API_BASE ?? "https://api.higgsfield.ai/v1";

export class HiggsfieldApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly body: unknown,
  ) {
    super(`Higgsfield ${status} on ${path}: ${JSON.stringify(body)}`);
    this.name = "HiggsfieldApiError";
  }
}

type RequestOptions = {
  apiKey: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T = unknown>(path: string, opts: RequestOptions): Promise<T> {
  const url = new URL(path.startsWith("/") ? path.slice(1) : path, BASE + "/");
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
    cache: "no-store",
  });
  const text = await res.text();
  const parsed = text ? safeJson(text) : null;
  if (!res.ok) throw new HiggsfieldApiError(res.status, path, parsed ?? text);
  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// -------- Domain-typed params (loose at v1) --------

type GenerateImageParams = {
  prompt: string;
  model?: string;
  aspectRatio?: string; // "16:9" | "1:1" | "9:16" | ...
  seed?: number;
  referenceImageUrl?: string;
  brandContext?: unknown;
};

type GenerateVideoParams = {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  durationSec?: number;
  imageUrl?: string;
  seed?: number;
};

type GenerateAudioParams = {
  text: string;
  voiceId?: string;
  model?: string;
  languageCode?: string;
};

// -------- Public API --------

export const higgsfield = (apiKey: string) => ({
  models: {
    explore: (query?: { modality?: "image" | "video" | "audio" | "3d" }) =>
      request("models/explore", { apiKey, query }),
    recommend: (body: { goal: string; modality: string; context?: unknown }) =>
      request("models/recommend", { apiKey, method: "POST", body }),
  },

  image: {
    generate: (body: GenerateImageParams) =>
      request("image/generate", { apiKey, method: "POST", body }),
    generateBatch: (body: { items: GenerateImageParams[] }) =>
      request("image/generate-batch", { apiKey, method: "POST", body }),
    upscale: (body: { imageUrl: string; target?: "2K" | "4K" }) =>
      request("image/upscale", { apiKey, method: "POST", body }),
    outpaint: (body: { imageUrl: string; direction?: string; scale?: number }) =>
      request("image/outpaint", { apiKey, method: "POST", body }),
    removeBackground: (body: { imageUrl: string }) =>
      request("image/remove-background", { apiKey, method: "POST", body }),
    reframe: (body: { imageUrl: string; aspectRatio: string }) =>
      request("image/reframe", { apiKey, method: "POST", body }),
  },

  video: {
    generate: (body: GenerateVideoParams) =>
      request("video/generate", { apiKey, method: "POST", body }),
    generateBatch: (body: { items: GenerateVideoParams[] }) =>
      request("video/generate-batch", { apiKey, method: "POST", body }),
    upscale: (body: { videoUrl: string; target?: "2K" | "4K" }) =>
      request("video/upscale", { apiKey, method: "POST", body }),
    reframe: (body: { videoUrl: string; aspectRatio: string }) =>
      request("video/reframe", { apiKey, method: "POST", body }),
    motionControl: (body: { videoUrl: string; controlKind: string; params?: unknown }) =>
      request("video/motion-control", { apiKey, method: "POST", body }),
  },

  audio: {
    generate: (body: GenerateAudioParams) =>
      request("audio/generate", { apiKey, method: "POST", body }),
    generateBatch: (body: { items: GenerateAudioParams[] }) =>
      request("audio/generate-batch", { apiKey, method: "POST", body }),
  },

  voices: {
    list: () => request("voices", { apiKey }),
    create: (body: { name: string; sampleUrls: string[]; description?: string }) =>
      request("voices", { apiKey, method: "POST", body }),
    createFromConfirmedAudio: (body: { audioUrl: string; name: string }) =>
      request("voices/from-confirmed-audio", { apiKey, method: "POST", body }),
  },

  dubbing: {
    create: (body: { videoUrl: string; targetLanguage: string; preserveVoice?: boolean }) =>
      request("dubbing", { apiKey, method: "POST", body }),
  },

  voiceChange: {
    apply: (body: { audioUrl: string; targetVoiceId: string }) =>
      request("voice-change", { apiKey, method: "POST", body }),
  },

  threeD: {
    generate: (body: { imageUrl: string }) =>
      request("3d/generate", { apiKey, method: "POST", body }),
  },

  jobs: {
    get: (id: string) => request(`jobs/${id}`, { apiKey }),
    wait: (id: string, opts?: { timeoutMs?: number }) =>
      request(`jobs/${id}/wait`, { apiKey, query: opts }),
  },

  balance: () => request("billing/balance", { apiKey }),
});

export type HiggsfieldClient = ReturnType<typeof higgsfield>;
