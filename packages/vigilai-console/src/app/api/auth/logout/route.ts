import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(AUTH_COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
