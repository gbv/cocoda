const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
  devServer: {
    host: "localhost",
    port: 8080,
    useLocalIp: false,
  },
  runtimeCompiler: true,
  productionSourceMap: false,
  publicPath: "./",
  outputDir: "dist-temp",
  pages: {
    app: {
      entry: "src/entry/app.js",
      template: "public/index.html",
      filename: "index.html",
      chunks: ["chunk-vendors", "chunk-common", "app"],
    },
    mappingsApp: {
      entry: "src/entry/mappingsApp.js",
      template: "public/mappings.html",
      filename: "mappings.html",
      chunks: ["chunk-vendors", "chunk-common", "mappingsApp"],
    },
  },
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin([
        {
          from: "build/build-info.json",
          to: "",
        },
        {
          from: "config/cocoda.json",
          to: "cocoda.json",
        },
        {
          from: "node_modules/bootstrap/dist/css/bootstrap.css",
          to: "css/",
        },
        {
          from: "node_modules/bootstrap-vue/dist/bootstrap-vue.css",
          to: "css/",
        },
      ]),
    ],
  },
  chainWebpack: config => {
    // from: https://stackoverflow.com/questions/51304187/spaces-are-gone-in-html-after-upgrading-to-vue-cli-3
    config.module
      .rule("vue")
      .use("vue-loader")
      .loader("vue-loader")
      .tap(options => {
        options.compilerOptions.preserveWhitespace = true
        return options
      })
  },
}
