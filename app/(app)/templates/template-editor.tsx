"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, FileText } from "lucide-react";
import { upsertTemplate, deleteTemplate } from "@/lib/actions/templates";
import { toast } from "sonner";

type Template = {
  id: string; key: string; subject: string; bodyHtml: string;
  locale: string; isActive: boolean;
};

type StarterTemplate = {
  key: string; subject: string; bodyHtml: string;
  locale: "ka" | "en"; isActive: boolean;
};

const STARTERS: StarterTemplate[] = [
  {
    key: "enrollment_confirmation",
    subject: "Welcome to {program} 🎉",
    bodyHtml: `<p>Hi {name},</p>
<p>You're enrolled in <b>{program}</b>. We start on <b>{start_date}</b>.</p>
<p>See you there!</p>`,
    locale: "ka",
    isActive: true,
  },
  {
    key: "followup_nudge",
    subject: "Still thinking about {program}?",
    bodyHtml: `<p>Hi {name},</p>
<p>We saved your spot in the upcoming <b>{program}</b> cohort. If you have any questions, just reply to this email.</p>`,
    locale: "ka",
    isActive: true,
  },
];

export function TemplateEditor({ templates: initial, canEdit }: { templates: Template[]; canEdit: boolean }) {
  const [templates, setTemplates] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(initial[0]?.id ?? null);
  const [pending, start] = useTransition();

  const selected = selectedId === "new"
    ? { id: "", key: "", subject: "", bodyHtml: "", locale: "ka", isActive: true }
    : templates.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      {/* LIST */}
      <aside className="space-y-2">
        {canEdit && (
          <button onClick={() => setSelectedId("new")}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:-translate-y-px"
            style={{
              background: "var(--color-accent)", color: "white",
              boxShadow: "0 4px 12px var(--color-accent-glow)",
            }}>
            <Plus className="w-4 h-4" /> New template
          </button>
        )}
        <ul className="space-y-1">
          {templates.map((t) => (
            <li key={t.id}>
              <button onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5 transition-all ${
                  selectedId === t.id ? "" : "hover:bg-[var(--surface-hover)]"
                }`}
                style={selectedId === t.id ? {
                  background: "var(--surface)",
                  boxShadow: "var(--shadow-sm)",
                } : undefined}>
                <FileText className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs truncate">{t.key}</div>
                  <div className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">{t.locale}</div>
                </div>
                {!t.isActive && (
                  <span className="text-[10px] text-[var(--text-faint)]">off</span>
                )}
              </button>
            </li>
          ))}
          {templates.length === 0 && (
            <li className="text-xs text-[var(--text-faint)] py-3">No templates yet.</li>
          )}
        </ul>

        {canEdit && templates.length === 0 && (
          <div className="pt-3 mt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-2">Starters</p>
            {STARTERS.map((s) => (
              <button key={s.key}
                onClick={() => start(async () => {
                  try {
                    await upsertTemplate(s);
                    toast.success(`Created ${s.key}`);
                  } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                })}
                className="block w-full text-left text-xs font-mono px-2 py-1.5 rounded-md mb-1 transition-colors hover:bg-[var(--surface-hover)]">
                + {s.key}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* EDITOR */}
      <main>
        {selected ? (
          <form
            key={selected.id || "new"}
            onSubmit={(e) => {
              e.preventDefault();
              if (!canEdit) return;
              const fd = new FormData(e.currentTarget);
              start(async () => {
                try {
                  await upsertTemplate({
                    id: selected.id || undefined,
                    key: String(fd.get("key") || "").trim(),
                    subject: String(fd.get("subject") || "").trim(),
                    bodyHtml: String(fd.get("bodyHtml") || ""),
                    locale: (String(fd.get("locale") || "ka") as "ka" | "en"),
                    isActive: fd.get("isActive") === "on",
                  });
                  toast.success("Saved");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed");
                }
              });
            }}
            className="glass-card rounded-2xl p-6 space-y-4"
          >
            <div className="grid grid-cols-[1fr_120px_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="key">Key</Label>
                <Input name="key" defaultValue={selected.key} placeholder="enrollment_confirmation" required readOnly={!canEdit} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="locale">Locale</Label>
                <select name="locale" defaultValue={selected.locale} disabled={!canEdit}
                  className="h-9 w-full rounded-lg border bg-[var(--surface)] px-3 text-sm"
                  style={{ borderColor: "var(--border)" }}>
                  <option value="ka">ქართული (ka)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={selected.isActive} disabled={!canEdit} />
                Active
              </label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input name="subject" defaultValue={selected.subject} placeholder="Welcome to {program} 🎉" required readOnly={!canEdit} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bodyHtml">Body (HTML)</Label>
              <textarea
                name="bodyHtml" defaultValue={selected.bodyHtml}
                rows={14} readOnly={!canEdit}
                className="w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm font-mono"
                style={{ borderColor: "var(--border)" }} />
            </div>

            <div className="text-xs text-[var(--text-faint)]">
              Available variables: <code className="font-mono">{`{name}`}</code>,{" "}
              <code className="font-mono">{`{program}`}</code>,{" "}
              <code className="font-mono">{`{start_date}`}</code>
            </div>

            {canEdit && (
              <div className="flex justify-end gap-2 pt-2">
                {selected.id && (
                  <Button type="button" variant="ghost"
                    onClick={() => {
                      if (!confirm("Delete this template?")) return;
                      start(async () => {
                        try {
                          await deleteTemplate(selected.id);
                          setTemplates((t) => t.filter((x) => x.id !== selected.id));
                          setSelectedId(null);
                          toast.success("Deleted");
                        } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                      });
                    }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                )}
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : selected.id ? "Save changes" : "Create template"}
                </Button>
              </div>
            )}
          </form>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center text-sm text-[var(--text-faint)]">
            Select a template to edit, or create a new one.
          </div>
        )}
      </main>
    </div>
  );
}
