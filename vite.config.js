import { defineConfig } from "vite"
import { resolve } from "path"
import { createVuePlugin as vue } from "vite-plugin-vue2"

// Copy static files to public folder
// TODO: Is there a better way of doing this?
import fs from "fs"
fs.copyFileSync("build/build-info.json", "public/build-info.json")
fs.copyFileSync("config/cocoda.json", "public/cocoda.json")
if (!fs.existsSync("public/css")) {
  fs.mkdirSync("public/css")
}
fs.copyFileSync("node_modules/bootstrap/dist/css/bootstrap.css", "public/css/bootstrap.css")
fs.copyFileSync("node_modules/bootstrap-vue/dist/bootstrap-vue.css", "public/css/bootstrap-vue.css")

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
