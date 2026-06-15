import { Bell, ArrowUpRight, Mail, Phone, Video, Check, Clock } from "lucide-react";
import { initials } from "@/lib/utils";
import Link from "next/link";

export type ActivityCardData = {
  href: string;
  personName: string;
  personRole: string;
  personPhoto?: string | null;
  title: string;
  kind: "call" | "video" | "email" | "meeting" | "reminder";
  when: string;
  attendees?: { name: string; photo?: string | null }[];
  status: { label: string; tone: "scheduled" | "done" | "overdue" | "waiting" };
  variant?: "lime" | "dark";
  hasAlert?: boolean;
};

const KIND_META = {
  call:     { icon: Phone,  bg: "linear-gradient(135deg, oklch(70% 0.22 320), oklch(60% 0.22 290))" },
  video:    { icon: Video,  bg: "linear-gradient(135deg, oklch(64% 0.22 264), oklch(54% 0.22 290))" },
  email:    { icon: Mail,   bg: "linear-gradient(135deg, oklch(70% 0.22 350), oklch(60% 0.22 320))" },
  meeting:  { icon: Video,  bg: "linear-gradient(135deg, oklch(74% 0.16 195), oklch(60% 0.16 180))" },
  reminder: { icon: Clock,  bg: "linear-gradient(135deg, oklch(80% 0.18 80), oklch(64% 0.18 50))" },
} as const;

export function ActivityCard({ data }: { data: ActivityCardData }) {
  const KIcon = KIND_META[data.kind].icon;
  const isLime = data.variant === "lime";

  return (
    <div className="relative tilt liquid">
      {/* Floating bell + arrow, sit in the notch */}
      <div className="absolute top-1.5 right-3 z-10 flex items-start gap-1.5">
        <button type="button" tabIndex={-1}
          className="notch-btn relative"
          onClick={(e) => e.preventDefault()}>
          <Bell className="w-4 h-4" />
          {data.hasAlert && <span className="dot" />}
        </button>
        <Link href={data.href} aria-label="Open"
          className="notch-btn"
          onClick={(e) => e.stopPropagation()}>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <Link href={data.href}
        draggable={false}
        className={`block rounded-[28px] notch-tr p-4 transition-all border ${isLime ? "lime-card" : "glass-card"}`}
        style={isLime ? { borderColor: "transparent" } : {}}>
      {/* Top: person */}
      <div className="flex items-center gap-2.5 mb-4">
        {data.personPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.personPhoto} alt={data.personName}
            className="w-9 h-9 rounded-full object-cover ring-2"
            style={{ boxShadow: "inset 0 1px 0 oklch(100% 0 0 / 0.3)" }} />
        ) : (
          <div className="w-9 h-9 rounded-full grid place-items-center text-white text-[11px] font-bold"
            style={{ background: "linear-gradient(135deg, oklch(70% 0.22 320), oklch(60% 0.22 290))" }}>
            {initials(data.personName)}
          </div>
        )}
        <div>
          <div className="text-[13px] font-semibold leading-tight">{data.personName}</div>
          <div className="text-[11px] opacity-70">{data.personRole}</div>
        </div>
      </div>

      {/* Middle: title + when */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 rounded-xl grid place-items-center text-white shrink-0"
            style={{ background: KIND_META[data.kind].bg, boxShadow: "inset 0 1px 0 oklch(100% 0 0 / 0.25)" }}>
            <KIcon className="w-4 h-4" />
          </div>
          <div className="text-[18px] font-bold tracking-tight leading-tight">{data.title}</div>
        </div>
        <div className="flex items-center gap-2 ml-12 text-[12px]">
          {data.attendees && data.attendees.length > 0 && (
            <div className="flex -space-x-1.5">
              {data.attendees.slice(0, 3).map((a, i) => (
                a.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={a.photo} alt={a.name}
                    className="w-5 h-5 rounded-full object-cover ring-2"
                    style={{ boxShadow: "0 0 0 1.5px var(--surface)" }} />
                ) : (
                  <div key={i} className="w-5 h-5 rounded-full grid place-items-center text-[8px] font-bold text-white ring-2"
                    style={{
                      background: "linear-gradient(135deg, oklch(70% 0.22 320), oklch(60% 0.22 290))",
                      boxShadow: "0 0 0 1.5px var(--surface)",
                    }}>
                    {initials(a.name)}
                  </div>
                )
              ))}
            </div>
          )}
          <span className="font-semibold tabular-nums">{data.when}</span>
        </div>
      </div>

      {/* Bottom: status pill + quick actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">Status</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <div className={`flex items-center gap-2 flex-1 min-w-0 rounded-full px-3 py-1.5 text-[12px] font-medium ${
          isLime ? "bg-black/10" : "bg-[var(--surface-2)]"
        }`}>
          <StatusDot tone={data.status.tone} />
          <span className="truncate">{data.status.label}</span>
        </div>
        {data.kind === "email" ? null : (
          <button type="button" tabIndex={-1}
            className={`w-8 h-8 rounded-full grid place-items-center ${isLime ? "bg-black/10" : "bg-[var(--surface-2)]"}`}>
            <Mail className="w-3.5 h-3.5" />
          </button>
        )}
        <button type="button" tabIndex={-1}
          className="w-8 h-8 rounded-full grid place-items-center bg-black text-white">
          {data.kind === "video" || data.kind === "meeting" ? <Video className="w-3.5 h-3.5" />
            : data.kind === "call" ? <Phone className="w-3.5 h-3.5" />
            : <Check className="w-3.5 h-3.5" />}
        </button>
      </div>
      </Link>
    </div>
  );
}

function StatusDot({ tone }: { tone: ActivityCardData["status"]["tone"] }) {
  const map = {
    scheduled: "var(--color-status-new)",
    done: "var(--color-status-enrolled)",
    overdue: "var(--color-status-overdue)",
    waiting: "var(--color-status-thinking)",
  } as const;
  return <span className="w-1.5 h-1.5 rounded-full" style={{ background: map[tone] }} />;
}
