import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseServiceKey } from "@/lib/env";

/**
 * Service-role client — bypasses RLS.
 * NEVER expose this to the browser. Server / cron / webhook only.
 */
export function getServiceSupabase() {
  return createClient(
    getSupabaseUrl(),
    getSupabaseServiceKey(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
