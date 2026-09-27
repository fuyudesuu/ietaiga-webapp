import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// Proves the import-boundary rules in .dependency-cruiser.cjs reject real
// violations. The fixtures are never part of the application build.
const FIXTURES = "tests/boundaries/fixtures";

function cruise(path) {
  const result = spawnSync(
    process.execPath,
    [
      "node_modules/dependency-cruiser/bin/dependency-cruiser.mjs",
      path,
      "--config",
      ".dependency-cruiser.cjs",
      "--output-type",
      "json",
    ],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  assert.ok(result.stdout, result.stderr);
  return JSON.parse(result.stdout).summary.violations;
}

const violations = cruise(FIXTURES);
const rulesFor = (file) =>
  new Set(
    violations
      .filter((violation) => violation.from === `${FIXTURES}/${file}`)
      .map((violation) => violation.rule.name),
  );

test("a direct client import of a server module is rejected", () => {
  assert.ok(
    rulesFor("features/concerts/ui/direct-server.tsx").has(
      "client-reaches-server",
    ),
  );
});

test("the same violation through the @/ alias is rejected", () => {
  assert.ok(
    rulesFor("features/concerts/ui/alias-server.tsx").has(
      "client-reaches-server",
    ),
  );
});

test("reaching a server module through a re-export is rejected", () => {
  const rules = rulesFor("features/concerts/ui/transitive-server.tsx");
  assert.ok(rules.has("client-reaches-server"));
});

test("a type-only import of another feature's contract is allowed", () => {
  assert.deepEqual(
    [...rulesFor("features/concerts/ui/allowed-type-only.tsx")],
    [],
  );
});

test("domain code importing a framework is rejected", () => {
  assert.ok(
    rulesFor("features/concerts/domain/uses-react.ts").has("domain-is-pure"),
  );
});

test("deep imports into another feature are rejected", () => {
  assert.ok(
    rulesFor("features/concerts/model/index.ts").has("no-deep-feature-imports"),
  );
});

test("shared code importing a feature is rejected", () => {
  assert.ok(
    rulesFor("lib/shared-uses-feature.ts").has(
      "shared-does-not-import-features",
    ),
  );
});

test("a cycle between features is rejected", () => {
  assert.ok(
    rulesFor("features/concerts/contracts/concert.ts").has("no-circular"),
  );
});
