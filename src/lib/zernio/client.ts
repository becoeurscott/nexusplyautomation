/**
 * Typed HTTP client for the Zernio REST API.
 *
 * All methods take a workspace-scoped API key and return typed responses.
 * Errors surface as `ZernioApiError` with the upstream status + body.
 */

const BASE = process.env.ZERNIO_API_BASE ?? "https://zernio.com/api/v1";

export class ZernioApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly body: unknown,
  ) {
    super(`Zernio ${status} on ${path}: ${JSON.stringify(body)}`);
    this.name = "ZernioApiError";
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

  if (!res.ok) {
    throw new ZernioApiError(res.status, path, parsed ?? text);
  }
  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ------------------------------------------------------------------
// Public API — one namespaced method per Zernio tool group.
// Types are intentionally loose (unknown) at v1 — tighten per-endpoint
// as we build UIs on top.
// ------------------------------------------------------------------

export const zernio = (apiKey: string) => ({
  // Profiles
  profiles: {
    list: () => request("profiles", { apiKey }),
    get: (id: string) => request(`profiles/${id}`, { apiKey }),
    create: (body: unknown) => request("profiles", { apiKey, method: "POST", body }),
    update: (id: string, body: unknown) =>
      request(`profiles/${id}`, { apiKey, method: "PATCH", body }),
    remove: (id: string) => request(`profiles/${id}`, { apiKey, method: "DELETE" }),
  },

  // Accounts
  accounts: {
    list: (query?: { profileId?: string }) => request("accounts", { apiKey, query }),
    get: (id: string) => request(`accounts/${id}`, { apiKey }),
    followerStats: (id: string) => request(`accounts/${id}/follower-stats`, { apiKey }),
    health: (id: string) => request(`accounts/${id}/health`, { apiKey }),
    allHealth: () => request("accounts/health", { apiKey }),
    move: (id: string, profileId: string) =>
      request(`accounts/${id}/move`, {
        apiKey,
        method: "POST",
        body: { profileId },
      }),
  },

  accountGroups: {
    list: () => request("account-groups", { apiKey }),
  },

  // Posts
  posts: {
    list: (query?: {
      status?: string;
      profileId?: string;
      accountId?: string;
      limit?: number;
      cursor?: string;
    }) => request("posts", { apiKey, query }),
    get: (id: string) => request(`posts/${id}`, { apiKey }),
    create: (body: unknown) => request("posts", { apiKey, method: "POST", body }),
    update: (id: string, body: unknown) =>
      request(`posts/${id}`, { apiKey, method: "PATCH", body }),
    edit: (id: string, body: unknown) =>
      request(`posts/${id}/edit`, { apiKey, method: "POST", body }),
    remove: (id: string) => request(`posts/${id}`, { apiKey, method: "DELETE" }),
    publishNow: (id: string) =>
      request(`posts/${id}/publish-now`, { apiKey, method: "POST" }),
    unpublish: (id: string) =>
      request(`posts/${id}/unpublish`, { apiKey, method: "POST" }),
    retry: (id: string) => request(`posts/${id}/retry`, { apiKey, method: "POST" }),
    retryAllFailed: () => request("posts/retry-all-failed", { apiKey, method: "POST" }),
    listFailed: () => request("posts/failed", { apiKey }),
    crossPost: (body: unknown) =>
      request("posts/cross-post", { apiKey, method: "POST", body }),
    bulkUpload: (body: unknown) =>
      request("posts/bulk-upload", { apiKey, method: "POST", body }),
  },

  // Media
  media: {
    getUploadUrl: (body: { filename: string; contentType: string }) =>
      request("media/upload-url", { apiKey, method: "POST", body }),
    uploadStatus: (id: string) => request(`media/${id}/status`, { apiKey }),
    validate: (body: unknown) => request("media/validate", { apiKey, method: "POST", body }),
  },

  // Queue
  queue: {
    listSlots: (query?: { accountId?: string }) =>
      request("queue/slots", { apiKey, query }),
    createSlot: (body: unknown) =>
      request("queue/slots", { apiKey, method: "POST", body }),
    updateSlot: (id: string, body: unknown) =>
      request(`queue/slots/${id}`, { apiKey, method: "PATCH", body }),
    deleteSlot: (id: string) =>
      request(`queue/slots/${id}`, { apiKey, method: "DELETE" }),
    nextSlot: (query?: { accountId?: string }) =>
      request("queue/next-slot", { apiKey, query }),
    preview: (query?: { accountId?: string; weeks?: number }) =>
      request("queue/preview", { apiKey, query }),
  },

  // Analytics
  analytics: {
    overview: (query?: { profileId?: string; from?: string; to?: string }) =>
      request("analytics", { apiKey, query }),
    daily: (query?: { accountId?: string; from?: string; to?: string }) =>
      request("analytics/daily", { apiKey, query }),
    bestTimeToPost: (query: { accountId: string }) =>
      request("analytics/best-time-to-post", { apiKey, query }),
    postTimeline: (postId: string) =>
      request(`analytics/posts/${postId}/timeline`, { apiKey }),
  },

  trackingTags: {
    list: () => request("tracking-tags", { apiKey }),
    stats: (id: string) => request(`tracking-tags/${id}/stats`, { apiKey }),
  },

  // Inbox
  inbox: {
    listComments: (query?: { accountId?: string; cursor?: string }) =>
      request("inbox/comments", { apiKey, query }),
    postComments: (postId: string) => request(`inbox/posts/${postId}/comments`, { apiKey }),
    replyToPost: (postId: string, body: { text: string; parentId?: string }) =>
      request(`inbox/posts/${postId}/reply`, { apiKey, method: "POST", body }),
    listMentions: (query?: { accountId?: string; cursor?: string }) =>
      request("inbox/mentions", { apiKey, query }),
    replyToMention: (mentionId: string, body: { text: string }) =>
      request(`inbox/mentions/${mentionId}/reply`, {
        apiKey,
        method: "POST",
        body,
      }),
  },

  // Usage / validation
  usage: () => request("usage", { apiKey }),
  validate: {
    post: (body: unknown) => request("validate/post", { apiKey, method: "POST", body }),
    postLength: (body: { text: string; platform: string }) =>
      request("validate/post-length", { apiKey, method: "POST", body }),
  },
});

export type ZernioClient = ReturnType<typeof zernio>;
