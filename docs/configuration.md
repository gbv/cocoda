Default settings are given in file `config/cocoda.default.json`. To change the configuration, create file `config/cocoda.json` and override selected fields. The following fields are recognized so far:

* `title`
* `logos`
* `registries` lists [registries](#registries) where to get data from
* `registryMode` with values `override` (default) or `merge`
  controls whether to include registries listed in `config/cocoda.default.json`
* `favoriteTerminologyProviders`
* `favoriteConcepts`
* `language`
* `languages` (object with supported interface languages)
* `githubUrl`
* `helpUrl`
* `feedbackUrl`
* `impressumUrl`

The application has to be rebuilt to activate changes.
