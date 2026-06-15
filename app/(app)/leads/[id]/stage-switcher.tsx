"use client";
import { useTransition } from "react";
import { moveLead } from "@/lib/actions/leads";
import { STAGES } from "@/components/ui/select-stage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/db/schema";

export function StageSwitcher({ leadId, current }: { leadId: string; current: Stage }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-1.5 p-1 rounded-xl border w-fit"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
      {STAGES.map((s) => (
        <button
          key={s.value}
          disabled={pending}
          onClick={() => start(async () => {
            try {
              await moveLead({ id: leadId, toStage: s.value });
              toast.success(`Stage: ${s.label}`);
            } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
          })}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            current === s.value
              ? "shadow font-semibold"
              : "text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]",
          )}
          style={current === s.value ? {
            background: `var(--color-status-${s.value})`,
            color: s.value === "thinking" ? "oklch(30% 0.18 80)" : "white",
          } : undefined}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
