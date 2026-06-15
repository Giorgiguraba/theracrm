"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, Users } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function UserMenu({ initials: inits, fullName, email }:
  { initials: string; fullName: string; email: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function signOut() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} aria-label="Account"
        className="w-9 h-9 rounded-full grid place-items-center text-white text-[11px] font-bold cursor-pointer transition-transform hover:scale-105"
        style={{
          background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
          boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px var(--color-accent-glow)",
        }}>
        {inits}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] w-[240px] rounded-2xl border z-50 overflow-hidden glass"
          style={{
            background: "var(--surface-glass)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-lg)",
            backdropFilter: "blur(24px) saturate(160%)",
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
          }}>
          {/* Header */}
          <div className="flex items-center gap-2.5 px-3 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="w-9 h-9 rounded-full grid place-items-center text-white text-[11px] font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}>
              {inits}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{fullName}</div>
              <div className="text-[11px] text-[var(--text-faint)] truncate">{email}</div>
            </div>
          </div>

          {/* Menu */}
          <div className="p-1.5">
            <MenuLink href="/settings" icon={Settings} onSelect={() => setOpen(false)}>Settings</MenuLink>
            <MenuLink href="/settings/users" icon={Users} onSelect={() => setOpen(false)}>Users & roles</MenuLink>
            <button onClick={signOut}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-[var(--surface-hover)] transition-colors text-left">
              <LogOut className="w-3.5 h-3.5 text-[var(--color-status-overdue)]" />
              <span className="text-[var(--color-status-overdue)]">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon: Icon, children, onSelect }:
  { href: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; onSelect: () => void }) {
  return (
    <Link href={href} onClick={onSelect}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-[var(--surface-hover)] transition-colors">
      <Icon className="w-3.5 h-3.5 text-[var(--text-faint)]" />
      <span>{children}</span>
    </Link>
  );
}
