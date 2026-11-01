import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** The verified signed-in user a request acts for. */
export interface Actor {
  userId: string;
}

/**
 * Who this request is, checked with the Supabase Auth server (getUser), not
 * just decoded from the cookie. Null when signed out. Any other failure
 * throws: an outage must not look like being signed out, or like success.
 */
export async function verifiedActor(
  client: SupabaseClient,
): Promise<Actor | null> {
  const { data, error } = await client.auth.getUser();
  if (error) {
    if (error.name === "AuthSessionMissingError" || error.status === 401)
      return null;
    throw new Error(`Session check failed (${error.name})`);
  }
  return data.user ? { userId: data.user.id } : null;
}
