/**
 * CDK mixin.
 *
 * Provides a centralized store (replacing the Vuex module) for storing schemes and concepts during the runtime of the application.
 * It provides methods to access the store and wrappers around loading data from the API.
 *
 * The goal is that every scheme or concept that is actively used in Cocoda is an object in the store. This provides reactivity to changes and makes things much easier.
 *
 * TODO:
 * - Add error handling
 * - ...
 */

import jskos from "jskos-tools"
import cdk from "cocoda-sdk"
import _ from "lodash"

let objects = {}
let topConcepts = {}
let loadingConcepts = []
let erroredConcepts = []
let schemes = []
let concordances = []

export default {
  data() {
    return {
      objects,
      topConcepts,
      loadingConcepts,
      erroredConcepts,
      schemes,
      concordances,
    }
  },
  computed: {
    /**
     * List of favorite schemes.
     */
    favoriteSchemes() {
      let schemes = []
      if (this.schemes.length) {
        for (let uri of this.$store.getters.favoriteSchemes) {
          let scheme = this.getObject({ uri })
          if (scheme && !this.$jskos.isContainedIn(scheme, schemes)) {
            schemes.push(scheme)
          }
        }
      }
      return schemes
    },
    /**
     * List of favorite concepts (will be saved into store on first load).
     */
    favoriteConcepts() {
      let concepts = []
      if (this.schemes.length) {
        for (let concept of this.$store.getters.favoriteConcepts) {
          let conceptFromStore = this.saveObject(concept, { type: "concept" })
          concepts.push(conceptFromStore)
        }
      }
      // Load details if necessary
      // TODO: Reconsider because this is a computed property.
      this.loadConcepts(concepts.filter(concept => !concept.__DETAILSLOADED__))
      return concepts
    },
    /**
     * Bool whether local mappings are supported.
     */
    localMappingsSupported() {
      let registry = this.config.registries.find(registry => registry.uri == "http://coli-conc.gbv.de/registry/local-mappings")
      return registry != null
    },
    currentRegistry() {
      return this.$store.getters.getCurrentRegistry
    },
    mappingRegistries() {
      let registries = this.config.registries.filter(registry =>
        registry.has.mappings || registry.has.occurrences,
      )
      return registries
    },
    // show registries
    showRegistry() {
      let object = {}
      // Define setter and getter for each registry separately.
      for (let registry of this.mappingRegistries) {
        Object.defineProperty(object, registry.uri, {
          get: () => {
            let result = this.$settings.mappingBrowserShowRegistry[registry.uri]
            if (result == null) {
              return true
            }
            return result
          },
          set: (value) => {
            // Only allow if it's not the current registry
            if (value || !this.$jskos.compare(registry, this.currentRegistry)) {
              this.$store.commit({
                type: "settings/set",
                prop: "mappingBrowserShowRegistry",
                value: Object.assign({}, this.$settings.mappingBrowserShowRegistry, { [registry.uri]: value }),
              })
              this.$store.commit("mapping/setRefresh", { registry: registry.uri })
            }
          },
        })
      }
      return object
    },
  },
  methods: {
    /**
     * Adjusts a concept so that its related nodes (ancestors, broader, narrower) all have the right inScheme properties and are saved in the store.
     *
     * @param {*} object
     */
    adjustConcept(object) {
      if (!object) {
        throw new Error("Can't adjust object that is null or undefined.")
      }
      for (let prop of ["ancestors", "broader", "narrower"]) {
        if (object[prop]) {
          object[prop].forEach((concept, index) => {
            if (concept != null) {
              concept = this.saveObject(concept, { type: "concept", scheme: _.get(object, "inScheme[0]") })
              if (!concept.inScheme) {
                this.$set(concept, "inScheme", object.inScheme)
              }
              this.$set(object[prop], index, concept)
            }
          })
        }
      }
    },
    /**
     * Saves an object in the store. Note that a deep copy will be made, meaning that the returned object should be used, not the original. If an object is already in the store, the properties will be merged into the existing object.
     *
     * For this to work properly, one of the following is necessary:
     * - object has to have the property `inScheme`
     * - scheme has to be provided through options
     *
     * Also, the object either has to have a `type` property, or a type ("scheme" or "concept") needs to be given through options.
     *
     * A provider can also be given through the options in certain cases.
     *
     * Returns the object that was saved in store (or the already existing one).
     *
     * @param {*} object
     * @param {*} options
     */
    saveObject(object, options = {}) {
      if (!object || !object.uri) {
        throw new Error("Can't save object that is null or undefined or that doesn't have a URI.")
      }
      let existing = this.getObject(object)
      // If it's the same object reference, return immediately
      if (object === existing) {
        return object
      }
      if (!existing) {
        object = jskos.deepCopy(object)

        // Save object

        let type = options.type || (jskos.isScheme(object) ? "scheme" : "concept")
        // Set __DETAILSLOADED__ property
        object.__DETAILSLOADED__ = object.__DETAILSLOADED__ != null ? object.__DETAILSLOADED__ : 0
        // __SAVED__ means it was saved in objects
        object.__SAVED__ = true

        // Type-specific adjustments
        if (type == "scheme") {
          // Adjustment for schemes
          object.type = object.type || ["http://www.w3.org/2004/02/skos/core#ConceptScheme"]
          // Set top concepts
          if (!this.topConcepts[object.uri]) {
            // TODO: Reconsider
            this.$set(this.topConcepts, object.uri, [null])
          }
        }
        if (type == "concept") {
          // Adjustments for concepts
          object.type = object.type || ["http://www.w3.org/2004/02/skos/core#Concept"]
          object.__ISOPEN__ = { true: false, false: false }
          object.inScheme = object.inScheme || [options.scheme]
          object.inScheme = object.inScheme.map(scheme => this.getObject(scheme)).filter(scheme => scheme != null).sort((a, b) => {
            if (a.__SAVED__) {
              return -1
            }
            if (b.__SAVED__) {
              return 1
            }
            return 0
          })
          if (object.inScheme.length == 0) {
            console.warn(object, object.uri + ": inScheme has no elements", object.inScheme.slice(), "with scheme", options.scheme)
          }
        }

        // Add to objects
        let uris = jskos.getAllUris(object)
        for (let uri of uris) {
          this.$set(this.objects, uri, object)
        }

        // Adjust related concepts
        this.adjustConcept(object)

        // Provider adjustments
        // TODO: Is this necessary? If yes, how can we make it not be necessary?
        let provider = _.get(object, "_registry") || _.get(this.getObject(_.get(object, "inScheme[0]")), "_registry") || options.provider
        if (provider) {
          if (type == "scheme") {
            provider.adjustSchemes([object])
          }
          if (type == "concept") {
            provider.adjustConcepts([object])
          }
        }

      } else {
        // Integrate details into existing object
        for (let prop of Object.keys(object)) {
          if (((_.isEmpty(existing[prop]) || Array.isArray(existing[prop]) && existing[prop].includes(null)) && object[prop] != null && !_.isEqual(existing[prop], object[prop])) || (_.isArray(existing[prop]) && _.isArray(object[prop]) && object[prop].length > existing[prop].length)) {
            this.$set(existing, prop, object[prop])
          } else {
            // Special cases
            // 1. Integrate object properties
            if (!_.isArray(existing[prop]) && !_.isArray(object[prop]) && _.isObject(existing[prop]) && _.isObject(object[prop])) {
              // Just overwrite null or not existing values
              for (let prop2 of Object.keys(object[prop])) {
                if (!existing[prop][prop2]) {
                  existing[prop][prop2] = object[prop][prop2]
                }
              }
            }
          }
        }
      }
      return existing || object
    },
    /**
     * Returns a wrapper function around saveObject to save multiple objects at once.
     *
     * @param {*} options
     */
    saveObjectsWithOptions(options) {
      return objects => objects.map(object => this.saveObject(object, options))
    },
    /**
     * Reads an object from the store via its URI.
     *
     * @param {*} object
     */
    getObject(object) {
      if (!object || object.__SAVED__) {
        return object
      }
      let uris = jskos.getAllUris(object)
      for (let uri of uris) {
        if (this.objects[uri]) {
          return this.objects[uri]
        }
      }
      return null
    },
    /**
     * Loads schemes from API. This should be called once upon application start.
     */
    async loadSchemes() {
      let schemes = await cdk.getSchemes()
      for (let scheme of schemes) {
        scheme = this.saveObject(scheme, { provider: scheme._registry, type: "scheme" })
        if (!this.schemes.includes(scheme)) {
          this.schemes.push(scheme)
        }
      }
      return this.schemes
    },
    /**
     * Loads the available concept types for a scheme.
     *
     * @param {*} scheme
     */
    async loadTypes(scheme) {
      if (!scheme || !scheme.__SAVED__) {
        throw new Error(`loadTypes called with a scheme that is undefined or not saved: ${scheme && scheme.uri}`)
      }
      let types = []
      try {
        // TODO CDK: Is this compatible?
        types = await scheme._getTypes()
      } catch(error) {
        // Ignore error, show warning only.
        console.warn(`Error loading types for scheme ${scheme.uri}; assuming empty types list.`)
      }
      this.$set(scheme, "types", types)
      return scheme
    },
    /**
     * Loads top concepts for a scheme.
     *
     * @param {*} scheme
     */
    async loadTop(scheme) {
      if (!scheme || !scheme.__SAVED__) {
        throw new Error(`loadTop called with a scheme that is undefined or not saved: ${scheme && scheme.uri}`)
      }
      if (this.topConcepts[scheme.uri] && !this.topConcepts[scheme.uri].includes(null)) {
        return this.topConcepts[scheme.uri]
      }
      let topConcepts = []
      try {
        // TODO CDK: Is this compatible?
        topConcepts = await scheme._getTop()
      } catch(error) {
        // Ignore error, show warning only.
        console.warn(`Error loading top concepts for scheme ${scheme.uri}; assuming empty list.`)
      }
      topConcepts = this.saveObjectsWithOptions({ scheme, type: "concept" })(topConcepts)
      // Set ancestors
      for (let concept of topConcepts) {
        this.$set(concept, "ancestors", [])
      }
      this.$set(this.topConcepts, scheme.uri, jskos.sortConcepts(topConcepts))
      return scheme
    },
    /**
     * Loads data about concepts.
     *
     * @param {*} concepts
     * @param {*} options - options for getConcepts call
     */
    async loadConcepts(concepts, { registry: fallbackRegistry, scheme, ...options } = {}) {
      // Filter out concepts that are not saved, already have details loaded, or don't have a provider.
      // Then, sort the remaining concepts by registry.
      const list = []
      let uris = []
      for (let concept of concepts.filter(c => c && c.uri && !c.__DETAILSLOADED__)) {
        const registry = this.getProvider(concept) || this.getProvider(scheme) || fallbackRegistry
        if (!registry) {
          continue
        }
        if ([].concat(this.loadingConcepts, this.erroredConcepts).find(c => this.$jskos.compare(c, concept))) {
          // Concept is already loading or errored
          continue
        }
        uris = uris.concat(jskos.getAllUris(concept))
        this.loadingConcepts.push(concept)
        // TODO: Remove magic number.
        const entry = list.find(e => e.registry == registry && e.concepts.length < 15)
        if (entry) {
          entry.concepts.push(concept)
        } else {
          list.push({
            registry,
            concepts: [concept],
          })
        }
      }
      // Load concepts by registry
      const promises = list.map(({ registry, concepts }) => registry.getConcepts({ ...options, concepts }).then(concepts => {
        // Save and adjust results
        let uris = []
        for (let concept of concepts) {
          // TODO: Add fallback registry here?
          concept = this.saveObject(concept, { scheme })
          this.$set(concept, "__DETAILSLOADED__", 1)
          this.adjustConcept(concept)
          uris = uris.concat(this.$jskos.getAllUris(concept))
        }
        // Remove all loaded URIs from loadingConcepts
        for (let uri of uris) {
          let index = this.loadingConcepts.findIndex(concept => this.$jskos.compare(concept, { uri }))
          if (index >= 0) {
            this.$delete(this.loadingConcepts, index)
          }
        }
      }))
      await Promise.all(promises)
      // Move all URIs that were not loaded to errored concepts
      for (let uri of uris) {
        let index = this.loadingConcepts.findIndex(concept => this.$jskos.compare(concept, { uri }))
        if (index >= 0) {
          let concept =  this.loadingConcepts[index]
          this.$set(concept, "__DETAILSLOADED__", -1)
          this.$delete(this.loadingConcepts, index)
          this.erroredConcepts.push(concept)
        }
      }
      // Return objects from store
      // ? is getObject okay here? (was saveObject previously)
      return concepts.map(c => this.getObject(c))
    },
    /**
     * Loads narrower concepts for a concept.
     *
     * @param {*} concept
     * @param {*} options
     */
    async loadNarrower(concept, { registry: fallbackRegistry, ...options } = {}) {
      // TODO: Does concept really need to be saved?
      if (!concept || !concept.__SAVED__) {
        throw new Error(`loadNarrower called with concept that is undefined or not saved: ${concept && concept.uri}.`)
      }
      if (concept.narrower && !concept.narrower.includes(null)) {
        // Narrower already loaded
        return concept
      }
      const registry = this.getProvider(concept) || fallbackRegistry
      if (!registry) {
        throw new Error(`loadNarrower called with concept that doesn't have a registry: ${concept.uri}`)
      }
      let narrower = await registry.getNarrower({ ...options, concept})
      narrower = this.saveObjectsWithOptions({ type: "concept" })(narrower)
      for (let child of narrower) {
        // Set ancestors of children
        if (!concept.ancestors || concept.ancestors.includes(null)) {
          this.$set(child, "ancestors", [null])
        } else {
          this.$set(child, "ancestors", concept.ancestors.concat([concept]))
        }
        // Set broader of children
        this.$set(child, "broader", [concept])
        this.adjustConcept(child)
      }
      this.$set(concept, "narrower", this.$jskos.sortConcepts(narrower))
      this.adjustConcept(concept)
      return concept
    },
    /**
     * Loads ancestor concepts for a concept.
     *
     * @param {*} concept
     * @param {*} options
     */
    async loadAncestors(concept, { registry: fallbackRegistry, ...options } = {}) {
      // TODO: Does concept really need to be saved?
      if (!concept || !concept.__SAVED__) {
        throw new Error(`loadAncestors called with concept that is undefined or not saved: ${concept && concept.uri}.`)
      }
      if (concept.ancestors && !concept.ancestors.includes(null)) {
        // Ancestors already loaded
        return concept
      }
      const registry = this.getProvider(concept) || fallbackRegistry
      if (!registry) {
        throw new Error(`loadAncestors called with concept that doesn't have a registry: ${concept.uri}`)
      }

      let ancestors = await registry.getAncestors({ ...options, concept })
      ancestors = this.saveObjectsWithOptions({ type: "concept" })(ancestors)
      let currentAncestors = []
      for (let ancestor of ancestors) {
        // Set ancestors of ancestors
        this.$set(ancestor, "ancestors", currentAncestors.slice())
        // Set broader of ancestors
        this.$set(ancestor, "broader", currentAncestors.length > 0 ? [currentAncestors[currentAncestors.length - 1]] : [])
        currentAncestors.push(ancestor)
        this.adjustConcept(ancestor)
      }
      for (let child of concept.narrower || []) {
        // Only set child's ancestors only if it doesn't have any.
        // Note: This might have unintended side effects. If there are problems with ancestors, look here.
        if (child && (!child.ancestors || child.ancestors.includes(null))) {
          this.$set(child, "ancestors", ancestors.concat([concept]))
        }
        if (child) {
          this.adjustConcept(child)
        }
      }
      this.$set(concept, "ancestors", ancestors)
      this.adjustConcept(concept)
      return concept
    },
    /**
     * Wrapper around the getMappings Vuex action that replaces all objects in the mappings with objects from the store.
     *
     * Only use this method to load mappings!
     *
     * @param  {...any} params
     */
    getMappings(...params) {
      if (!params[0]) {
        return Promise.resolve([])
      }
      params[0].type = "mapping/getMappings"
      if (params[0].adjust === undefined) {
        params[0].adjust = true
      }
      return this.$store.dispatch(...params).then(mappings => {
        if (params[0].adjust) {
          // Replace all objects in mappings with objects in store
          for (let mapping of mappings) {
            this.adjustMapping(mapping)
          }
        }
        return mappings
      })
    },
    /**
     * Adjusts a mapping by retrieving/saving all contained schemes and concepts from/in the store.
     *
     * @param {*} mapping
     */
    adjustMapping(mapping) {
      if (!mapping) {
        return null
      }
      for (let fromTo of ["from", "to"]) {
        if (mapping[fromTo + "Scheme"]) {
          mapping[fromTo + "Scheme"] = this.saveObject(mapping[fromTo + "Scheme"], { type: "scheme" })
          let scheme = mapping[fromTo + "Scheme"]
          for (let bundleType of ["memberSet", "memberList", "memberChoice"]) {
            if (_.isArray(mapping[fromTo][bundleType])) {
              mapping[fromTo][bundleType] = mapping[fromTo][bundleType].filter(concept => concept != null).map(concept => this.saveObject(concept, { scheme, type: "concept" }))
            }
          }
        }
      }
      // Replace partOf with concordance objects if possible
      if (mapping.partOf) {
        mapping.partOf = mapping.partOf.map(concordance => this.concordances.find(c => this.$jskos.compare(c, concordance)) || concordance)
      }
      // Set mapped entry for concepts that have mappings
      const registry = _.get(mapping, "_registry")
      if (jskos.mappingRegistryIsStored(registry)) {
        for (let [from, to] of [["from", "to"], ["to", "from"]]) {
          const targetScheme = mapping[`${to}Scheme`]
          const sourceConcepts = jskos.conceptsOfMapping(mapping, from)
          if (targetScheme) {
            for (let concept of sourceConcepts) {
              if (!concept.__MAPPED__) {
                this.$set(concept, "__MAPPED__", [])
              }
              const existing = concept.__MAPPED__.find(item => jskos.compare(item.registry, registry) && jskos.compare(item.scheme, targetScheme))
              if (existing && !existing.exist) {
                existing.exist = true
              } else if (!existing) {
                concept.__MAPPED__.push({
                  registry,
                  scheme: targetScheme,
                  exist: true,
                })
              }
            }
          }
        }
      }
      return mapping
    },
  },
}
