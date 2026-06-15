"use client";
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabasePublicKey } from "@/lib/env";

export function getBrowserSupabase() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublicKey());
}
