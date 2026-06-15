import { getServerSupabase } from "@/lib/supabase/server";
import { SignOutAndRefresh } from "./refresh";
import { Check } from "lucide-react";

export default async function NoTenantPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const meta = (user?.app_metadata ?? {}) as { tenant_id?: string; role?: string };

  return (
    <main className="min-h-screen p-6 grid place-items-center">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-grid place-items-center w-12 h-12 rounded-xl text-white font-bold text-lg"
            style={{ background: "conic-gradient(from 220deg, var(--color-accent), var(--color-accent-2), var(--color-accent))" }}>
            T
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Almost there</h1>
          <p className="text-[var(--text-soft)]">
            You're signed in as <b>{user?.email}</b>, but your account isn't linked to a tenant yet.
          </p>
        </div>

        <div className="rounded-2xl border p-5 space-y-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <h2 className="text-sm font-semibold text-[var(--text-soft)] uppercase tracking-wider">Current session</h2>
          <Row label="Email" value={user?.email ?? "—"} ok={!!user?.email} />
          <Row label="tenant_id" value={meta.tenant_id ?? "missing"} ok={!!meta.tenant_id} />
          <Row label="role" value={meta.role ?? "missing"} ok={!!meta.role} />
        </div>

        <div className="rounded-2xl border p-5 space-y-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold">What to do</h2>
          <p className="text-sm text-[var(--text-soft)]">
            From the project root, run:
          </p>
          <pre className="rounded-lg border p-3 font-mono text-xs overflow-x-auto"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
{`npm run setup`}
          </pre>
          <p className="text-sm text-[var(--text-soft)]">
            That creates the demo tenant and assigns your account as <b>admin</b>. Then click
            below to clear your cached session and sign back in with the updated metadata.
          </p>
          <SignOutAndRefresh />
        </div>

        <p className="text-center text-xs text-[var(--text-faint)]">
          Already ran setup? You just need to sign out and back in — your JWT is cached from
          before the metadata change.
        </p>
      </div>
    </main>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full grid place-items-center text-white shrink-0"
        style={{ background: ok ? "var(--color-status-enrolled)" : "var(--color-status-overdue)" }}>
        {ok && <Check className="w-3 h-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs text-[var(--text-faint)]">{label}</div>
        <div className="font-mono text-sm truncate">{value}</div>
      </div>
    </div>
  );
}
