/**
 * objects mixin.
 *
 * Provides a centralized store (replacing the Vuex module) for storing schemes and concepts during the runtime of the application.
 * It provides methods to access the store and wrappers around loading data from the API.
 *
 * The goal is that every scheme or concept that is actively used in Cocoda is an object in the store. This provides reactivity to changes and makes things much easier.
 */

import jskos from "jskos-tools"
import _ from "lodash"

let objects = {}
let topConcepts = {}

export default {
  data() {
    return {
      objects,
      topConcepts,
    }
  },
  computed: {
    /**
     * List of available schemes.
     */
    schemes() {
      // TODO: Sorting should be fixed in jskos-tools.
      return this.$store.state.schemes.slice()
    },
    schemesLoaded() {
      return this.$store.state.schemesLoaded
    },
    /**
     * List of favorite schemes.
     */
    favoriteSchemes() {
      let schemes = []
      if (this.schemesLoaded) {
        for (let uri of this.$store.getters.favoriteSchemes) {
          let scheme = this._getObject({ uri })
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
      if (this.schemesLoaded) {
        for (let concept of this.$store.getters.favoriteConcepts) {
          concepts.push(this.getObject(concept, { type: "concept" }))
        }
      }
      return concepts
    },
  },
  methods: {
    /**
     * Returns the provider object for a scheme or concept.
     *
     * @param {*} object
     */
    getProvider(object) {
      return _.get(object, "_provider") || _.get(object, "inScheme[0]._provider")
    },
    /**
     * Adjusts a concept so that its related nodes (ancestors, broader, narrower) all have the right inScheme properties and are saved in the store.
     *
     * @param {*} object
     */
    adjustConcept(object) {
      if (!object) {
        return
      }
      for (let prop of ["ancestors", "broader", "narrower"]) {
        if (object[prop]) {
          object[prop].forEach((concept, index) => {
            if (concept != null) {
              concept.inScheme = concept.inScheme || object.inScheme
              // Replace concept with concept from store
              this.$set(object[prop], index, this.saveObject(concept, { type: "concept" }))
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
        console.error("Can't save object (null or missing URI).", object)
        return
      }
      let existing = this._getObject(object)
      if (!existing) {
        object = jskos.deepCopy(object)

        // Save object

        let type = options.type || (jskos.isScheme(object) ? "scheme" : "concept")
        // Set __DETAILSLOADED__ property
        object.__DETAILSLOADED__ = object.__DETAILSLOADED__ != null ? object.__DETAILSLOADED__ : false
        // __SAVED__ means it was saved in objects
        object.__SAVED__ = true

        // Type-specific adjustments
        if (type == "scheme") {
          // Adjustment for schemes
          object.type = object.type || ["http://www.w3.org/2004/02/skos/core#ConceptScheme"]
          // Set top concepts
          if (!this.topConcepts[object.uri]) {
            this.$set(this.topConcepts, object.uri, [null])
          }
        }
        if (type == "concept") {
          // Adjustments for concepts
          object.type = object.type || ["http://www.w3.org/2004/02/skos/core#Concept"]
          object.__ISOPEN__ = { true: false, false: false }
          object.inScheme = object.inScheme || [options.scheme]
          object.inScheme = object.inScheme.map(scheme => this._getObject(scheme)).filter(scheme => scheme != null).sort((a, b) => {
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
        let provider = _.get(this._getObject(_.get(object, "inScheme[0]")), "_provider", options.provider)
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
          if ((_.isEmpty(existing[prop]) || Array.isArray(existing[prop]) && existing[prop].includes(null)) && object[prop] != null && !_.isEqual(existing[prop], object[prop])) {
            this.$set(existing, prop, object[prop])
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
      return (objects) => objects.map(object => this.saveObject(object, options))
    },
    /**
     * Reads an object from the store via its URI.
     *
     * @param {*} object
     */
    _getObject(object) {
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
     * Either returns an object already in store or saves the object and returns the saved object.
     *
     * TODO: Isn't this almost the same as just saveObject itself?
     *
     * @param {*} object
     * @param {*} options
     */
    getObject(object, options) {
      return this._getObject(object) || this.saveObject(object, options)
    },
    /**
     * Loads schemes from API. This should be called once upon application start.
     */
    loadSchemes() {
      let schemes = [], promises = []

      for (let registry of this.config.registries) {
        let provider = registry.provider
        if (provider.has.concepts) {
          let promise = provider.getSchemes().then(results => {
            for (let scheme of results) {
              // Set provider for scheme
              scheme.__PROVIDER__ = registry
              // Add scheme specific custom properties
              scheme.__DETAILSLOADED__ = true
              scheme.type = scheme.type || ["http://www.w3.org/2004/02/skos/core#ConceptScheme"]
              // Check if scheme is already in store
              // TODO: This is currently not possible from here!
              let otherScheme = this._getObject(scheme), prio, otherPrio, override = false
              // let otherScheme = null, prio, otherPrio
              if (otherScheme) {
                prio = registry.prio || 0
                otherPrio = otherScheme.__PROVIDER__ ? (otherScheme.__PROVIDER__.priority || 0) : -1
                override = otherPrio < prio
              }
              if (!otherScheme || override) {
                if (override) {
                  // Find and remove scheme from schemes array
                  let otherSchemeIndex = -1
                  for (let index = 0; index < schemes.length; index += 1) {
                    if (this.$jskos.compare(scheme, schemes[index])) {
                      otherSchemeIndex = index
                      break
                    }
                  }
                  schemes.splice(otherSchemeIndex, 1)
                  // Remove otherScheme from objects
                  for (let uri of this.$jskos.getAllUris(otherScheme)) {
                    this.$set(this.objects, uri, null)
                  }
                }
                // Save scheme in objects and push into schemes array
                schemes.push(this.saveObject(scheme, { provider, type: "scheme" }))
              }
            }
          }).catch(error => {
            console.warn("Couldn't load schemes for registry", registry.uri, error)
            this.$store.commit({
              type: "alerts/add",
              text: `Could not load concept schemes for provider ${util.prefLabel(registry)}. Please open an issue on GitHub.`,
              variant: "danger"
            })
          })
          promises.push(promise)
        }
      }

      return Promise.all(promises).then(() => {
        schemes = this.$jskos.sortSchemes(schemes)
        // Commit schemes to store
        this.$store.commit({
          type: "setSchemes",
          schemes
        })
        this.$store.commit({
          type: "setSchemesLoaded",
          value: true
        })
      })
    },
    /**
     * Loads the available concept types for a scheme.
     *
     * @param {*} scheme
     */
    loadTypes(scheme) {
      if (!scheme || !scheme.__SAVED__) {
        console.error("loadTypes called with object that is not saved.", scheme)
        return Promise.resolve(scheme)
      }
      let promise
      if (!scheme || !scheme._getTypes) {
        promise = Promise.resolve(scheme)
      } else {
        promise = scheme._getTypes()
      }
      return promise.then(types => {
        this.$set(scheme, "types", types)
        return scheme
      })
    },
    /**
     * Loads top concepts for a scheme.
     *
     * @param {*} scheme
     */
    loadTop(scheme) {
      if (!scheme || !scheme.__SAVED__) {
        console.error("loadTop called with scheme that is not saved.", scheme)
        return Promise.resolve(scheme)
      }
      if (!scheme || (this.topConcepts[scheme.uri] && !this.topConcepts[scheme.uri].includes(null))) {
        return Promise.resolve(scheme)
      }
      let promise
      if (!scheme || !scheme._getTop) {
        promise = Promise.resolve([])
      } else {
        promise = scheme._getTop()
      }
      return promise.then(this.saveObjectsWithOptions({ scheme, type: "concept" })).then(top => {
        // Set ancestors
        for (let concept of top) {
          this.$set(concept, "ancestors", [])
        }
        this.$set(this.topConcepts, scheme.uri, jskos.sortConcepts(top))
        return scheme
      })
    },
    /**
     * Loads details for a scheme or concept.
     *
     * @param {*} object
     * @param {*} options
     */
    loadDetails(object, options = {}) {
      if (!object || !object.__SAVED__) {
        console.error("loadDetails called with object that is not saved.", object)
        return Promise.resolve(object)
      }
      if (!object || object.__DETAILSLOADED__) {
        return Promise.resolve(object)
      }
      let scheme = _.get(object, "inScheme[0]") || options.scheme
      let getDetails = (object._getDetails && object._getDetails())
        || (_.get(scheme, "_provider.getDetails") && _.get(scheme, "_provider").getDetails(object))
        || Promise.reject("no provider found")
      return getDetails.then(results => {
        if (results.length) {
          // Save details
          return this.saveObject(results[0])
        }
        this.adjustConcept(object)
        return object
      }).catch(error => {
        console.error("Error in loadDetails:", error, object)
        return object
      })
    },
    /**
     * Loads narrower concepts for a concept.
     *
     * @param {*} object
     * @param {*} options
     */
    loadNarrower(object, options = {}) {
      if (!object || !object.__SAVED__) {
        console.error("loadNarrower called with object that is not saved.", object)
        return Promise.resolve(object)
      }
      if (!object || object.narrower && !object.narrower.includes(null)) {
        return Promise.resolve(object)
      }
      let scheme = _.get(object, "inScheme[0]") || options.scheme
      let getNarrower = (object._getNarrower && object._getNarrower())
        || (_.get(scheme, "_provider.getNarrower") && _.get(scheme, "_provider").getNarrower(object))
        || Promise.reject("no provider found")
      return getNarrower.then(this.saveObjectsWithOptions({ scheme, type: "concept" })).then(narrower => {
        for (let child of narrower) {
          // Set ancestors of children
          if (!object.ancestors || object.ancestors.includes(null)) {
            this.$set(child, "ancestors", [null])
          } else {
            this.$set(child, "ancestors", object.ancestors.concat([object]))
          }
          // Set broader of children
          this.$set(child, "broader", [object])
          this.adjustConcept(child)
        }
        this.$set(object, "narrower", this.$jskos.sortConcepts(narrower))
        this.adjustConcept(object)
        return object
      }).catch(error => {
        console.error("Error in loadNarrower:", error)
        return object
      })
    },
    /**
     * Loads ancestor concepts for a concept.
     *
     * @param {*} object
     * @param {*} options
     */
    loadAncestors(object, options = {}) {
      if (!object || !object.__SAVED__) {
        console.error("loadAncestors called with object that is not saved.", object)
        return Promise.resolve(object)
      }
      if (!object || object.ancestors && !object.ancestors.includes(null)) {
        return Promise.resolve(object)
      }
      let scheme = _.get(object, "inScheme[0]") || options.scheme
      let getAncestors = (object._getAncestors && object._getAncestors())
        || (_.get(scheme, "_provider.getAncestors") && _.get(scheme, "_provider").getAncestors(object))
        || Promise.reject("no provider found")
      return getAncestors.then(this.saveObjectsWithOptions({ scheme, type: "concept" })).then(ancestors => {
        let currentAncestors = []
        for (let ancestor of ancestors) {
          // Set ancestors of ancestors
          this.$set(ancestor, "ancestors", currentAncestors.slice())
          // Set broader of ancestors
          this.$set(ancestor, "broader", currentAncestors.length > 0 ? [currentAncestors[currentAncestors.length - 1]] : [])
          currentAncestors.push(ancestor)
          this.adjustConcept(ancestor)
        }
        for (let child of object.narrower || []) {
          if (child) {
            this.$set(child, "ancestors", ancestors.concat([object]))
            this.adjustConcept(child)
          }
        }
        this.$set(object, "ancestors", ancestors)
        this.adjustConcept(object)
        return object
      }).catch(error => {
        console.error("Error in loadAncestors:", error)
        return object
      })
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
      return this.$store.dispatch(...params).then(mappings => {
        // Replace all objects in mappings with objects in store
        for (let mapping of mappings) {
          this.adjustMapping(mapping)
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
      for (let fromTo of ["from", "to"]) {
        if (mapping[fromTo + "Scheme"]) {
          mapping[fromTo + "Scheme"] = this.saveObject(mapping[fromTo + "Scheme"], { type: "scheme" })
          let scheme = mapping[fromTo + "Scheme"]
          for (let bundleType of ["memberSet", "memberList", "memberChoice"]) {
            if (_.isArray(mapping[fromTo][bundleType])) {
              mapping[fromTo][bundleType] = mapping[fromTo][bundleType].map(concept => this.saveObject(concept, { scheme, type: "concept" }))
            }
          }
        }
      }
      return mapping
    },
  },
}
