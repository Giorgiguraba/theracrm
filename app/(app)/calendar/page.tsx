import { db, schema } from "@/lib/db";
import { and, eq, gte, lte, asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { Calendar as CalIcon } from "lucide-react";
import { CalendarGrid } from "./calendar-grid";
import { ensureStuckLeadReminders } from "@/lib/actions/auto-reminders";

type Search = { [key: string]: string | string[] | undefined };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.y ?? now.getFullYear());
  const month = Number(sp.m ?? (now.getMonth() + 1)); // 1-12

  const { tenant } = await requireUser();
  await ensureStuckLeadReminders();

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const [reminders, leads] = await Promise.all([
    db.select().from(schema.reminders).where(and(
      eq(schema.reminders.tenantId, tenant.id),
      gte(schema.reminders.dueAt, start),
      lte(schema.reminders.dueAt, end),
    )).orderBy(asc(schema.reminders.dueAt)),
    db.select().from(schema.leads).where(eq(schema.leads.tenantId, tenant.id)),
  ]);

  const monthName = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  // Auto-system reminder count for the badge
  const autoCount = reminders.filter((r) => r.createdBySystem && r.status === "pending").length;

  return (
    <div className="px-8 py-7">
      <header className="mb-8">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-7">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-faint)] font-semibold mb-2">
              Schedule
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight leading-none flex items-center gap-3">
              <CalIcon className="w-12 h-12" style={{ color: "var(--color-accent)" }} />
              {monthName}
            </h1>
          </div>
        </div>

        <div className="flex items-end gap-10 flex-wrap">
          <div className="display-num">
            {reminders.length}
            <small>This month</small>
          </div>
          <div className="display-num" style={{ color: "var(--color-status-overdue)" }}>
            {reminders.filter((r) => r.status === "pending" && new Date(r.dueAt) < new Date()).length}
            <small style={{ color: "var(--text-soft)" }}>Overdue</small>
          </div>
          <div className="display-num" style={{ color: "var(--color-accent)" }}>
            {autoCount}
            <small style={{ color: "var(--text-soft)" }}>Auto stuck-lead</small>
          </div>
        </div>
      </header>

      <CalendarGrid
        year={year}
        month={month}
        reminders={reminders}
        leads={leads.map((l) => ({ id: l.id, fullName: l.fullName }))}
      />
    </div>
  );
}
