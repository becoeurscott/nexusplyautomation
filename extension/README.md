# NexusPly browser extension

Scores a caption and suggests hashtags while you're on TikTok or YouTube Studio,
using the same scoring engine as the web app (`src/lib/scoring` in the main app —
one implementation, two entry points).

## Install locally

1. Open `chrome://extensions`, turn on **Developer mode**.
2. **Load unpacked** → select this `extension/` folder.
3. Click the NexusPly icon, paste a token from
   [Settings](https://nexusplyautomation.com/app/settings), press **Connect**.
4. Visit tiktok.com or studio.youtube.com — a **NexusPly** button appears
   bottom-right.

## How it's put together

- `src/background/worker.js` — the only code that talks to the API. Content
  scripts proxy through it because a host page's CSP can block their fetches,
  and because the token should never be reachable from page context.
- `src/content/overlay.js` — the panel, rendered in a shadow root so the host
  page's CSS can't restyle it and ours can't leak out.
- `src/popup/` — token entry. Verifies against `/balance` before saving.

## Why it doesn't read the caption off the page

Both sites change their markup without warning. A scraper tied to their class
names is broken code with a delayed fuse: it keeps appearing to work, then
starts scoring the wrong text silently. The panel has its own textarea instead.
Auto-reading can be added per-platform later, once a given selector is stable
enough to be worth maintaining.

## Not done yet

- Icons (`icons/`) — the manifest currently declares none, so Chrome uses a
  default placeholder.
- Store submission. Chrome Web Store review for a content-script extension that
  reads third-party pages typically takes days to weeks and can bounce on
  permissions justification. Firefox AMO is a separate submission.
