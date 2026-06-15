"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { and, eq, gte, lte, asc, desc, isNull } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

const createSchema = z.object({
  leadId: z.string().uuid(),
  dueAt: z.string(), // ISO string
  note: z.string().max(500).optional().nullable(),
});

export async function createReminder(input: z.infer<typeof createSchema>) {
  const p = createSchema.parse(input);
  const { tenant, user } = await requireUser();

  const [reminder] = await db.insert(schema.reminders).values({
    tenantId: tenant.id,
    leadId: p.leadId,
    dueAt: new Date(p.dueAt),
    createdBySystem: false,
    createdByUserId: user.id,
  }).returning();

  await db.insert(schema.activities).values({
    tenantId: tenant.id, leadId: p.leadId, userId: user.id,
    type: "reminder",
    payload: { reminderId: reminder.id, dueAt: p.dueAt, note: p.note ?? null },
  });

  revalidatePath(`/leads/${p.leadId}`);
  revalidatePath("/follow-ups");
  revalidatePath("/calendar");
  return reminder;
}

export async function markReminderDone(id: string) {
  z.string().uuid().parse(id);
  const { tenant } = await requireUser();
  await db.update(schema.reminders).set({ status: "done" })
    .where(and(eq(schema.reminders.id, id), eq(schema.reminders.tenantId, tenant.id)));
  revalidatePath("/follow-ups");
  revalidatePath("/calendar");
}

export async function snoozeReminder(input: { id: string; until: string }) {
  const { id, until } = z.object({ id: z.string().uuid(), until: z.string() }).parse(input);
  const { tenant } = await requireUser();
  await db.update(schema.reminders).set({ status: "snoozed", dueAt: new Date(until) })
    .where(and(eq(schema.reminders.id, id), eq(schema.reminders.tenantId, tenant.id)));
  revalidatePath("/follow-ups");
  revalidatePath("/calendar");
}

export async function deleteReminder(id: string) {
  z.string().uuid().parse(id);
  const { tenant } = await requireUser();
  await db.delete(schema.reminders)
    .where(and(eq(schema.reminders.id, id), eq(schema.reminders.tenantId, tenant.id)));
  revalidatePath("/follow-ups");
  revalidatePath("/calendar");
}

export async function listLeadReminders(leadId: string) {
  z.string().uuid().parse(leadId);
  const { tenant } = await requireUser();
  return db.select().from(schema.reminders)
    .where(and(eq(schema.reminders.leadId, leadId), eq(schema.reminders.tenantId, tenant.id)))
    .orderBy(asc(schema.reminders.dueAt));
}

export async function listRemindersForMonth(year: number, month: number /* 1-12 */) {
  const { tenant } = await requireUser();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return db.select().from(schema.reminders).where(and(
    eq(schema.reminders.tenantId, tenant.id),
    gte(schema.reminders.dueAt, start),
    lte(schema.reminders.dueAt, end),
  )).orderBy(asc(schema.reminders.dueAt));
}

export async function listOpenReminders() {
  const { tenant } = await requireUser();
  return db.select().from(schema.reminders).where(and(
    eq(schema.reminders.tenantId, tenant.id),
  )).orderBy(asc(schema.reminders.dueAt));
}
