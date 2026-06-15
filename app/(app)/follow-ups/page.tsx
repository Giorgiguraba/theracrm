import { db, schema } from "@/lib/db";
import { and, eq, asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { StageChip } from "@/components/ui/select-stage";
import { initials, relativeTime } from "@/lib/utils";
import { ensureStuckLeadReminders } from "@/lib/actions/auto-reminders";

const isToday = (d: Date) => {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

export default async function FollowUpsPage() {
  const { tenant } = await requireUser();
  await ensureStuckLeadReminders();
  const [reminders, leads] = await Promise.all([
    db.select().from(schema.reminders)
      .where(and(eq(schema.reminders.tenantId, tenant.id)))
      .orderBy(asc(schema.reminders.dueAt)),
    db.select().from(schema.leads).where(eq(schema.leads.tenantId, tenant.id)),
  ]);

  const now = new Date();
  const overdue = reminders.filter((r) => r.status === "pending" && new Date(r.dueAt) < now && !isToday(new Date(r.dueAt)));
  const today = reminders.filter((r) => r.status !== "done" && isToday(new Date(r.dueAt)));
  const upcoming = reminders.filter((r) => r.status !== "done" && new Date(r.dueAt) > now && !isToday(new Date(r.dueAt)));
  const done = reminders.filter((r) => r.status === "done").slice(-15).reverse();

  const leadById = (id: string) => leads.find((l) => l.id === id);

  return (
    <div className="px-8 py-7 max-w-5xl mx-auto">
      <header className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-white shrink-0"
          style={{
            background: "conic-gradient(from 220deg, var(--color-accent), var(--color-accent-2), var(--color-accent))",
            boxShadow: "0 8px 24px var(--color-accent-glow), inset 0 1px 0 oklch(100% 0 0 / 0.3)",
          }}>
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight leading-none">Follow-ups</h1>
          <p className="text-sm text-[var(--text-soft)] mt-2">
            <b className="text-[var(--color-status-overdue)] font-semibold tabular-nums">{overdue.length}</b> overdue ·
            <b className="text-[var(--text)] font-semibold tabular-nums"> {today.length}</b> today ·
            <b className="text-[var(--text)] font-semibold tabular-nums"> {upcoming.length}</b> upcoming
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <Section title="Overdue" empty="Nothing overdue." reminders={overdue} leadById={leadById} tint="var(--color-status-overdue)" />
        <Section title="Today" empty="Nothing due today." reminders={today} leadById={leadById} tint="var(--color-accent)" />
        <Section title="Upcoming" empty="No upcoming reminders." reminders={upcoming.slice(0, 20)} leadById={leadById} tint="var(--text-soft)" />
        {done.length > 0 && (
          <Section title="Recently done" empty="" reminders={done} leadById={leadById} tint="var(--color-status-enrolled)" />
        )}
      </div>
    </div>
  );
}

function Section({
  title, empty, reminders, leadById, tint,
}: {
  title: string;
  empty: string;
  reminders: (typeof schema.reminders.$inferSelect)[];
  leadById: (id: string) => typeof schema.leads.$inferSelect | undefined;
  tint: string;
}) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ background: tint }} />
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <span className="text-xs text-[var(--text-faint)] tabular-nums">· {reminders.length}</span>
      </div>
      {reminders.length === 0 ? (
        <p className="text-sm text-[var(--text-faint)] py-2">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => {
            const lead = leadById(r.leadId);
            if (!lead) return null;
            return (
              <li key={r.id} className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <Link href={`/leads/${lead.id}`} className="flex items-center gap-2.5 flex-1 min-w-0 group">
                  <div className="w-9 h-9 rounded-full grid place-items-center text-white text-xs font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}>
                    {initials(lead.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate group-hover:text-[var(--color-accent)] transition-colors">
                      {lead.fullName}
                    </div>
                    <div className="text-[11px] text-[var(--text-faint)] tabular-nums">
                      {new Date(r.dueAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      {" · "}
                      {relativeTime(r.dueAt)}
                    </div>
                  </div>
                  <StageChip stage={lead.stage} />
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-faint)] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
