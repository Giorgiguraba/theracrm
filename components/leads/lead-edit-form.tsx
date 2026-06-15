"use client";
import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { updateLead } from "@/lib/actions/leads";
import { toast } from "sonner";
import type { Lead } from "@/lib/db/schema";

export function EditLeadButton({
  lead, programs,
}: {
  lead: Lead;
  programs: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Pencil className="w-3.5 h-3.5" /> Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit lead</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              try {
                await updateLead({
                  id: lead.id,
                  fullName: String(fd.get("fullName") || ""),
                  phone: String(fd.get("phone") || ""),
                  email: String(fd.get("email") || ""),
                  source: String(fd.get("source") || "manual") as "manual",
                  programId: String(fd.get("programId") || "") || null,
                  notes: String(fd.get("notes") || ""),
                  birthDate: String(fd.get("birthDate") || ""),
                  city: String(fd.get("city") || ""),
                  occupation: String(fd.get("occupation") || ""),
                  photoUrl: lead.photoUrl,
                });
                toast.success("Saved");
                setOpen(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
              }
            });
          }}
          className="space-y-3 max-h-[70vh] overflow-y-auto pr-1"
        >
          <Field label="Full name"><Input name="fullName" defaultValue={lead.fullName} required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"><Input name="phone" defaultValue={lead.phone ?? ""} placeholder="+995 5xx xxx xxx" /></Field>
            <Field label="Email"><Input name="email" type="email" defaultValue={lead.email ?? ""} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Birth date"><Input name="birthDate" type="date" defaultValue={lead.birthDate ?? ""} /></Field>
            <Field label="City"><Input name="city" defaultValue={lead.city ?? ""} /></Field>
          </div>
          <Field label="Occupation"><Input name="occupation" defaultValue={lead.occupation ?? ""} placeholder="Psychology student, teacher, etc." /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <select name="source" defaultValue={lead.source}
                className="h-9 w-full rounded-lg border bg-[var(--surface)] px-3 text-sm"
                style={{ borderColor: "var(--border)" }}>
                <option value="manual">Manual</option>
                <option value="fb_ads">Facebook Ads</option>
                <option value="ig_ads">Instagram Ads</option>
                <option value="referral">Referral</option>
              </select>
            </Field>
            <Field label="Program">
              <select name="programId" defaultValue={lead.programId ?? ""}
                className="h-9 w-full rounded-lg border bg-[var(--surface)] px-3 text-sm"
                style={{ borderColor: "var(--border)" }}>
                <option value="">—</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea name="notes" defaultValue={lead.notes ?? ""} rows={4}
              className="w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)" }} />
          </Field>

          {error && <p className="text-sm text-[var(--color-status-overdue)]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
