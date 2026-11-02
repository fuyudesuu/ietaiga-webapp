// Regression review (2026-11-01, third pass): findings R-5 to R-7 about the
// first round of fixes, plus tests for fixes that had none.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function loadServerModule(path) {
  let source = await readFile(new URL(path, import.meta.url), "utf8");
  source = source.replace(/^import "server-only";\s*$/m, "");
  source = source.replace(
    /from "(@supabase\/[^"]+)"/g,
    (_, name) => `from "${import.meta.resolve(name)}"`,
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(
    `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`
  );
}

const { readAuthConfig } =
  await import("../features/identity/server/auth-config.ts");
const { clearStaleAuthCookies, createRequestClient } = await loadServerModule(
  "../features/identity/server/supabase.ts",
);

test("R-5: a secret key with surrounding whitespace is refused (fetch trims header values)", () => {
  const base = {
    ENCORE_SITE_URL: "https://encore.example",
    SUPABASE_URL: "https://abcd.supabase.co",
  };
  for (const key of [
    " sb_secret_0123456789abcdefghij",
    "\tsb_secret_0123456789abcdefghij",
  ])
    assert.throws(() =>
      readAuthConfig({ ...base, SUPABASE_PUBLISHABLE_KEY: key }),
    );
});

test("R-6: an odd auth-prefixed cookie name cannot make sign-out throw", () => {
  const request = new Request("http://localhost:8790/auth/sign-out", {
    method: "POST",
    headers: { cookie: "encore-auth x=1; encore-auth.0=a" },
  });
  // Sign-in off: clearStaleAuthCookies. Sign-in on: clearAuthCookies (used
  // when the revoke fails).
  assert.doesNotThrow(() => clearStaleAuthCookies(request, new Response()));
  const { clearAuthCookies } = createRequestClient(request, {
    siteOrigin: "http://localhost:8790",
    supabaseUrl: "https://example-project.supabase.co",
    publishableKey: "sb_publishable_placeholder_key_000",
  });
  assert.doesNotThrow(() => clearAuthCookies());
});

test("R-7: clearing stale auth cookies leaves unrelated cookies alone", () => {
  const request = new Request("http://localhost:8790/auth/sign-out", {
    headers: { cookie: "encore-authority=keep; encore-auth.0=a" },
  });
  const cleared = clearStaleAuthCookies(request, new Response())
    .headers.getSetCookie()
    .map((cookie) => cookie.split("=")[0]);
  assert.deepEqual(cleared, ["encore-auth.0"]);
});

// --- Fixes that had no test --------------------------------------------------

test("F8: sign-in redirects carry the PKCE flow id for the callback", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("no network in tests");
  };
  try {
    const { client } = createRequestClient(
      new Request("http://localhost:8790/auth/sign-in", { method: "POST" }),
      {
        siteOrigin: "http://localhost:8790",
        supabaseUrl: "https://example-project.supabase.co",
        publishableKey: "sb_publishable_placeholder_key_000",
      },
    );
    const { data } = await client.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: "http://localhost:8790/auth/callback?next=%2F",
        skipBrowserRedirect: true,
      },
    });
    const redirect = new URL(new URL(data.url).searchParams.get("redirect_to"));
    assert.match(
      redirect.searchParams.get("sb_flow_id") ?? "",
      /^[A-Za-z0-9_-]{8,64}$/,
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("F10: with sign-in off, old Encore auth cookies are expired and nothing else", () => {
  const request = new Request("https://encore.example/auth/sign-out", {
    method: "POST",
    headers: {
      cookie:
        "__Host-encore-auth=a; __Host-encore-auth.0=b; encore-auth-code-verifier=c; theme=dark; other=1",
    },
  });
  const response = clearStaleAuthCookies(
    request,
    new Response(null, { status: 303 }),
  );
  const expired = response.headers
    .getSetCookie()
    .map((cookie) => cookie.split("=")[0]);
  assert.deepEqual(expired.sort(), [
    "__Host-encore-auth",
    "__Host-encore-auth.0",
    "encore-auth-code-verifier",
  ]);
  for (const cookie of response.headers.getSetCookie())
    assert.match(cookie, /Max-Age=0/);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("F11: auth failure logs carry error names and codes, never messages", async () => {
  const { logAuthFailure } = await loadServerModule(
    "../features/identity/server/responses.ts",
  );
  const lines = [];
  const original = console.error;
  console.error = (line) => lines.push(line);
  try {
    logAuthFailure("callback_exchange", {
      name: "AuthApiError",
      code: "bad_code_verifier",
      message: "secret-token-abc in message",
    });
  } finally {
    console.error = original;
  }
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.category, "callback_exchange");
  assert.equal(entry.errorName, "AuthApiError");
  assert.equal(entry.errorCode, "bad_code_verifier");
  assert.match(entry.correlationId, /^[0-9a-f-]{36}$/);
  assert.doesNotMatch(lines[0], /secret-token|message/);
});
