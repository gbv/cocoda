const webpackConfig = require("./build/webpack.prod.conf.js")

module.exports = {
  title: "Cocoda Docs",
  ribbon: {
    url: "https://github.com/gbv/cocoda",
  },
  template: {
    favicon: "/favicon.ico",
  },
  assetsDir: "static",
  sections: [
    {
      name: "Cocoda",
      content: "docs/introduction.md",
      sections: [
        {
          name: "Usage",
          content: "docs/usage.md"
        },
        {
          name: "Installation",
          content: "docs/installation.md"
        },
        {
          name: "Configuration",
          content: "docs/configuration.md"
        }
      ]
    },
    {
      name: "Development",
      content: "CONTRIBUTING.md",
      sections: [
        {
          name: "Getting Started",
          content: "docs/setup.md"
        },
        {
          name: "Background",
          content: "docs/background.md"
        },
        {
          name: "Design Guidelines",
          content: "docs/design-guidelines.md"
        }
      ]
    },
    {
      name: "Guide",
      content: "docs/guide.md",
      sections: [
        {
          name: "Interface Description",
          content: "docs/guide-interface.md"
        },
        {
          name: "Browsing Terminologies",
          content: "docs/guide-browsing.md"
        },
        {
          name: "Mappings",
          content: "docs/guide-mappings.md"
        }
      ]
    },
    {
      name: "Components",
      content: "docs/components.md",
      components: "src/components/*.vue"
    },
  ],
  showUsage: true,
  webpackConfig
}
