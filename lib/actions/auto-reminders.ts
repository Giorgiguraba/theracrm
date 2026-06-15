"use server";
import { db, schema } from "@/lib/db";
import { and, eq, inArray, isNull, lte, gte, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

/**
 * Find every active lead that's been sitting > 7 days without enrollment and
 * doesn't already have a pending reminder, then create one for tomorrow at
 * 10:00 local time. Logs an activity entry so the timeline shows the bot did it.
 *
 * Safe to call frequently — idempotent because of the "no existing pending
 * reminder" check. Called on calendar + follow-ups page load.
 */
export async function ensureStuckLeadReminders() {
  const { tenant } = await requireUser();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find leads stuck > 7 days, still in the pipeline (not enrolled/lost)
  const stuck = await db.select().from(schema.leads).where(and(
    eq(schema.leads.tenantId, tenant.id),
    inArray(schema.leads.stage, ["new", "contacted", "thinking"]),
    lte(schema.leads.stageChangedAt, sevenDaysAgo),
    isNull(schema.leads.deletedAt),
  ));
  if (stuck.length === 0) return { created: 0 };

  // Filter out ones already covered by a pending system reminder
  const stuckIds = stuck.map((l) => l.id);
  const existing = await db.select({ leadId: schema.reminders.leadId })
    .from(schema.reminders)
    .where(and(
      eq(schema.reminders.tenantId, tenant.id),
      inArray(schema.reminders.leadId, stuckIds),
      eq(schema.reminders.status, "pending"),
    ));
  const covered = new Set(existing.map((r) => r.leadId));
  const toCreate = stuck.filter((l) => !covered.has(l.id));
  if (toCreate.length === 0) return { created: 0 };

  // Tomorrow at 10:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  for (const l of toCreate) {
    const [r] = await db.insert(schema.reminders).values({
      tenantId: tenant.id,
      leadId: l.id,
      dueAt: tomorrow,
      createdBySystem: true,
    }).returning();
    await db.insert(schema.activities).values({
      tenantId: tenant.id,
      leadId: l.id,
      type: "reminder",
      payload: {
        reminderId: r.id,
        dueAt: tomorrow.toISOString(),
        note: "Auto: stuck > 7 days without enrollment",
      },
    });
  }

  return { created: toCreate.length };
}
