import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrl, getSupabasePublicKey, hasSupabaseEnv } from "@/lib/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Runs in middleware.ts. Refreshes the auth session and returns the
 * Supabase user, the response (which may carry refreshed cookies),
 * and a small `tenant` object for routing decisions.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // No Supabase configured -> skip session refresh, let middleware handle routing
  if (!hasSupabaseEnv()) {
    return { response, user: null, tenantId: null, role: null, tenantStatus: null };
  }

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublicKey(),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Tenant + role + status from JWT app_metadata
  const meta = (user?.app_metadata ?? {}) as {
    tenant_id?: string;
    role?: "platform_admin" | "admin" | "operator";
    tenant_status?: "active" | "past_due" | "suspended" | "cancelled";
    paid_until?: string;
  };

  return {
    response,
    user,
    tenantId: meta.tenant_id ?? null,
    role: meta.role ?? null,
    tenantStatus: meta.tenant_status ?? null,
  };
}
