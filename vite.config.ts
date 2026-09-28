import vinext from "vinext";
import { defineConfig } from "vite";

// Vinext (Next.js-compatible App Router on Vite) with a Cloudflare Workers
// server build. The GitHub Pages build reuses this config with a static
// export (see next.config.ts and scripts/pages-artifact.mjs).
export default defineConfig(async () => {
  // Keep Wrangler/Miniflare local and quiet; these are tool settings, not app config.
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: {
          main: "vinext/server/fetch-handler",
          compatibility_flags: ["nodejs_compat"],
        },
      }),
    ],
  };
});
