"use client";
import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createLead } from "@/lib/actions/leads";
import { toast } from "sonner";

export function NewLeadButton({ programs }: { programs: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4" /> New lead</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new lead</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              try {
                await createLead({
                  fullName: String(fd.get("fullName") || ""),
                  phone: String(fd.get("phone") || ""),
                  email: String(fd.get("email") || ""),
                  source: (String(fd.get("source") || "manual") as "manual"),
                  programId: String(fd.get("programId") || "") || null,
                  notes: String(fd.get("notes") || ""),
                });
                toast.success("Lead added");
                setOpen(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
              }
            });
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" placeholder="+995 5xx xxx xxx" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="optional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <select id="source" name="source" defaultValue="manual"
                className="h-9 w-full rounded-lg border bg-[var(--surface)] px-3 text-sm"
                style={{ borderColor: "var(--border)" }}>
                <option value="manual">Manual</option>
                <option value="fb_ads">Facebook Ads</option>
                <option value="ig_ads">Instagram Ads</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="programId">Program</Label>
              <select id="programId" name="programId"
                className="h-9 w-full rounded-lg border bg-[var(--surface)] px-3 text-sm"
                style={{ borderColor: "var(--border)" }}>
                <option value="">—</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea id="notes" name="notes" rows={3}
              className="w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)" }} />
          </div>
          {error && <p className="text-sm text-[var(--color-status-overdue)]">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add lead"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
