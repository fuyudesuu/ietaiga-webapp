import {
  authConfig,
  safeReturnPath,
  createRequestClient,
  logAuthFailure,
  plainResponse,
  redirectTo,
} from "@/features/identity/server";

// Discord (through Supabase Auth) returns here with a one-time code. It only
// becomes a session together with this browser's PKCE verifier cookie.
export async function GET(request: Request) {
  const config = authConfig();
  if (!config)
    return plainResponse(503, "Sign-in is not set up on this deployment.");
  const url = new URL(request.url);
  const signIn = (reason: string) =>
    redirectTo(
      new URL(`/sign-in?error=${reason}`, config.siteOrigin).toString(),
    );

  // Cancelling on Discord's screen comes back with an error and no code.
  const code = url.searchParams.get("code");
  if (!code)
    return signIn(url.searchParams.has("error") ? "cancelled" : "failed");

  const { client, respond } = createRequestClient(request, config);
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    logAuthFailure("callback_exchange");
    return respond(signIn("failed"));
  }
  const next = safeReturnPath(url.searchParams.get("next"));
  return respond(redirectTo(new URL(next, config.siteOrigin).toString()));
}
