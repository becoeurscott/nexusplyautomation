# AGENTS.md

Coding-agent instructions for Nexusply. Any AI agent (Claude Code, Cursor, Codex, etc.) reads this file before touching the codebase.

## Reading order — every session
1. `PRD.md` — what we are building and for whom.
2. `ARCHITECTURE.md` — the shape of the system.
3. `ARCHITECTURE-ESSENTIALS.md` — the ten decisions that must not be violated.
4. The specific package's `README.md` if it has one.

If a change would violate anything in `ARCHITECTURE-ESSENTIALS.md`, stop and raise it to the human instead of proceeding.

## Repo layout you should assume
Monorepo (pnpm workspaces + Turborepo). Apps under `apps/`, shared code under `packages/`. Today the code still lives inside `zernio-app/` — treat that as `apps/web/` in your reasoning and place new shared modules where they will live after the restructure.

## Package rules
- **`packages/db`** — Drizzle schema is the source of truth. Never write raw SQL migrations by hand; use `drizzle-kit generate`.
- **`packages/auth`** — Better-Auth config. Don't add a second auth library.
- **`packages/zernio`, `packages/higgsfield`, `packages/cloneviral`** — thin typed adapters. One method per upstream endpoint. Never inline business logic here.
- **`packages/credits`** — `withCredits(cost, fn)` is the only way to spend credits. Never insert into `credit_ledger` from outside this package.
- **`packages/jobs`** — BullMQ workers. Each worker file is one queue.
- **`packages/ai`** — always call `withBrandContext(orgId, ...)` before hitting Claude; never bypass to keep outputs generic.

## Coding conventions
- TypeScript strict everywhere. No `any`. If you need `unknown`, narrow it with zod.
- Zod schemas live in `packages/shared/schemas/` and are the single source of runtime validation.
- Server-only imports (Node crypto, database, env) never appear in `"use client"` files. Move to a server action / route.
- No default exports in packages; named exports only.
- Files are kebab-case; components are PascalCase; hooks are `useCamelCase`.
- Tailwind first; when a class name gets past ~4 conditions, extract a variant with `class-variance-authority`.
- Never inline API keys or secrets in code — env vars only, and only through the shared config module.

## Commit + PR conventions
- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
- One PR = one concern. Splitting a "big change" into a series of small PRs is always preferred.
- Every PR runs `pnpm turbo run typecheck lint test build` — all four must pass locally before push.
- Never commit `.env`. `.env.example` gets updated when a new env var is introduced.

## Feature-flag before merge
Any behavior that changes user-facing outputs ships behind a `feature_flags` row so it can be toggled per-org without redeploy. Default to `off` in production until sign-off.

## Testing bar
- Every mutation procedure has at least one integration test that hits a real local Postgres (via `docker compose up postgres`) and a mocked Zernio/Higgsfield/CloneViral server.
- Credit debit + refund path must be tested end-to-end. This is the invariant we're most likely to break.
- Snapshot tests for AI prompts (input → assembled prompt) so we notice accidental drift.

## Where secrets live
- Local dev: `apps/web/.env` and `apps/admin/.env`, gitignored.
- CI: GitHub Actions encrypted secrets.
- Prod: Doppler (planned).
- Never `console.log` a secret. Never paste one into a chat message, including this one.

## Running the stack locally
```bash
pnpm i
docker compose up -d          # Postgres + Redis
pnpm --filter web db:push      # Drizzle apply schema
pnpm --filter web dev          # http://localhost:3000
pnpm --filter admin dev        # http://localhost:3001
pnpm --filter jobs dev         # worker process
```

## Definition of done
A change is done when:
1. It has tests.
2. `pnpm turbo run typecheck lint test build` is green.
3. If it touches user-facing text or UI: rendered manually at least once against a real local database.
4. If it touches credits, payments, or audit: an entry in this file's *Load-bearing decisions* is either preserved or explicitly amended with human sign-off.
5. Docs updated (`PRD.md`, `ARCHITECTURE.md`, or a package README).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
