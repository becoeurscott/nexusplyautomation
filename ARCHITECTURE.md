# Nexusply — Architecture

## System shape (target)

Monorepo (`nexusply/`) with pnpm workspaces + Turborepo. Existing `zernio-app/` migrates into `apps/web/` on the next restructure pass — nothing in this doc assumes it has moved yet, but every path is written to still make sense after it does.

```
nexusply/
├─ apps/
│  ├─ web/        # Next.js — end-user SaaS + landing page
│  ├─ admin/      # Next.js — super-admin dashboard (separate app, separate deploy)
│  └─ mobile/     # Expo (Phase M)
├─ packages/
│  ├─ db/         # Drizzle schema + client
│  ├─ auth/       # Better-Auth (email/password + Google + mobile bearer)
│  ├─ zernio/     # Typed Zernio REST wrapper (already built in Phase 1)
│  ├─ higgsfield/ # Typed Higgsfield MCP-adjacent wrapper (media generation)
│  ├─ cloneviral/ # Typed CloneViral wrapper (long-form → shorts)
│  ├─ credits/    # Credit ledger + `withCredits(cost, fn)` helper + prices
│  ├─ payments/   # Flutterwave / Paystack / IntaSend / MTN MoMo / Orange adapters
│  ├─ jobs/       # BullMQ queues + workers
│  ├─ automations/# Trigger/action rule engine
│  ├─ ai/         # Claude API client + prompt library + brand-context injection
│  ├─ trends/     # Trend + competitor research
│  └─ shared/     # zod schemas, error types, constants, i18n
└─ infra/
   ├─ docker-compose.yml   # local Postgres + Redis
   └─ migrations/          # Drizzle output
```

## Runtime topology

- **Web (`apps/web`)** — Next.js 16 App Router. Server components + Server Actions for internal use, tRPC router at `apps/web/src/server/router.ts` for anything mobile will also call.
- **Admin (`apps/admin`)** — separate Next.js app, own domain (`admin.nexusply.com`), gated by `admin_users` allowlist + Better-Auth session.
- **Workers** — Node processes running `packages/jobs`. Deployable to Fly.io machines or a Railway worker service; must sit next to Postgres + Redis to avoid latency.
- **Postgres** — Neon (EU region v1). Primary store for everything.
- **Redis** — Upstash. Backs BullMQ queues + Upstash rate-limit.
- **Object storage** — Cloudflare R2 for user-uploaded media awaiting Zernio publish; used only as a staging bucket, purged 7 days after publish.
- **Secrets** — Vercel env for build-time, Doppler or 1Password Connect for runtime rotation.

## Data model (Postgres, Drizzle)

Below is the full schema. Tables from Phase 1 that stay unchanged are marked *(existing)*; everything else is new for the SaaS.

### Auth core *(existing — Better-Auth)*
- `users(id, email, email_verified, name, image, created_at, updated_at)`
- `sessions(id, user_id, token, expires_at, ip_address, user_agent, created_at, updated_at)`
- `accounts(id, user_id, account_id, provider_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)`
- `verifications(id, identifier, value, expires_at, created_at, updated_at)`

### Multi-tenancy
- `organizations(id, name, slug, owner_id, country, currency, timezone, plan_id, credit_balance_cached, deleted_at, created_at)` — supersedes today's `workspaces`. `credit_balance_cached` is a denormalized snapshot of `sum(credit_ledger.delta)` refreshed on every ledger insert. Source of truth is always the ledger.
- `organization_members(org_id, user_id, role in {owner,admin,member,viewer}, created_at)`

### Credentials (per-org, encrypted)
- `zernio_credentials(org_id, ciphertext, iv, tag, key_preview, added_by_id, added_at)` *(existing shape)*
- `higgsfield_credentials(...)` — same shape.
- `cloneviral_credentials(...)` — same shape.

### Brand context (the moat)
- `brand_profiles(id, org_id, name, niche, audience, tone_words[], forbidden_words[], colors jsonb, voice_notes text, top_hashtags[], created_at)` — one org can have several (e.g. an agency serving multiple clients).
- `brand_examples(id, brand_profile_id, kind in {top_post,brand_ref,manual_snippet}, content text, embedding vector(1536), source_platform, source_url, created_at)` — the few-shot examples the AI reads before generating. Requires `pgvector`.

### Publishing / content
- `posts_cache(id, org_id, zernio_post_id, status, platform, scheduled_at, published_at, content, media_urls jsonb, updated_at)` — local mirror of Zernio's post rows so pages render without a round-trip. Refreshed by `analytics.poll` and webhook.
- `media_assets(id, org_id, kind in {image,video,audio}, url, source in {upload,higgsfield,cloneviral}, source_ref, meta jsonb, created_at)` — everything the user has generated or uploaded, browsable in a picker.
- `drafts(id, org_id, author_id, title, payload jsonb, created_at, updated_at)` *(existing)*.

### Credit system
- `plans(id, code, name, monthly_price_local numeric, currency, included_credits int, per_channel_cap int, features jsonb, sort_order, active)` — hot-editable in admin.
- `subscriptions(id, org_id, plan_id, provider, provider_sub_ref, status in {trialing,active,past_due,canceled}, current_period_end, cancel_at, created_at)`.
- `credit_prices(action_key, credits, description, updated_at)` — e.g. `post.create=1, ai.caption.generate=3, ai.calendar.month.generate=15, video.render=25, higgsfield.image.generate=2`.
- `credit_ledger(id, org_id, delta int, reason in {plan_refill,top_up,action_debit,admin_adjust,refund,promo}, ref_type, ref_id, balance_after int, actor_user_id, created_at)` — append-only; `balance_after` is the invariant we lean on for audits.
- `top_up_products(id, credits, price_local numeric, currency, active)`.

### Automations
- `automations(id, org_id, name, trigger jsonb, actions jsonb[], enabled, created_by, created_at, updated_at)` — trigger and actions are constrained to the fixed catalog in `packages/automations/triggers.ts` / `actions.ts`.
- `automation_runs(id, automation_id, triggered_by jsonb, status in {pending,ok,error,skipped}, log jsonb, created_at)`.

### Trends + competitors
- `trend_watchlists(id, org_id, platform, niche, keywords[], competitor_handles[], enabled, created_at)`.
- `trend_snapshots(id, watchlist_id, captured_at, top_posts jsonb, top_hashtags jsonb, top_sounds jsonb, competitor_posts jsonb)` — polled daily, ~7-day rolling window kept.

### Payments (mirror of provider truth)
- `payment_customers(org_id, provider, provider_customer_ref, created_at)`.
- `payment_intents(id, org_id, provider, provider_ref, amount numeric, currency, kind in {subscription,top_up}, status, metadata jsonb, created_at)`.
- `payouts_webhook_events(id, provider, event_id unique, payload jsonb, processed_at)` — idempotency shield.

### Admin / ops
- `admin_users(user_id primary key, role in {superadmin,support,readonly}, created_at)`.
- `feature_flags(key primary key, value jsonb, targeting jsonb, updated_at)`.
- `audit_events(id, org_id, actor_user_id, action, entity_type, entity_id, payload jsonb, result in {ok,error}, error_message, ip, ua, created_at, index (org_id, created_at))` — expanded version of Phase-1 `activity_log`, covers admin actions too.
- `webhook_events_in(id, source in {zernio,flutterwave,paystack,intasend,mtn_momo,orange}, event_id unique, payload jsonb, processed_at, error text)` — same idempotency shield for inbound webhooks.

### API keys (for programmatic access — Agency plan)
- `api_tokens(id, org_id, token_hash, name, scopes text[], last_used_at, expires_at, created_at, revoked_at)`.

## Request flow — a post is scheduled

```
User in browser  ─(HTTPS)─▶  apps/web (Next.js)
    └─ trpc.post.create({content, accountIds, scheduledAt})
        └─ requireOrg() ──▶ Postgres (session + membership check)
        └─ withCredits('post.create', 1, tx ─▶
             1. credit_ledger.insert(-1, reason='action_debit')
             2. organizations.credit_balance_cached = balance_after
             3. drafts_stage insert (idempotency key = tRPC request id)
             4. queue.add('post.publish', {orgId, draftStageId, runAt=scheduledAt})
             5. audit_events.insert('post.create', ok)
           )
        └─ return { queued: true, draftStageId }

Worker (BullMQ)  ── runs at scheduledAt ──▶
    └─ zernio.posts.create(payload)           # uses per-org decrypted key
    └─ posts_cache.insert(zernio_post_id, status='scheduled|published')
    └─ if Zernio 5xx and retries exhausted:
         credit_ledger.insert(+1, reason='refund', ref_id=draftStageId)
         audit_events.insert('post.publish', error)
    else:
         audit_events.insert('post.publish', ok)
```

**Invariant**: no Zernio call is issued without a preceding debit in the same DB transaction, and no permanent failure leaves the user out of credits.

## Job map (BullMQ queues)
- `post.publish` — hand-off to Zernio at `runAt`.
- `post.retry` — exponential backoff on Zernio failures.
- `analytics.poll` — nightly (per org) refresh of follower + post metrics.
- `inbox.poll` — every 15 min per org until Zernio pushes inbound webhooks.
- `automation.tick` — every 5 min, evaluate enabled `automations`.
- `credit.refill` — daily 00:05 UTC sweep, refills subscriptions whose `current_period_end` just passed and is active.
- `trend.snapshot` — daily per `trend_watchlists` row.
- `ai.calendar.generate` — one-shot on user click; long-running, streams progress via server-sent events.
- `media.cleanup` — daily, purges R2 staging after 7 days.

## Webhooks
### In from Zernio
`/api/webhooks/zernio/[event]` — post.published, post.failed, comment.received, mention.received. Idempotent via `webhook_events_in.event_id`.

### In from payments
`/api/webhooks/flutterwave|paystack|intasend|momo|orange` — subscription.created, charge.success (writes `credit_ledger`), charge.failed, subscription.canceled. Signature verified per provider.

### Out to user's org (optional, Agency plan)
Outbound webhook fires to their URL on post.published / comment.received.

## AI layer (`packages/ai`)
- Wraps `@anthropic-ai/sdk` with a `withBrandContext(orgId, promptTemplate, vars)` helper that:
  1. Loads the org's active `brand_profiles` row.
  2. Retrieves top-K semantically similar `brand_examples` for the prompt (pgvector).
  3. Injects tone/forbidden/colors/audience into the system prompt.
  4. Streams the response back.
- Prompt library lives in `packages/ai/prompts/` — one file per skill (script-tiktok, script-ig-reel, caption-linkedin, calendar-monthly, competitor-brief, etc.), all versioned.

## Trends layer (`packages/trends`)
- Scraping is ToS-fragile; treat it as best-effort. Where possible, use platform official APIs (YouTube Data, TikTok Research API) with the org's own OAuth via Zernio's connect flow.
- Cache snapshots in `trend_snapshots` so the UI is fast and doesn't hammer sources.
- When scraping is required, run through a rotating-IP job queue; on failure, downgrade the feature UI to "temporarily unavailable" rather than crashing.

## Frontend visual language

Reference: the "Nexus — AI Workflow Automation" Framer template mirrored at `D:\mes site\nexusply automation\` and the light-blue rounded-card dashboard mockup in the conversation.

- **Fonts**: Inter Tight (display, `-tracking-tight`), Inter (body).
- **Palette** — dark surfaces `#021d46 · #071a3d · #0a0a0a`; primary `#2563eb · #1d4ed8`; supports `#60a5fa · #93c5fd · #bfdbfe · #EBF4FE`; text `#171717 → #a3a3a3`; success/warn/danger reuse Tailwind emerald/amber/rose 500s.
- **Motion**: soft entrance fade + 6-px translate-up, 250 ms, ease-out. No parallax gimmicks.
- **Landing** — Nexus-template feel: dark hero with a single glowing orb, glass sections, big Inter Tight headlines.
- **App shell** — reference mockup: 260-px sidebar with icons + labels, workspace card on top, sign-out on bottom; main pane on `#f5f7fb` with 20-px rounded white cards, subtle drop-shadow, cobalt-blue primary buttons.

See `nexusply-image-prompts.md` for the illustration set.
