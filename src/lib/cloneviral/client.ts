/**
 * Typed HTTP client for the CloneViral REST API.
 * CloneViral turns long-form videos into vertical shorts, analyzes videos for
 * high-virality clips, generates images/videos, and translates.
 */

const BASE = process.env.CLONEVIRAL_API_BASE ?? "https://api.cloneviral.com/v1";

export class CloneViralApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly body: unknown,
  ) {
    super(`CloneViral ${status} on ${path}: ${JSON.stringify(body)}`);
    this.name = "CloneViralApiError";
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
  if (!res.ok) throw new CloneViralApiError(res.status, path, parsed ?? text);
  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// -------- Public API --------

export const cloneviral = (apiKey: string) => ({
  credits: () => request("credits", { apiKey }),
  characters: () => request("characters", { apiKey }),

  videos: {
    list: (query?: { limit?: number; cursor?: string }) =>
      request("videos", { apiKey, query }),
    analyze: (body: { videoUrl: string; goal?: string }) =>
      request("videos/analyze", { apiKey, method: "POST", body }),
    buildRemixVariants: (body: { videoUrl: string; variants?: number }) =>
      request("videos/build-remix-variants", { apiKey, method: "POST", body }),
    translate: (body: { videoUrl: string; targetLanguage: string }) =>
      request("videos/translate", { apiKey, method: "POST", body }),
  },

  image: {
    generate: (body: { prompt: string; aspectRatio?: string; seed?: number }) =>
      request("image/generate", { apiKey, method: "POST", body }),
  },

  video: {
    generate: (body: {
      prompt: string;
      imageUrl?: string;
      aspectRatio?: string;
      durationSec?: number;
    }) => request("video/generate", { apiKey, method: "POST", body }),
  },

  jobs: {
    checkStatus: (id: string) => request(`jobs/${id}`, { apiKey }),
  },
});

export type CloneViralClient = ReturnType<typeof cloneviral>;
