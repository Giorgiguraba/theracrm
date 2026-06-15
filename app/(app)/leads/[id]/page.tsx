import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { and, asc, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { StageChip } from "@/components/ui/select-stage";
import { relativeTime } from "@/lib/utils";
import { Phone, Mail, ArrowLeft, MessageSquare, Calendar, Tag, Activity, Bell, MapPin, Briefcase, Cake } from "lucide-react";
import Link from "next/link";
import { NoteForm } from "./note-form";
import { StageSwitcher } from "./stage-switcher";
import { LeadPhotoUpload } from "@/components/leads/photo-upload";
import { EditLeadButton } from "@/components/leads/lead-edit-form";
import { ReminderForm } from "@/components/leads/reminder-form";
import { RemindersList } from "@/components/leads/reminders-list";

const AVATAR_PALETTES = [
  ["oklch(70% 0.22 320)", "oklch(60% 0.22 290)"],
  ["oklch(70% 0.22 350)", "oklch(60% 0.22 320)"],
  ["oklch(76% 0.16 65)", "oklch(64% 0.18 50)"],
  ["oklch(72% 0.18 160)", "oklch(60% 0.18 145)"],
  ["oklch(68% 0.20 25)", "oklch(58% 0.20 15)"],
  ["oklch(74% 0.16 195)", "oklch(60% 0.16 180)"],
] as const;
const gradFor = (id: string) => {
  const i = Math.abs([...id].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[i];
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenant } = await requireUser();

  const [lead] = await db.select().from(schema.leads)
    .where(and(eq(schema.leads.id, id), eq(schema.leads.tenantId, tenant.id)));
  if (!lead) notFound();

  const [allPrograms, [program], acts, reminders] = await Promise.all([
    db.select().from(schema.programs).where(eq(schema.programs.tenantId, tenant.id)),
    lead.programId
      ? db.select().from(schema.programs).where(eq(schema.programs.id, lead.programId))
      : Promise.resolve([null]),
    db.select().from(schema.activities)
      .where(and(eq(schema.activities.leadId, id), eq(schema.activities.tenantId, tenant.id)))
      .orderBy(desc(schema.activities.createdAt))
      .limit(50),
    db.select().from(schema.reminders)
      .where(and(eq(schema.reminders.leadId, id), eq(schema.reminders.tenantId, tenant.id)))
      .orderBy(asc(schema.reminders.dueAt)),
  ]);

  const [c1, c2] = gradFor(lead.id);

  return (
    <div className="px-8 py-7 max-w-6xl mx-auto">
      <Link href="/leads"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-soft)] mb-6 hover:text-[var(--text)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to pipeline
      </Link>

      {/* HERO */}
      <header className="glass-card rounded-3xl p-7 mb-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: c1 }} />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: c2 }} />

        <div className="flex items-start gap-5 flex-wrap relative z-10">
          <LeadPhotoUpload leadId={lead.id} fullName={lead.fullName} photoUrl={lead.photoUrl} tenantId={tenant.id} size={88} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{lead.fullName}</h1>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <StageChip stage={lead.stage} />
                  <span className="text-xs text-[var(--text-faint)]">
                    Created {relativeTime(lead.createdAt)} · stage changed {relativeTime(lead.stageChangedAt)}
                  </span>
                </div>
              </div>
              <EditLeadButton lead={lead} programs={allPrograms.map((p) => ({ id: p.id, name: p.name }))} />
            </div>
          </div>
        </div>

        <div className="mt-6 relative z-10">
          <StageSwitcher leadId={lead.id} current={lead.stage} />
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* REMINDERS */}
          <section className="glass-card rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" /> Reminders
            </h2>
            <ReminderForm leadId={lead.id} />
            {reminders.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <RemindersList reminders={reminders} />
              </div>
            )}
          </section>

          {/* NOTE */}
          <section className="glass-card rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Add a note
            </h2>
            <NoteForm leadId={lead.id} />
          </section>

          {/* NOTES (lead-level free-text) */}
          {lead.notes && (
            <section className="glass-card rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-3">Profile notes</h2>
              <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
            </section>
          )}

          {/* ACTIVITY */}
          <section>
            <h2 className="text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Activity
            </h2>
            <ol className="space-y-2.5">
              {acts.map((a, i) => (
                <li key={a.id} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full ring-2 ring-[var(--bg)]"
                      style={{ background: i === 0 ? "var(--color-accent)" : "var(--border-strong)" }} />
                    {i < acts.length - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: "var(--border)" }} />
                    )}
                  </div>
                  <div className="flex-1 glass-card rounded-xl p-3.5 -mt-0.5 mb-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold capitalize">{a.type.replace("_", " ")}</span>
                      <span className="text-[11px] text-[var(--text-faint)] tabular-nums">{relativeTime(a.createdAt)}</span>
                    </div>
                    {a.type === "stage_change" && a.payload && (
                      <div className="text-sm flex items-center gap-1.5">
                        <StageChip stage={(a.payload as { from: schema.Lead["stage"] }).from as never} />
                        <span className="text-[var(--text-faint)]">→</span>
                        <StageChip stage={(a.payload as { to: schema.Lead["stage"] }).to as never} />
                      </div>
                    )}
                    {a.type === "note" && a.payload && (
                      <p className="text-sm whitespace-pre-wrap">
                        {String((a.payload as Record<string, unknown>).message ?? "")}
                      </p>
                    )}
                    {a.type === "reminder" && a.payload && (
                      <p className="text-sm">
                        Reminder set for{" "}
                        <b>{new Date(String((a.payload as Record<string, unknown>).dueAt)).toLocaleString()}</b>
                      </p>
                    )}
                  </div>
                </li>
              ))}
              {acts.length === 0 && (
                <li className="text-sm text-[var(--text-faint)] glass-card rounded-xl p-5 text-center">
                  No activity yet.
                </li>
              )}
            </ol>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-3">
          <SideRow label="Phone" value={lead.phone} icon={Phone} />
          <SideRow label="Email" value={lead.email} icon={Mail} />
          <SideRow label="Source" value={lead.source.replace("_", " ")} icon={Tag} />
          <SideRow label="Program" value={program?.name ?? "—"} icon={Tag} />
          {program?.price && <SideRow label="Price" value={`₾ ${program.price}`} icon={Tag} />}
          <SideRow label="City" value={lead.city} icon={MapPin} />
          <SideRow label="Occupation" value={lead.occupation} icon={Briefcase} />
          <SideRow
            label="Birth date"
            value={lead.birthDate ? new Date(lead.birthDate).toLocaleDateString() : null}
            icon={Cake}
          />
          <SideRow label="Stage changed" value={relativeTime(lead.stageChangedAt)} icon={Calendar} />
        </aside>
      </div>
    </div>
  );
}

function SideRow({ label, value, icon: Icon }:
  { label: string; value?: string | null; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="glass-card shimmer rounded-xl p-3.5">
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-faint)] mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-sm font-medium">
        {value || <span className="text-[var(--text-faint)]">—</span>}
      </div>
    </div>
  );
}
