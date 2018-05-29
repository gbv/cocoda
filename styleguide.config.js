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
          name: 'Usage',
          content: 'docs/usage.md'
        },
        {
          name: 'Background',
          content: 'docs/background.md'
        },
        {
          name: 'Installation',
          content: 'docs/installation.md'
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
