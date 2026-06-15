"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, ArrowRight, Bot, Clock } from "lucide-react";
import { getNotifications } from "@/lib/actions/notifications";
import { initials, relativeTime } from "@/lib/utils";

type Item = {
  id: string; leadId: string; leadName: string; photoUrl: string | null;
  dueAt: string; isOverdue: boolean; isSystem: boolean;
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [overdue, setOverdue] = useState(0);
  const [loading, setLoading] = useState(true);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const load = () => getNotifications().then((d) => {
      if (!alive) return;
      setItems(d.items as Item[]);
      setOverdue(d.overdueCount);
      setLoading(false);
    }).catch(() => alive && setLoading(false));
    load();
    const t = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!popRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={popRef}>
      <button onClick={() => setOpen((v) => !v)} aria-label="Notifications"
        className="topbar-circle">
        <Bell className="w-4 h-4" />
        {overdue > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full grid place-items-center text-[9px] font-bold text-white tabular-nums"
            style={{ background: "var(--color-status-overdue)", boxShadow: "0 0 0 2px var(--surface)" }}>
            {overdue}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] w-[340px] rounded-2xl border z-50 overflow-hidden glass"
          style={{
            background: "var(--surface-glass)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-lg)",
            backdropFilter: "blur(24px) saturate(160%)",
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
          }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="font-semibold text-sm">Notifications</div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-faint)] tabular-nums">
              {items.length} pending
            </span>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading && (
              <div className="p-6 text-center text-xs text-[var(--text-faint)]">Loading…</div>
            )}
            {!loading && items.length === 0 && (
              <div className="p-8 text-center">
                <Clock className="w-7 h-7 mx-auto mb-2 text-[var(--text-faint)]" />
                <div className="text-sm text-[var(--text-soft)]">You're all caught up.</div>
              </div>
            )}
            {items.map((n) => (
              <Link key={n.id} href={`/leads/${n.leadId}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)] border-b last:border-0"
                style={{ borderColor: "var(--border)" }}>
                {n.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full grid place-items-center text-white text-[11px] font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, oklch(70% 0.22 320), oklch(60% 0.22 290))" }}>
                    {initials(n.leadName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                    {n.isSystem && <Bot className="w-3 h-3 shrink-0" style={{ color: "var(--color-accent)" }} />}
                    {n.leadName}
                  </div>
                  <div className={`text-[11px] tabular-nums ${n.isOverdue ? "text-[var(--color-status-overdue)]" : "text-[var(--text-faint)]"}`}>
                    {n.isOverdue ? "Overdue · " : "Due "}
                    {new Date(n.dueAt).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-faint)]" />
              </Link>
            ))}
          </div>

          <Link href="/follow-ups" onClick={() => setOpen(false)}
            className="block px-4 py-3 text-xs font-semibold text-center hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: "var(--color-accent)", borderTop: "1px solid var(--border)" }}>
            View all follow-ups →
          </Link>
        </div>
      )}
    </div>
  );
}
