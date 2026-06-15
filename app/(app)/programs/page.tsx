import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { Brush, GraduationCap, Brain, LayoutGrid } from "lucide-react";

const PROGRAM_VISUALS: Record<string, { icon: React.ComponentType<{ className?: string }>; c1: string; c2: string }> = {
  therapy:    { icon: Brush,          c1: "oklch(70% 0.22 320)", c2: "oklch(60% 0.22 290)" },
  course:     { icon: Brain,          c1: "oklch(74% 0.16 195)", c2: "oklch(60% 0.16 180)" },
  internship: { icon: GraduationCap,  c1: "oklch(72% 0.18 160)", c2: "oklch(60% 0.18 145)" },
};

export default async function ProgramsPage() {
  const { tenant } = await requireUser();
  const programs = await db.select().from(schema.programs).where(eq(schema.programs.tenantId, tenant.id));

  return (
    <div className="px-8 py-7">
      <header className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-white shrink-0"
          style={{
            background: "conic-gradient(from 220deg, var(--color-accent), var(--color-accent-2), var(--color-accent))",
            boxShadow: "0 8px 24px var(--color-accent-glow), inset 0 1px 0 oklch(100% 0 0 / 0.3)",
          }}>
          <LayoutGrid className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight leading-none">Programs</h1>
          <p className="text-sm text-[var(--text-soft)] mt-2">
            <b className="text-[var(--text)] font-semibold tabular-nums">{programs.length}</b> active —
            therapy types, courses, and internship cohorts
          </p>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((p) => {
          const v = PROGRAM_VISUALS[p.type];
          const Icon = v?.icon ?? LayoutGrid;
          return (
            <div key={p.id} className="glass-card shimmer tilt liquid rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none"
                style={{ background: v?.c1 ?? "var(--color-accent)" }} />

              <div className="flex items-start justify-between mb-5 relative">
                <div className="w-12 h-12 rounded-xl grid place-items-center text-white"
                  style={{
                    background: `linear-gradient(135deg, ${v?.c1 ?? "var(--color-accent)"}, ${v?.c2 ?? "var(--color-accent-2)"})`,
                    boxShadow: "inset 0 1px 0 oklch(100% 0 0 / 0.25)",
                  }}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="chip">{p.type}</span>
              </div>

              <h3 className="font-semibold tracking-tight text-base mb-1">{p.name}</h3>
              <div className="text-3xl font-bold tracking-tight tabular-nums">₾ {p.price}</div>

              <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs text-[var(--text-soft)]"
                style={{ borderColor: "var(--border)" }}>
                <span>
                  {p.startDate ? `Starts ${new Date(p.startDate).toLocaleDateString()}` : "Open enrollment"}
                </span>
                {p.capacity && <span>Cap. {p.capacity}</span>}
              </div>
            </div>
          );
        })}

        {programs.length === 0 && (
          <div className="col-span-full text-center text-sm text-[var(--text-faint)] p-12 rounded-2xl border border-dashed"
            style={{ borderColor: "var(--border)" }}>
            No programs yet — run the seed script or add one.
          </div>
        )}
      </div>
    </div>
  );
}
