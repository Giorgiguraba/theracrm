"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

const stageEnum = z.enum(["new", "contacted", "thinking", "enrolled", "lost"]);
const sourceEnum = z.enum(["fb_ads", "ig_ads", "manual", "referral"]);

const createSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  source: sourceEnum.default("manual"),
  programId: z.string().uuid().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function createLead(input: z.infer<typeof createSchema>) {
  const parsed = createSchema.parse(input);
  const { tenant, user } = await requireUser();

  const [lead] = await db.insert(schema.leads).values({
    tenantId: tenant.id,
    fullName: parsed.fullName,
    phone: parsed.phone || null,
    email: parsed.email || null,
    source: parsed.source,
    programId: parsed.programId || null,
    notes: parsed.notes || null,
    stage: "new",
  }).returning();

  await db.insert(schema.activities).values({
    tenantId: tenant.id, leadId: lead.id, userId: user.id, type: "note",
    payload: { message: "Lead created" },
  });

  revalidatePath("/leads");
  return lead;
}

export async function moveLead(input: { id: string; toStage: z.infer<typeof stageEnum> }) {
  const { id, toStage } = z.object({ id: z.string().uuid(), toStage: stageEnum }).parse(input);
  const { tenant, user } = await requireUser();

  const [prev] = await db.select().from(schema.leads)
    .where(and(eq(schema.leads.id, id), eq(schema.leads.tenantId, tenant.id)));
  if (!prev) throw new Error("Lead not found");
  if (prev.stage === toStage) return prev;

  const [updated] = await db.update(schema.leads).set({
    stage: toStage,
    stageChangedAt: new Date(),
  }).where(and(eq(schema.leads.id, id), eq(schema.leads.tenantId, tenant.id))).returning();

  await db.insert(schema.activities).values({
    tenantId: tenant.id, leadId: id, userId: user.id, type: "stage_change",
    payload: { from: prev.stage, to: toStage },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return updated;
}

export async function addLeadNote(input: { id: string; message: string }) {
  const { id, message } = z.object({ id: z.string().uuid(), message: z.string().min(1).max(2000) }).parse(input);
  const { tenant, user } = await requireUser();

  await db.insert(schema.activities).values({
    tenantId: tenant.id, leadId: id, userId: user.id, type: "note",
    payload: { message },
  });

  revalidatePath(`/leads/${id}`);
}

export async function softDeleteLead(id: string) {
  z.string().uuid().parse(id);
  const { tenant } = await requireUser();

  await db.update(schema.leads).set({ deletedAt: new Date() })
    .where(and(eq(schema.leads.id, id), eq(schema.leads.tenantId, tenant.id)));

  revalidatePath("/leads");
}

export async function listLeads() {
  const { tenant } = await requireUser();
  return db.select().from(schema.leads)
    .where(and(eq(schema.leads.tenantId, tenant.id), isNull(schema.leads.deletedAt)))
    .orderBy(schema.leads.createdAt);
}

const updateSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1).max(120),
  phone: z.string().max(40).nullish(),
  email: z.string().email().or(z.literal("")).nullish(),
  source: sourceEnum,
  programId: z.string().uuid().nullish().or(z.literal("")),
  notes: z.string().max(4000).nullish(),
  birthDate: z.string().nullish().or(z.literal("")),
  city: z.string().max(120).nullish(),
  occupation: z.string().max(120).nullish(),
  photoUrl: z.string().nullish(),
});
export async function updateLead(input: z.infer<typeof updateSchema>) {
  const p = updateSchema.parse(input);
  const { tenant } = await requireUser();

  const [updated] = await db.update(schema.leads).set({
    fullName: p.fullName,
    phone: p.phone || null,
    email: p.email || null,
    source: p.source,
    programId: p.programId || null,
    notes: p.notes || null,
    birthDate: p.birthDate || null,
    city: p.city || null,
    occupation: p.occupation || null,
    photoUrl: p.photoUrl || null,
  }).where(and(eq(schema.leads.id, p.id), eq(schema.leads.tenantId, tenant.id))).returning();

  revalidatePath(`/leads/${p.id}`);
  revalidatePath("/leads");
  return updated;
}

export async function setLeadPhoto(input: { id: string; photoUrl: string | null }) {
  const { id, photoUrl } = z.object({
    id: z.string().uuid(),
    photoUrl: z.string().nullable(),
  }).parse(input);
  const { tenant } = await requireUser();

  await db.update(schema.leads).set({ photoUrl })
    .where(and(eq(schema.leads.id, id), eq(schema.leads.tenantId, tenant.id)));
  revalidatePath(`/leads/${id}`);
}
