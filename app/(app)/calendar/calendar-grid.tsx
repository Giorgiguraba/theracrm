"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Bot, Check, MoonStar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Reminder } from "@/lib/db/schema";
import { createReminder, markReminderDone, snoozeReminder, deleteReminder } from "@/lib/actions/reminders";
import { useRouter } from "next/navigation";

type LeadLite = { id: string; fullName: string };

export function CalendarGrid({
  year, month, reminders, leads,
}: {
  year: number; month: number;
  reminders: Reminder[];
  leads: LeadLite[];
}) {
  const router = useRouter();
  const [openDay, setOpenDay] = useState<string | null>(null);

  // Build grid: 6 rows × 7 cols, Monday first
  const first = new Date(year, month - 1, 1);
  const dayOfWeek = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < dayOfWeek; i++) {
    cells.push({ date: new Date(year, month - 1, -dayOfWeek + i + 1), inMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(year, month - 1, i), inMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }

  const byDay = new Map<string, Reminder[]>();
  reminders.forEach((r) => {
    const k = new Date(r.dueAt).toISOString().slice(0, 10);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(r);
  });
  const leadName = (id: string) => leads.find((l) => l.id === id)?.fullName ?? "—";

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  return (
    <>
      {/* Navigator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <Link href={`/calendar?y=${prev.y}&m=${prev.m}`}
            className="w-9 h-9 grid place-items-center rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
            title="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <Link href="/calendar"
            className="px-3 h-9 grid place-items-center rounded-lg text-sm hover:bg-[var(--surface-hover)] transition-colors">
            Today
          </Link>
          <Link href={`/calendar?y=${next.y}&m=${next.m}`}
            className="w-9 h-9 grid place-items-center rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
            title="Next month">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="text-xs text-[var(--text-faint)]">
          Click any day to add a reminder.
          <Bot className="inline w-3.5 h-3.5 ml-3 mr-1 text-[var(--color-accent)]" />
          Auto reminders fire after 7 days of no enrollment.
        </div>
      </div>

      {/* Grid */}
      <div className="glass-card rounded-3xl p-4">
        <div className="grid grid-cols-7 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-2 py-1.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((c) => {
            const key = c.date.toISOString().slice(0, 10);
            const day = byDay.get(key) ?? [];
            const isToday = key === new Date().toISOString().slice(0, 10);
            return (
              <button key={key} onClick={() => setOpenDay(key)}
                className="text-left min-h-[120px] rounded-2xl p-2.5 transition-all hover:scale-[1.02]"
                style={{
                  background: c.inMonth ? "var(--surface)" : "var(--surface-2)",
                  border: `1px solid ${isToday ? "var(--color-accent)" : "var(--border)"}`,
                  opacity: c.inMonth ? 1 : 0.4,
                  boxShadow: isToday
                    ? "0 0 0 1px var(--color-accent), 0 12px 32px -8px var(--color-accent-glow)"
                    : "none",
                }}>
                <div className={`text-xs font-semibold mb-1.5 tabular-nums ${isToday ? "text-[var(--color-accent)]" : ""}`}>
                  {c.date.getDate()}
                </div>
                <div className="space-y-1">
                  {day.slice(0, 3).map((r) => {
                    const done = r.status === "done";
                    const overdue = r.status === "pending" && new Date(r.dueAt) < new Date();
                    return (
                      <div key={r.id}
                        className="px-1.5 py-1 rounded-md text-[10px] font-medium truncate flex items-center gap-1"
                        style={{
                          background: done
                            ? "color-mix(in oklch, var(--color-status-enrolled) 12%, transparent)"
                            : overdue
                              ? "color-mix(in oklch, var(--color-status-overdue) 14%, transparent)"
                              : r.createdBySystem
                                ? "color-mix(in oklch, var(--color-accent) 16%, transparent)"
                                : "color-mix(in oklch, var(--color-status-new) 14%, transparent)",
                          color: done
                            ? "var(--color-status-enrolled)"
                            : overdue
                              ? "var(--color-status-overdue)"
                              : r.createdBySystem
                                ? "var(--color-accent)"
                                : "var(--color-status-new)",
                          textDecoration: done ? "line-through" : "none",
                        }}>
                        {r.createdBySystem && <Bot className="w-2.5 h-2.5 shrink-0" />}
                        <span className="font-semibold tabular-nums">
                          {new Date(r.dueAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>{" "}
                        <span className="truncate">{leadName(r.leadId)}</span>
                      </div>
                    );
                  })}
                  {day.length > 3 && (
                    <div className="text-[10px] text-[var(--text-faint)]">+{day.length - 3} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day modal */}
      {openDay && (
        <DayPanel
          day={openDay}
          reminders={byDay.get(openDay) ?? []}
          leads={leads}
          onClose={() => setOpenDay(null)}
          onChange={() => router.refresh()}
        />
      )}
    </>
  );
}

function DayPanel({
  day, reminders, leads, onClose, onChange,
}: {
  day: string;
  reminders: Reminder[];
  leads: LeadLite[];
  onClose: () => void;
  onChange: () => void;
}) {
  const [leadId, setLeadId] = useState(leads[0]?.id ?? "");
  const [time, setTime] = useState("10:00");
  const [pending, start] = useTransition();
  const date = new Date(day);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-6"
      onClick={onClose}>
      <div className="glass-card rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-faint)] font-semibold mb-1">
              {date.toLocaleDateString(undefined, { weekday: "long" })}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight leading-none">
              {date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
            </h2>
          </div>
        </div>

        {/* Quick add */}
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!leadId) return;
          const dt = new Date(day);
          const [h, m] = time.split(":").map(Number);
          dt.setHours(h, m, 0, 0);
          start(async () => {
            try {
              await createReminder({ leadId, dueAt: dt.toISOString(), note: null });
              toast.success("Reminder added");
              onChange();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          });
        }} className="rounded-2xl border p-3 mb-4" style={{ borderColor: "var(--border)" }}>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-faint)] font-semibold mb-2">
            Quick add
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)} required
              className="h-9 rounded-lg border bg-[var(--surface)] px-3 text-sm"
              style={{ borderColor: "var(--border)" }}>
              <option value="">Select customer</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}
            </select>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required
              className="h-9 rounded-lg border bg-[var(--surface)] px-3 text-sm tabular-nums"
              style={{ borderColor: "var(--border)" }} />
          </div>
          <button type="submit" disabled={pending}
            className="w-full h-9 mt-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{
              background: "var(--color-accent)",
              color: "oklch(15% 0.05 130)",
              boxShadow: "0 4px 12px var(--color-accent-glow)",
            }}>
            <Plus className="w-3.5 h-3.5" />
            {pending ? "Adding…" : "Add reminder"}
          </button>
        </form>

        {/* Existing list */}
        <div className="space-y-2">
          {reminders.length === 0 && (
            <p className="text-sm text-[var(--text-faint)] text-center py-3">
              No reminders for this day yet.
            </p>
          )}
          {reminders.map((r) => (
            <DayReminderRow key={r.id} r={r}
              leadName={leads.find((l) => l.id === r.leadId)?.fullName ?? "—"}
              onChange={onChange} />
          ))}
        </div>

        <button onClick={onClose}
          className="w-full h-9 mt-4 rounded-lg text-sm text-[var(--text-soft)] hover:bg-[var(--surface-hover)] transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

function DayReminderRow({ r, leadName, onChange }:
  { r: Reminder; leadName: string; onChange: () => void }) {
  const [pending, start] = useTransition();
  const overdue = r.status === "pending" && new Date(r.dueAt) < new Date();
  const done = r.status === "done";

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl border"
      style={{ background: "var(--surface)", borderColor: "var(--border)", opacity: pending ? 0.6 : 1 }}>
      {r.createdBySystem && <Bot className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-accent)" }} />}
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-semibold truncate ${done ? "line-through opacity-60" : ""}`}>
          {leadName}
        </div>
        <div className={`text-[10px] tabular-nums ${overdue ? "text-[var(--color-status-overdue)]" : "text-[var(--text-faint)]"}`}>
          {new Date(r.dueAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          {overdue && " · overdue"}
        </div>
      </div>
      {!done && (
        <>
          <button title="Done" onClick={() => start(async () => {
            try { await markReminderDone(r.id); toast.success("Done"); onChange(); }
            catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
          })}
            className="w-7 h-7 rounded-md grid place-items-center hover:bg-[var(--surface-hover)]">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button title="Snooze 1 day" onClick={() => start(async () => {
            try {
              const next = new Date(r.dueAt); next.setDate(next.getDate() + 1);
              await snoozeReminder({ id: r.id, until: next.toISOString() });
              toast.success("Snoozed"); onChange();
            } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
          })}
            className="w-7 h-7 rounded-md grid place-items-center hover:bg-[var(--surface-hover)]">
            <MoonStar className="w-3.5 h-3.5" />
          </button>
        </>
      )}
      <button title="Delete" onClick={() => start(async () => {
        try { await deleteReminder(r.id); toast.success("Removed"); onChange(); }
        catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
      })}
        className="w-7 h-7 rounded-md grid place-items-center hover:bg-[var(--surface-hover)]">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
