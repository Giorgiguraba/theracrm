/**
 * One-shot setup. Run with: npm run setup
 *
 * 1. Validates env
 * 2. Creates tables (idempotent)
 * 3. Applies RLS policies
 * 4. Seeds the demo tenant + programs + leads
 * 5. Finds the most recent confirmed Supabase auth user and assigns
 *    them as admin of the seeded tenant (sets app_metadata + creates
 *    public.users row)
 */
import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

// Next.js loads .env.local automatically. tsx (standalone) doesn't —
// dotenv's default is `.env`, so we load .env.local explicitly here.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

if (!url) fail("DATABASE_URL is not set in .env.local. Get it from Supabase → Settings → Database → Connection string → URI mode, replace [YOUR-PASSWORD] with your DB password.");
if (!supabaseUrl) fail("NEXT_PUBLIC_SUPABASE_URL is not set.");
if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY is not set.");

const sql = postgres(url, { max: 1, prepare: false, ssl: "require" });
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function step(label: string, fn: () => Promise<void>) {
  process.stdout.write(`  ${label}… `);
  try { await fn(); console.log("✓"); }
  catch (e) { console.log("✗"); throw e; }
}

async function main() {
  console.log("\nStimuli CRM setup\n");

  await step("Push schema (drizzle/migrations/0000_init.sql)", async () => {
    const initSql = readFileSync(join(process.cwd(), "drizzle/migrations/0000_init.sql"), "utf8");
    await sql.unsafe(initSql);
  });

  await step("Apply RLS policies (lib/db/rls.sql)", async () => {
    const rlsSql = readFileSync(join(process.cwd(), "lib/db/rls.sql"), "utf8");
    await sql.unsafe(rlsSql);
  });

  let tenantId = "";
  await step("Seed demo tenant 'Mindspace'", async () => {
    const existing = await sql<{ id: string }[]>`select id from tenants where slug = 'mindspace' limit 1`;
    if (existing.length > 0) { tenantId = existing[0].id; return; }
    const created = await sql<{ id: string }[]>`
      insert into tenants (name, slug, plan, paid_until)
      values ('Mindspace Tbilisi', 'mindspace', 'pro', current_date + interval '30 days')
      returning id
    `;
    tenantId = created[0].id;
    await sql`insert into tenant_settings (tenant_id) values (${tenantId})`;
  });

  await step("Seed programs", async () => {
    const cnt = await sql<{ c: number }[]>`select count(*)::int as c from programs where tenant_id = ${tenantId}`;
    if (cnt[0].c > 0) return;
    await sql`
      insert into programs (tenant_id, name, type, price) values
        (${tenantId}, 'სტაჟირების პროგრამა ფსიქოლოგებისთვის',          'internship', 4800),
        (${tenantId}, 'არტთერაპია სასწავლო-თერაპიული ჯგუფი (3 თვე)',    'therapy',     300),
        (${tenantId}, 'ბავშვთა ფსიქოკორექცია არტთერაპიის მეთოდებით',  'therapy',     300),
        (${tenantId}, 'ქვიშითთერაპია — 4-დღიანი ტრენინგი',             'course',      250),
        (${tenantId}, 'ნეიროგრაფიკის სასწავლო კურსი',                  'course',        0),
        (${tenantId}, 'ინდივიდუალური თერაპია',                         'therapy',     120)
    `;
  });

  // No demo leads — the real product starts empty. The operator adds leads
  // via the UI or Meta Ads webhook fills them in.

  await step("Ensure 'lead-photos' Storage bucket exists", async () => {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === "lead-photos")) {
      const { error } = await supabase.storage.createBucket("lead-photos", {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      });
      if (error && !error.message.includes("already exists")) throw error;
    }
  });

  let assignedTo: { email?: string | null; id: string } | null = null;
  await step("Find your Supabase auth user and make them admin", async () => {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) throw error;
    if (!data.users.length) {
      throw new Error("No auth users found. Create one in Supabase Dashboard → Authentication → Users, then re-run this.");
    }
    // Prefer a user that doesn't already have a tenant assigned; fall back to most recent
    const candidate =
      data.users.find((u) => !((u.app_metadata ?? {}) as { tenant_id?: string }).tenant_id) ??
      [...data.users].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

    const { error: updErr } = await supabase.auth.admin.updateUserById(candidate.id, {
      app_metadata: {
        ...candidate.app_metadata,
        tenant_id: tenantId,
        role: "admin",
      },
    });
    if (updErr) throw updErr;

    // Mirror into public.users (in case the trigger isn't installed yet)
    await sql`
      insert into users (id, tenant_id, role, full_name, email)
      values (
        ${candidate.id}::uuid,
        ${tenantId}::uuid,
        'admin'::user_role,
        ${(candidate.user_metadata?.full_name as string) ?? candidate.email ?? "Admin"},
        ${candidate.email ?? ""}
      )
      on conflict (id) do update set
        tenant_id = excluded.tenant_id,
        role = excluded.role
    `;

    assignedTo = { email: candidate.email, id: candidate.id };
  });

  console.log(`\n✓ All done.\n`);
  console.log(`  Tenant id : ${tenantId}`);
  if (assignedTo) console.log(`  Admin user: ${assignedTo.email}`);
  console.log(`\n  Start the app: npm run dev`);
  console.log(`  Then open    : http://localhost:3000/sign-in\n`);
  await sql.end();
  process.exit(0);
}

main().catch(async (e) => {
  console.error("\n✗ Setup failed:", e instanceof Error ? e.message : e);
  if (e && typeof e === "object") {
    const err = e as Record<string, unknown>;
    if (err.code) console.error("  code:", err.code);
    if (err.errno) console.error("  errno:", err.errno);
    if (err.severity) console.error("  severity:", err.severity);
    if (err.detail) console.error("  detail:", err.detail);
  }
  console.error("\nDATABASE_URL host:", (() => {
    try { return new URL(url!).host; } catch { return "(unparseable)"; }
  })());
  try { await sql.end(); } catch {}
  process.exit(1);
});
