# Nexusply — Product Requirements Document

## One-line pitch
An AI-native, credit-metered social-media command center for African creators, schools, and SMBs — one place to plan, generate, publish, listen, and learn, priced in local currency and paid via mobile money.

## Why this exists
The African creator and SMB market is served today by tools built for US pricing (Buffer, Hootsuite, Publer) and paid in dollars via credit cards. Meanwhile, the workflow those tools address is fragmenting: creators paste between ChatGPT for scripts, Canva for visuals, CapCut for edits, Later for scheduling, and native inboxes for replies. Nexusply consolidates that stack around three third-party engines we already have MCP access to (Zernio for social ops, Higgsfield for media generation, CloneViral for long-form-to-clip), adds the pieces those engines don't cover (brand memory, AI calendar, script generation in the user's voice, trend + competitor research), and prices the whole thing in KES / NGN / XOF / USD with M-Pesa, MTN MoMo, Orange, and Flutterwave rails.

## Target users
1. **Independent African creators** growing on TikTok / IG / YouTube. Solo, price-sensitive, phone-first.
2. **African schools & training institutes** running an admissions / community presence across Facebook + WhatsApp + IG. Small marketing team, low budget, needs simplicity.
3. **African SMBs** (fintech, e-commerce, coaching) wanting one dashboard and a light automation layer.
4. **Small agencies** (< 10 clients) that want white-label reporting and per-client credit ceilings.

## Non-goals for v1
- Enterprise plans, SOC 2, SAML SSO.
- Full-blown video editor. (CloneViral does the cutting, Higgsfield does the generation — we orchestrate.)
- Owning the OAuth connections to social platforms. (Zernio owns that. We wrap.)
- Global tax handling. (v1 = African corridors + a global USD fallback.)

## What the product does (feature list)

### Publishing (Zernio wraps)
- Connect accounts, create/edit/delete/schedule posts, cross-post, bulk-upload, retry, publish-now, unpublish.
- Recurring queue slots per account, weekly calendar, drag-to-reschedule.
- Media upload flow: pick from Higgsfield-generated library or upload direct.

### Listen & respond (Zernio wraps)
- Unified inbox of comments and mentions.
- Reply in-app; templated quick-replies.
- Later: mobile push notifications on new activity (Phase M).

### Measure (Zernio wraps)
- Per-account and per-post analytics.
- Best-time-to-post recommendations.
- Follower growth.
- Tracking-tag campaign roll-ups.

### Generate media (Higgsfield wraps)
- Image generation, batch generation, upscaling, background removal, reframing, outpainting.
- Video generation, motion control, reframing.
- Voiceover generation, voice cloning (opt-in), dubbing.
- Character reference sheets for consistent brand characters.

### Repurpose long-form (CloneViral wraps)
- Paste a long YouTube video URL → get vertical shorts with captions.
- AI-analyze a video and suggest the highest-virality clips.
- Translate a video into another language.

### Only we can build (the moat)
- **Brand context store** — the user's tone, audience, niche, colors, do/don't list, past-post embeddings — injected into every generation prompt so the AI outputs actually sound like them.
- **AI calendar generator** — takes brand context + goals, returns a month of ready-to-post ideas mapped onto the queue.
- **Script generator in the user's voice** — uses their skill library (prompt templates) plus their historical top-performing posts as few-shot examples.
- **Trend + competitor research** — periodically pulls what's trending on TikTok/IG/YouTube per niche and what named competitors have posted in the last N days. Weakest at Postana too — a real opportunity.
- **Automations** — trigger/action rules ("when a new comment matches keyword X, draft a reply from template Y and queue it for review"). Fixed catalog of ~6 triggers × ~6 actions in v1.
- **Credit metering + African billing** — every action has a credit cost, plans include monthly credits, top-ups top up the ledger, all payments via M-Pesa / MoMo / Orange / Flutterwave.
- **UI** — the whole thing, styled to the Nexus template (deep navy + cobalt blue + Inter Tight) and the light-blue rounded-card dashboard reference.

## Success metrics (first 6 months post-launch)
- 500 signed-up accounts.
- 100 paying orgs (any tier above Starter).
- Median org burns 50%+ of its monthly credit allowance (proves the meter is calibrated).
- < 5% weekly churn on paying orgs from month 3.
- 3× more posts published per org than at signup (proves the workflow is faster than what they had).

## Competitor SWOT — Postana (our closest analog)
Postana is a small AI-native all-in-one that we compete with directly.

**Strengths** — consolidates planning / scripting / visuals / scheduling / trends into one tool; brand-context AI agent; platform-specific scripts; built-in trend scraping; early Product Hunt / PeerPush validation.

**Weaknesses** — ~109 brands only, unproven at scale; small-shop feel (Starterlyst Labs LLC), likely slow support; AI output typically needs editing for real brand voice; no deep analytics/ROI; scraping-based competitor research is ToS-fragile.

**Opportunities** — creator/SMB tool consolidation trend; affiliate program lever; expand to YouTube Shorts / Pinterest / X; agency features (multi-client, white-label); their /vs. pages show clear switcher-capture SEO play.

**Threats** — crowded market vs. Hootsuite/Buffer/Later + Jasper/Blaze; platform API changes break scraping; AI content commoditizes; content-tool retention is fragile once novelty wears.

**How Nexusply beats them** — same feature surface plus (a) **credit metering**, (b) **local African currency + mobile-money billing**, (c) **three real production engines (Zernio + Higgsfield + CloneViral)** doing the heavy lifting instead of thin API wrappers, (d) **UI polish matching Nexus/Framer template quality** rather than a founder-built look.

## Capability matrix (who does what)
| Function | Owner |
|---|---|
| Connect accounts, schedule, cross-post, queue | **Zernio MCP** (integrated) |
| Analytics, best time to post, inbox comments/mentions | **Zernio MCP** (integrated) |
| Images, videos, voiceover, dubbing | **Higgsfield MCP** (integrated) |
| Video clips from long-form | **CloneViral MCP** (integrated) |
| Brand context store | **Nexusply** (build) |
| AI calendar generator | **Nexusply** (build — Claude API) |
| Script generation in the user's voice | **Nexusply** (build — existing skill library = the prompt substrate) |
| Trend + competitor research | **Nexusply** (build — this is the weakest slot at every competitor including Postana; owning it is the differentiator) |
| UI (web + admin + mobile) | **Nexusply** (build) |

## Business model
Subscription with monthly credits + pay-as-you-go top-ups. See ARCHITECTURE.md → *Credit ledger* and the Pricing section of the plan.

## Regulatory / trust posture
- Data residency: v1 = EU (Neon EU region) or Africa (once Neon adds it). Not US.
- Right to delete: hard-delete org + cascade purge within 30 days on request.
- Payment PCI: we never touch card PAN — Flutterwave / Paystack / IntaSend hosted checkout.
- Zernio API keys, payment provider secrets, and social account tokens all AES-256-GCM at rest.
