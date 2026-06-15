"use client";
import { useState, useTransition } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable, type DragEndEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { toast } from "sonner";
import { moveLead } from "@/lib/actions/leads";
import { STAGES } from "@/components/ui/select-stage";
import type { Lead, Stage } from "@/lib/db/schema";
import { initials, relativeTime } from "@/lib/utils";
import { Phone, Mail, ArrowUpRight, Bell } from "lucide-react";
import { useInterestFilter, filterByLevel, computeLevel } from "./interest-filter";

const interestLevel = computeLevel;

const SOURCE_LABEL = {
  fb_ads: "Facebook",
  ig_ads: "Instagram",
  manual: "Manual",
  referral: "Referral",
} as const;

type Props = { leads: Lead[]; programs: { id: string; name: string }[] };

export function KanbanBoard({ leads: initial, programs }: Props) {
  const [leads, setLeads] = useState(initial);
  const [active, setActive] = useState<Lead | null>(null);
  const [, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const { level } = useInterestFilter();

  const visibleLeads = filterByLevel(leads, level);
  const programName = (id: string | null) => id ? programs.find((p) => p.id === id)?.name ?? "—" : "—";

  function onDragEnd(e: DragEndEvent) {
    setActive(null);
    const id = e.active.id as string;
    const toStage = e.over?.id as Stage | undefined;
    if (!toStage) return;
    const prev = leads.find((l) => l.id === id);
    if (!prev || prev.stage === toStage) return;

    // optimistic
    setLeads((curr) => curr.map((l) => l.id === id ? { ...l, stage: toStage } : l));
    start(async () => {
      try {
        await moveLead({ id, toStage });
        toast.success(`Moved ${prev.fullName} → ${toStage}`);
      } catch (err) {
        setLeads((curr) => curr.map((l) => l.id === id ? prev : l));
        toast.error(err instanceof Error ? err.message : "Move failed");
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActive(leads.find((l) => l.id === e.active.id) ?? null)}
      onDragCancel={() => setActive(null)}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
        style={{ height: "calc(100vh - 380px)", minHeight: "440px" }}>
        {STAGES.map((s) => {
          const stageLeads = visibleLeads.filter((l) => l.stage === s.value);
          return (
            <Column key={s.value} stage={s.value} title={s.label} count={stageLeads.length}>
              {stageLeads.map((l) => (
                <Card key={l.id} lead={l} programName={programName(l.programId)} />
              ))}
            </Column>
          );
        })}
      </div>
      <DragOverlay>
        {active && <Card lead={active} programName={programName(active.programId)} overlay />}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ stage, title, count, children }:
  { stage: Stage; title: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef}
      className="glass-card rounded-3xl p-4 transition-all flex flex-col"
      style={{
        background: isOver ? "var(--surface-hover)" : "var(--surface-glass)",
        borderColor: isOver ? "var(--color-accent)" : "var(--border)",
        boxShadow: isOver
          ? "0 0 0 1px var(--color-accent), 0 24px 56px -12px var(--color-accent-glow)"
          : "var(--shadow-sm)",
        minHeight: 0,
      }}>
      <div className="flex items-end justify-between mb-4 px-1 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--text-faint)] font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--color-status-${stage})` }} />
            {title}
          </div>
          <div className="text-3xl font-extrabold tracking-tight tabular-nums leading-none">{count}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 min-h-0">
        <div className="flex flex-col gap-2 min-h-[80px]">{children}</div>
      </div>
    </div>
  );
}

function Card({ lead, programName, overlay }: { lead: Lead; programName: string; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  const isHot = interestLevel(lead) === 5;
  const gid = `card-${lead.id}`;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="card-folder relative tilt liquid cursor-grab active:cursor-grabbing select-none group"
      style={{ opacity: isDragging && !overlay ? 0.3 : 1, filter: overlay ? "drop-shadow(0 16px 32px rgba(0,0,0,.4))" : undefined }}>

      {/* File-folder shape: small tab sticking up at top-right above a
         rounded-corner body. The buttons sit INSIDE the tab. One
         continuous SVG path traces the entire outline. */}
      <svg
        className="absolute inset-0 w-full h-full transition-[filter] duration-300"
        preserveAspectRatio="none"
        viewBox="0 0 260 300"
        aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--surface)" />
            <stop offset="100%" stopColor="var(--surface-2)" />
          </linearGradient>
        </defs>
        <path
          className="card-folder-path"
          d="
            M 166,8
            Q 166,0 174,0
            L 246,0
            Q 254,0 254,8
            L 254,272
            Q 254,300 226,300
            L 28,300
            Q 0,300 0,272
            L 0,40
            Q 0,28 12,28
            L 154,28
            Q 166,28 166,16 Z
          "
          fill={`url(#${gid})`}
          stroke="var(--border-strong)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Buttons sit centered inside the folder TAB at top-right */}
      <div className="absolute top-[6px] right-[10px] z-20 flex items-center gap-1.5">
        <button type="button" tabIndex={-1}
          aria-label="Reminders" className="notch-btn"
          style={{ width: 24, height: 24 }}
          onClick={(e) => e.preventDefault()}>
          <Bell className="w-3 h-3" />
          {isHot && <span className="dot" style={{ top: 1, right: 2, width: 5, height: 5 }} />}
        </button>
        <Link href={`/leads/${lead.id}`} aria-label="Open lead"
          className="notch-btn"
          style={{ width: 24, height: 24 }}
          onClick={(e) => e.stopPropagation()}>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Content (positioned over the SVG) */}
      <Link
        href={`/leads/${lead.id}`}
        draggable={false}
        className="relative block px-3 py-3 pt-12">

        {/* Avatar */}
        <div className="mb-2">
          {lead.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lead.photoUrl} alt=""
              className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full text-white text-[10px] font-bold grid place-items-center"
              style={{ background: "linear-gradient(135deg, oklch(70% 0.22 320), oklch(60% 0.22 290))" }}>
              {initials(lead.fullName)}
            </div>
          )}
        </div>

        <h3 className="text-[13px] font-bold tracking-tight leading-tight mb-px">{lead.fullName}</h3>
        <p className="text-[10px] text-[var(--text-soft)] mb-2 truncate">{programName}</p>

        {/* Source row */}
        <div className="flex items-center gap-1 mb-2">
          <SourcePill>{SOURCE_LABEL[lead.source]}</SourcePill>
          {lead.email && <SourcePill>Email</SourcePill>}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            {isHot && <span className="text-[10px] leading-none" aria-label="Hot">🔥</span>}
            <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-full"
              style={{ background: "oklch(0% 0 0 / 0.4)" }}>
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-interest-1)" }} />
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-interest-2)" }} />
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-interest-3)" }} />
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-interest-4)" }} />
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-interest-5)" }} />
            </div>
          </div>
          <span className="text-[9px] text-[var(--text-faint)] tabular-nums">{relativeTime(lead.createdAt)}</span>
        </div>
      </Link>
    </div>
  );
}

function SourcePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: "var(--surface-2)", color: "var(--text-soft)" }}>
      {children}
    </span>
  );
}
