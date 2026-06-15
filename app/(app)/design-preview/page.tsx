import { db, schema } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { VariantA, VariantB, VariantC, VariantD } from "./variants";
import type { Lead } from "@/lib/db/schema";

export default async function DesignPreviewPage() {
  const { tenant } = await requireUser();
  const leads = await db.select().from(schema.leads).where(and(
    eq(schema.leads.tenantId, tenant.id),
    isNull(schema.leads.deletedAt),
  )).limit(1);

  const programs = await db.select().from(schema.programs).where(eq(schema.programs.tenantId, tenant.id));
  const sample: Lead = leads[0] ?? {
    id: "demo",
    tenantId: tenant.id,
    fullName: "Luka Tsereteli",
    phone: "+995 555 821",
    email: "luka.t@gmail.com",
    source: "ig_ads",
    metaLeadId: null,
    programId: programs[0]?.id ?? null,
    stage: "contacted",
    stageChangedAt: new Date(),
    assignedTo: null,
    notes: null,
    photoUrl: null,
    birthDate: null,
    city: null,
    occupation: null,
    deletedAt: null,
    createdAt: new Date(Date.now() - 21 * 60 * 60 * 1000),
  };
  const programName = programs.find((p) => p.id === sample.programId)?.name ?? "Internship";

  return (
    <div className="px-8 py-7 max-w-7xl mx-auto">
      <header className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-faint)] font-semibold mb-2">
          Card design
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight leading-none mb-3">Pick a variant</h1>
        <p className="text-[var(--text-soft)] max-w-2xl">
          Each card shows the same lead. Hover any card to see the lime border + cursor spotlight.
          Tell me <b>A / B / C / D</b> and I&apos;ll roll it out everywhere.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <VariantCol letter="A" title="Bookmark only"
          description="Full Figma match. Bookmark+ icon stuck in the notch instead of buttons. Page icon bottom-right. Paper grain. No bell/arrow.">
          <VariantA lead={sample} programName={programName} />
        </VariantCol>

        <VariantCol letter="B" title="Buttons + file decor"
          description="Keep working bell + arrow buttons in the notch. Add page icon bottom-right, paper grain, card-stack shadow.">
          <VariantB lead={sample} programName={programName} />
        </VariantCol>

        <VariantCol letter="C" title="Hybrid"
          description="Bookmark in the notch (decorative). Small bell + arrow icons inline at the bottom next to source pills.">
          <VariantC lead={sample} programName={programName} />
        </VariantCol>

        <VariantCol letter="D" title="Current"
          description="What you have now — two circular buttons in the notch, no extra decor.">
          <VariantD lead={sample} programName={programName} />
        </VariantCol>
      </div>
    </div>
  );
}

function VariantCol({ letter, title, description, children }: {
  letter: string; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl grid place-items-center text-base font-extrabold tabular-nums"
          style={{
            background: "var(--color-accent)",
            color: "oklch(15% 0.05 130)",
            boxShadow: "0 4px 12px var(--color-accent-glow)",
          }}>
          {letter}
        </div>
        <div className="font-bold text-lg tracking-tight">{title}</div>
      </div>
      <p className="text-xs text-[var(--text-soft)] mb-5 leading-relaxed">{description}</p>
      <div className="min-h-[280px]">{children}</div>
    </div>
  );
}
