# Zernio Studio

Full-parity SaaS dashboard wrapping the Zernio API. Bring your own key.

**Stack:** Next.js 16 · TypeScript · Tailwind v4 · Better-Auth · Drizzle · Postgres (Neon)

## Setup

1. Copy env:
   ```bash
   cp .env.example .env
   ```
2. Fill in `DATABASE_URL` (Neon), generate `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY`:
   ```bash
   openssl rand -base64 32   # for BETTER_AUTH_SECRET
   openssl rand -base64 32   # for ENCRYPTION_KEY
   ```
3. Push schema:
   ```bash
   npm run db:push
   ```
4. Run:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000`, sign up, go to Settings, paste your Zernio key.

## Architecture

- `src/db/schema.ts` — full DB schema (users, sessions, workspaces, encrypted credentials, drafts, audit log).
- `src/lib/encryption.ts` — AES-256-GCM helpers for storing Zernio keys.
- `src/lib/zernio/client.ts` — typed wrapper around every Zernio REST endpoint.
- `src/lib/zernio/for-workspace.ts` — pulls the encrypted key for a workspace and hands back a ready client.
- `src/lib/auth.ts` — Better-Auth config (email/password + optional Google).
- `src/lib/workspace.ts` — `requireSession()` / `requireWorkspace()` route guards, auto-creates a personal workspace on first login.
- `src/app/app/**` — protected dashboard (Dashboard, Compose, Posts, Queue, Analytics, Inbox, Accounts, Settings).

## Phase 1 status (this build)

- ✅ Auth (email/password)
- ✅ Personal workspace auto-provisioning
- ✅ Encrypted Zernio API key storage + verify-on-save
- ✅ Dashboard shell with sidebar nav
- ✅ Compose + Schedule (real end-to-end call to `POST /posts`)
- ✅ Posts list
- ✅ Accounts list
- ⏳ Queue, Analytics, Inbox — placeholder pages (Phases 3–5)

See [../zernio-app-plan.md](../zernio-app-plan.md) for the full roadmap.
