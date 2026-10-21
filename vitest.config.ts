import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const fixture = (p: string) => fileURLToPath(new URL(`./tests/fixtures/${p}`, import.meta.url))

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    // Les modules virtuels du plugin barjavel sont remplacés par des fixtures.
    alias: {
      "virtual:barjavel-content": fixture("content.ts"),
      "virtual:barjavel-config": fixture("config.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}", "vite/**/*.mjs", "bin/**/*.mjs", "assets/sw.js"],
      exclude: ["app/**/*.d.ts"],
      reporter: ["text", "lcov", "html"],
      thresholds: { statements: 95, branches: 90, functions: 95, lines: 95 },
    },
  },
})
