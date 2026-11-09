import { defineConfig } from "vite"
import { resolve } from "path"
import vue from "@vitejs/plugin-vue"
import legacy from "@vitejs/plugin-legacy"

// https://vitejs.dev/config/
export default defineConfig(configEnv => ({
  base: "./",
  plugins: [
    vue(),
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
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
    sourcemap: configEnv.mode === "development",
  },
  resolve: {
    alias: {
      // vue-i18n resolves to a runtime build without the message compiler by
      // default. config/locale.json is imported as a module and compiled at
      // runtime, so without this alias translations are empty in the
      // production build only.
      "vue-i18n": "vue-i18n/dist/vue-i18n.esm-bundler.js",
      // This allows relative imports starting with @/ instead of absolute imports
      "@": resolve(__dirname, "./src"),
    },
    dedupe: ["vue"],
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
}))
