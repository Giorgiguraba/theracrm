import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabasePublicKey } from "@/lib/env";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublicKey(),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — middleware handles refresh
          }
        },
      },
    },
  );
}
