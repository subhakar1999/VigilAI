import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, createSessionToken, sessionCookieOptions, verifyCredentials } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username?: unknown; password?: unknown };
    if (typeof body.username !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ detail: "Username and password are required" }, { status: 400 });
    }
    if (!await verifyCredentials(body.username, body.password)) {
      return NextResponse.json({ detail: "Invalid username or password" }, { status: 401 });
    }
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(AUTH_COOKIE_NAME, await createSessionToken(body.username), sessionCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error && error.message.includes("environment variables")
      ? "VigilAI authentication is not configured"
      : "The login request could not be processed";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
