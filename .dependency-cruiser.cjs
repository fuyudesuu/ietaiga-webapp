// Import-boundary rules (docs/engineering/ARCHITECTURE.md). Patterns use
// "(^|/)" so they also match tests/boundaries/fixtures, which prove the rules
// fail on real violations (tests/boundaries.test.mjs).

// Server-only code: must never be bundled into the browser.
const SERVER = "(^|/)features/[^/]+/server/|(^|/)lib/server/|^db/";
// Code that runs in the browser (or may be imported by code that does).
const CLIENT =
  "(^|/)features/[^/]+/(ui|domain|contracts|model)/|^components/|^hooks/|^lib/encore/";
// Pure rules: no framework, browser, database or provider dependencies.
const DOMAIN =
  "(^|/)features/[^/]+/domain/|^lib/encore/(model|fixtures|demo-storage)\\.ts$";
// Shared code that features build on; it must not depend on a feature.
const SHARED = "(^|/)lib/(?!encore/)|^components/(ui|encore-ui)/|^hooks/";

module.exports = {
  forbidden: [
    {
      name: "client-reaches-server",
      severity: "error",
      comment:
        "Browser code must not reach server-only modules, directly, through the @/ alias or through re-exports. Share types through a feature's contracts/.",
      from: { path: CLIENT },
      to: { path: SERVER, reachable: true },
    },
    {
      name: "domain-is-pure",
      severity: "error",
      comment:
        "Domain rules must not import React, Next.js, database clients, provider SDKs or app/UI code.",
      from: { path: DOMAIN },
      to: {
        path: [
          "(^|/)node_modules/(react|react-dom|next|drizzle-orm|@cloudflare|@base-ui|radix-ui)/",
          "^cloudflare:",
          "(^|/)(app|components|db)/",
          "(^|/)features/[^/]+/(ui|server)/",
        ],
      },
    },
    {
      name: "no-deep-feature-imports",
      severity: "error",
      comment:
        "Another feature may be used only through its contracts/ or index.ts entry point.",
      from: { path: "(^|/)features/([^/]+)/" },
      to: {
        path: "(^|/)features/[^/]+/(?!contracts/|index\\.tsx?$)",
        pathNot: "(^|/)features/$2/",
      },
    },
    {
      name: "shared-does-not-import-features",
      severity: "error",
      comment:
        "Shared code (lib, components/ui, hooks) must not depend on a feature.",
      from: { path: SHARED },
      to: { path: ["(^|/)features/", "^components/shell/"] },
    },
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Import cycles make modules impossible to understand or change alone.",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(dist|\\.vinext|\\.wrangler)/" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".mjs", ".jsx", ".d.ts"],
    },
  },
};
