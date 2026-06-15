import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function requireUser() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const meta = (user.app_metadata ?? {}) as { tenant_id?: string; role?: "platform_admin" | "admin" | "operator" };
  if (!meta.tenant_id) {
    // signed in but not yet assigned to a tenant
    redirect("/no-tenant");
  }

  const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, meta.tenant_id!));
  if (!tenant) redirect("/sign-in");

  return {
    user,
    tenant,
    role: meta.role ?? "operator",
    isPastDue: tenant.status === "past_due",
  };
}
