# Contributing to Cocoda

> Thanks for your interest in improving Cocoda and its documentation, your contributions are welcome!

To start contributing please make sure you have a [GitHub account](https://github.com/signup/free). Bug reports and feature requests can best be given [as GitHub issues](https://github.com/gbv/cocoda/issues). We use a [GitHub repository](https://github.com/gbv/cocoda) for version control and [travis-ci](https://travis-ci.org/gbv/cocoda) for continuous integration.  The most recent development version is available at <https://coli-conc.gbv.de/cocoda/dev/> (from branch `dev`).

[![Build Status](https://travis-ci.org/gbv/cocoda.svg?branch=dev)](https://travis-ci.org/gbv/cocoda)

## Table of Contents

- [Getting Started](#getting-started)
- [Background](#background)
- [Documentation](#documentation)
- [Design Guidelines](#design-guidelines)
- [Creating Providers](#creating-providers)
- [Component Settings](#component-settings)
- [Translate](#translate)
- [Publish](#publish)

## Getting Started

Its recommended to use Node.js v10 or above.

``` bash
# get the sources
git clone https://github.com/gbv/cocoda.git # or git@github.com:gbv/cocoda.git
cd cocoda

# install dependencies
npm ci

# create a local config file
echo '{}' > config/cocoda.json

# serve with hot reload at localhost:8080
npm run dev

# build static minified files for production. Result will will be in folder `dist`.
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# serve documentation at localhost:6060
npm run styleguide
```

## Background

The web application is build with [Vue](https://vuejs.org/), based on independent [components](#components). Data is processed and communicated with backend services in [JSKOS data format for Knowledge Organization Systems](https://gbv.github.io/jskos/) via [providers](#providers).

Core entities of JSKOS relevant to Cocoda are:

* **Concept Schemes** are classifications, thesauri, authority files or other kinds of knowledge organization systems (see [concept schemes](#concept-schemes) in the user manual).
* **Concepts** are conceptual entity in a concept scheme, for instance a class in a classification or a record in an authority file (see [concepts](#concepts) in the user manual).
* **Concept Mappings** are directed connections between concepts from two concept schemes (see [mappings](#mappings) in the user manual)
* **Concordances** are collections of mappings between two concepts schemes.
* **Concept Occurrences** give the number of times one or more concepts are used, for instance in a specific database.

## Documentation

Software documentation and user manuals in multiple languages are located in directory `doc` written in Markdown. The documents are automatically published from the `dev` branch:

* [Software documentation](https://gbv.github.io/cocoda/)
* [English user manual](https://gbv.github.io/cocoda/dev/user-manual-en.html)
* [German user manual](https://gbv.github.io/cocoda/dev/user-manual-de.html)

To build the API documentation:

~~~sh
npm run styleguide
~~~

Generation of the user manual requires [Pandoc](https://pandoc.org/) 2.7 or newer.

To build the user manuals:

~~~sh
npm run build-info
npm run manual      # HTML version
npm run manual-pdf  # PDF version
~~~

Generation of the PDF manual requires XeTeX and several related packages. On Ubuntu install via:

~~~sh
sudo apt-get install texlive-xetex texlive-fonts-recommended texlive-fonts-extra lmodern librsvg2-bin
~~~

## Design Guidelines

Please adhere to the following design guidelines when developing for Cocoda.

You can use the mentioned CSS classes in one of two ways:

1. Add them to the classes list of your HTML element (recommended).
2. Extend your CSS class using [LESS](http://lesscss.org): `&:extend(.font-heavy);`

### Cards

The user interface is divided into **cards** which are implemented by [components](#components).

Design of cards should roughly adhere to [material design cards](https://material.io/design/components/cards.html).

### Fonts

* **Font size** must only be set via one of the CSS classes `fontSize-small`, `fontSize-normal`, and `fontSize-large` (as defined in `src/style/text-styles.less`). The latter must only be use in the navigation bar and component placeholders.

* Use CSS class `fontWeight-heavy` for **bold font markup**.

* Other font sizes may be used for FontAwesome icons.

### Colors

For interface elements, there is a range of pre-defined colors available in `src/style/colors.less`. For non-linked text, please use one of the following colors:

* CSS class `text-dark`
* CSS class `text-grey`
* CSS class `text-lightGrey`
* CSS class `text-veryLightGrey`

Colors can be overridden using a custom user file in `src/style/user-colors.less`.

### Tables

For tables, there is a custom table component called [vue-flexible-table](https://github.com/stefandesu/vue-flexible-table). It can be used very similarly to a [bootstrap-vue table](https://bootstrap-vue.js.org/docs/components/table). See the [MappingBrowser](#mappingbrowser) component for an example of this in use.

### Buttons

For text buttons, there are predefined CSS classes in `src/style/main.less`. In particular, there are:

* CSS class `button`
* CSS class `button-disabled` (to be applied when a button is shown, but not clickable)

### Z-index values

If you need to use z-index values, please use the predefined LESS variables in `src/style/z-index.less`.

### Icons
Cocoda uses [Font Awesome](https://fontawesome.com/) for some icons. You can use any of their free icons (see their [icon gallery](https://fontawesome.com/icons?d=gallery&s=brands,solid&m=free)) like this:

```html static
<font-awesome-icon icon="plus-circle" />
```

As of now, all icons (solid, brands) are available without importing them separately. But at some point in the future, we will only add those icons to the project that are needed to save same space. At that point, new icons will need to be imported in your components as well.

## Creating Providers

<!-- TODO: Update this section -->

Access to [concepts schemes](#concept-schemes), [concepts](#concepts), [mappings](#mappings), and mapping recommendations is provided by **registries** which can be configured in the [config file](#configuration).

There are some preconfigured registries in the config file, but it's possible to set up a new registry, for example with [jskos-server](https://github.com/gbv/jskos-server). Each registry has to be assigned a **provider**. A provider is a way of accessing data, for instance via a specific API. Please refer to the [cocoda-sdk documentation](https://gbv.github.io/cocoda-sdk/) for an explanation on how providers work and how they need to be configured.

Registries can be grouped into:

* **Terminology Registries** such as <https://api.dante.gbv.de/> provide
  information about concept schemes and concepts.

* **Mapping Registries** can be queried for existing mappings and mapping recommendations, and might allow creation, modification, and annotation of new mappings.

* **Occurrence Registries** can be queried for usage statistics of concepts in collections.

## Component Settings

All components have component specific user settings. These are options where the user can decide about how a certain functionality in a component looks or behaves. They can be accessed per component with the small gear in the bottom right corner of a component, or centrally under Settings - User Interface. These settings are defined in a JSON file under `config/settings.json`.

If you would like to add a component setting, find the component key in `settings.json` and add a new subkey with the name of your setting. Under that subkey, you can define the following properties:

- `prefLabel` (**required**, JSKOS [language map](https://gbv.github.io/jskos/jskos.html#language-map) of strings) - the preferred label for the setting (please provide it in English (`en`) and German (`de`))
- `type` (**required**, string) - the type of the value, currently supports `"Boolean"` and `"Number"` (exception for dividers, see below)
- `default` (**required**, boolean or number) - the default value for the setting (e.g. `true`, `false`, `5`, ...) (exception for dividers, see below)
- `definition` (optional, JSKOS [language map](https://gbv.github.io/jskos/jskos.html#language-map) of [list](https://gbv.github.io/jskos/jskos.html#list)) - a definition/explanation for the settings (shown as a tooltip or below the setting)
- `sideDependent` (optional, boolean) - whether the setting has separate values for the left and right side of a component (example see `ConceptSchemeSelection.insertPrefLabel`)
- `min` (**required**, number, only for type `"Number"`) - minimum value
- `max` (**required**, number, only for type `"Number"`) - maximum value

The following are two examples which cover all possible properties:

```json
{
  "MappingBrowser": {
    "resultLimit": {
      "prefLabel": {
        "en": "Results per page:",
        "de": "Ergebnisse pro Seite:"
      },
      "type": "Number",
      "default": 5,
      "min": 1,
      "max": 20
    }
  }
}
```

```json
{
  "ConceptSchemeSelection": {
    "insertPrefLabel": {
      "prefLabel": {
        "en": "Copy selected concept label from opposite side into search field",
        "de": "Ausgewähltes Konzept der gegenüberliegenden Seite in Suchfeld eintragen"
      },
      "definition": {
        "en": ["When turned on, the label of the selected concept on the opposite side will be inserted in the concept search whenever the selected concept changes."],
        "de": ["Falls eingeschaltet wird das Label vom ausgewählten Konzept der gegenüberliegenden Seite in das Suchfeld einfügt, sobald das Konzept sich ändert."]
      },
      "type": "Boolean",
      "default": true,
      "sideDependent": true
    }
  }
}
```

See also existing settings in `config/settings.json` as a guideline.

After a setting was defined, it can be accessed in any component via `this.$store.state.settings.settings.components.NameOfComponent.nameOfSetting` (+ `[true]`/`[false]` if `sideDependent` is enabled). If the `computed` mixin is included in the component, this can be shortened to `this.$settings.components.NameOfComponent.nameOfSetting` or `this.componentSettings.nameOfSetting` if it is accessed from inside the component for which the setting is defined. The settings will automatically be shown under the component specific settings (gear in the bottom right) and under Settings - User Interface.

There is one exception for the rule. It is possible to add text-only dividers to separate a group of settings within a component. These only have to have a `prefLabel`, and they can optionally have a `class` added to them (e.g. `"fontWeight-heavy"`). The following example is also straight from the current `settings.json` file:

```json
{
  "MappingBrowser": {
    "navigatorDivider": {
      "prefLabel": {
        "en": "Navigator"
      },
      "class": "fontWeight-heavy"
    }
  }
}
```

The setting key does not matter in this case, but make sure it is unique inside that component.

## Translate

The user interface is currently available in English and German. To facilitate contributions to the translations, we developed a small tool: opening [the translation tool via this link](https://gbv.github.io/cocoda-locale-editor/?fromUrl=https%3A%2F%2Fraw.githubusercontent.com%2Fgbv%2Fcocoda%2Fdev%2Fconfig%2Flocale.json) will load the current interface translation into the too so, you can contribute by editing existing texts or adding new languages:

- Use the text fields in the table to edit the texts. Each row represents a single piece of text in the interface.
- After editing, you can download the file `locale.json` with "Download" at the top. You can either send this file to [coli-conc@gbv.de](mailto:coli-conc@gbv.de), upload the file to a server and post the link as a [GitHub issue](https://github.com/gbv/cocoda/issues/new), or create a [pull request](https://github.com/gbv/cocoda/pull/new/dev) and commit the file there.
- Note that the edits in the tool will be lost if you reload the site! To make sure that your edits won't be lost, use the "Download" button regularly and reupload the file if necessary.
- The "New path" function below the table is only necessary if new text pieces need to be added (i.e. when you're directly involved in the development or if you want to suggest a feature and provide the necessary text in advance).

## Publish

**For maintainers only**

Before creating a release, be aware of the following prerequisites:

- You are on the dev branch and your working tree is clean.
- You have the rights to push to the Cocoda repository.
- Your internet connection is working correctly.

If these are fulfilled, you can create a release by running one of the following commands:

```bash
# patch release, e.g. 0.8.0 -> 0.8.1
npm run release patch

# minor release, e.g. 0.8.1 -> 0.9.0
npm run release minor

# major release, e.g. 0.9.0 -> 1.0.0
npm run release major
```

After successfully creating a release, the script will show you some possible next steps.

If there were any errors during the release, make sure to clean up your repository before trying again (reverting the version commit, etc.).
