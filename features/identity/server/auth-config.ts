// Parses the sign-in settings. Kept free of the "server-only" guard so unit
// tests can load it; only ./config (server-only) reads the real environment.
import { z } from "zod";

// Sign-in configuration, read on the server only. Names, not values, are
// documented in docs/engineering/SETUP-SUPABASE.md; values live in the
// deployment's secret store. Only the publishable (anon) key is used: it is
// safe for clients by design, and every query still runs under row-level
// security as the signed-in user. The service-role key is never used here.

const httpsOrigin = z
  .url({ protocol: /^https$/ })
  .transform((value) => new URL(value).origin);
// Local development may use http://localhost for the site only.
const siteOrigin = z
  .url({ protocol: /^https?$/ })
  .refine(
    (value) =>
      value.startsWith("https://") ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(value),
    "The site URL must be https (http only for localhost).",
  )
  .transform((value) => new URL(value).origin);

/** The role inside a legacy JWT-style Supabase key, if it is one. */
function legacyKeyRole(key: string): string | undefined {
  const payload = key.split(".")[1];
  if (!payload) return undefined;
  try {
    const claims: unknown = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof claims === "object" && claims !== null && "role" in claims
      ? String(claims.role)
      : undefined;
  } catch {
    // Not a JWT: an opaque key (sb_publishable_...), which has no role.
    return undefined;
  }
}

const schema = z.object({
  ENCORE_SITE_URL: siteOrigin,
  SUPABASE_URL: httpsOrigin,
  // The publishable (anon) key only. A secret or service-role key would make
  // every query bypass row-level security, so it is refused outright.
  SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20)
    .max(512)
    .refine(
      (key) =>
        /^sb_publishable_[A-Za-z0-9_-]+$/.test(key) ||
        legacyKeyRole(key) === "anon",
      "Use the publishable key, never a secret or service-role key.",
    ),
});

export type AuthConfig = {
  siteOrigin: string;
  supabaseUrl: string;
  publishableKey: string;
};

const NAMES = [
  "ENCORE_SITE_URL",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
] as const;

/**
 * The sign-in configuration, or null when this deployment has none (the
 * demo). A partial or invalid configuration throws: it must fail closed and
 * visibly, not fall back to the demo.
 */
export function readAuthConfig(
  source: Record<string, string | undefined>,
): AuthConfig | null {
  const present = NAMES.filter((name) => source[name]);
  if (present.length === 0) return null;
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    // Report which settings are wrong, never their values.
    const fields = [
      ...new Set(parsed.error.issues.map((issue) => issue.path[0])),
    ];
    throw new Error(`Invalid sign-in configuration: ${fields.join(", ")}`);
  }
  return {
    siteOrigin: parsed.data.ENCORE_SITE_URL,
    supabaseUrl: parsed.data.SUPABASE_URL,
    publishableKey: parsed.data.SUPABASE_PUBLISHABLE_KEY,
  };
}
