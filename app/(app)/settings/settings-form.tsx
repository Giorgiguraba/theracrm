"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTenantSettings } from "@/lib/actions/settings";
import { toast } from "sonner";

export function SettingsForm({
  initial, canEdit,
}: {
  canEdit: boolean;
  initial: { followupHours: number; locale: "ka" | "en"; adSpendMonthly: string; autoFollowupEmail: boolean };
}) {
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          try {
            await updateTenantSettings({
              followupHours: Number(fd.get("followupHours") || 48),
              locale: (String(fd.get("locale") || "ka") as "ka" | "en"),
              adSpendMonthly: String(fd.get("adSpendMonthly") || ""),
              autoFollowupEmail: fd.get("autoFollowupEmail") === "on",
            });
            toast.success("Settings saved");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          }
        });
      }}
      className="glass-card rounded-2xl p-5 space-y-4"
    >
      <h2 className="text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider">Preferences</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="followupHours">Follow-up trigger (hours)</Label>
          <Input id="followupHours" name="followupHours" type="number" min={1} max={720}
            defaultValue={initial.followupHours} disabled={!canEdit} />
          <p className="text-[11px] text-[var(--text-faint)]">
            How long a lead can stay in "Thinking" before triggering a follow-up.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="locale">Default locale</Label>
          <select id="locale" name="locale" defaultValue={initial.locale} disabled={!canEdit}
            className="h-9 w-full rounded-lg border bg-[var(--surface)] px-3 text-sm"
            style={{ borderColor: "var(--border)" }}>
            <option value="ka">ქართული (ka)</option>
            <option value="en">English (en)</option>
          </select>
          <p className="text-[11px] text-[var(--text-faint)]">
            Language used in automated emails by default.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="adSpendMonthly">Monthly ad spend (₾)</Label>
          <Input id="adSpendMonthly" name="adSpendMonthly" type="number" step="0.01" min={0}
            defaultValue={initial.adSpendMonthly ?? ""} disabled={!canEdit} placeholder="e.g. 250" />
          <p className="text-[11px] text-[var(--text-faint)]">
            Used to compute Ad ROI on the dashboard.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Auto-email on follow-up</Label>
          <label className="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
            style={{ borderColor: "var(--border)" }}>
            <input type="checkbox" name="autoFollowupEmail"
              defaultChecked={initial.autoFollowupEmail} disabled={!canEdit}
              className="mt-1" />
            <div className="text-xs">
              <div className="font-semibold mb-0.5">Send the follow-up template automatically</div>
              <div className="text-[var(--text-faint)]">When a lead hits the trigger, send <code className="font-mono">followup_nudge</code> to them too.</div>
            </div>
          </label>
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
        </div>
      )}
      {!canEdit && (
        <p className="text-xs text-[var(--text-faint)] pt-1">Only admins can change these.</p>
      )}
    </form>
  );
}
