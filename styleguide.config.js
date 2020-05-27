const path = require("path")
const fs = require("fs")
const styleguideDir = "styleguide"
if (!fs.existsSync(styleguideDir)) {
  fs.mkdirSync(styleguideDir)
}

module.exports = {
  title: "Cocoda Docs",
  ribbon: {
    url: "https://github.com/gbv/cocoda",
  },
  template: {
    favicon: "/favicon.ico",
  },
  require: [
    path.join(__dirname, "public/styleguide.css"),
  ],
  assetsDir: "public",
  sections: [
    {
      name: "Cocoda",
      content: "docs/introduction.md",
    },
    {
      name: "Components",
      content: "docs/components.md",
      components: "src/components/*.vue",
    },
  ],
  usageMode: "expand",
}
