"use client";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/db/schema";

const STAGES: { value: Stage; label: string; cls: string }[] = [
  { value: "new",       label: "New",       cls: "chip chip-new" },
  { value: "contacted", label: "Contacted", cls: "chip chip-contacted" },
  { value: "thinking",  label: "Thinking",  cls: "chip chip-thinking" },
  { value: "enrolled",  label: "Enrolled",  cls: "chip chip-enrolled" },
  { value: "lost",      label: "Lost",      cls: "chip chip-lost" },
];

export function StageChip({ stage }: { stage: Stage }) {
  const s = STAGES.find((x) => x.value === stage);
  if (!s) return null;
  return (
    <span className={cn(s.cls)}>
      <span className="d" style={{ background: `var(--color-status-${stage})` }} />
      {s.label}
    </span>
  );
}

export { STAGES };
