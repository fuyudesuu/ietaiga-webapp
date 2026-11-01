import "server-only";
import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import type { AuthConfig } from "./config";

// Session cookies are for the server only: no page script can read them.
const SESSION_SECONDS = 30 * 24 * 60 * 60;
// The PKCE verifier only has to survive the trip to Discord and back.
const VERIFIER_SECONDS = 10 * 60;

/**
 * The auth cookie name. On https it carries the __Host- prefix, so browsers
 * refuse the cookie unless it is Secure, Path=/ and has no Domain: a sibling
 * subdomain cannot plant a session or verifier (login CSRF). Plain-http
 * localhost cannot use the prefix. Every chunk and verifier cookie the library
 * writes starts with this name.
 */
export function authCookieName(siteOrigin: string) {
  return siteOrigin.startsWith("https://")
    ? "__Host-encore-auth"
    : "encore-auth";
}

// RFC 6265 cookie-name token; other names (spaces, non-ASCII) would make
// serialising a deletion throw.
const COOKIE_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/** True for the auth cookie itself, its chunks (".0") and verifiers ("-..."). */
function isAuthCookie(name: string, base: string) {
  return (
    COOKIE_NAME.test(name) &&
    (name === base ||
      name.startsWith(base + ".") ||
      name.startsWith(base + "-"))
  );
}

/** Lifetime for a cookie the Supabase library sets; 0 (deletion) is kept. */
function cappedMaxAge(name: string, requested: number | undefined) {
  const limit = name.includes("code-verifier")
    ? VERIFIER_SECONDS
    : SESSION_SECONDS;
  if (requested === 0) return 0;
  return Math.min(requested ?? limit, limit);
}

/**
 * A Supabase client for one request, acting as whoever that request's session
 * cookies say. Never share it across requests. Cookie changes (sign-in,
 * refresh, sign-out) are collected and written by `respond`.
 */
export function createRequestClient(request: Request, config: AuthConfig) {
  const secure = config.siteOrigin.startsWith("https://");
  const cookieName = authCookieName(config.siteOrigin);
  const attributes = {
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "lax",
  } as const;
  const pending: string[] = [];
  const incoming = () =>
    parseCookieHeader(request.headers.get("cookie") ?? "").map((cookie) => ({
      name: cookie.name,
      value: cookie.value ?? "",
    }));
  const client = createServerClient(config.supabaseUrl, config.publishableKey, {
    cookieOptions: { name: cookieName, ...attributes, maxAge: SESSION_SECONDS },
    cookies: {
      getAll: incoming,
      setAll: (cookies) => {
        for (const { name, value, options } of cookies)
          pending.push(
            serializeCookieHeader(name, value, {
              ...options,
              ...attributes,
              maxAge: cappedMaxAge(name, options.maxAge),
            }),
          );
      },
    },
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      // The callback names which sign-in it finishes (sb_flow_id), so two tabs
      // signing in at once do not spoil each other.
      experimental: { appendPkceFlowIdToRedirects: true },
    },
  });

  /** Expires every auth cookie this request carried. */
  function clearAuthCookies() {
    // The session, its chunks (".0", ".1") and verifiers ("-code-verifier").
    for (const { name } of incoming())
      if (isAuthCookie(name, cookieName))
        pending.push(
          serializeCookieHeader(name, "", { ...attributes, maxAge: 0 }),
        );
  }

  /**
   * Signs this browser out: revokes the refresh token at Supabase Auth when it
   * can, and always removes the session cookies. The library keeps the session
   * when a token refresh fails retryably, so the cookies are cleared here too.
   */
  async function signOutThisBrowser(): Promise<{ revoked: boolean }> {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) clearAuthCookies();
    return { revoked: !error };
  }

  /** Adds the session cookies to a response and keeps it out of any cache. */
  function respond(response: Response) {
    for (const cookie of pending) response.headers.append("Set-Cookie", cookie);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  return { client, respond, signOutThisBrowser, clearAuthCookies };
}

/**
 * Expires any Encore auth cookie on a deployment with sign-in switched off,
 * so turning sign-in off cannot strand 30-day sessions in browsers.
 */
export function clearStaleAuthCookies(request: Request, response: Response) {
  for (const { name } of parseCookieHeader(request.headers.get("cookie") ?? ""))
    if (
      isAuthCookie(name, "__Host-encore-auth") ||
      isAuthCookie(name, "encore-auth")
    )
      response.headers.append(
        "Set-Cookie",
        serializeCookieHeader(name, "", {
          path: "/",
          httpOnly: true,
          secure: name.startsWith("__Host-"),
          sameSite: "lax",
          maxAge: 0,
        }),
      );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
