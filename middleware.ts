import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { hasSupabaseEnv } from "@/lib/env";

const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/no-tenant", "/payment-required", "/setup-required", "/api/webhooks"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Env not configured -> route everyone to the setup screen
  if (!hasSupabaseEnv()) {
    if (pathname.startsWith("/setup-required") || pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/setup-required";
    return NextResponse.redirect(url);
  }

  const { response, user, tenantStatus } = await updateSession(request);

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return response;

  // Not signed in -> sign-in
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Suspended -> hard block, vendor contact screen
  if (tenantStatus === "suspended" || tenantStatus === "cancelled") {
    const url = request.nextUrl.clone();
    url.pathname = "/payment-required";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
