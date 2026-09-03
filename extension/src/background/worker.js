/**
 * Service worker — the only place that talks to NexusPly.
 *
 * Content scripts run inside tiktok.com / studio.youtube.com pages, where the
 * page's own Content-Security-Policy can block outbound fetches. The worker has
 * no such restriction, so every network call is proxied through here via
 * message passing. It also keeps the token out of the page context entirely,
 * where a hostile or compromised page script could read it.
 *
 * MV3 service workers are not persistent — they spin down when idle — so
 * nothing is cached in module scope. The token is read from chrome.storage on
 * each request.
 */

const API_BASE = "https://nexusplyautomation.com/api/ext/v1";

async function getToken() {
  const { token } = await chrome.storage.local.get("token");
  return typeof token === "string" && token ? token : null;
}

async function call(path, { method = "GET", body } = {}) {
  const token = await getToken();
  if (!token) return { ok: false, error: "Not connected. Add your token in the NexusPly extension." };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, error: "Couldn't reach NexusPly. Check your connection." };
  }

  if (res.status === 401) {
    return { ok: false, error: "That token isn't valid any more. Create a new one in Settings." };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "NexusPly sent something we couldn't read." };
  }

  if (!res.ok) return { ok: false, error: data?.error ?? "Something went wrong." };
  return data;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg?.type) {
      case "score":
        sendResponse(await call("/score", { method: "POST", body: { content: msg.content } }));
        break;
      case "hashtags":
        sendResponse(await call("/hashtags", { method: "POST", body: { content: msg.content } }));
        break;
      case "balance":
        sendResponse(await call("/balance"));
        break;
      default:
        sendResponse({ ok: false, error: "Unknown request." });
    }
  })();
  // Returning true keeps the message channel open for the async reply above —
  // without it Chrome closes it and sendResponse silently does nothing.
  return true;
});
