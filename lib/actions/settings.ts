"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

const schemaIn = z.object({
  followupHours: z.number().int().min(1).max(720),
  locale: z.enum(["ka", "en"]),
  adSpendMonthly: z.string().optional().nullable(),
  autoFollowupEmail: z.boolean(),
});

export async function updateTenantSettings(input: z.infer<typeof schemaIn>) {
  const p = schemaIn.parse(input);
  const { tenant, role } = await requireUser();
  if (role !== "admin" && role !== "platform_admin") throw new Error("Forbidden");

  // upsert settings
  const existing = await db.select().from(schema.tenantSettings).where(eq(schema.tenantSettings.tenantId, tenant.id));
  if (existing.length === 0) {
    await db.insert(schema.tenantSettings).values({
      tenantId: tenant.id,
      followupHours: p.followupHours,
      locale: p.locale,
      adSpendMonthly: p.adSpendMonthly || null,
      autoFollowupEmail: p.autoFollowupEmail,
    });
  } else {
    await db.update(schema.tenantSettings).set({
      followupHours: p.followupHours,
      locale: p.locale,
      adSpendMonthly: p.adSpendMonthly || null,
      autoFollowupEmail: p.autoFollowupEmail,
    }).where(eq(schema.tenantSettings.tenantId, tenant.id));
  }

  revalidatePath("/settings");
}
