import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export default async function UsersPage() {
  const { tenant, role } = await requireUser();
  if (role !== "admin" && role !== "platform_admin") {
    return <div className="p-7 text-sm text-[var(--text-soft)]">Only admins can manage users.</div>;
  }

  const users = await db.select().from(schema.users).where(eq(schema.users.tenantId, tenant.id));

  return (
    <div className="p-7">
      <h1 className="text-3xl font-bold tracking-tight mb-1">Users & roles</h1>
      <p className="text-sm text-[var(--text-soft)] mb-6">Invite operators, manage admin access.</p>

      <div className="rounded-xl border overflow-hidden"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-2.5 font-semibold">{u.fullName}</td>
                <td className="px-4 py-2.5 text-[var(--text-soft)]">{u.email}</td>
                <td className="px-4 py-2.5"><span className="chip">{u.role}</span></td>
                <td className="px-4 py-2.5">
                  <span className={`chip ${u.isActive ? "chip-enrolled" : "chip-lost"}`}>
                    {u.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--text-faint)] mt-3">
        Invite via the Supabase Dashboard for now; UI invite flow comes in Phase 2.
      </p>
    </div>
  );
}
