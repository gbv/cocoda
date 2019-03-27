Access to [concepts schemes](#concept-schemes), [concepts](#concepts), [mappings](#mappings), and mapping recommendations is provided by **registries** which can be configured in the [config file](#configuration).

There are some preconfigured registries in the config file, but it's possible to set up a new registry, for example with [jskos-server](https://github.com/gbv/jskos-server). Each registry has to be assigned a provider. A provider is like a category for registries, a way of accessing an API for example.

See [providers](#providers) for a list of providers currently implemented as part of cocoda.

The registries accessed via providers can be grouped into:

* **Terminology Registries** such as <https://api.dante.gbv.de/> provide
  information about concept schemes and concepts.

* **Mapping Registries** can be queried for existing mappings and mapping recommendations, and might allow creation, modification, and annotation of new mappings.

* **Occurrence Registries** can be queried for usage statistics of concepts in collections.

* **Identity Registries** manage user accounts and provide access tokens via OAuth2 (not implemented yet).

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
- There are two special fields for a registry which describe write access capabilities for mappings: `canSaveMappings` and `canRemoveMappings`.
- BaseProvider also provides a wrapper around axios under `this.get(url, options, cancelToken)` that sets the `language` parameter for each request and returns only the `data` portion of the response. If there is an error, it will return an empty array and print a warning on the console. Alternatively, you can import and use axios yourself.
- BaseProvider also has adjustment methods that are called for different types of objects returned by the provider, e.g. for concepts or mappings.
- In the future, BaseProvider should be a separate npm package which other packages can use to offer additional providers for Cocoda.
