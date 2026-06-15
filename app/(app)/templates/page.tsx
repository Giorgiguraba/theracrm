import { db, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { Mail } from "lucide-react";
import { TemplateEditor } from "./template-editor";

export default async function TemplatesPage() {
  const { tenant, role } = await requireUser();
  const templates = await db.select().from(schema.emailTemplates)
    .where(eq(schema.emailTemplates.tenantId, tenant.id))
    .orderBy(asc(schema.emailTemplates.key));

  const canEdit = role === "admin" || role === "platform_admin";

  return (
    <div className="px-8 py-7 max-w-5xl mx-auto">
      <header className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-white shrink-0"
          style={{
            background: "conic-gradient(from 220deg, var(--color-accent), var(--color-accent-2), var(--color-accent))",
            boxShadow: "0 8px 24px var(--color-accent-glow), inset 0 1px 0 oklch(100% 0 0 / 0.3)",
          }}>
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight leading-none">Email templates</h1>
          <p className="text-sm text-[var(--text-soft)] mt-2">
            <b className="text-[var(--text)] font-semibold tabular-nums">{templates.length}</b> templates —
            use <code className="text-xs font-mono">{`{name}`}</code>, <code className="text-xs font-mono">{`{program}`}</code>, <code className="text-xs font-mono">{`{start_date}`}</code> as variables
          </p>
        </div>
      </header>

      <TemplateEditor templates={templates} canEdit={canEdit} />
    </div>
  );
}
