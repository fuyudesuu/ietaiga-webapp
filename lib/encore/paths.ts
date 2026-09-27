/**
 * Static hosting support (GitHub Pages). The app can be served below a
 * sub-path, and a static export only contains pages for the seeded records.
 */

// Set by vinext/Next.js from next.config `basePath`; empty at the domain root.
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? "";

/** Prefix an app-absolute path ("/trips") with the deployment base path. */
export function withBasePath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  return BASE_PATH + path;
}

/**
 * Pre-rendered detail page that renders any record chosen by `?id=`.
 * Records created in the browser have no exported page of their own, so
 * static hosting sends them here. Record IDs are UUIDs or seed slugs, so
 * this value cannot collide with a real record.
 */
export const RECORD_FALLBACK_ID = "view";

/** Map an unknown `/concerts/<id>` or `/trips/<id>` path to the fallback page. */
export function recordFallbackPath(pathname: string): string | null {
  const path = pathname.startsWith(BASE_PATH)
    ? pathname.slice(BASE_PATH.length)
    : pathname;
  const match = /^\/(concerts|trips)\/([^/]+?)(?:\.html)?\/?$/.exec(path);
  if (!match || match[2] === RECORD_FALLBACK_ID) return null;
  return `/${match[1]}/${RECORD_FALLBACK_ID}?id=${match[2]}`;
}
