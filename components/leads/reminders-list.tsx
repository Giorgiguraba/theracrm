"use client";
import { useTransition } from "react";
import { Check, Clock, Trash2, MoonStar } from "lucide-react";
import { markReminderDone, snoozeReminder, deleteReminder } from "@/lib/actions/reminders";
import { toast } from "sonner";
import type { Reminder } from "@/lib/db/schema";

export function RemindersList({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) {
    return (
      <p className="text-xs text-[var(--text-faint)] py-3 text-center">No reminders yet.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {reminders.map((r) => <ReminderRow key={r.id} reminder={r} />)}
    </ul>
  );
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const [pending, start] = useTransition();
  const due = new Date(reminder.dueAt);
  const overdue = reminder.status === "pending" && due.getTime() < Date.now();
  const isDone = reminder.status === "done";

  return (
    <li className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all ${pending ? "opacity-60" : ""}`}
      style={{
        background: isDone ? "var(--surface-2)" : "var(--surface)",
        borderColor: overdue ? "color-mix(in oklch, var(--color-status-overdue) 40%, transparent)" : "var(--border)",
      }}>
      <Clock className="w-3.5 h-3.5 shrink-0"
        style={{ color: overdue ? "var(--color-status-overdue)" : isDone ? "var(--color-status-enrolled)" : "var(--text-faint)" }} />
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium tabular-nums ${isDone ? "line-through text-[var(--text-faint)]" : ""}`}>
          {due.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </div>
        {overdue && !isDone && (
          <div className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-status-overdue)" }}>Overdue</div>
        )}
      </div>
      {!isDone && (
        <>
          <IconBtn title="Mark done" onClick={() => start(async () => {
            try { await markReminderDone(reminder.id); toast.success("Done"); }
            catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
          })}><Check className="w-3.5 h-3.5" /></IconBtn>
          <IconBtn title="Snooze 1 day" onClick={() => start(async () => {
            try {
              const next = new Date(due); next.setDate(next.getDate() + 1);
              await snoozeReminder({ id: reminder.id, until: next.toISOString() });
              toast.success("Snoozed");
            } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
          })}><MoonStar className="w-3.5 h-3.5" /></IconBtn>
        </>
      )}
      <IconBtn title="Delete" onClick={() => start(async () => {
        try { await deleteReminder(reminder.id); toast.success("Removed"); }
        catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
      })}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
    </li>
  );
}

function IconBtn({ children, title, onClick }:
  { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button type="button" title={title} onClick={onClick}
      className="w-7 h-7 rounded-md grid place-items-center text-[var(--text-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors">
      {children}
    </button>
  );
}
