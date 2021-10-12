module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  extends: [
    "gbv",
    "gbv/vue/2",
  ],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
}
