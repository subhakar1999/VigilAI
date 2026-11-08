/** Validate browser mutation requests against the configured public origin. */
export function isAllowedOrigin(origin: string | null, host: string | null, configuredOrigin: string | undefined): boolean {
  if (!origin || origin === "null") return false;
  try {
    const actual = new URL(origin);
    if (actual.origin !== origin || actual.username || actual.password) return false;
    if (configuredOrigin) {
      const configured = new URL(configuredOrigin);
      return configured.origin === configuredOrigin && !configured.username && !configured.password && actual.origin === configured.origin;
    }
    // Only loopback HTTP works without an explicitly configured public origin.
    return actual.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(actual.hostname) && actual.host === host;
  } catch {
    return false;
  }
}
