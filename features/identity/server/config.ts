import "server-only";
import { readAuthConfig, type AuthConfig } from "./auth-config";

export { readAuthConfig, type AuthConfig };

/** The configuration of the running deployment. */
export function authConfig(): AuthConfig | null {
  return readAuthConfig(process.env);
}
