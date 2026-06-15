"use client";
import Link from "next/link";
import { Inbox, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { NotificationsBell } from "./notifications-bell";
import { UserMenu } from "./user-menu";

export function Topbar({
  crumb, userInitials, userName, userEmail, pastDue,
}: {
  crumb: string;
  userInitials: string;
  userName: string;
  userEmail: string;
  pastDue?: boolean;
}) {
  const { theme, toggle } = useTheme();

  return (
    <div className="glass h-14 flex items-center px-5 gap-2 border-b z-10"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface-glass)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
      }}>
      <div className="text-sm text-[var(--text-soft)]">
        Workspace <span className="text-[var(--text-faint)]">/</span>{" "}
        <b className="text-[var(--text)] font-semibold">{crumb}</b>
      </div>
      <div className="flex-1" />

      {/* Theme toggle — keep pill shape */}
      <button onClick={toggle}
        aria-label="Toggle theme"
        className="w-14 h-9 rounded-full border flex items-center px-1 relative transition-colors"
        style={{
          background: "var(--surface-glass)",
          borderColor: "var(--border)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
        }}>
        <Sun className="w-3 h-3 flex-1 text-[var(--text-faint)]" />
        <Moon className="w-3 h-3 flex-1 text-[var(--text-faint)]" />
        <span className="absolute w-7 h-7 rounded-full shadow transition-transform"
          style={{
            transform: theme === "dark" ? "translateX(22px)" : "translateX(0)",
            background: theme === "dark"
              ? "oklch(80% 0.12 80)"
              : "white",
          }} />
      </button>

      {/* Notifications */}
      <NotificationsBell />

      {/* Inbox → follow-ups */}
      <Link href="/follow-ups" className="topbar-circle" aria-label="Follow-ups inbox">
        <Inbox className="w-4 h-4" />
      </Link>

      {/* User avatar menu */}
      <UserMenu initials={userInitials} fullName={userName} email={userEmail} />
    </div>
  );
}
