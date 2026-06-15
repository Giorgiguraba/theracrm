import { hasSupabaseEnv, hasDatabaseEnv, getSupabaseServiceKey } from "@/lib/env";
import { Check, X } from "lucide-react";

export default function SetupRequiredPage() {
  const checks = [
    { key: "NEXT_PUBLIC_SUPABASE_URL", ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL, desc: "Project URL — Settings → API" },
    {
      key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      ok: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      desc: "Publishable (anon) key — Settings → API",
    },
    { key: "SUPABASE_SERVICE_ROLE_KEY", ok: !!getSupabaseServiceKey(), desc: "Service role key — Settings → API (server-side only)" },
    { key: "DATABASE_URL", ok: hasDatabaseEnv(), desc: "Direct DB connection — Settings → Database → URI" },
  ];

  const allRequired = hasSupabaseEnv();

  return (
    <main className="min-h-screen p-6 grid place-items-center">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-grid place-items-center w-12 h-12 rounded-xl text-white font-bold text-lg"
            style={{ background: "conic-gradient(from 220deg, var(--color-accent), var(--color-accent-2), var(--color-accent))" }}>
            T
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Finish setting up Stimuli CRM</h1>
          <p className="text-[var(--text-soft)]">Add your Supabase keys to <code className="font-mono text-sm">.env.local</code>, then restart the dev server.</p>
        </div>

        <div className="rounded-2xl border p-5 space-y-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <h2 className="text-sm font-semibold text-[var(--text-soft)] uppercase tracking-wider">Env checklist</h2>
          {checks.map((c) => (
            <div key={c.key} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full grid place-items-center text-white"
                style={{ background: c.ok ? "var(--color-status-enrolled)" : "var(--color-status-overdue)" }}>
                {c.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm font-medium">{c.key}</div>
                <div className="text-xs text-[var(--text-faint)]">{c.desc}</div>
              </div>
              <span className={`chip ${c.ok ? "chip-enrolled" : "chip-overdue"}`}>{c.ok ? "set" : "missing"}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border p-5 space-y-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold">Steps</h2>
          <ol className="space-y-2 text-sm text-[var(--text-soft)] list-decimal pl-5">
            <li>
              In your Supabase project, open <b>Settings → API</b>. Copy <b>Project URL</b>,
              <b> Publishable key</b>, and <b>service_role</b> key.
            </li>
            <li>
              In <b>Settings → Database → Connection string</b>, copy the <b>URI</b> connection string and
              substitute your DB password.
            </li>
            <li>
              Open <code className="font-mono">.env.local</code> in this repo and paste the values.
            </li>
            <li>Stop the dev server (Ctrl+C) and run <code className="font-mono">npm run dev</code> again.</li>
            <li>
              Then run <code className="font-mono">npm run db:push</code>, <code className="font-mono">npm run db:rls</code>, <code className="font-mono">npm run db:seed</code> (one-time).
            </li>
          </ol>
        </div>

        {allRequired && (
          <p className="text-center text-sm text-[var(--text-soft)]">
            ✓ The two browser keys look good. The server-side keys (service role + DATABASE_URL) are needed for
            schema push and the Meta webhook, but the app will load.
            <a href="/" className="ml-2 text-[var(--color-accent)] font-medium">Continue →</a>
          </p>
        )}

        <p className="text-center text-xs text-[var(--text-faint)]">
          Full guide: <span className="font-mono">SETUP.md</span> in the project root.
        </p>
      </div>
    </main>
  );
}
