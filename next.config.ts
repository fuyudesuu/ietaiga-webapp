import type { NextConfig } from "next";

// The default build targets the existing Sites/Cloudflare runtime. The GitHub
// Pages build (`pnpm build:pages`) sets ENCORE_STATIC_EXPORT=1 and, for a
// project site, ENCORE_BASE_PATH (for example "/ietaiga-webapp").
const staticExport = process.env.ENCORE_STATIC_EXPORT === "1";

const nextConfig: NextConfig = staticExport
  ? { output: "export", basePath: process.env.ENCORE_BASE_PATH || undefined }
  : {};

export default nextConfig;
