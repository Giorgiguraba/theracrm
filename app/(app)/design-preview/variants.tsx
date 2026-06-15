"use client";
import Link from "next/link";
import { Bell, ArrowUpRight, Plus, FileText, Bookmark } from "lucide-react";
import type { Lead } from "@/lib/db/schema";
import { initials, relativeTime } from "@/lib/utils";

const SOURCE_LABEL = {
  fb_ads: "Facebook",
  ig_ads: "Instagram",
  manual: "Manual",
  referral: "Referral",
} as const;

const COMMON_PATH = `
  M 14,0
  L 154,0
  Q 162,0 167,9
  C 176,46 234,46 243,9
  Q 248,0 254,0
  Q 260,0 260,14
  L 260,236
  Q 260,250 246,250
  L 14,250
  Q 0,250 0,236
  L 0,14
  Q 0,0 14,0 Z
`;

function Avatar({ lead }: { lead: Lead }) {
  return lead.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={lead.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
  ) : (
    <div className="w-10 h-10 rounded-full text-white text-xs font-bold grid place-items-center"
      style={{ background: "linear-gradient(135deg, oklch(70% 0.22 320), oklch(60% 0.22 290))" }}>
      {initials(lead.fullName)}
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

function InterestDots() {
  return (
    <div className="flex items-center gap-1 px-1.5 py-1 rounded-full"
      style={{ background: "oklch(0% 0 0 / 0.4)" }}>
      <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-interest-1)" }} />
      <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-interest-2)" }} />
      <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-interest-3)" }} />
      <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-interest-4)" }} />
      <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-interest-5)" }} />
    </div>
  );
}

function PaperGrain() {
  // SVG grain overlay (very subtle noise)
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04] mix-blend-soft-light"
      preserveAspectRatio="none" aria-hidden="true">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="2" />
        <feColorMatrix values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 1 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

function CardShell({
  lead, programName, children, gid, withStack = false,
}: {
  lead: Lead; programName: string; children: React.ReactNode;
  gid: string; withStack?: boolean;
}) {
  return (
    <div className="card-folder relative" style={{ filter: withStack ? "drop-shadow(0 4px 0 var(--surface-2)) drop-shadow(0 8px 0 var(--surface))" : undefined }}>
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 260 250" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--surface)" />
            <stop offset="100%" stopColor="var(--surface-2)" />
          </linearGradient>
        </defs>
        <path className="card-folder-path" d={COMMON_PATH}
          fill={`url(#${gid})`} stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      {children}
    </div>
  );
}

// =============== A: Bookmark only ===============
export function VariantA({ lead, programName }: { lead: Lead; programName: string }) {
  return (
    <CardShell lead={lead} programName={programName} gid="va-grad">
      {/* Bookmark+ sticker in notch */}
      <div className="absolute top-1 right-5 z-20">
        <Link href={`/leads/${lead.id}`} aria-label="Open lead"
          className="block w-10 h-12 grid place-items-center rounded-md relative"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
          }}>
          <Plus className="w-4 h-4 text-[var(--text-soft)] mt-1" />
        </Link>
      </div>

      <PaperGrain />

      <Link href={`/leads/${lead.id}`} className="relative block px-3 py-3 pt-9">
        <div className="mb-2"><Avatar lead={lead} /></div>
        <h3 className="text-[13px] font-bold tracking-tight leading-tight mb-px">{lead.fullName}</h3>
        <p className="text-[10px] text-[var(--text-soft)] mb-3 truncate">{programName}</p>
        <div className="flex items-center gap-1 mb-2">
          <SourcePill>{SOURCE_LABEL[lead.source]}</SourcePill>
          {lead.email && <SourcePill>Email</SourcePill>}
        </div>
        <div className="flex items-center justify-between gap-1.5">
          <InterestDots />
          <FileText className="w-3.5 h-3.5 text-[var(--text-faint)]" />
        </div>
      </Link>
    </CardShell>
  );
}

// =============== B: Buttons + file decor ===============
export function VariantB({ lead, programName }: { lead: Lead; programName: string }) {
  return (
    <div className="relative">
      {/* Card stack shadows behind */}
      <div className="absolute inset-0 rounded-2xl translate-x-1.5 translate-y-1.5"
        style={{ background: "var(--surface-2)", opacity: 0.6 }} />
      <div className="absolute inset-0 rounded-2xl translate-x-3 translate-y-3"
        style={{ background: "var(--surface)", opacity: 0.35 }} />

      <CardShell lead={lead} programName={programName} gid="vb-grad">
        {/* Existing two buttons */}
        <div className="absolute top-1.5 right-4 z-20 flex items-start gap-1.5">
          <button type="button" tabIndex={-1} className="notch-btn"
            style={{ width: 28, height: 28 }} onClick={(e) => e.preventDefault()}>
            <Bell className="w-3 h-3" />
          </button>
          <Link href={`/leads/${lead.id}`} className="notch-btn"
            style={{ width: 28, height: 28 }}>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <PaperGrain />

        <Link href={`/leads/${lead.id}`} className="relative block px-3 py-3 pt-10">
          <div className="mb-2"><Avatar lead={lead} /></div>
          <h3 className="text-[13px] font-bold tracking-tight leading-tight mb-px">{lead.fullName}</h3>
          <p className="text-[10px] text-[var(--text-soft)] mb-3 truncate">{programName}</p>
          <div className="flex items-center gap-1 mb-2">
            <SourcePill>{SOURCE_LABEL[lead.source]}</SourcePill>
            {lead.email && <SourcePill>Email</SourcePill>}
          </div>
          <div className="flex items-center justify-between gap-1.5">
            <InterestDots />
            <FileText className="w-3.5 h-3.5 text-[var(--text-faint)]" />
          </div>
        </Link>
      </CardShell>
    </div>
  );
}

// =============== C: Hybrid ===============
export function VariantC({ lead, programName }: { lead: Lead; programName: string }) {
  return (
    <CardShell lead={lead} programName={programName} gid="vc-grad">
      {/* Bookmark sticker (decorative, links to lead) */}
      <div className="absolute top-1 right-5 z-20">
        <Link href={`/leads/${lead.id}`}
          className="block w-9 h-11 grid place-items-center relative"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "6px 6px 0 0",
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)",
          }}>
          <Bookmark className="w-3.5 h-3.5 text-[var(--text-soft)] mt-1" />
        </Link>
      </div>

      <PaperGrain />

      <Link href={`/leads/${lead.id}`} className="relative block px-3 py-3 pt-9">
        <div className="mb-2"><Avatar lead={lead} /></div>
        <h3 className="text-[13px] font-bold tracking-tight leading-tight mb-px">{lead.fullName}</h3>
        <p className="text-[10px] text-[var(--text-soft)] mb-3 truncate">{programName}</p>
        {/* Inline source + actions */}
        <div className="flex items-center gap-1 mb-2">
          <SourcePill>{SOURCE_LABEL[lead.source]}</SourcePill>
          {lead.email && <SourcePill>Email</SourcePill>}
          <span className="ml-auto flex items-center gap-1">
            <span className="w-6 h-6 rounded-full grid place-items-center"
              style={{ background: "var(--surface-2)" }}>
              <Bell className="w-3 h-3 text-[var(--text-soft)]" />
            </span>
            <span className="w-6 h-6 rounded-full grid place-items-center"
              style={{ background: "var(--surface-2)" }}>
              <ArrowUpRight className="w-3 h-3 text-[var(--text-soft)]" />
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-1.5">
          <InterestDots />
          <span className="text-[9px] text-[var(--text-faint)] tabular-nums">{relativeTime(lead.createdAt)}</span>
        </div>
      </Link>
    </CardShell>
  );
}

// =============== D: Current (control) ===============
export function VariantD({ lead, programName }: { lead: Lead; programName: string }) {
  return (
    <CardShell lead={lead} programName={programName} gid="vd-grad">
      <div className="absolute top-1.5 right-4 z-20 flex items-start gap-1.5">
        <button type="button" tabIndex={-1} className="notch-btn"
          style={{ width: 28, height: 28 }} onClick={(e) => e.preventDefault()}>
          <Bell className="w-3 h-3" />
        </button>
        <Link href={`/leads/${lead.id}`} className="notch-btn"
          style={{ width: 28, height: 28 }}>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <Link href={`/leads/${lead.id}`} className="relative block px-3 py-3 pt-10">
        <div className="mb-2"><Avatar lead={lead} /></div>
        <h3 className="text-[13px] font-bold tracking-tight leading-tight mb-px">{lead.fullName}</h3>
        <p className="text-[10px] text-[var(--text-soft)] mb-3 truncate">{programName}</p>
        <div className="flex items-center gap-1 mb-2">
          <SourcePill>{SOURCE_LABEL[lead.source]}</SourcePill>
          {lead.email && <SourcePill>Email</SourcePill>}
        </div>
        <div className="flex items-center justify-between gap-1.5">
          <InterestDots />
          <span className="text-[9px] text-[var(--text-faint)] tabular-nums">{relativeTime(lead.createdAt)}</span>
        </div>
      </Link>
    </CardShell>
  );
}
