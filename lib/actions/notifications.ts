"use server";
import { db, schema } from "@/lib/db";
import { and, eq, lte, asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function getNotifications() {
  const { tenant } = await requireUser();
  const today = new Date(); today.setHours(23, 59, 59, 999);

  const [reminders, leads] = await Promise.all([
    db.select().from(schema.reminders).where(and(
      eq(schema.reminders.tenantId, tenant.id),
      eq(schema.reminders.status, "pending"),
      lte(schema.reminders.dueAt, today),
    )).orderBy(asc(schema.reminders.dueAt)).limit(10),
    db.select().from(schema.leads).where(eq(schema.leads.tenantId, tenant.id)),
  ]);

  const items = reminders.map((r) => {
    const lead = leads.find((l) => l.id === r.leadId);
    const isOverdue = new Date(r.dueAt) < new Date();
    return {
      id: r.id,
      leadId: r.leadId,
      leadName: lead?.fullName ?? "—",
      photoUrl: lead?.photoUrl ?? null,
      dueAt: r.dueAt.toISOString(),
      isOverdue,
      isSystem: r.createdBySystem,
    };
  });

  return {
    items,
    overdueCount: items.filter((i) => i.isOverdue).length,
    totalCount: items.length,
  };
}
