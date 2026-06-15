import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForPg = globalThis as unknown as {
  pg?: ReturnType<typeof postgres>;
  drz?: ReturnType<typeof drizzle<typeof schema>>;
};

function init() {
  if (globalForPg.drz) return globalForPg.drz;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // max: 1 per serverless instance — recommended for Vercel + Supabase transaction pooler.
  // The pooler handles concurrency, not the postgres-js client.
  const client = globalForPg.pg ?? postgres(url, {
    max: 1,
    prepare: false,
    ssl: "require",
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });
  if (process.env.NODE_ENV !== "production") globalForPg.pg = client;
  const drz = drizzle(client, { schema });
  if (process.env.NODE_ENV !== "production") globalForPg.drz = drz;
  return drz;
}

// Lazy proxy — importing this module doesn't connect to the DB.
// Connection happens the first time you actually access `db.select(...)` etc.
// This keeps `next build`'s static-collect phase happy when env vars are missing.
export const db = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_t, prop) {
      const d = init() as unknown as Record<string | symbol, unknown>;
      return d[prop];
    },
  },
);

export { schema };
