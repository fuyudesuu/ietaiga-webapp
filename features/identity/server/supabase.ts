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
  const pending: string[] = [];
  const client = createServerClient(config.supabaseUrl, config.publishableKey, {
    cookieOptions: {
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "lax",
      maxAge: SESSION_SECONDS,
    },
    cookies: {
      getAll: () =>
        parseCookieHeader(request.headers.get("cookie") ?? "").map(
          (cookie) => ({ name: cookie.name, value: cookie.value ?? "" }),
        ),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies)
          pending.push(
            serializeCookieHeader(name, value, {
              ...options,
              maxAge: cappedMaxAge(name, options.maxAge),
              path: "/",
              httpOnly: true,
              secure,
              sameSite: "lax",
            }),
          );
      },
    },
    auth: { flowType: "pkce", detectSessionInUrl: false },
  });

  /** Adds the session cookies to a response and keeps it out of any cache. */
  function respond(response: Response) {
    for (const cookie of pending) response.headers.append("Set-Cookie", cookie);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  return { client, respond };
}
