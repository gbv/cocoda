const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
  runtimeCompiler: true,
  productionSourceMap: false,
  publicPath: "./",
  outputDir: "dist-temp",
  pages: {
    app: {
      entry: "src/entry/app.js",
      template: "public/index.html",
      filename: "index.html",
      chunks: ["chunk-vendors", "chunk-common", "app"]
    },
    mappingsApp: {
      entry: "src/entry/mappingsApp.js",
      template: "public/mappings.html",
      filename: "mappings.html",
      chunks: ["chunk-vendors", "chunk-common", "mappingsApp"]
    }
  },
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin([
        {
          from: "build/build-info.json",
          to: ""
        },
        {
          from: "node_modules/bootstrap/dist/css/bootstrap.css",
          to: "css/"
        },
        {
          from: "node_modules/bootstrap-vue/dist/bootstrap-vue.css",
          to: "css/"
        }
      ])
    ],
  }
}
