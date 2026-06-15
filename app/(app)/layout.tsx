import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { initials } from "@/lib/utils";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, tenant, role, isPastDue } = await requireUser();
  const name = (user.user_metadata?.full_name as string) ?? user.email ?? "User";
  const inits = initials(name);

  return (
    <div className="grid grid-cols-[260px_1fr] h-screen">
      <Sidebar tenantName={tenant.name} userInitials={inits} userName={name} userRole={role} />
      <main className="flex flex-col overflow-hidden">
        <Topbar
          crumb="Leads pipeline"
          userInitials={inits}
          userName={name}
          userEmail={user.email ?? ""}
          pastDue={isPastDue}
        />
        {isPastDue && (
          <div className="px-6 py-2 text-sm flex items-center gap-2"
            style={{
              background: "color-mix(in oklch, var(--color-status-thinking) 12%, transparent)",
              color: "oklch(40% 0.14 80)",
              borderBottom: "1px solid color-mix(in oklch, var(--color-status-thinking) 30%, transparent)",
            }}>
            ⚠ <b>Payment due.</b> Service will be limited after the grace period. Contact your vendor.
          </div>
        )}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
