import { db, schema } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { formatGEL } from "@/lib/utils";
import { BarChart3, Users, TrendingUp, Coins } from "lucide-react";

export default async function DashboardPage() {
  const { tenant } = await requireUser();
  const [leads, programs] = await Promise.all([
    db.select().from(schema.leads).where(and(eq(schema.leads.tenantId, tenant.id), isNull(schema.leads.deletedAt))),
    db.select().from(schema.programs).where(eq(schema.programs.tenantId, tenant.id)),
  ]);

  const byStage = (s: string) => leads.filter((l) => l.stage === s).length;
  const bySource = (s: string) => leads.filter((l) => l.source === s).length;
  const revenue = leads
    .filter((l) => l.stage === "enrolled")
    .reduce((sum, l) => sum + Number(programs.find((p) => p.id === l.programId)?.price ?? 0), 0);

  const enrolled = byStage("enrolled");
  const total = leads.length;
  const conversion = total ? Math.round((enrolled / total) * 100) : 0;

  return (
    <div className="px-8 py-7">
      <header className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-white shrink-0"
          style={{
            background: "conic-gradient(from 220deg, var(--color-accent), var(--color-accent-2), var(--color-accent))",
            boxShadow: "0 8px 24px var(--color-accent-glow), inset 0 1px 0 oklch(100% 0 0 / 0.3)",
          }}>
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight leading-none">Dashboard</h1>
          <p className="text-sm text-[var(--text-soft)] mt-2">
            Live snapshot of your pipeline this month
          </p>
        </div>
      </header>

      {/* TOP METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Metric icon={<Users className="w-4 h-4" />} label="Total leads" value={String(total)} tint="var(--color-status-new)" />
        <Metric icon={<TrendingUp className="w-4 h-4" />} label="Enrolled" value={String(enrolled)} tint="var(--color-status-enrolled)" />
        <Metric icon={<BarChart3 className="w-4 h-4" />} label="Conversion" value={`${conversion}%`} tint="var(--color-accent)" />
        <Metric icon={<Coins className="w-4 h-4" />} label="Revenue" value={formatGEL(revenue)} tint="var(--color-accent-2)" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Pipeline by stage" sub="Where leads are sitting right now">
          <Bars data={[
            ["New",       byStage("new"),       "var(--color-status-new)"],
            ["Contacted", byStage("contacted"), "var(--color-status-contacted)"],
            ["Thinking",  byStage("thinking"),  "var(--color-status-thinking)"],
            ["Enrolled",  byStage("enrolled"),  "var(--color-status-enrolled)"],
            ["Lost",      byStage("lost"),      "var(--color-status-lost)"],
          ]} />
        </Panel>
        <Panel title="Leads by source" sub="Where they came from">
          <Bars data={[
            ["Facebook Ads",  bySource("fb_ads"),   "var(--color-src-fb)"],
            ["Instagram Ads", bySource("ig_ads"),   "var(--color-src-ig)"],
            ["Manual",        bySource("manual"),   "var(--color-src-manual)"],
            ["Referral",      bySource("referral"), "var(--color-src-ref)"],
          ]} />
        </Panel>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tint }:
  { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <div className="glass-card shimmer tilt rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl pointer-events-none"
        style={{ background: tint }} />
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-soft)] mb-3 relative">
        <span style={{ color: tint }}>{icon}</span>{label}
      </div>
      <div className="text-3xl font-bold tracking-tight tabular-nums relative">{value}</div>
    </div>
  );
}

function Panel({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-xs text-[var(--text-soft)] mt-0.5 mb-5">{sub}</p>
      {children}
    </div>
  );
}

function Bars({ data }: { data: [string, number, string][] }) {
  const max = Math.max(1, ...data.map(([, v]) => v));
  return (
    <div className="space-y-3">
      {data.map(([label, val, color]) => (
        <div key={label} className="flex items-center gap-3">
          <div className="w-28 text-sm text-[var(--text-soft)]">{label}</div>
          <div className="flex-1 h-7 rounded-lg overflow-hidden relative"
            style={{ background: "var(--surface-2)" }}>
            <div className="h-full transition-all duration-700 relative overflow-hidden"
              style={{
                width: `${(val / max) * 100}%`,
                background: `linear-gradient(90deg, ${color}, color-mix(in oklch, ${color} 70%, white))`,
                boxShadow: `0 0 16px ${color}`,
              }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(110deg, transparent 30%, oklch(100% 0 0 / 0.18) 50%, transparent 70%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmerSweep 6s ease-in-out infinite",
                }} />
            </div>
          </div>
          <div className="w-10 text-right font-semibold tabular-nums tracking-tight">{val}</div>
        </div>
      ))}
    </div>
  );
}
