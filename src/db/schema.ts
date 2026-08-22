import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
  integer,
  numeric,
  index,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================================
// AUTH CORE (Better-Auth managed)
// ============================================================

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  issuer: text("issuer"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// MULTI-TENANCY (organizations replaces old `workspaces`)
// ============================================================

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  country: text("country").notNull().default("KE"), // ISO 3166 alpha-2
  currency: text("currency").notNull().default("KES"), // ISO 4217
  timezone: text("timezone").notNull().default("Africa/Nairobi"),
  planId: uuid("plan_id"),
  creditBalanceCached: integer("credit_balance_cached").notNull().default(0),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "admin", "member", "viewer"] })
      .notNull()
      .default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.orgId, t.userId] }),
    index("org_members_user_idx").on(t.userId),
  ],
);

// ============================================================
// CREDENTIALS (per-org, AES-256-GCM encrypted)
// Reusable shape: encryptedCredential(providerKey)
// ============================================================

export const zernioCredentials = pgTable("zernio_credentials", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  ciphertext: text("ciphertext").notNull(),
  iv: text("iv").notNull(),
  tag: text("tag").notNull(),
  keyPreview: text("key_preview").notNull(),
  addedById: text("added_by_id")
    .notNull()
    .references(() => users.id),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const higgsfieldCredentials = pgTable("higgsfield_credentials", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  ciphertext: text("ciphertext").notNull(),
  iv: text("iv").notNull(),
  tag: text("tag").notNull(),
  keyPreview: text("key_preview").notNull(),
  addedById: text("added_by_id")
    .notNull()
    .references(() => users.id),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cloneviralCredentials = pgTable("cloneviral_credentials", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  ciphertext: text("ciphertext").notNull(),
  iv: text("iv").notNull(),
  tag: text("tag").notNull(),
  keyPreview: text("key_preview").notNull(),
  addedById: text("added_by_id")
    .notNull()
    .references(() => users.id),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// BRAND CONTEXT (the moat)
// ============================================================

export const brandProfiles = pgTable(
  "brand_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    niche: text("niche"),
    audience: text("audience"),
    toneWords: text("tone_words").array().notNull().default([]),
    forbiddenWords: text("forbidden_words").array().notNull().default([]),
    colors: jsonb("colors").notNull().default({}), // { primary, secondary, accent }
    voiceNotes: text("voice_notes"),
    topHashtags: text("top_hashtags").array().notNull().default([]),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("brand_profiles_org_idx").on(t.orgId)],
);

// Semantic examples fed as few-shot into AI generation.
// `embedding` is stored as text (JSON-serialized float array) so we don't
// require pgvector at bootstrap; a migration to pgvector lands with the
// trend/AI phase.
export const brandExamples = pgTable(
  "brand_examples",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brandProfileId: uuid("brand_profile_id")
      .notNull()
      .references(() => brandProfiles.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["top_post", "brand_ref", "manual_snippet"] })
      .notNull()
      .default("manual_snippet"),
    content: text("content").notNull(),
    embedding: text("embedding"), // JSON-serialized float[]
    sourcePlatform: text("source_platform"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("brand_examples_profile_idx").on(t.brandProfileId)],
);

// ============================================================
// PUBLISHING / CONTENT
// ============================================================

// Local mirror of Zernio post rows so pages render without a round-trip.
export const postsCache = pgTable(
  "posts_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    zernioPostId: text("zernio_post_id").notNull(),
    status: text("status").notNull(), // scheduled | published | failed | draft | unpublished
    platform: text("platform"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    content: text("content"),
    mediaUrls: jsonb("media_urls").notNull().default([]),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("posts_cache_zernio_unique").on(t.orgId, t.zernioPostId),
    index("posts_cache_org_status_idx").on(t.orgId, t.status),
  ],
);

// Everything the org has generated or uploaded — the media picker source.
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["image", "video", "audio"] }).notNull(),
    url: text("url").notNull(),
    source: text("source", {
      enum: ["upload", "higgsfield", "cloneviral", "external"],
    }).notNull(),
    sourceRef: text("source_ref"),
    meta: jsonb("meta").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_assets_org_idx").on(t.orgId, t.createdAt)],
);

// Local drafts before they hit Zernio.
export const drafts = pgTable(
  "drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    title: text("title"),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("drafts_org_idx").on(t.orgId)],
);

// ============================================================
// CREDIT SYSTEM (append-only ledger is the truth)
// ============================================================

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(), // starter | school | institute | agency
  name: text("name").notNull(),
  monthlyPriceLocal: numeric("monthly_price_local", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  currency: text("currency").notNull().default("USD"),
  includedCredits: integer("included_credits").notNull().default(0),
  perChannelCap: integer("per_channel_cap"), // null = unlimited
  seatCap: integer("seat_cap").notNull().default(1),
  features: jsonb("features").notNull().default({}),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),
  provider: text("provider", {
    enum: ["flutterwave", "paystack", "intasend", "mtn_momo", "orange", "lemonsqueezy", "manual"],
  }).notNull(),
  providerSubRef: text("provider_sub_ref"),
  status: text("status", {
    enum: ["trialing", "active", "past_due", "canceled"],
  })
    .notNull()
    .default("active"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAt: timestamp("cancel_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creditPrices = pgTable("credit_prices", {
  actionKey: text("action_key").primaryKey(),
  credits: integer("credits").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(), // signed
    reason: text("reason", {
      enum: [
        "plan_refill",
        "top_up",
        "action_debit",
        "admin_adjust",
        "refund",
        "promo",
      ],
    }).notNull(),
    refType: text("ref_type"),
    refId: text("ref_id"),
    balanceAfter: integer("balance_after").notNull(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("credit_ledger_org_ts_idx").on(t.orgId, t.createdAt)],
);

export const topUpProducts = pgTable("top_up_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  credits: integer("credits").notNull(),
  priceLocal: numeric("price_local", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ============================================================
// AUTOMATIONS (fixed-catalog triggers × actions)
// ============================================================

export const automations = pgTable(
  "automations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    trigger: jsonb("trigger").notNull(), // { type, params }
    actions: jsonb("actions").notNull().default([]), // [{ type, params }]
    enabled: boolean("enabled").notNull().default(true),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("automations_org_idx").on(t.orgId)],
);

export const automationRuns = pgTable(
  "automation_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    automationId: uuid("automation_id")
      .notNull()
      .references(() => automations.id, { onDelete: "cascade" }),
    triggeredBy: jsonb("triggered_by"),
    status: text("status", { enum: ["pending", "ok", "error", "skipped"] })
      .notNull()
      .default("pending"),
    log: jsonb("log").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("automation_runs_automation_idx").on(t.automationId, t.createdAt)],
);

// ============================================================
// TRENDS + COMPETITORS
// ============================================================

export const trendWatchlists = pgTable(
  "trend_watchlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(), // tiktok | youtube | instagram | linkedin
    niche: text("niche"),
    keywords: text("keywords").array().notNull().default([]),
    competitorHandles: text("competitor_handles").array().notNull().default([]),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("trend_watchlists_org_idx").on(t.orgId)],
);

export const trendSnapshots = pgTable(
  "trend_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    watchlistId: uuid("watchlist_id")
      .notNull()
      .references(() => trendWatchlists.id, { onDelete: "cascade" }),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    topPosts: jsonb("top_posts").notNull().default([]),
    topHashtags: jsonb("top_hashtags").notNull().default([]),
    topSounds: jsonb("top_sounds").notNull().default([]),
    competitorPosts: jsonb("competitor_posts").notNull().default([]),
  },
  (t) => [index("trend_snapshots_watch_idx").on(t.watchlistId, t.capturedAt)],
);

// ============================================================
// PAYMENTS (mirror of provider truth + idempotency shield)
// ============================================================

export const paymentCustomers = pgTable(
  "payment_customers",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerCustomerRef: text("provider_customer_ref").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.provider] })],
);

export const paymentIntents = pgTable(
  "payment_intents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerRef: text("provider_ref").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    kind: text("kind", { enum: ["subscription", "top_up"] }).notNull(),
    status: text("status").notNull(), // pending | succeeded | failed | canceled
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("payment_intents_provider_ref_unique").on(t.provider, t.providerRef),
    index("payment_intents_org_idx").on(t.orgId, t.createdAt),
  ],
);

// ============================================================
// WEBHOOKS (inbound idempotency shield — append-only)
// ============================================================

export const webhookEventsIn = pgTable(
  "webhook_events_in",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source", {
      enum: [
        "zernio",
        "flutterwave",
        "paystack",
        "intasend",
        "mtn_momo",
        "orange",
        "lemonsqueezy",
        "inngest",
      ],
    }).notNull(),
    eventId: text("event_id").notNull(),
    payload: jsonb("payload").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("webhook_events_in_source_id_unique").on(t.source, t.eventId)],
);

// ============================================================
// ADMIN / OPS
// ============================================================

export const adminUsers = pgTable("admin_users", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["superadmin", "support", "readonly"] })
    .notNull()
    .default("readonly"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default(false),
  targeting: jsonb("targeting"), // { orgIds?: string[], countries?: string[] }
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Audit trail — every state-changing action (user or admin).
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    payload: jsonb("payload"),
    result: text("result", { enum: ["ok", "error"] }).notNull(),
    errorMessage: text("error_message"),
    ip: text("ip"),
    ua: text("ua"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_events_org_ts_idx").on(t.orgId, t.createdAt)],
);

// Programmatic API tokens (Agency plan feature).
export const apiTokens = pgTable(
  "api_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    name: text("name").notNull(),
    scopes: text("scopes").array().notNull().default([]),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("api_tokens_hash_unique").on(t.tokenHash),
    index("api_tokens_org_idx").on(t.orgId),
  ],
);

