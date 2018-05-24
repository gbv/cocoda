const webpackConfig = require('./build/webpack.prod.conf.js')

module.exports = {
  title: 'Cocoda Docs',
  ribbon: {
    url: 'https://github.com/gbv/cocoda',
  },
  sections: [
    {
      name: 'Cocoda',
      content: 'docs/introduction.md',
      sections: [
        {
          name: 'Installation',
          content: 'docs/installation.md'
        },
        {
          name: 'Technical background',
          content: 'docs/technical-background.md'
        }
      ]
    },
    {
      name: 'Components',
      content: 'docs/components.md',
      components: 'src/components/*.vue'
    }
  ],
  showUsage: true,
  webpackConfig
};
