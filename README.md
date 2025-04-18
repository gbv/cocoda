# Cocoda Mapping Tool

[![GitHub release](https://img.shields.io/github/release/gbv/cocoda.svg)](https://github.com/gbv/cocoda/releases/latest)
[![Web App Status](https://coli-conc-status.fly.dev/api/badge/8/status)](https://coli-conc.gbv.de/cocoda/app/)
[![License](https://img.shields.io/github/license/gbv/cocoda.svg)](https://github.com/gbv/cocoda/blob/master/LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io%2Fgbv%2Fcocoda-informational)](https://github.com/gbv/cocoda/blob/dev/docker/README.md)
[![Build Status](https://github.com/gbv/cocoda/actions/workflows/build.yml/badge.svg)](https://github.com/gbv/cocoda/actions/workflows/build.yml)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> A web-based tool for creating mappings between knowledge organization systems.

Try out the [latest release version](https://coli-conc.gbv.de/cocoda/app/), the [current development version](https://coli-conc.gbv.de/cocoda/dev/), and consult the [usage documentation](#usage)!

## Table of Contents

- [Install](#install)
  - [Release versions](#release-versions)
  - [Development versions](#development-versions)
  - [Serving the Files](#serving-the-files)
  - [Docker](#docker)
- [Usage](#usage)
- [Configuration](#configuration)
- [Maintainers](#maintainers)
- [Contribute](#contribute)
- [License](#license)

## Install

### Release versions

Releases [can be downloaded](https://github.com/gbv/cocoda/releases) in form of static files. Extract into a web server directory and adjust [configuration](#configuration) file `cocoda.json`. You could automate download and extraction of the latest release with [jq](https://stedolan.github.io/jq/) like this:

```bash
# You can also manually download the latest release here: https://github.com/gbv/cocoda/releases/latest
wget -N $(curl -s https://api.github.com/repos/gbv/cocoda/releases/latest | jq -r '.assets[].browser_download_url')
unzip cocoda-*.zip
rm cocoda-*.zip
```

The directory `cocoda` is then ready to be [served with any web server](#serving-the-files).

### Development versions

Alternatively, it's possible to clone the [Cocoda repository](https://github.com/gbv/cocoda):

```bash
git clone https://github.com/gbv/cocoda.git
cd cododa
```

Then install required Node modules with [npm](https://www.npmjs.com/get-npm) and run build (requires Node.js v18 or above, v20 recommended):

```bash
npm ci
npm run build
```

Files are created in directory `dist`, including the configuration file.

### Serving the Files

Any web server can be used to serve Cocoda files. No special configuration is necessary. For instance using the `http-server` npm package to serve Cocoda at <http://localhost:8000>:

```bash
# serve the pre-built release
npx http-server -p 8000 cocoda/
# or serve the build version
npx http-server -p 8000 dist/
```

### Docker

Cocoda is also available via Docker. Please refer to [our Docker documentation](https://github.com/gbv/cocoda/blob/dev/docker/README.md) for more information and instructions.

## Usage

There is a detailled end-user manual available [in German](https://gbv.github.io/cocoda/dev/user-manual-de.html) and [in English](https://gbv.github.io/cocoda/dev/user-manual-en.html). The German version will likely be more up-to-date. Documentation sources are located in directory `docs`.

## Configuration

For the pre-built version, configuration options can be overridden by using `cocoda.json` in the root of the directory and by passing query parameter `config` with an URL of a config file (CORS headers must be enabled to load if from another domain). 

The default options are given in the file [`config/cocoda.default.json`](https://github.com/gbv/cocoda/blob/dev/config/cocoda.default.json) (please consult this file for examples on how to use the configuration options). When using a manual build, create file `config/cocoda.json` and rebuild (`npm run build`) after editing (you can also run `npm run build -- --config-only` if you already have a build in folder `dist/` and only need to update the config file).

The following fields are recognized so far:

* **title**: the main title of the instance as plain string

* **cssProperties**: object of global CSS properties, used for [color settings](#color-settings)

* **logos**: a list of logos to display left to the title, each with subfields:
  * `file`: image URL relative to the `public` directory
  * `alt`: alternate text for the image, if the image cannot be displayed, as plain string
  * `url`: URL to link from the logo

* **favicon**: URL of a custom favicon.

* **menu**: a list of links to show in the menu, each with subfields:
  * `url`: the link URL
  * `prefLabel`: mapping of language codes to link titles

* **searchLinks**: a list of search links to quickly link to external resources from concepts. Each searchlink has subfields:
  * `url` an URL template with possible parameters `{prefLabel}` and/or `{notation}`
  * `prefLabel`: mapping of language codes to link titles
  * `separator`: defines how to join multiple values (especially multiple `{notation}` values) when constructing the final URL.

* **favoriteSchemes**: list of vocabulary URIs to be favorited by default.

* **languages**: array with supported interface languages

* **registries**: lists [registries](#registries) where to get data from

* **overrideRegistries**: `false` (default) or `true`
  controls whether to override registries listed in `config/cocoda.default.json`

* **auth**: URL to a [login-server](https://github.com/gbv/login-server) instance to be used for authentication

* **conceptLists**: a list of concept lists. Each list can be either an object or a URL that returns a JSON object. Objects are basically [JSKOS registries](http://gbv.github.io/jskos/jskos.html#registries) with required properties `prefLabel` and `concepts`. If `concepts` is a string, it will be considered a URL which returns a JSON array of concepts. Optional properties are `notation` and `scopeNote`.

* **autoRefresh**: an object with auto refresh values in milliseconds. `autoRefresh.mappings` determines how often mappings in MappingBrowser will be reloaded (default: 10000 = every 10 seconds), `autoRefresh.update` determines how often Cocoda will look for an update (default: 120000 = every 2 minutes).

Using the pre-built version, the application only has to be reloaded after editing the configuration file.

### Color settings

Colors can be changed with the `cssProperties` configuration object. Most colors are derived from a set of basic color codes, each given with three values in HSL color model (hue, saturation, and lightness). Some other colors can be given by standard CSS color name or code. Colors can be provided as hexadecimal **RGB** value or, for selected properties, with **HSL** value components. The following color properties are can be configured, at least:

| Color Property                    | Description                                                                 | HSL |
|:----------------------------------|:----------------------------------------------------------------------------|-----|
| **color-primary**                 | Primary color is for selected elements, links, etc.                         | ✓   |
| **color-secondary**               | Secondary color is for menus, selectable elements, warnings, etc.           | ✓   |
| **color-text**                    | Color for text, labels, etc.                                                | ✓   |
| **color-text-secondary**          | Color for text on background color-secondary                                | ✓   |
| **color-button**                  | Color for clickable buttons                                                 | ✓   |
| **color-success**                 | Color for confirmation messages, mapped concepts, positive votes            | ✓   |
| **color-danger**                  | Color for error messages, error indicators, delete buttons, negative votes  | ✓   |
| **color-background**              | Background color of the application                                         |     |
| **color-background-component**    | Background color of components (concept browser, mapping editor, etc.)      |     |
| **color-background-component-heading** | Background color for component headings.                               |     |
| **color-background-navbar**       | Background color for the navigation bar                                     |     |
| **color-link**                    | Color of the links                                                          |     |
| **color-link-hover**              | Color of the links when hovering                                            |     |

See [src/style/colors.css](src/style/colors.css) for additional CSS color properties. Some comments are included to provide clarity on its purpose and usage within the application. Property names not included in the list above may change in future releases.

For instance the color property `color-primary` can be set in RGB like this:

```json
"cssProperties": {
  "color-primary": "#00ffff"
}
```
Or you can set the individual HSL values:

```json
"cssProperties": {
  "color-primary-h": "180",
  "color-primary-s": "100%",
  "color-primary-l": "40%"
}
```
Internally, RGB values will also be converted to HSL for properties if the property supports HSL.

### Image files

Images files (`.png`, `.svg`, `.ico`) in the `config` directory are made available at path `/config` and can be referenced like this:

~~~json
"favicon": "config/favicon.ico",
"logos": [
  {
    "file": "config/logo.png",
    "alt": "Mapping Editor ",
    "url": "https://example.org/"
  }
]
~~~

## Maintainers

- [@nichtich](https://github.com/nichtich)
- [@rodolv-commons](https://github.com/rodolv-commons)

## Contribute

Your contributions to improve Cocoda are very welcome: please [open a GitHub issue](https://github.com/gbv/cocoda/issues/new) for feature suggestions and bug reports! See the file [CONTRIBUTING.md](CONTRIBUTING.md) for more information about how and where to best contribute and for development details.

See <https://gbv.github.io/cocoda/> for API documentation automatically build from Node sources.

## License

MIT ©2019 Verbundzentrale des GBV (VZG)
