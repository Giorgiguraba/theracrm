/**
 * Apply RLS policies from lib/db/rls.sql.
 * Run AFTER drizzle migrations have created the tables.
 *   npm run db:rls
 */
import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sqlPath = join(process.cwd(), "lib/db/rls.sql");
const sqlText = readFileSync(sqlPath, "utf8");

const client = postgres(url, { max: 1, prepare: false, ssl: "require" });

async function main() {
  try {
    await client.unsafe(sqlText);
    console.log("✓ RLS policies applied");
    await client.end();
    process.exit(0);
  } catch (e) {
    console.error("✗ Failed to apply RLS:", e);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

main();
