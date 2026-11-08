import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { isAllowedOrigin } from "@/lib/origin";

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!(await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value))) return Response.json({ detail: "Authentication required" }, { status: 401 });
  const origin = request.headers.get("origin");
  if (request.method !== "GET" && !isAllowedOrigin(origin, request.headers.get("host"), process.env.VIGILAI_PUBLIC_ORIGIN)) return Response.json({ detail: "Invalid request origin" }, { status: 403 });
  const token = process.env.VIGILAI_API_TOKEN ?? "";
  if (token.length < 32) return Response.json({ detail: "Control plane API token is not configured" }, { status: 503 });
  const { path } = await context.params;
  const base = process.env.VIGILAI_API_URL ?? "http://localhost:8000";
  const url = `${base}/api/v1/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  try {
    const response = await fetch(url, { method: request.method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: request.method === "POST" ? await request.text() : undefined, cache: "no-store", redirect: "error" });
    const body = response.status === 204 ? null : await response.arrayBuffer();
    return new Response(body, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ detail: "Control plane is unavailable" }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const DELETE = forward;
