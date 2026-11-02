import "server-only";

/** A 303 redirect, so a POST is never repeated at the new location. */
export function redirectTo(location: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}

/** A short plain-text reply that is never cached. */
export function plainResponse(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Logs an auth failure by category and a correlation id only: never tokens,
 * codes, cookies or provider messages that could contain them.
 */
export function logAuthFailure(
  category: string,
  cause?: { name?: string; code?: string },
): string {
  const correlationId = crypto.randomUUID();
  // An error's name and code are fixed identifiers; its message is never logged.
  console.error(
    JSON.stringify({
      event: "auth_failure",
      category,
      errorName: cause?.name,
      errorCode: cause?.code,
      correlationId,
    }),
  );
  return correlationId;
}
