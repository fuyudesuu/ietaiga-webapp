import {
  routeAuthConfig,
  isSameSiteRequest,
  safeReturnPath,
  createRequestClient,
  logAuthFailure,
  plainResponse,
  redirectTo,
} from "@/features/identity/server";

// Starts "Continue with Discord". POST from the sign-in page only: the PKCE
// verifier cookie set here ties the provider's answer to this browser.
export async function POST(request: Request) {
  const loaded = routeAuthConfig();
  if ("response" in loaded) return loaded.response;
  const config = loaded.config;
  if (!config)
    return plainResponse(503, "Sign-in is not set up on this deployment.");
  const headers = {
    origin: request.headers.get("origin"),
    secFetchSite: request.headers.get("sec-fetch-site"),
  };
  if (!isSameSiteRequest(headers, config.siteOrigin))
    return plainResponse(403, "This request must come from the Encore site.");

  const form = await request.formData().catch(() => null);
  const next = safeReturnPath(form?.get("next")?.toString());
  const callback = new URL("/auth/callback", config.siteOrigin);
  callback.searchParams.set("next", next);

  const { client, respond } = createRequestClient(request, config);
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: callback.toString(),
      skipBrowserRedirect: true,
      // Login asks only who you are: no servers or messages. Supabase's Discord
      // provider may add "email" itself; check the consent screen on staging.
      scopes: "identify",
    },
  });
  // Only ever forward the browser to this project's own Auth server.
  if (error || !data.url || !data.url.startsWith(config.supabaseUrl + "/")) {
    logAuthFailure("sign_in_start");
    return redirectTo(
      new URL("/sign-in?error=start", config.siteOrigin).toString(),
    );
  }
  return respond(redirectTo(data.url));
}
