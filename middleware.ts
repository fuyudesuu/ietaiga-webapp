import { NextResponse, type NextRequest } from "next/server";
import { authConfig, securityHeaders } from "@/features/identity/server";

// Adds the security headers to every response. Static exports (GitHub Pages)
// have no middleware; the Pages demo holds no private data.
export function middleware(request: NextRequest) {
  let supabaseOrigin: string | null = null;
  let siteIsHttps = request.nextUrl.protocol === "https:";
  try {
    const config = authConfig();
    supabaseOrigin = config?.supabaseUrl ?? null;
    if (config) siteIsHttps = config.siteOrigin.startsWith("https://");
  } catch {
    // Invalid sign-in settings: the auth routes report them; headers still apply.
  }
  const response = NextResponse.next();
  for (const [name, value] of Object.entries(
    securityHeaders({
      pathname: request.nextUrl.pathname,
      siteIsHttps,
      supabaseOrigin,
    }),
  ))
    response.headers.set(name, value);
  return response;
}
