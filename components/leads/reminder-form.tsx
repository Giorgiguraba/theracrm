"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { createReminder } from "@/lib/actions/reminders";
import { toast } from "sonner";

function presetDate(addDays: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, 0, 0, 0);
  // local YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ReminderForm({ leadId }: { leadId: string }) {
  const [dueAt, setDueAt] = useState(presetDate(1));
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            await createReminder({
              leadId,
              dueAt: new Date(dueAt).toISOString(),
              note: note || null,
            });
            setNote("");
            toast.success("Reminder set");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          }
        });
      }}
      className="space-y-3"
    >
      <div className="flex flex-wrap gap-1.5">
        <Chip onClick={() => setDueAt(presetDate(0, 18))}>Later today</Chip>
        <Chip onClick={() => setDueAt(presetDate(1))}>Tomorrow</Chip>
        <Chip onClick={() => setDueAt(presetDate(2))}>+2d</Chip>
        <Chip onClick={() => setDueAt(presetDate(7))}>+1 week</Chip>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="dueAt" className="text-xs">When</Label>
          <Input id="dueAt" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
        </div>
        <div className="space-y-1.5 self-end">
          <Button type="submit" disabled={pending} className="h-9">
            <Bell className="w-3.5 h-3.5" /> {pending ? "…" : "Set reminder"}
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note" className="text-xs">Note (optional)</Label>
        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Call back about pricing…" />
      </div>
    </form>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="px-2.5 py-1 rounded-full text-xs border transition-all hover:-translate-y-px"
      style={{
        background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-soft)",
      }}>
      {children}
    </button>
  );
}
