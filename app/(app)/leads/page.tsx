import { db, schema } from "@/lib/db";
import { and, asc, eq, gte, isNull, lte } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { KanbanBoard } from "@/components/leads/kanban";
import { NewLeadButton } from "@/components/leads/lead-form";
import { InterestFilterProvider, InterestFilterTabs } from "@/components/leads/interest-filter";
import { ActivityCard, type ActivityCardData } from "@/components/leads/activity-card";
import { ensureStuckLeadReminders } from "@/lib/actions/auto-reminders";

export default async function LeadsPage() {
  const { tenant } = await requireUser();

  // Auto-create reminders for leads stuck > 7 days
  await ensureStuckLeadReminders();

  // Today's task window: midnight today → midnight tomorrow
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay); endOfDay.setDate(endOfDay.getDate() + 1);

  const [leads, programs, todaysReminders] = await Promise.all([
    db.select().from(schema.leads).where(and(
      eq(schema.leads.tenantId, tenant.id),
      isNull(schema.leads.deletedAt),
    )).orderBy(schema.leads.createdAt),
    db.select().from(schema.programs).where(eq(schema.programs.tenantId, tenant.id)),
    db.select().from(schema.reminders).where(and(
      eq(schema.reminders.tenantId, tenant.id),
      gte(schema.reminders.dueAt, startOfDay),
      lte(schema.reminders.dueAt, endOfDay),
    )).orderBy(asc(schema.reminders.dueAt)).limit(8),
  ]);

  const enrolled = leads.filter((l) => l.stage === "enrolled").length;
  const won = leads.filter((l) => l.stage === "enrolled").length;
  const lost = leads.filter((l) => l.stage === "lost").length;

  // Build activity cards from today's reminders
  const taskCards: ActivityCardData[] = todaysReminders.map((r, i) => {
    const lead = leads.find((l) => l.id === r.leadId);
    const time = new Date(r.dueAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
    const overdue = r.status === "pending" && new Date(r.dueAt) < new Date();
    return {
      href: lead ? `/leads/${lead.id}` : "/leads",
      personName: lead?.fullName ?? "—",
      personRole: r.createdBySystem ? "Auto follow-up" : "Manual reminder",
      personPhoto: lead?.photoUrl ?? null,
      title: r.createdBySystem ? "Call / Email reminder" : "Follow-up",
      kind: r.createdBySystem ? "reminder" : "call",
      when: time,
      attendees: lead ? [{ name: lead.fullName, photo: lead.photoUrl }] : [],
      status: r.status === "done"
        ? { label: "Done", tone: "done" }
        : overdue
          ? { label: "Overdue", tone: "overdue" }
          : { label: "Scheduled", tone: "scheduled" },
      variant: i === 0 ? "lime" : "dark",   // first card gets the lime treatment
      hasAlert: overdue,
    };
  });

  return (
    <InterestFilterProvider>
      <div className="px-8 py-7">
        {/* HERO */}
        <header className="mb-8">
          <div className="flex items-end justify-between gap-6 flex-wrap mb-7">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-faint)] font-semibold mb-2">
                Your workspace
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight leading-none">
                Leads pipeline
              </h1>
            </div>
            <NewLeadButton programs={programs.map((p) => ({ id: p.id, name: p.name }))} />
          </div>

          <div className="flex items-end gap-10 flex-wrap">
            <div className="display-num">
              {leads.length}
              <small>Total leads</small>
            </div>
            <div className="display-num" style={{ color: "var(--color-accent)" }}>
              {won}
              <small style={{ color: "var(--text-soft)" }}>Won this month</small>
            </div>
            <div className="display-num" style={{ color: "var(--color-status-overdue)" }}>
              {lost}
              <small style={{ color: "var(--text-soft)" }}>Lost</small>
            </div>
            <div className="ml-auto">
              <InterestFilterTabs />
            </div>
          </div>
        </header>

        {/* BOARD */}
        <KanbanBoard leads={leads} programs={programs.map((p) => ({ id: p.id, name: p.name }))} />

        {/* TODAY'S TASKS */}
        {taskCards.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-faint)] font-semibold mb-1">
                  Today's tasks
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {taskCards.length} {taskCards.length === 1 ? "thing" : "things"} to do
                </h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {taskCards.map((t, i) => <ActivityCard key={i} data={t} />)}
            </div>
          </section>
        )}
      </div>
    </InterestFilterProvider>
  );
}
