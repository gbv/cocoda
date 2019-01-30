Default settings are given in file `config/cocoda.default.json`. To change the configuration, create file `config/cocoda.json` and override selected fields. The following fields are recognized so far:

* **title**: the main title of the instance as plain string

* **logos**: a list of logos to display left to the title, each with subfields:
  * `file`: image URL relative to the `static` directory
  * `alt`: alternate text for the image, if the image cannot be displayed, as plain string
  * `url`: URL to link from the logo

* **menu**: a list of links to show in the menu, each with subfields:
  * `url`: the link URL
  * `prefLabel`: mapping of language codes to link titles

* **impressum**: URL of an Impressum

* **searchLinks**: a list of search links to quickly link to external resources from concepts. Each searchlink has subfields:
  * `url` an URL template with possible parameters `{prefLabel}` and/or `{notation}`
  * `prefLabel`: mapping of language codes to link titles

The following fields may be changed in a later version:

* **favoriteSchemes**: list of vocabulary URIs to be favorited by default.

* **language**

* **languages**: object with supported interface languages

* **registries**: lists [registries](#registries) where to get data from

* **registryMode**: values `override` (default) or `merge`
  controls whether to include registries listed in `config/cocoda.default.json`

* **registryGroups**

The application has to be rebuilt to activate changes.
