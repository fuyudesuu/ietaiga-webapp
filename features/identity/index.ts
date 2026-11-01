// Client-safe entry point of the identity feature. Server code is imported
// from "@/features/identity/server" by route handlers only.
export { safeReturnPath } from "./domain/return-path";
export { isSameSiteRequest } from "./domain/same-origin";
export { SignIn } from "./ui/sign-in";
