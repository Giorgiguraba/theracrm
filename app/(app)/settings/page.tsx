import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { Settings } from "lucide-react";
import { SettingsForm } from "./settings-form";
import Link from "next/link";

export default async function SettingsPage() {
  const { tenant, role } = await requireUser();
  const [settings] = await db.select().from(schema.tenantSettings)
    .where(eq(schema.tenantSettings.tenantId, tenant.id));

  const canEdit = role === "admin" || role === "platform_admin";

  return (
    <div className="px-8 py-7 max-w-3xl mx-auto">
      <header className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-white shrink-0"
          style={{
            background: "conic-gradient(from 220deg, var(--color-accent), var(--color-accent-2), var(--color-accent))",
            boxShadow: "0 8px 24px var(--color-accent-glow), inset 0 1px 0 oklch(100% 0 0 / 0.3)",
          }}>
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight leading-none">Settings</h1>
          <p className="text-sm text-[var(--text-soft)] mt-2">
            Tenant preferences and automation defaults
          </p>
        </div>
      </header>

      {/* Tenant overview */}
      <section className="glass-card rounded-2xl p-5 mb-4">
        <h2 className="text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-3">Organization</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-[var(--text-faint)] mb-0.5">Name</dt>
            <dd className="font-semibold">{tenant.name}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-[var(--text-faint)] mb-0.5">Plan</dt>
            <dd className="font-semibold capitalize">{tenant.plan}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-[var(--text-faint)] mb-0.5">Status</dt>
            <dd>
              <span className={`chip ${tenant.status === "active" ? "chip-enrolled" : "chip-overdue"}`}>
                {tenant.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-[var(--text-faint)] mb-0.5">Paid until</dt>
            <dd className="font-semibold tabular-nums">{tenant.paidUntil ?? "—"}</dd>
          </div>
        </dl>
      </section>

      {/* Preferences form */}
      <SettingsForm
        canEdit={canEdit}
        initial={{
          followupHours: settings?.followupHours ?? 48,
          locale: (settings?.locale as "ka" | "en") ?? "ka",
          adSpendMonthly: settings?.adSpendMonthly ?? "",
          autoFollowupEmail: settings?.autoFollowupEmail ?? false,
        }}
      />

      <section className="glass-card rounded-2xl p-5 mt-4">
        <h2 className="text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-3">Related</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Link href="/settings/users"
            className="p-3 rounded-xl border hover:bg-[var(--surface-hover)] transition-colors"
            style={{ borderColor: "var(--border)" }}>
            <div className="font-semibold mb-0.5">Users &amp; roles</div>
            <div className="text-xs text-[var(--text-soft)]">Invite operators, manage admins</div>
          </Link>
          <Link href="/templates"
            className="p-3 rounded-xl border hover:bg-[var(--surface-hover)] transition-colors"
            style={{ borderColor: "var(--border)" }}>
            <div className="font-semibold mb-0.5">Email templates</div>
            <div className="text-xs text-[var(--text-soft)]">Edit confirmations, reminders, nudges</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
