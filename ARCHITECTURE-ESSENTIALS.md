# Nexusply — Load-bearing decisions

These are the ten choices that would be expensive to reverse later. Every other decision is downstream of these. Read this file first, whether you are a human contributor or a coding agent, before you propose anything structural.

## 1. Monorepo (pnpm workspaces + Turborepo)
The web app, the admin app, the mobile app (later), and the shared packages (db, auth, zernio, media, cloneviral, credits, payments, jobs, automations, ai, trends, shared) all live in one repo. This means one source of truth for the schema, one type surface for the API, one place to bump a Zernio endpoint. The cost is initial setup complexity — worth it because we ship three surfaces at once (web app, admin dashboard, mobile app).

**If you disagree**: don't split into separate repos to "keep things simple". Adding a package to the monorepo is cheaper than syncing types across three repos.

## 2. tRPC is the internal API contract; REST is only a bridge
The web app talks to itself via tRPC procedures. The mobile app talks to the same procedures over an `openapi`-generated REST bridge. There is one router of business logic — never two. If a mutation exists as a Next.js Server Action, it is a thin call into a tRPC procedure, not its own implementation.

**If you disagree**: don't build a parallel REST controller. Wrap the existing procedure.

## 3. Credits debit in the same DB transaction as the enqueue
Every Zernio (or the media provider, or CloneViral) call is preceded by a `credit_ledger` insert *in the same transaction* as the queue enqueue. The user's balance and the queued job cannot go out of sync — either both happen or neither does. If the downstream call permanently fails after all retries, a matching `credit_ledger` credit row is written (`reason='refund'`) so the balance is auto-restored.

**If you disagree**: don't cache balances as the source of truth. `sum(delta)` for the org is the invariant. The cached column on `organizations` exists for display only.

## 4. Zernio / the media provider / CloneViral are adapters, not core
These are third-party engines we wrap. Their capabilities are exposed 1-to-1 in `packages/zernio`, `packages/media`, `packages/cloneviral`. Our value is in what sits above: brand context, credit metering, automations, AI calendar, trends, UI. If Zernio adds a new endpoint, we add it to the adapter. We never fork their behavior — if they're wrong, we file a bug.

**If you disagree**: don't reimplement their logic locally. If we ever need to swap one out, the adapter boundary is where the seam lives.

## 5. Users bring their own Zernio / the media provider / CloneViral API key (BYOK)
The key is encrypted at rest with AES-256-GCM using a server-side `ENCRYPTION_KEY` (32 bytes base64). Only the last 4 characters ever appear back in any UI. This keeps us out of the position of holding one central master key for every user's social accounts, and makes deletion straightforward.

**If you disagree**: don't add a "we hold the key for you" path in v1. Revisit only if a specific enterprise deal demands it.

## 6. Stripe billing shipped first; African rails are deferred, not deleted
**Superseded 2026-08-24, by explicit user instruction ("we will used stripe no more african thing for now").** The original decision below is kept for the record — the reasoning still applies to *later*, it just no longer describes what shipped first.

Stripe (hosted Checkout + Billing Portal) is the only payment processor wired up. `subscriptions.provider` / `payment_customers.provider` / `webhook_events_in.source` all gained a `"stripe"` value; the African-rail values (`flutterwave`, `paystack`, `intasend`, `mtn_momo`, `orange`) stay in those enums unused, and `payment_customers`/`payment_intents` are provider-generic by design — so adding a rail back is additive (a new adapter + webhook route), not a rewrite of anything Stripe touches. See `src/lib/payments/` and the Stripe billing plan for the shape of that adapter boundary.

*Original decision (no longer current default, kept for context on why African rails were planned first):* Flutterwave is the v1 provider because it covers the widest African corridor (cards + mobile money). IntaSend gets added for Kenya M-Pesa STK Push in Phase L. Paystack for Nigeria + Ghana + South Africa cards. MTN MoMo Collections and Orange Money for direct MoMo. Prices are stored per-currency in `plans.monthly_price_local` and `top_up_products.price_local`. The pricing page auto-selects currency from the org's `country`, defaulting to a geo-IP guess at signup.

**If you disagree**: African rails are the fast-follow, not a rejected idea — the risk this decision originally warned about (a USD-only mindset, a payment path half the market can't use) is still real and still needs addressing before African-market launch. Don't remove the unused enum values or the provider-generic shape of `payment_customers`/`payment_intents` while "cleaning up" Stripe code — that's the seam a rail gets added back through.

## 7. Admin is a separate Next.js app with its own domain
`apps/admin` deploys separately, gated by an `admin_users` allowlist row plus a Better-Auth session. It never runs mixed with the end-user app. This means an XSS bug in a marketing widget can't reach the admin surface, and we can lock the admin domain behind IP allowlist or SSO later without touching the main app.

**If you disagree**: don't put admin pages inside `apps/web` "for convenience".

## 8. Better-Auth for both web and mobile
The web uses cookie sessions. The mobile app (Phase M) uses bearer tokens issued by the same Better-Auth instance via its Expo plugin. One user table, one session table, one password hash. No parallel auth stack.

**If you disagree**: don't add Auth.js, Clerk, or Supabase Auth. Migration cost >> perceived UI polish.

## 9. Postgres + Redis, and nothing else in v1
Neon for Postgres (with `pgvector` for brand embeddings). Upstash for Redis (BullMQ + rate limits). That's it — no Kafka, no ClickHouse, no Elasticsearch, no queue-of-the-week. If a feature would demand one, defer the feature or model it in Postgres first.

**If you disagree**: not until you've proven Postgres can't do it at 100× current load.

## 10. Schema evolves, ledger is append-only
Every other table can be migrated, refactored, dropped-and-recreated. `credit_ledger`, `audit_events`, and `webhook_events_in` are append-only forever — you may add columns, never mutate a row after insert. This is what lets us reconcile with providers, prove balances to a user in a dispute, and re-replay history for analytics.

**If you disagree**: don't run an `UPDATE` against these tables. Ever.

---

## What's deliberately not decided yet
- Which language model for on-app AI (Claude, GPT, Llama-on-Together). Wrap them behind `packages/ai` so it's a one-line swap.
- Where workers run in production (Fly.io, Railway, Sevalla). Keep them stateless.
- Whether to open-source the app later. Design as if we would — no proprietary rot.
- Whether the mobile app ships as an installable Capacitor wrap of the web or a real Expo app. Assumption: Expo, once the web feature set is stable.
