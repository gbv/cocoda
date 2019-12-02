const path = require("path")
const fs = require("fs")

const jsdoc2md = require("jsdoc-to-markdown")
const githubBase = "https://github.com/gbv/cocoda/tree/dev/"
const providerBase = "src/providers/"
const styleguideDir = "styleguide"
if (!fs.existsSync(styleguideDir)) {
  fs.mkdirSync(styleguideDir)
}
const providerSections =
  fs.readdirSync(providerBase)
    .sort()
    .map(file => file.match(/^(.+-provider).js$/))
    .filter(match => match)
    .map(match => {
      const jsFile = match[0]
      const name = match[1].split("-")
        .map(s => s.charAt(0).toUpperCase() + s.substr(1))
        .join("")
      const content = `${styleguideDir}/${match[1]}.md`
      let options = {
        files: [providerBase + jsFile],
        "index-format": "none",
        "global-index-format": "none",
      }

      let markdown = jsdoc2md.renderSync(options)
      // only keep the first section. TODO: also show details
      markdown = markdown.replace(/^(<a name.*>|^## .*$)/gm, "")
      markdown = markdown.replace(/^\*\*Kind\*\*[\s\S]*/gm, "")
      markdown = markdown + "\n\n⇒ [source](" +
        githubBase + providerBase + jsFile + ")"
      fs.writeFileSync(content, markdown)
      return { name, content }
    })

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
      name: "Providers",
      content: "docs/providers.md",
      sections: providerSections,
    },
    {
      name: "Components",
      content: "docs/components.md",
      components: "src/components/*.vue",
    },
  ],
  usageMode: "expand",
}
