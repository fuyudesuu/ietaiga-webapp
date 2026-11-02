// Cross-site request forgery guard for state-changing auth requests
// (sign-in start, sign-out). Browsers send Origin on POST; Sec-Fetch-Site is
// a second signal. A request with neither is refused.

export interface RequestOriginHeaders {
  origin: string | null;
  secFetchSite: string | null;
}

/** True only when the request clearly comes from this site's own pages. */
export function isSameSiteRequest(
  headers: RequestOriginHeaders,
  siteOrigin: string,
): boolean {
  if (headers.secFetchSite && headers.secFetchSite !== "same-origin")
    return false;
  if (headers.origin === null) return headers.secFetchSite === "same-origin";
  return headers.origin === siteOrigin;
}
