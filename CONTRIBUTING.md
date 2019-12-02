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

To build the software documentation:

~~~sh
npm run styleguide
~~~

To build the user manuals:

~~~sh
npm run build-info
npm run manual      # HTML version
npm run manual-pdf  # PDF version
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

Access to [concepts schemes](#concept-schemes), [concepts](#concepts), [mappings](#mappings), and mapping recommendations is provided by **registries** which can be configured in the [config file](#configuration).

There are some preconfigured registries in the config file, but it's possible to set up a new registry, for example with [jskos-server](https://github.com/gbv/jskos-server). Each registry has to be assigned a **provider**. A provider is a way of accessing data, for instance via a specific API. Each provider is implemented in its own JavaScript class.

Registries accessed via providers can be grouped into:

* **Terminology Registries** such as <https://api.dante.gbv.de/> provide
  information about concept schemes and concepts.

* **Mapping Registries** can be queried for existing mappings and mapping recommendations, and might allow creation, modification, and annotation of new mappings.

* **Occurrence Registries** can be queried for usage statistics of concepts in collections.

### Creating a new provider

It's simple to create a new provider. Each provider has its own file in the folder `src/providers/` and is a subclass of a BaseProvider (`base-provider.js`). The BaseProvider predefines a lot of different methods that are used by Cocoda to access data from a registry. Most methods have a second variant starting with an underscore (`_`) that is supposed to be overridden by the subclass. For example, if you want to provide mappings or mapping recommendations in your provider, you can override the `_getMappings` method. The code documentation in `base-provider.js` also describes the parameters used in Cocoda with those methods, and you can look at the existing providers to get an idea of how it works.

The following process describes how to create a very simple mapping provider that receives concepts (`from` and/or `to`) and returns mappings `from` -> `from` and `to` -> `to`.

1. Create a the file `src/providers/test-provider.js`.
2. Add the following base code to the file:

  ```js static
  import _ from "lodash"
  import BaseProvider from "./base-provider"

  class TestProvider extends BaseProvider {

  }

  TestProvider.providerName = "Test"

  export default TestProvider
  ```
  This should be the base template used for all providers. Make sure to replace `TestProvider` with the name of the provider when implementing your own.

3. Add the following lines to `src/providers/index.js` (before the `export` statement):

  ```js static
  import TestProvider from "./test-provider"
  providers[TestProvider.providerName] = TestProvider
  ```

4. Add the following registry to the registries array in `config/cocoda.json`:

  ```json
  {
    "registries": [
      {
        "uri": "http://coli-conc.gbv.de/registry/coli-conc-test",
        "notation": ["T"],
        "prefLabel": {
          "en": "Test Mappings"
        },
        "mappings": "...",
        "provider": "Test"
      }
    ]
  }
  ```
  Note the field `mappings`. Usually you would provide a URL for mappings in this field, but even when you don't use an API, this field needs to have a value if you want to provide mappings. (It would also be possible to override the constructur and add `this.has.mappings = true`.)

5. If you take a look at your Cocoda instance now (for example by using `npm run dev`), you will see a new registry called "Test Mappings" added to the list of registries in MappingBrowser. Right now, this registry does not return any mappings yet, so you'll always see "No results for Test Mappings.".

6. Add the following function to the `TestProvider` class in `src/providers/test-provider.js`:

  ```js static
  _getMappings({ from, to }) {
    // Create the list of concepts.
    let concepts = [from, to].filter(concept => concept != null)
    let mappings = []
    for (let concept of concepts) {
      // Get the scheme for each concept.
      let scheme = _.get(concept, "inScheme[0]")
      if (scheme) {
        // Create a mapping of the concept onto itself.
        let mapping = {
          from: {
            memberSet: [concept]
          },
          fromScheme: scheme,
          to: {
            memberSet: [concept]
          },
          toScheme: scheme
        }
        // Add the mapping to the list.
        mappings.push(mapping)
      }
    }
    // Return a Promise with the mappings.
    return Promise.resolve(mappings)
  }
  ```
  The code comments should help you understand what the code is doing.

7. If you refresh your Cocoda instance and select a concept on one side, you should see a mapping provided by the "Test Mappings" registry.

Usually, you would access some kind of API to retrieve mappings or mapping recommendations. As the provider is generic, it should not contain any hardcoded URLs. Instead, the URLs to access the API belong inside the registry object in the configuration file. This way, you could add mulitple registries with different URLs using the same provider.

Some notes:

- The constructor of the BaseProvider superclass makes some assumptions about a registry based on the provided files in the registry object. For example, if the `mappings` field is provided, `provider.has.mappings` will be `true`. When a `baseUrl` is given, it will assume that a concept related methods are available. In case this assumptions are wrong, you should override fields in `this.has` in the constructur of your subclass.
- To describe write access capabilities for mappings, add something like this to the constructor:
  ```javascript
  this.has.mappings = {
    read: true,
    create: true,
    update: true,
    delete: true,
  }
  ```
- BaseProvider also provides a wrapper around axios under `this.get(url, options, cancelToken)` that sets the `language` parameter for each request and returns only the `data` portion of the response. If there is an error, it will return an empty array and print a warning on the console. Alternatively, you can import and use axios yourself.
- BaseProvider also has adjustment methods that are called for different types of objects returned by the provider, e.g. for concepts or mappings.
- In the future, BaseProvider should be a separate npm package which other packages can use to offer additional providers for Cocoda.

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
