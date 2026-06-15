"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addLeadNote } from "@/lib/actions/leads";
import { toast } from "sonner";

export function NoteForm({ leadId }: { leadId: string }) {
  const [val, setVal] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const message = val.trim();
        if (!message) return;
        start(async () => {
          try {
            await addLeadNote({ id: leadId, message });
            setVal(""); toast.success("Note added");
          } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
        });
      }}
      className="space-y-2"
    >
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={3}
        placeholder="Called, said she'll think about it…"
        className="w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm"
        style={{ borderColor: "var(--border)" }}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending || !val.trim()}>
          {pending ? "Adding…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}
