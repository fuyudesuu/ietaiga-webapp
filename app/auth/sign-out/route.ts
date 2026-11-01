import {
  authConfig,
  isSameSiteRequest,
  createRequestClient,
  logAuthFailure,
  plainResponse,
  redirectTo,
} from "@/features/identity/server";

// Signs out this browser: revokes its refresh token at Supabase Auth and
// clears the session cookies. POST from this site only.
export async function POST(request: Request) {
  const config = authConfig();
  if (!config)
    return plainResponse(503, "Sign-in is not set up on this deployment.");
  const headers = {
    origin: request.headers.get("origin"),
    secFetchSite: request.headers.get("sec-fetch-site"),
  };
  if (!isSameSiteRequest(headers, config.siteOrigin))
    return plainResponse(403, "This request must come from the Encore site.");

  const { client, respond } = createRequestClient(request, config);
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) {
    // The cookies are cleared either way; say the server-side revoke failed.
    logAuthFailure("sign_out_revoke");
    return respond(
      redirectTo(
        new URL("/sign-in?error=signout", config.siteOrigin).toString(),
      ),
    );
  }
  return respond(redirectTo(new URL("/", config.siteOrigin).toString()));
}
