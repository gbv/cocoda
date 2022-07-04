import { defineConfig } from "vite"
import { resolve } from "path"
import vue from "@vitejs/plugin-vue2"

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
    chunkSizeWarningLimit: 1000,
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
  // Required to suppress warnings regarding @charset tags in compiled CSS
  // See also: https://github.com/vitejs/vite/discussions/5079
  css: {
    postcss: {
      plugins: [{
        postcssPlugin: "internal:charset-removal",
        AtRule: {
          charset: (atRule) => {
            if (atRule.name === "charset") {
              atRule.remove()
            }
          },
        },
      }],
    },
  },
})
