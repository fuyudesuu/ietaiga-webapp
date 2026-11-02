import {
  routeAuthConfig,
  clearStaleAuthCookies,
  createRequestClient,
  isSameSiteRequest,
  logAuthFailure,
  plainResponse,
  redirectTo,
} from "@/features/identity/server";

// Signs out this browser: revokes its refresh token at Supabase Auth and
// clears the session cookies. POST from this site only.
export async function POST(request: Request) {
  const headers = {
    origin: request.headers.get("origin"),
    secFetchSite: request.headers.get("sec-fetch-site"),
  };
  const loaded = routeAuthConfig();
  if ("response" in loaded) return loaded.response;
  const config = loaded.config;
  // With sign-in switched off, still let this site clear old session cookies.
  if (!config) {
    if (headers.secFetchSite !== "same-origin")
      return plainResponse(403, "This request must come from the Encore site.");
    return clearStaleAuthCookies(request, redirectTo("/"));
  }
  if (!isSameSiteRequest(headers, config.siteOrigin))
    return plainResponse(403, "This request must come from the Encore site.");

  const { respond, signOutThisBrowser } = createRequestClient(request, config);
  const { revoked } = await signOutThisBrowser();
  if (!revoked) {
    // The cookies are gone; the server-side revoke could not be confirmed.
    logAuthFailure("sign_out_revoke");
    return respond(
      redirectTo(
        new URL("/sign-in?error=signout", config.siteOrigin).toString(),
      ),
    );
  }
  return respond(redirectTo(new URL("/", config.siteOrigin).toString()));
}
