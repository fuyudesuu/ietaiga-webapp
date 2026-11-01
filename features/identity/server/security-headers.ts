// Response security headers for every page and route (security review F5).
// Kept free of the "server-only" guard so unit tests can load it.

/**
 * Headers that stop framing (clickjacking), MIME sniffing, plugin content and
 * <base> hijacking, limit where forms may post, and keep URLs (including the
 * one-time sign-in code) out of Referer headers. Script sources are not yet
 * restricted: that needs per-request nonces from the framework.
 */
export function securityHeaders(options: {
  pathname: string;
  siteIsHttps: boolean;
  supabaseOrigin: string | null;
}): Record<string, string> {
  const formTargets = ["'self'", options.supabaseOrigin].filter(Boolean);
  const headers: Record<string, string> = {
    "Content-Security-Policy": [
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "object-src 'none'",
      `form-action ${formTargets.join(" ")}`,
    ].join("; "),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": /^\/auth(\/|$)/.test(options.pathname)
      ? "no-referrer"
      : "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=()",
  };
  if (options.siteIsHttps)
    headers["Strict-Transport-Security"] =
      "max-age=63072000; includeSubDomains";
  return headers;
}
