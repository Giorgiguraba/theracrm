import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Reuse the connection across hot reloads in dev
const globalForPg = globalThis as unknown as { pg?: ReturnType<typeof postgres> };
const client = globalForPg.pg ?? postgres(url, { max: 10, prepare: false, ssl: "require" });
if (process.env.NODE_ENV !== "production") globalForPg.pg = client;

export const db = drizzle(client, { schema });
export { schema };
