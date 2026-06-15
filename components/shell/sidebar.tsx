"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ListTodo, LayoutGrid, BarChart3, Clock, Mail, Users, Settings,
  Search, Plus, ChevronDown, ChevronRight, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./command-palette";

const nav = [
  { href: "/leads",      icon: ListTodo,   label: "Leads pipeline", badge: 6 },
  { href: "/customers",  icon: Users,      label: "Customers" },
  { href: "/programs",   icon: LayoutGrid, label: "Programs" },
  { href: "/dashboard",  icon: BarChart3,  label: "Dashboard" },
  { href: "/follow-ups", icon: Clock,      label: "Follow-ups", alertBadge: 1 },
  { href: "/calendar",   icon: Calendar,   label: "Calendar" },
  { href: "/templates",  icon: Mail,       label: "Email templates" },
];

const admin = [
  { href: "/settings/users",    icon: Users,    label: "Users & roles" },
  { href: "/settings",          icon: Settings, label: "Settings" },
];

export function Sidebar({ tenantName, userInitials, userName, userRole }:
  { tenantName: string; userInitials: string; userName: string; userRole: string }) {
  const pathname = usePathname();

  return (
    <aside className="glass breathe flex flex-col p-3 overflow-y-auto"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2.5 pb-3.5 px-2 mb-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-7 h-7 rounded-lg grid place-items-center text-white font-bold text-xs"
          style={{ background: "conic-gradient(from 220deg, var(--color-accent), var(--color-accent-2), var(--color-accent))" }}>
          {tenantName[0]}
        </div>
        <span className="text-sm font-semibold tracking-tight flex-1">{tenantName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)]" />
      </div>

      <CommandPalette />

      <SectionLabel>Workspace</SectionLabel>
      {nav.map((item) => <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} />)}

      <SectionLabel>Admin</SectionLabel>
      {admin.map((item) => <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} />)}

      <div className="mt-auto pt-2">
        <div className="flex items-center gap-2.5 p-2 rounded-lg border"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
          <div className="w-7 h-7 rounded-full grid place-items-center text-white text-[11px] font-bold"
            style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}>
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{userName}</div>
            <div className="text-[10px] text-[var(--text-faint)] capitalize">{userRole} · {tenantName.split(" ")[0]}</div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-faint)]" />
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider px-2.5 pt-3.5 pb-1 flex items-center justify-between">
      {children}
      <Plus className="w-3 h-3 opacity-50 hover:opacity-100 cursor-pointer" />
    </div>
  );
}

function NavItem({
  href, icon: Icon, label, active, badge, alertBadge,
}: {
  href: string; icon: React.ComponentType<{ className?: string }>;
  label: string; active?: boolean; badge?: number; alertBadge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "nav-item-glass group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] mb-0.5 relative overflow-hidden",
        active ? "font-medium" : "text-[var(--text-soft)]",
      )}
      style={active ? { background: "var(--surface)", color: "var(--text)", boxShadow: "var(--shadow-xs)" } : undefined}
    >
      {/* Accent indicator: persistent when active, slides in on hover */}
      <span className={cn(
        "absolute left-0 top-2 bottom-2 w-[3px] rounded-r transition-all duration-300",
        active ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
      )}
        style={{ background: "var(--color-accent)", boxShadow: "0 0 10px var(--color-accent-glow)" }} />

      {/* Soft glass wash on hover */}
      <span className={cn(
        "absolute inset-0 rounded-lg transition-opacity duration-300",
        active ? "opacity-0" : "opacity-0 group-hover:opacity-100"
      )}
        style={{
          background: "linear-gradient(90deg, color-mix(in oklch, var(--color-accent) 12%, transparent), transparent 70%)",
          backdropFilter: "blur(8px) saturate(150%)",
          WebkitBackdropFilter: "blur(8px) saturate(150%)",
        }} />

      <Icon className={cn(
        "w-4 h-4 relative z-10 transition-all duration-200",
        active ? "text-[var(--color-accent)]" : "text-[var(--text-faint)] group-hover:text-[var(--color-accent)] group-hover:scale-110"
      )} />
      <span className="flex-1 truncate relative z-10 transition-transform duration-200 group-hover:translate-x-0.5">{label}</span>
      {badge != null && (
        <span className="text-[10px] font-semibold px-1.5 rounded-full relative z-10"
          style={{ background: "var(--surface-2)", color: "var(--text-soft)" }}>{badge}</span>
      )}
      {alertBadge != null && (
        <span className="text-[10px] font-semibold px-1.5 rounded-full relative z-10"
          style={{ background: "color-mix(in oklch, var(--color-status-overdue) 15%, transparent)", color: "var(--color-status-overdue)" }}>{alertBadge}</span>
      )}
    </Link>
  );
}
