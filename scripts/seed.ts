/**
 * Seed: creates a demo tenant (Mindspace) with programs and example leads
 * so you can click around immediately. Run AFTER migrations + RLS.
 *
 *   pnpm db:seed   (or)   npm run db:seed
 */
import { config as loadEnv } from "dotenv";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  const slug = "mindspace";

  let [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, slug));
  if (!tenant) {
    [tenant] = await db.insert(schema.tenants).values({
      name: "Mindspace Tbilisi",
      slug,
      plan: "pro",
      paidUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    }).returning();
    await db.insert(schema.tenantSettings).values({ tenantId: tenant.id });
  }

  // Programs
  const existingPrograms = await db.select().from(schema.programs).where(eq(schema.programs.tenantId, tenant.id));
  if (existingPrograms.length === 0) {
    await db.insert(schema.programs).values([
      { tenantId: tenant.id, name: "Art Therapy",    type: "therapy",    price: "380" },
      { tenantId: tenant.id, name: "CBT Course",     type: "course",     price: "340" },
      { tenantId: tenant.id, name: "Internship",     type: "internship", price: "450" },
      { tenantId: tenant.id, name: "Group Therapy",  type: "therapy",    price: "290" },
    ]);
  }

  const programs = await db.select().from(schema.programs).where(eq(schema.programs.tenantId, tenant.id));
  const pid = (name: string) => programs.find((p) => p.name === name)?.id;

  // Leads
  const existingLeads = await db.select().from(schema.leads).where(eq(schema.leads.tenantId, tenant.id));
  if (existingLeads.length === 0) {
    await db.insert(schema.leads).values([
      { tenantId: tenant.id, fullName: "Nino Beridze",      phone: "+995 599 123", email: "nino@mail.ge",         source: "fb_ads",   programId: pid("Art Therapy"),   stage: "new" },
      { tenantId: tenant.id, fullName: "Luka Tsereteli",    phone: "+995 555 821", email: "luka.t@gmail.com",     source: "ig_ads",   programId: pid("Internship"),    stage: "new" },
      { tenantId: tenant.id, fullName: "Ana Khurodze",      phone: "+995 577 408", email: null,                    source: "manual",   programId: pid("CBT Course"),    stage: "new" },
      { tenantId: tenant.id, fullName: "Mariam Jorjadze",   phone: "+995 591 442", email: "mariam.j@mail.ge",     source: "fb_ads",   programId: pid("Group Therapy"), stage: "contacted" },
      { tenantId: tenant.id, fullName: "Giga Lomidze",      phone: "+995 555 901", email: "giga.l@gmail.com",     source: "ig_ads",   programId: pid("Internship"),    stage: "contacted" },
      { tenantId: tenant.id, fullName: "Salome Pkhakadze",  phone: "+995 595 112", email: "salome.p@gmail.com",   source: "ig_ads",   programId: pid("Art Therapy"),   stage: "thinking" },
      { tenantId: tenant.id, fullName: "David Okriashvili", phone: "+995 599 558", email: "d.okri@mail.ge",       source: "referral", programId: pid("CBT Course"),    stage: "thinking" },
      { tenantId: tenant.id, fullName: "Tamta Kapanadze",   phone: "+995 577 220", email: null,                    source: "fb_ads",   programId: pid("Internship"),    stage: "enrolled" },
      { tenantId: tenant.id, fullName: "Sopo Maisuradze",   phone: "+995 591 003", email: null,                    source: "ig_ads",   programId: pid("Art Therapy"),   stage: "enrolled" },
      { tenantId: tenant.id, fullName: "Nika Gogiashvili",  phone: "+995 555 671", email: null,                    source: "referral", programId: pid("CBT Course"),    stage: "enrolled" },
    ]);
  }

  console.log(`✓ Seeded tenant '${tenant.slug}' (${tenant.id})`);
  console.log(`  Now create an auth user in Supabase Dashboard and set:`);
  console.log(`    app_metadata.tenant_id = '${tenant.id}'`);
  console.log(`    app_metadata.role = 'admin'`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
