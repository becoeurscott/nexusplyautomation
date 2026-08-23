/**
 * Media generation, behind a provider-agnostic interface.
 *
 * The product previously called one vendor's SDK directly from the tRPC
 * router, so dropping that vendor meant editing routers, the database enum,
 * the credit-price keys and the env schema. This layer exists so the next
 * change is a config change: routers depend on the capability, and the
 * provider is chosen here.
 *
 * Current providers (see MEDIA_PROVIDERS below for how to change them):
 *   image  — Google Imagen. Imagen 4 Fast is ~$0.02/image and GOOGLE_API_KEY
 *            is already provisioned, so it adds no new vendor relationship.
 *   video  — CloneViral, already integrated for repurposing.
 *   voice  — Google Cloud TTS at ~$4 per million characters, the cheapest
 *            credible option; a 150-word voiceover costs well under a cent.
 *
 * Every method returns the same shape regardless of provider, so callers
 * never branch on who served the request.
 */

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

/** Swap providers here; nothing else in the codebase names a vendor. */
export function mediaProvider(): MediaProvider {
  return unconfigured;
}
