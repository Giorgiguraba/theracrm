import { db, schema } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { CustomersExplorer } from "./customers-explorer";
import { Users } from "lucide-react";

export default async function CustomersPage() {
  const { tenant } = await requireUser();

  const [leads, programs] = await Promise.all([
    db.select().from(schema.leads).where(and(
      eq(schema.leads.tenantId, tenant.id),
      isNull(schema.leads.deletedAt),
    )),
    db.select().from(schema.programs).where(eq(schema.programs.tenantId, tenant.id)),
  ]);

  const enrolled = leads.filter((l) => l.stage === "enrolled").length;
  const active = leads.filter((l) => l.stage !== "lost" && l.stage !== "enrolled").length;

  return (
    <div className="px-8 py-7">
      <header className="mb-8">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-7">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-faint)] font-semibold mb-2">
              Directory
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight leading-none flex items-center gap-3">
              <Users className="w-12 h-12" style={{ color: "var(--color-accent)" }} />
              Customers
            </h1>
          </div>
        </div>

        <div className="flex items-end gap-10 flex-wrap">
          <div className="display-num">
            {leads.length}
            <small>Total</small>
          </div>
          <div className="display-num" style={{ color: "var(--color-accent)" }}>
            {enrolled}
            <small style={{ color: "var(--text-soft)" }}>Enrolled</small>
          </div>
          <div className="display-num">
            {active}
            <small>In pipeline</small>
          </div>
        </div>
      </header>

      <CustomersExplorer leads={leads} programs={programs.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  );
}
