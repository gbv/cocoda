import { defineConfig } from "vite"
import { resolve } from "path"
import { createVuePlugin as vue } from "vite-plugin-vue2"

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    vue(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        concordances: resolve(__dirname, "concordances.html"),
      },
    },
    outDir: "dist-temp",
  },
  resolve: {
    alias: {
      // This allows relative imports starting with @/ instead of absolute imports
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
  },
})
