/**
 * Meta Lead Ads webhook
 * - GET: subscription verification (`hub.mode=subscribe`)
 * - POST: leadgen event, verify X-Hub-Signature-256, then fetch lead via Graph API
 *
 * Phase 2 will fill in the Graph API fetch + tenant mapping. The verification
 * skeleton is here so you can subscribe immediately during setup.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("x-hub-signature-256") ?? "";
  const raw = await req.text();

  const secret = process.env.META_APP_SECRET;
  if (!secret) return NextResponse.json({ error: "secret not set" }, { status: 500 });

  const expected = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  if (!safeEqual(expected, sig)) {
    return NextResponse.json({ error: "bad signature" }, { status: 403 });
  }

  const body = JSON.parse(raw);

  // Log unconditionally for the platform-health view
  const sb = getServiceSupabase();
  await sb.from("webhook_log").insert({
    source: "meta",
    payload: body,
    status: "ok",
  });

  // TODO Phase 2: for each entry.changes[].value.leadgen_id
  //   - resolve page_id -> tenant_id mapping
  //   - fetch lead from Graph API
  //   - upsert into leads (dedupe by meta_lead_id)
  //   - trigger realtime push so kanban updates live

  return NextResponse.json({ ok: true });
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a); const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
