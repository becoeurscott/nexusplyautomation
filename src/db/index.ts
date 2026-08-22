import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

let _db: Db | null = null;

function connect(): Db {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env locally or to your host's environment variables.",
    );
  }
  const client = postgres(connectionString, { prepare: false, ssl: "prefer" });
  return drizzle(client, { schema });
}

/**
 * Lazily-initialised Drizzle client. Nothing connects (or throws) until the
 * first query, so `next build` can evaluate route modules without a database.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    if (!_db) _db = connect();
    const value = Reflect.get(_db, prop, receiver);
    return typeof value === "function" ? value.bind(_db) : value;
  },
});

export type DB = Db;
