module.exports = {
  "root": true,
  "env": {
    "node": true,
    "browser": true,
  },
  "extends": [
    "eslint:recommended",
    "plugin:vue/recommended",
  ],
  "rules": {
    // console.log, console.warn, and console.error can be used.
    "no-console": "off",
    // Always use two spaces, and indent switch-case statements.
    "indent": [
      "error",
      2,
      {
        "SwitchCase": 1,
      },
    ],
    // Use Unix line endings (\n).
    "linebreak-style": [
      "error",
      "unix",
    ],
    // Use double quotes.
    "quotes": [
      "error",
      "double",
    ],
    // Disallow semicolons.
    "semi": [
      "error",
      "never",
    ],
    // See: https://medium.com/@nikgraf/why-you-should-enforce-dangling-commas-for-multiline-statements-d034c98e36f8
    "comma-dangle": [
      "error",
      "always-multiline",
    ],
    // We need v-html at some places.
    "vue/no-v-html": "off",
    // Closing bracket formatting.
    "vue/html-closing-bracket-newline": [
      "error",
      {
        "singleline": "never",
        "multiline": "never",
      },
    ],
    "vue/html-closing-bracket-spacing": [
      "error",
      {
        "startTag": "never",
        "endTag": "never",
        "selfClosingTag": "always",
      },
    ],
  },
  "parserOptions": {
    "sourceType": "module",
    "parser": "babel-eslint",
  },
}
