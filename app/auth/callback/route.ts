import {
  routeAuthConfig,
  safeReturnPath,
  createRequestClient,
  logAuthFailure,
  plainResponse,
  redirectTo,
} from "@/features/identity/server";

// Discord (through Supabase Auth) returns here with a one-time code. It only
// becomes a session together with this browser's PKCE verifier cookie.
export async function GET(request: Request) {
  const loaded = routeAuthConfig();
  if ("response" in loaded) return loaded.response;
  const config = loaded.config;
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
  const flowId = url.searchParams.get("sb_flow_id");
  const { error } = await client.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );
  if (error) {
    logAuthFailure("callback_exchange", error);
    return respond(signIn("failed"));
  }
  // The return path is same-site by construction; check the final address too.
  const target = new URL(
    safeReturnPath(url.searchParams.get("next")),
    config.siteOrigin,
  );
  const destination =
    target.origin === config.siteOrigin
      ? target
      : new URL("/", config.siteOrigin);
  return respond(redirectTo(destination.toString()));
}
