import "server-only";
import { logAuthFailure, plainResponse } from "./responses";
import { readAuthConfig, type AuthConfig } from "./auth-config";

export { readAuthConfig, type AuthConfig };

/** The configuration of the running deployment. */
export function authConfig(): AuthConfig | null {
  return readAuthConfig(process.env);
}

/**
 * The configuration for a route handler: null when sign-in is off, or a
 * ready-made error response when the settings are invalid (logged by name
 * only, never values).
 */
export function routeAuthConfig():
  { config: AuthConfig | null } | { response: Response } {
  try {
    return { config: authConfig() };
  } catch {
    logAuthFailure("config_invalid");
    return { response: plainResponse(500, "Sign-in is misconfigured.") };
  }
}
