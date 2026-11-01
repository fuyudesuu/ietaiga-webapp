// Adversarial checks of the sign-in flow (security review, 2026-11-01).
// Tests named "F<n>" reproduce a review finding and assert its fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { loadTypeScript as load } from "./load-typescript.mjs";

const loadTypeScript = (path) => load(path, import.meta.url);
const { safeReturnPath } = await loadTypeScript(
  "../features/identity/domain/return-path.ts",
);

// Loads a server module without its "server-only" guard (which throws outside
// the react-server condition), resolving bare imports from this repository.
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

const { createRequestClient } = await loadServerModule(
  "../features/identity/server/supabase.ts",
);
const { verifiedActor } = await loadServerModule(
  "../features/identity/server/session.ts",
);

const localConfig = {
  siteOrigin: "http://localhost:8790",
  supabaseUrl: "https://example-project.supabase.co",
  publishableKey: "sb_publishable_placeholder_key_000",
};
const httpsConfig = { ...localConfig, siteOrigin: "https://encore.example" };
const SESSION_COOKIE = "encore-auth"; // http://localhost: no __Host- prefix

function sessionCookie(secondsUntilExpiry) {
  const session = {
    access_token: "header.payload.signature",
    refresh_token: "refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + secondsUntilExpiry,
    expires_in: 3600,
    token_type: "bearer",
    user: { id: "11111111-1111-1111-1111-111111111111" },
  };
  return `${SESSION_COOKIE}=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
}

function request(cookie) {
  return new Request("http://localhost:8790/auth/sign-out", {
    method: "POST",
    headers: cookie ? { cookie } : {},
  });
}

/** Replaces global fetch for one test; returns the URLs requested. */
function stubFetch(t, respond) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    calls.push(String(input instanceof Request ? input.url : input));
    return respond(String(input));
  };
  t.after(() => {
    globalThis.fetch = original;
  });
  return calls;
}

const networkDown = () => {
  throw new TypeError("fetch failed");
};

function setCookies(respond) {
  return respond(new Response(null)).headers.getSetCookie();
}

// --- Return path -----------------------------------------------------------

test("F2: safeReturnPath never returns a protocol-relative path (dot segments)", () => {
  for (const attack of [
    "/.//evil.example",
    "/%2e//evil.example",
    "/a/..//evil.example",
    "/x/%2E%2E//evil.example/?q#h",
  ]) {
    const result = safeReturnPath(attack);
    assert.ok(!result.startsWith("//"), `${attack} -> ${result}`);
    assert.equal(
      new URL(result, "https://encore.example").origin,
      "https://encore.example",
      `${attack} leaves the site`,
    );
  }
});

test("safeReturnPath is stable on its own output for safe paths", () => {
  for (const path of ["/", "/trips/a?tab=stays#top", "/%5Cx", "/concerts"])
    assert.equal(safeReturnPath(safeReturnPath(path)), safeReturnPath(path));
});

// --- Cookies ---------------------------------------------------------------

test("PKCE verifier cookies are httpOnly, Lax, path=/ and capped at 10 minutes", async (t) => {
  const calls = stubFetch(t, networkDown);
  const { client, respond } = createRequestClient(request(), localConfig);
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: "http://localhost:8790/auth/callback?next=%2F",
      skipBrowserRedirect: true,
      scopes: "identify",
    },
  });
  assert.equal(error, null);
  assert.equal(calls.length, 0, "starting sign-in makes no network call");
  assert.ok(
    data.url.startsWith(localConfig.supabaseUrl + "/auth/v1/authorize?"),
  );
  assert.match(data.url, /code_challenge_method=s256/);
  const cookies = setCookies(respond);
  assert.ok(cookies.length >= 1);
  for (const cookie of cookies) {
    assert.match(cookie, /code-verifier=/);
    assert.match(cookie, /; Max-Age=600;/);
    assert.match(cookie, /; Path=\//);
    assert.match(cookie, /; HttpOnly/);
    assert.match(cookie, /; SameSite=Lax/);
    assert.doesNotMatch(cookie, /; Domain=/i);
    assert.doesNotMatch(cookie, /; Secure/, "no Secure on http://localhost");
  }
});

test("cookies are Secure when the site is https", async (t) => {
  stubFetch(t, networkDown);
  const { client, respond } = createRequestClient(request(), httpsConfig);
  await client.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: "https://encore.example/auth/callback",
      skipBrowserRedirect: true,
    },
  });
  for (const cookie of setCookies(respond)) assert.match(cookie, /; Secure/);
});

test("F4: session cookies use the __Host- prefix on https (no cookie tossing from sibling subdomains)", async (t) => {
  stubFetch(t, networkDown);
  const { client, respond } = createRequestClient(request(), httpsConfig);
  await client.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: "https://encore.example/auth/callback",
      skipBrowserRedirect: true,
    },
  });
  for (const cookie of setCookies(respond)) assert.match(cookie, /^__Host-/);
});

// --- Code exchange -----------------------------------------------------------

test("a callback code without this browser's verifier never reaches Supabase", async (t) => {
  const calls = stubFetch(t, networkDown);
  const { client } = createRequestClient(request(), localConfig);
  const { error } = await client.auth.exchangeCodeForSession("attacker-code");
  assert.equal(error?.name, "AuthPKCECodeVerifierMissingError");
  assert.equal(calls.length, 0);
});

// --- Sign-out ----------------------------------------------------------------

test("sign-out with a live access token clears cookies even when Auth is down", async (t) => {
  stubFetch(t, networkDown);
  const { client, respond } = createRequestClient(
    request(sessionCookie(3600)),
    localConfig,
  );
  const { error } = await client.auth.signOut({ scope: "local" });
  assert.ok(error, "the revoke failure is reported");
  assert.ok(
    setCookies(respond).some(
      (cookie) =>
        cookie.startsWith(`${SESSION_COOKIE}=;`) && /Max-Age=0/.test(cookie),
    ),
  );
});

test("F1: sign-out with an expired access token clears cookies even when Auth is down", async (t) => {
  // auth-js retries a failed refresh with backoff for up to ~30s of clock
  // time; move the clock on with each attempt so the test stays fast.
  const realNow = Date.now;
  let offset = 0;
  Date.now = () => realNow() + offset;
  t.after(() => {
    Date.now = realNow;
  });
  stubFetch(t, () => {
    offset += 31_000;
    return networkDown();
  });
  const { respond, signOutThisBrowser } = createRequestClient(
    request(sessionCookie(-7200)),
    localConfig,
  );
  const { revoked } = await signOutThisBrowser();
  assert.equal(revoked, false);
  assert.ok(
    setCookies(respond).some((cookie) =>
      cookie.startsWith(`${SESSION_COOKIE}=;`),
    ),
    "the session cookie must be deleted",
  );
});

// --- verifiedActor -------------------------------------------------------------

const authJson = (status, body) => () =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "x-supabase-api-version": "2024-01-01",
    },
  });

test("verifiedActor: no session cookie is signed out, without a network call", async (t) => {
  const calls = stubFetch(t, networkDown);
  const { client } = createRequestClient(request(), localConfig);
  assert.equal(await verifiedActor(client), null);
  assert.equal(calls.length, 0);
});

test("verifiedActor: an Auth outage throws instead of looking signed out", async (t) => {
  stubFetch(t, networkDown);
  const { client } = createRequestClient(
    request(sessionCookie(3600)),
    localConfig,
  );
  await assert.rejects(verifiedActor(client), /Session check failed/);
});

test("verifiedActor: a 5xx from Auth throws", async (t) => {
  stubFetch(t, authJson(503, { code: "unexpected_failure", message: "down" }));
  const { client } = createRequestClient(
    request(sessionCookie(3600)),
    localConfig,
  );
  await assert.rejects(verifiedActor(client), /Session check failed/);
});

test("verifiedActor: a terminated session is signed out", async (t) => {
  stubFetch(t, authJson(403, { code: "session_not_found", message: "gone" }));
  const { client } = createRequestClient(
    request(sessionCookie(3600)),
    localConfig,
  );
  assert.equal(await verifiedActor(client), null);
});

test("F3: a rejected or tampered token (403 bad_jwt) is signed out, not an outage", async (t) => {
  stubFetch(t, authJson(403, { code: "bad_jwt", message: "invalid JWT" }));
  const { client } = createRequestClient(
    request(sessionCookie(3600)),
    localConfig,
  );
  assert.equal(await verifiedActor(client), null);
});

test("verifiedActor: returns only the verified user id", async (t) => {
  stubFetch(
    t,
    authJson(200, {
      id: "22222222-2222-2222-2222-222222222222",
      aud: "authenticated",
    }),
  );
  const { client } = createRequestClient(
    request(sessionCookie(3600)),
    localConfig,
  );
  assert.deepEqual(await verifiedActor(client), {
    userId: "22222222-2222-2222-2222-222222222222",
  });
});

// --- Configuration and headers -------------------------------------------------

const { readAuthConfig } =
  await import("../features/identity/server/auth-config.ts");
const { securityHeaders } =
  await import("../features/identity/server/security-headers.ts");

test("F6: secret and service-role keys are refused as the publishable key", () => {
  const base = {
    ENCORE_SITE_URL: "https://encore.example",
    SUPABASE_URL: "https://abcd.supabase.co",
  };
  const jwt = (role) =>
    [
      "e30",
      Buffer.from(JSON.stringify({ role })).toString("base64url"),
      "sig",
    ].join(".");
  for (const key of ["sb_secret_0123456789abcdefghij", jwt("service_role")])
    assert.throws(
      () => readAuthConfig({ ...base, SUPABASE_PUBLISHABLE_KEY: key }),
      /^Error: Invalid sign-in configuration: SUPABASE_PUBLISHABLE_KEY$/,
    );
  assert.ok(readAuthConfig({ ...base, SUPABASE_PUBLISHABLE_KEY: jwt("anon") }));
});

test("F5: responses carry anti-framing, referrer and sniffing headers", () => {
  const page = securityHeaders({
    pathname: "/settings",
    siteIsHttps: true,
    supabaseOrigin: "https://abcd.supabase.co",
  });
  assert.match(page["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(
    page["Content-Security-Policy"],
    /form-action 'self' https:\/\/abcd\.supabase\.co/,
  );
  assert.equal(page["X-Frame-Options"], "DENY");
  assert.equal(page["X-Content-Type-Options"], "nosniff");
  assert.equal(page["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(page["Strict-Transport-Security"], /max-age=63072000/);
  const callback = securityHeaders({
    pathname: "/auth/callback",
    siteIsHttps: false,
    supabaseOrigin: null,
  });
  assert.equal(callback["Referrer-Policy"], "no-referrer");
  assert.equal(callback["Strict-Transport-Security"], undefined);
  assert.match(callback["Content-Security-Policy"], /form-action 'self'$/);
});
