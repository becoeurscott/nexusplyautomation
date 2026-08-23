/**
 * Media generation, behind a provider-agnostic interface.
 *
 * The product previously called one vendor's SDK directly from the tRPC
 * router, so dropping that vendor meant editing routers, the database enum,
 * the credit-price keys and the env schema. This layer exists so the next
 * change is a config change: routers depend on the capability, and the
 * provider is chosen here.
 *
 * Current providers:
 *   image  — OpenRouter, the same key and account used for every LLM call.
 *   video  — not wired yet; CloneViral is the intended source since it is
 *            already integrated for repurposing.
 *   voice  — not wired yet; OpenRouter does not serve speech.
 *
 * Every method returns the same shape regardless of provider, so callers
 * never branch on who served the request.
 */

import { AiError, aiConfigured, openRouterHeaders } from "@/lib/ai/router";

export type MediaKind = "image" | "video" | "audio";

export type GeneratedMedia = {
  /** Public URL of the finished asset, or null while a job is still running. */
  url: string | null;
  /** Provider-side job/asset id, kept for polling and support lookups. */
  ref: string | null;
  /** Which provider actually served this, recorded for cost attribution. */
  provider: string;
};

export type ImageRequest = {
  prompt: string;
  aspectRatio?: string;
  seed?: number;
  referenceImageUrl?: string;
};

export type VideoRequest = {
  prompt: string;
  aspectRatio?: string;
  durationSec?: number;
  imageUrl?: string;
};

export type VoiceRequest = {
  text: string;
  voice?: string;
  languageCode?: string;
};

export interface MediaProvider {
  readonly name: string;
  /** False when the provider's credentials are absent — callers surface a clear message. */
  isConfigured(): boolean;
  generateImage(req: ImageRequest): Promise<GeneratedMedia>;
  generateVideo(req: VideoRequest): Promise<GeneratedMedia>;
  generateVoice(req: VoiceRequest): Promise<GeneratedMedia>;
}

export class MediaNotConfiguredError extends Error {
  constructor(capability: string) {
    super(`No media provider is configured for ${capability}`);
    this.name = "MediaNotConfiguredError";
  }
}

/**
 * Placeholder provider used until an implementation is wired.
 *
 * It reports itself unconfigured rather than throwing at import time, so the
 * rest of the app boots and the UI can say "not available yet" instead of
 * crashing — the same reason startTrial() fails soft.
 */
const unconfigured: MediaProvider = {
  name: "none",
  isConfigured: () => false,
  async generateImage() {
    throw new MediaNotConfiguredError("image generation");
  },
  async generateVideo() {
    throw new MediaNotConfiguredError("video generation");
  },
  async generateVoice() {
    throw new MediaNotConfiguredError("voice generation");
  },
};

/**
 * Image generation over OpenRouter.
 *
 * OpenRouter returns images inline as base64 rather than as a hosted URL, so
 * this hands back a data URI. That keeps the provider contract honest — the
 * caller always gets something renderable — but it means large images travel
 * in the response body; move to object storage before this is used at volume.
 */
class OpenRouterImages implements MediaProvider {
  readonly name = "openrouter";

  isConfigured(): boolean {
    return aiConfigured();
  }

  async generateImage(req: ImageRequest): Promise<GeneratedMedia> {
    const base = process.env.OPENROUTER_API_BASE ?? "https://openrouter.ai/api/v1";
    const model = process.env.OPENROUTER_MODEL_IMAGE ?? "google/gemini-2.5-flash-image";

    const res = await fetch(`${base}/images`, {
      method: "POST",
      headers: openRouterHeaders(),
      body: JSON.stringify({
        model,
        prompt: req.prompt,
        ...(req.aspectRatio ? { aspect_ratio: req.aspectRatio } : {}),
      }),
    });

    if (!res.ok) {
      throw new AiError(res.status, await res.text().catch(() => ""));
    }

    const data = (await res.json()) as {
      data?: { b64_json?: string; media_type?: string }[];
    };
    const first = data.data?.[0];
    if (!first?.b64_json) return { url: null, ref: null, provider: this.name };

    return {
      url: `data:${first.media_type ?? "image/png"};base64,${first.b64_json}`,
      ref: null,
      provider: this.name,
    };
  }

  async generateVideo(): Promise<GeneratedMedia> {
    throw new MediaNotConfiguredError("video generation");
  }

  async generateVoice(): Promise<GeneratedMedia> {
    throw new MediaNotConfiguredError("voice generation");
  }
}

/** Swap providers here; nothing else in the codebase names a vendor. */
export function mediaProvider(): MediaProvider {
  const openRouter = new OpenRouterImages();
  return openRouter.isConfigured() ? openRouter : unconfigured;
}
