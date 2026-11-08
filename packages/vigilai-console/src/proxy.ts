import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/playground" ||
    pathname === "/integrations" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/playground/") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png")
  ) {
    return NextResponse.next();
  }
  if (await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value)) return NextResponse.next();
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png|favicon-32x32.png|favicon-16x16.png|vigilai-logo.png|vigilai-favicon-v2.png|.*\\.(?:svg|png|ico|jpg|jpeg|webp)).*)",
  ],
};
