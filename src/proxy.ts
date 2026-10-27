import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for the admin area: no session cookie, no /admin. The real
 * check (session valid, email still on the allowlist) runs per request in
 * src/lib/authz.ts.
 */

const SESSION_COOKIES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  // Local development bypass; see devAdmin() in src/lib/authz.ts.
  if (process.env.NODE_ENV !== "production" && process.env.DEV_ADMIN_EMAIL?.trim()) return NextResponse.next();
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
