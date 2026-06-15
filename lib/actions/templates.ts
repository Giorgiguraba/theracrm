"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).max(80).regex(/^[a-z0-9_]+$/, "lowercase letters, digits, underscores only"),
  subject: z.string().min(1).max(200),
  bodyHtml: z.string().min(1),
  locale: z.enum(["ka", "en"]).default("ka"),
  isActive: z.boolean().default(true),
});

export async function upsertTemplate(input: z.infer<typeof upsertSchema>) {
  const p = upsertSchema.parse(input);
  const { tenant } = await requireUser();

  if (p.id) {
    await db.update(schema.emailTemplates).set({
      key: p.key, subject: p.subject, bodyHtml: p.bodyHtml,
      locale: p.locale, isActive: p.isActive,
    }).where(and(eq(schema.emailTemplates.id, p.id), eq(schema.emailTemplates.tenantId, tenant.id)));
  } else {
    await db.insert(schema.emailTemplates).values({
      tenantId: tenant.id,
      key: p.key, subject: p.subject, bodyHtml: p.bodyHtml,
      locale: p.locale, isActive: p.isActive,
    });
  }
  revalidatePath("/templates");
}

export async function deleteTemplate(id: string) {
  z.string().uuid().parse(id);
  const { tenant } = await requireUser();
  await db.delete(schema.emailTemplates)
    .where(and(eq(schema.emailTemplates.id, id), eq(schema.emailTemplates.tenantId, tenant.id)));
  revalidatePath("/templates");
}
