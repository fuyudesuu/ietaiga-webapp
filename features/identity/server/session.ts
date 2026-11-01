import "server-only";
import {
  isAuthApiError,
  isAuthSessionMissingError,
  type SupabaseClient,
} from "@supabase/supabase-js";

/** The verified signed-in user a request acts for. */
export interface Actor {
  userId: string;
}

// Auth server answers meaning "this token is not a valid session": the user
// is signed out (expired, revoked, tampered, deleted account, rotated key).
const SIGNED_OUT_CODES = new Set([
  "bad_jwt",
  "user_not_found",
  "session_not_found",
  "session_expired",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "no_authorization",
]);

/**
 * Who this request is, checked with the Supabase Auth server (getUser), not
 * just decoded from the cookie. Null when signed out. Outages, rate limits and
 * a rejected API key throw: they must not look like being signed out, or like
 * success.
 */
export async function verifiedActor(
  client: SupabaseClient,
): Promise<Actor | null> {
  const { data, error } = await client.auth.getUser();
  if (error) {
    if (isAuthSessionMissingError(error)) return null;
    if (
      isAuthApiError(error) &&
      (SIGNED_OUT_CODES.has(error.code ?? "") || error.status === 403)
    )
      return null;
    if (isAuthApiError(error) && error.status === 401)
      throw new Error("Session check rejected the API key (configuration)");
    throw new Error(`Session check failed (${error.name})`);
  }
  return data.user ? { userId: data.user.id } : null;
}
