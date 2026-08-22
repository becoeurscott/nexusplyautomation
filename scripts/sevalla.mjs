#!/usr/bin/env node
/**
 * Sevalla provisioning + deploy helper for Nexusply.
 *
 * Usage:
 *   node scripts/sevalla.mjs db:status                 # show DB status + connection info
 *   node scripts/sevalla.mjs app:create <repoUrl>      # create web app from a Git repo
 *   node scripts/sevalla.mjs app:env <appId>           # push env vars from .env.production
 *   node scripts/sevalla.mjs app:deploy <appId>        # trigger a deployment
 *   node scripts/sevalla.mjs app:status <appId>        # latest deployment status
 *
 * Reads SEVALLA_API_KEY from env (or .env). Never commit the key.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE = "https://api.sevalla.com/v3";

// Defaults chosen for Nexusply (Belgium / europe-west1, smallest tiers).
const CLUSTER_ID = process.env.SEVALLA_CLUSTER_ID ?? "20204189-9832-46a5-b281-c3dc18dbe2a4";
const WEB_RESOURCE_TYPE = process.env.SEVALLA_WEB_RESOURCE ?? "474d8d4c-ce53-47af-acfe-5891f1d508e0"; // s1
const DB_ID = process.env.SEVALLA_DB_ID ?? "d133c46e-b42d-4bb1-afee-0c4e9f7c2049";

function loadDotenv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const local = { ...loadDotenv(resolve(".env")), ...process.env };
const KEY = local.SEVALLA_API_KEY;
if (!KEY) {
  console.error("SEVALLA_API_KEY is not set (put it in .env or export it).");
  process.exit(1);
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

const [cmd, arg] = process.argv.slice(2);

async function main() {
  switch (cmd) {
    case "db:status": {
      const db = await api(`/databases/${DB_ID}`);
      console.log(JSON.stringify(db, null, 2));
      break;
    }

    case "app:create": {
      if (!arg) throw new Error("repo URL required");
      const created = await api("/applications", {
        method: "POST",
        body: {
          display_name: "nexusply-web",
          cluster_id: CLUSTER_ID,
          source: "privateGit",
          git_type: "github",
          repo_url: arg,
          default_branch: "main",
          auto_deploy: false,
        },
      });
      console.log("Created application:", created.id);
      console.log(JSON.stringify(created, null, 2));
      break;
    }

    case "app:env": {
      if (!arg) throw new Error("app id required");
      const prod = loadDotenv(resolve(".env.production"));
      const keys = Object.keys(prod);
      if (!keys.length) throw new Error(".env.production is empty");
      for (const key of keys) {
        await api(`/applications/${arg}/env-vars`, {
          method: "POST",
          body: { key, value: prod[key], is_runtime: true, is_buildtime: true },
        });
        console.log("set", key);
      }
      console.log(`Pushed ${keys.length} env vars. Trigger a deployment to apply.`);
      break;
    }

    case "app:deploy": {
      if (!arg) throw new Error("app id required");
      const dep = await api(`/applications/${arg}/deployments`, {
        method: "POST",
        body: { branch: "main" },
      });
      console.log("Deployment:", dep.id, dep.status);
      break;
    }

    case "app:status": {
      if (!arg) throw new Error("app id required");
      const deps = await api(`/applications/${arg}/deployments?limit=1`);
      console.log(JSON.stringify(deps, null, 2));
      break;
    }

    default:
      console.log(`Unknown command: ${cmd ?? "(none)"}`);
      console.log("See header comment for usage.");
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
