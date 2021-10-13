import { defineConfig } from "vite"
import { resolve } from "path"
import { createVuePlugin as vue } from "vite-plugin-vue2"

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    vue(),
  ],
  optimizeDeps: {
    exclude: ["vue-demi"],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        concordances: resolve(__dirname, "concordances.html"),
      },
    },
    outDir: "dist-temp",
  },
  server: {
    port: 8080,
  },
})
