module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
  },
  extends: [
    "gbv",
    "gbv/vue",
  ],
  parserOptions: {
    sourceType: "module",
    parser: "babel-eslint",
  },
}
