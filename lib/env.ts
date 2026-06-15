/**
 * Centralized env access. Lets the app render a friendly "set up Supabase"
 * screen instead of crashing when keys are missing, and supports both the
 * legacy `ANON_KEY` and the newer `PUBLISHABLE_KEY` naming from Supabase.
 */
export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function getSupabasePublicKey() {
  // Supabase renamed "anon key" to "publishable key" in 2025; accept either.
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ""
  );
}

export function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function hasSupabaseEnv() {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}

export function hasDatabaseEnv() {
  return Boolean(process.env.DATABASE_URL);
}
