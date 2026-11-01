// Where to send someone after sign-in. Only a path on this site is accepted,
// so the sign-in flow can never be used to redirect to another origin.

const MAX_LENGTH = 512;

/** A safe same-site path ("/trips/abc?x=1"), or "/" for anything else. */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || value.length > MAX_LENGTH) return "/";
  // Reject protocol-relative ("//evil"), backslash tricks ("/\evil") and any
  // control characters before parsing; browsers normalise these differently.
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return "/";
  const base = "https://return-path.invalid";
  let parsed: URL;
  try {
    parsed = new URL(value, base);
  } catch {
    return "/";
  }
  if (parsed.origin !== base) return "/";
  // Never bounce back into the auth routes themselves.
  if (/^\/auth(\/|$)/i.test(parsed.pathname)) return "/";
  const path = parsed.pathname + parsed.search + parsed.hash;
  // Dot segments normalise "/.//evil" to "//evil": protocol-relative, so
  // another site. Check again after normalising.
  if (path.startsWith("//")) return "/";
  return path;
}
