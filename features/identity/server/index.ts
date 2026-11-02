// Server-only entry point of the identity feature (route handlers only).
import "server-only";
export { authConfig, routeAuthConfig, type AuthConfig } from "./config";
export { createRequestClient, clearStaleAuthCookies } from "./supabase";
export { verifiedActor, type Actor } from "./session";
export { redirectTo, plainResponse, logAuthFailure } from "./responses";
export { safeReturnPath } from "../domain/return-path";
export { isSameSiteRequest } from "../domain/same-origin";
export { securityHeaders } from "./security-headers";
