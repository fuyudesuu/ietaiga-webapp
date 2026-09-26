import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the project at /<repo>/. The Pages workflow sets
// BASE_PATH; local dev and preview default to the root.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
