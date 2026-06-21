// ============================================================
// src/proxy.ts
// Next.js 16+ Edge Proxy (replaces middleware.ts).
// Uses default export to satisfy both old and new conventions.
// Protects routes via a lightweight presence cookie "hr_auth_present".
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Routes accessible without authentication */
const PUBLIC_ROUTES = ["/login", "/register", "/auth/google/callback"];

/** Routes only accessible while unauthenticated */
const AUTH_ONLY_ROUTES = ["/login", "/register"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isAuthPresent = request.cookies.has("hr_auth_present");

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Not authenticated → redirect to login
  if (!isAuthPresent && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated → redirect away from auth routes
  if (isAuthPresent && AUTH_ONLY_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
