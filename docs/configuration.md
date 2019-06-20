For the pre-built version, configuration options can be overridden by using `cocoda.json` in the root of the directory. The default options are given in the file [`config/cocoda.default.json`](https://github.com/gbv/cocoda/blob/dev/config/cocoda.default.json) (please consult this file for examples on how to use the configuration options). When using a manual build, create file `config/cocoda.json` and rebuild (`npm run build`) after editing. The following fields are recognized so far:

* **title**: the main title of the instance as plain string

* **logos**: a list of logos to display left to the title, each with subfields:
  * `file`: image URL relative to the `static` directory
  * `alt`: alternate text for the image, if the image cannot be displayed, as plain string
  * `url`: URL to link from the logo

* **menu**: a list of links to show in the menu, each with subfields:
  * `url`: the link URL
  * `prefLabel`: mapping of language codes to link titles

* **searchLinks**: a list of search links to quickly link to external resources from concepts. Each searchlink has subfields:
  * `url` an URL template with possible parameters `{prefLabel}` and/or `{notation}`
  * `prefLabel`: mapping of language codes to link titles

* **favoriteSchemes**: list of vocabulary URIs to be favorited by default.

* **languages**: array with supported interface languages

* **registries**: lists [registries](#registries) where to get data from

* **overrideRegistries**: `false` (default) or `true`
  controls whether to override registries listed in `config/cocoda.default.json`

* **registryGroups**

* **auth**: URL to a [login-server](https://github.com/gbv/login-server) instance to be used for authentication

Using the pre-built version, the application only has to be reloaded after editing the configuration file.
