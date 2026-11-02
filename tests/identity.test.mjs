import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript as load } from "./load-typescript.mjs";
import { readAuthConfig } from "../features/identity/server/auth-config.ts";

const loadTypeScript = (path) => load(path, import.meta.url);
const { safeReturnPath } = await loadTypeScript(
  "../features/identity/domain/return-path.ts",
);
const { isSameSiteRequest } = await loadTypeScript(
  "../features/identity/domain/same-origin.ts",
);

test("sign-in returns only to paths on this site", () => {
  assert.equal(
    safeReturnPath("/trips/autumn?tab=stays#top"),
    "/trips/autumn?tab=stays#top",
  );
  assert.equal(safeReturnPath("/"), "/");
  for (const attack of [
    null,
    undefined,
    "",
    "https://evil.example/",
    "//evil.example/",
    "/\\evil.example/",
    "\\\\evil.example",
    "/%2F%2Fevil.example",
    "javascript:alert(1)",
    "/\tevil",
    "/\nhttps://evil.example",
    "evil.example",
    "/auth/callback?code=x",
    "/" + "a".repeat(600),
  ]) {
    const result = safeReturnPath(attack);
    assert.ok(
      result === "/" || (result.startsWith("/") && !result.startsWith("//")),
      `${JSON.stringify(attack)} -> ${result}`,
    );
    assert.ok(
      !/evil/.test(new URL(result, "https://encore.test").host),
      `${JSON.stringify(attack)} leaves the site`,
    );
  }
  assert.equal(safeReturnPath("/auth/sign-out"), "/");
});

test("state-changing auth requests must come from this site", () => {
  const site = "https://encore.example";
  assert.equal(
    isSameSiteRequest({ origin: site, secFetchSite: "same-origin" }, site),
    true,
  );
  assert.equal(
    isSameSiteRequest({ origin: site, secFetchSite: null }, site),
    true,
  );
  assert.equal(
    isSameSiteRequest({ origin: null, secFetchSite: "same-origin" }, site),
    true,
  );
  assert.equal(
    isSameSiteRequest(
      { origin: "https://evil.example", secFetchSite: "cross-site" },
      site,
    ),
    false,
  );
  assert.equal(
    isSameSiteRequest(
      { origin: "https://evil.example", secFetchSite: null },
      site,
    ),
    false,
  );
  assert.equal(
    isSameSiteRequest({ origin: site, secFetchSite: "same-site" }, site),
    false,
  );
  assert.equal(
    isSameSiteRequest({ origin: "null", secFetchSite: null }, site),
    false,
  );
  assert.equal(
    isSameSiteRequest({ origin: null, secFetchSite: null }, site),
    false,
  );
});

test("sign-in configuration is absent, valid, or refused", () => {
  assert.equal(readAuthConfig({}), null);
  const valid = {
    ENCORE_SITE_URL: "https://encore.example/",
    SUPABASE_URL: "https://abcd.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_0123456789abcdef",
  };
  assert.deepEqual(readAuthConfig(valid), {
    siteOrigin: "https://encore.example",
    supabaseUrl: "https://abcd.supabase.co",
    publishableKey: "sb_publishable_0123456789abcdef",
  });
  assert.equal(
    readAuthConfig({ ...valid, ENCORE_SITE_URL: "http://localhost:3000" })
      .siteOrigin,
    "http://localhost:3000",
  );
  // Partial or unsafe settings fail closed, naming the setting, not its value.
  for (const broken of [
    { SUPABASE_URL: valid.SUPABASE_URL },
    { ...valid, SUPABASE_URL: "http://abcd.supabase.co" },
    { ...valid, ENCORE_SITE_URL: "http://encore.example" },
    { ...valid, SUPABASE_PUBLISHABLE_KEY: "short" },
  ]) {
    assert.throws(
      () => readAuthConfig(broken),
      (error) => {
        assert.match(error.message, /^Invalid sign-in configuration: /);
        assert.doesNotMatch(error.message, /sb_publishable|abcd/);
        return true;
      },
    );
  }
});
