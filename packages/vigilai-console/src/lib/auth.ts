const SESSION_TTL_SECONDS = 60 * 60 * 8;

export const AUTH_COOKIE_NAME = "vigilai_session";

function getAuthConfig() {
  const username = process.env.VIGILAI_ADMIN_USERNAME;
  const password = process.env.VIGILAI_ADMIN_PASSWORD;
  const secret = process.env.VIGILAI_AUTH_SECRET;
  if (!username || !password || !secret || secret.length < 32) throw new Error("VigilAI authentication environment variables are not configured");
  return { username, password, secret };
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const config = getAuthConfig();
  const usernameMatches = constantTimeEqual(username, config.username);
  const passwordMatches = constantTimeEqual(password, config.password);
  return usernameMatches && passwordMatches;
}

export async function createSessionToken(username: string): Promise<string> {
  const { secret } = getAuthConfig();
  const payload = toBase64Url(JSON.stringify({ username, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 }));
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { username, secret } = getAuthConfig();
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra || !constantTimeEqual(signature, await hmac(payload, secret))) return false;
    const session = JSON.parse(fromBase64Url(payload)) as { username?: unknown; expiresAt?: unknown };
    return session.username === username && typeof session.expiresAt === "number" && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.VIGILAI_COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
