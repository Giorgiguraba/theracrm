"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Phone, Mail, ArrowUpRight, MapPin, Briefcase } from "lucide-react";
import type { Lead } from "@/lib/db/schema";
import { initials, relativeTime } from "@/lib/utils";
import { StageChip } from "@/components/ui/select-stage";
import { computeLevel } from "@/components/leads/interest-filter";
import { EditLeadButton } from "@/components/leads/lead-edit-form";

type Level = "all" | "hot" | "high" | "medium" | "low";
type Stage = "all" | "new" | "contacted" | "thinking" | "enrolled" | "lost";

export function CustomersExplorer({
  leads, programs,
}: {
  leads: Lead[];
  programs: { id: string; name: string }[];
}) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<Level>("all");
  const [stage, setStage] = useState<Stage>("all");
  const [active, setActive] = useState<Lead | null>(leads[0] ?? null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (stage !== "all" && l.stage !== stage) return false;

      const lv = computeLevel(l);
      if (level === "hot"    && lv < 5)  return false;
      if (level === "high"   && lv !== 4) return false;
      if (level === "medium" && lv !== 3) return false;
      if (level === "low"    && lv > 2)  return false;

      if (!needle) return true;
      return (
        l.fullName.toLowerCase().includes(needle) ||
        (l.email ?? "").toLowerCase().includes(needle) ||
        (l.phone ?? "").toLowerCase().includes(needle) ||
        (l.city ?? "").toLowerCase().includes(needle) ||
        (l.occupation ?? "").toLowerCase().includes(needle)
      );
    });
  }, [leads, q, level, stage]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone, city, occupation…"
            className="w-full h-11 pl-10 pr-3 rounded-xl border bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            style={{ borderColor: "var(--border)" }} />
        </div>

        <div className="seg-bar">
          {(["all", "hot", "high", "medium", "low"] as Level[]).map((lv) => (
            <button key={lv} onClick={() => setLevel(lv)}
              className={`seg-tab ${level === lv ? "active" : ""}`}>
              {lv === "all" ? "All" : lv === "hot" ? <>🔥 Hot</> : lv[0].toUpperCase() + lv.slice(1)}
            </button>
          ))}
        </div>

        <select value={stage} onChange={(e) => setStage(e.target.value as Stage)}
          className="h-11 rounded-xl border bg-[var(--surface)] px-3 text-sm"
          style={{ borderColor: "var(--border)" }}>
          <option value="all">All stages</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="thinking">Thinking</option>
          <option value="enrolled">Enrolled</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* Two-pane: list + detail */}
      <div className="grid lg:grid-cols-[1fr_420px] gap-4">
        {/* LIST */}
        <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {filtered.map((l) => (
            <li key={l.id}>
              <button onClick={() => setActive(l)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  active?.id === l.id ? "" : "hover:bg-[var(--surface-hover)]"
                }`}
                style={{
                  background: active?.id === l.id ? "var(--surface)" : "var(--surface)",
                  borderColor: active?.id === l.id ? "var(--color-accent)" : "var(--border)",
                  boxShadow: active?.id === l.id ? "0 0 0 1px var(--color-accent)" : "none",
                }}>
                {l.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.photoUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full grid place-items-center text-white text-xs font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, oklch(70% 0.22 320), oklch(60% 0.22 290))" }}>
                    {initials(l.fullName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{l.fullName}</div>
                  <div className="text-[11px] text-[var(--text-faint)] truncate">
                    {l.email ?? l.phone ?? "—"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StageChip stage={l.stage} />
                  <div className="interest-dots" data-level={computeLevel(l)}>
                    <span className="d" /><span className="d" /><span className="d" /><span className="d" /><span className="d" />
                  </div>
                </div>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="text-sm text-[var(--text-faint)] text-center py-8">No matches.</li>
          )}
        </ul>

        {/* DETAIL */}
        {active && (
          <aside className="glass-card rounded-3xl p-5 lg:sticky lg:top-4 self-start">
            <div className="flex items-start gap-3 mb-5">
              {active.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.photoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl grid place-items-center text-white text-lg font-bold"
                  style={{ background: "linear-gradient(135deg, oklch(70% 0.22 320), oklch(60% 0.22 290))" }}>
                  {initials(active.fullName)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold tracking-tight">{active.fullName}</div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <StageChip stage={active.stage} />
                  {computeLevel(active) === 5 && <span className="pill-hot">Hot</span>}
                </div>
              </div>
            </div>

            <DetailRow icon={Phone} label="Phone" value={active.phone} />
            <DetailRow icon={Mail}  label="Email" value={active.email} />
            <DetailRow icon={MapPin} label="City" value={active.city} />
            <DetailRow icon={Briefcase} label="Occupation" value={active.occupation} />
            <DetailRow label="Program" value={programs.find((p) => p.id === active.programId)?.name ?? null} />
            <DetailRow label="Source" value={active.source.replace("_", " ")} />
            <DetailRow label="Created" value={relativeTime(active.createdAt)} />

            {active.notes && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-faint)] mb-1.5">Notes</div>
                <p className="text-sm whitespace-pre-wrap">{active.notes}</p>
              </div>
            )}

            <div className="flex items-center gap-2 mt-5">
              <EditLeadButton lead={active} programs={programs} />
              <Link href={`/leads/${active.id}`}
                className="flex-1 h-9 rounded-lg grid place-items-center text-sm font-semibold transition-all hover:-translate-y-px"
                style={{
                  background: "var(--color-accent)",
                  color: "oklch(15% 0.05 130)",
                  boxShadow: "0 4px 12px var(--color-accent-glow)",
                }}>
                Open profile <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon, label, value,
}: { icon?: React.ComponentType<{ className?: string }>; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 text-sm">
      {Icon && <Icon className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0" />}
      <div className="text-[var(--text-faint)] w-20 text-xs">{label}</div>
      <div className="flex-1 truncate">
        {value || <span className="text-[var(--text-faint)]">—</span>}
      </div>
    </div>
  );
}
