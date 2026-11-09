import { defineConfig } from "vitest/config"
import { resolve } from "path"

// Separate from vite.config.js on purpose: the unit tests only cover plain JS
// modules (no SFCs), so they need neither the Vue plugin nor the legacy plugin.
// This also keeps the test setup independent of the Vue 2 -> Vue 3 migration.
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    // store/index.js assigns document.onmousemove on import
    environment: "jsdom",
    include: ["tests/unit/**/*.test.js"],
  },
})
