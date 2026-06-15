"use client";
import { useRef, useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { setLeadPhoto } from "@/lib/actions/leads";
import { initials } from "@/lib/utils";
import { toast } from "sonner";

const AVATAR_PALETTES = [
  ["oklch(70% 0.22 320)", "oklch(60% 0.22 290)"],
  ["oklch(70% 0.22 350)", "oklch(60% 0.22 320)"],
  ["oklch(76% 0.16 65)", "oklch(64% 0.18 50)"],
  ["oklch(72% 0.18 160)", "oklch(60% 0.18 145)"],
  ["oklch(68% 0.20 25)", "oklch(58% 0.20 15)"],
  ["oklch(74% 0.16 195)", "oklch(60% 0.16 180)"],
] as const;
const gradFor = (id: string) => {
  const i = Math.abs([...id].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[i];
};

export function LeadPhotoUpload({
  leadId, fullName, photoUrl, tenantId, size = 80,
}: { leadId: string; fullName: string; photoUrl: string | null; tenantId: string; size?: number }) {
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<string | null>(photoUrl);
  const input = useRef<HTMLInputElement>(null);
  const [c1, c2] = gradFor(leadId);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    start(async () => {
      const supabase = getBrowserSupabase();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${tenantId}/${leadId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("lead-photos").upload(path, file, {
        cacheControl: "3600", upsert: true, contentType: file.type,
      });
      if (error) { toast.error(error.message); setPreview(photoUrl); return; }
      const { data: pub } = supabase.storage.from("lead-photos").getPublicUrl(path);
      try {
        await setLeadPhoto({ id: leadId, photoUrl: pub.publicUrl });
        setPreview(pub.publicUrl);
        toast.success("Photo updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
        setPreview(photoUrl);
      }
    });
  }

  async function onRemove() {
    start(async () => {
      try {
        await setLeadPhoto({ id: leadId, photoUrl: null });
        setPreview(null);
        toast.success("Photo removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="relative inline-block group" style={{ width: size, height: size }}>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={fullName}
          className="rounded-2xl object-cover"
          style={{
            width: size, height: size,
            boxShadow: `0 12px 32px ${c1.replace(")", " / 0.4)")}, inset 0 1px 0 oklch(100% 0 0 / 0.3)`,
          }} />
      ) : (
        <div className="rounded-2xl grid place-items-center text-white font-bold"
          style={{
            width: size, height: size, fontSize: size * 0.28,
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            boxShadow: `0 12px 32px ${c1.replace(")", " / 0.4)")}, inset 0 1px 0 oklch(100% 0 0 / 0.3)`,
          }}>
          {initials(fullName)}
        </div>
      )}

      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending}
        className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white text-xs gap-1"
        style={{ flexDirection: "column" }}
      >
        <Camera className="w-4 h-4" />
        {pending ? "…" : "Change"}
      </button>

      {preview && !pending && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full grid place-items-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "var(--color-status-overdue)" }}
          title="Remove photo">
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      <input ref={input} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
