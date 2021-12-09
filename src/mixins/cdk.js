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
import { cdk } from "cocoda-sdk"
import _ from "lodash"
import computed from "./computed.js"
import { getItem, getItems, modifyItem, saveItem, schemes } from "@/items"

let objects = {}
let topConcepts = {}
let loadingConcepts = []
let erroredConcepts = []
let concordances = []

export default {
  mixins: [computed],
  data() {
    return {
      objects,
      topConcepts,
      loadingConcepts,
      erroredConcepts,
      concordances,
    }
  },
  computed: {
    schemes() {
      return schemes
    },
    /**
     * List of favorite schemes.
     */
    favoriteSchemes() {
      let schemes = []
      if (this.schemes.length) {
        for (let uri of this.$store.getters.favoriteSchemes) {
          let scheme = getItem({ uri })
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
      return this.$store.getters.favoriteConcepts
    },
    /**
     * Registry for local mappings if configured.
     */
    localMappingsRegistry() {
      return this.config.registries.find(registry => registry.constructor.providerName == "LocalMappings")
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
            if (value || !this.$jskos.compareFast(registry, this.currentRegistry)) {
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
     * Returns registry object from config for a registry or URI. Fallback to current registry if it's null.
     *
     * @param {Object|string} registry
     */
    getRegistry(registry) {
      registry = registry || this.currentRegistry
      // Keep backward compatibility with old way of calling
      if (_.isString(registry)) {
        registry = { uri: registry }
      }
      registry = this.config.registries.find(r => jskos.compareFast(r, registry))
      return registry
    },
    /**
     * Adjusts a mapping by retrieving/saving all contained schemes and concepts from/in the store.
     *
     * @param {Object} mapping JSKOS mapping object
     * @returns {Object}
     */
    adjustMapping(mapping) {
      // TODO: Find and replace current mapping?
      if (!mapping) {
        return null
      }
      for (let fromTo of ["from", "to"]) {
        if (mapping[fromTo + "Scheme"]) {
          mapping[fromTo + "Scheme"] = saveItem(mapping[fromTo + "Scheme"], { type: "scheme", returnIfExists: true })
          let scheme = mapping[fromTo + "Scheme"]
          for (let bundleType of ["memberSet", "memberList", "memberChoice"]) {
            if (_.isArray(mapping[fromTo][bundleType])) {
              mapping[fromTo][bundleType] = mapping[fromTo][bundleType].filter(concept => concept != null).map(concept => saveItem(concept, { scheme, type: "concept", returnIfExists: true }))
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
          const targetScheme = getItem(mapping[`${to}Scheme`])
          const sourceConcepts = getItems(jskos.conceptsOfMapping(mapping, from))
          if (targetScheme) {
            for (let concept of sourceConcepts) {
              if (!concept.__MAPPED__) {
                modifyItem(concept, "__MAPPED__", [])
              }
              const existing = concept.__MAPPED__.find(item => jskos.compareFast(item.registry, registry) && jskos.compare(item.scheme, targetScheme))
              if (existing && !existing.exist.length) {
                existing.exist.push(mapping.uri)
              } else if (!existing) {
                concept.__MAPPED__.push({
                  registry,
                  scheme: targetScheme,
                  exist: [mapping.uri],
                })
              }
            }
          }
        }
      }
      // Check if mapping is equal to hoveredMapping, if yes refresh it
      if (this.$store.state.hoveredMapping && mapping.uri === this.$store.state.hoveredMapping.uri) {
        this.$store.commit({
          type: "setHoveredMapping",
          mapping,
        })
      }
      return mapping
    },
    prepareMapping(mapping) {
      if (!mapping) {
        return null
      }
      mapping = jskos.copyDeep(mapping)
      // Adjust creator
      let creator = this.creator
      // - All previous creators (except self) will be written to contributors.
      // - `creator` will be overridden by self.
      if (creator && (creator.uri || creator.prefLabel)) {
        const contributor = (mapping.contributor || []).concat(mapping.creator || [])
        mapping.contributor = []
        for (let creator of contributor) {
          // Only add if it's not self and not already in contributor
          if (!jskos.compare(creator, { identifier: this.userUris || [] }) && !jskos.isContainedIn(creator, mapping.contributor)) {
            mapping.contributor.push(creator)
          }
        }
        mapping.creator = [creator]
        // If mapping as a URI already (i.e. it already exists), add creator as contributor as well
        if (mapping.uri) {
          mapping.contributor.push(creator)
        }
      } else {
        mapping.contributor = mapping.contributor || []
        for (let creator of mapping.creator || []) {
          if (!jskos.isContainedIn(creator, mapping.contributor)) {
            mapping.contributor.push(creator)
          }
        }
        this.$delete(mapping, "creator")
      }
      // Prevent issue with empty strings as prefLabels
      for (let prop of ["creator", "contributor"].filter(p => mapping[p])) {
        for (let person of mapping[prop]) {
          if (person.uri === "") {
            this.$delete(person, "uri")
          }
          _.forOwn(person.prefLabel, (value, key) => {
            if (value == "") {
              this.$delete(person.prefLabel, key)
            }
          })
          if (_.isEmpty(person.prefLabel)) {
            this.$delete(person, "prefLabel")
          }
        }
        mapping[prop] = mapping[prop].filter(p => !_.isEmpty(p))
      }
      if (mapping.creator && mapping.creator.length == 0) {
        this.$delete(mapping, "creator")
      }
      if (mapping.contributor && mapping.contributor.length == 0) {
        this.$delete(mapping, "contributor")
      }
      return mapping
    },
    async getMapping({ registry, _adjust = true, uri, mapping, ...config }) {
      if (!mapping && !uri) {
        throw new Error("getMapping: Can't get mapping with neither uri nor mapping.")
      }
      if (!mapping) {
        mapping = { uri }
      }
      if (!registry) {
        registry = mapping._registry || this.config.registries.find(r => r.has.mappings && mapping.uri.startsWith(r._api.mappings))
      }
      // Assume local mappings if URI starts with "urn:uuid"
      if (!registry && mapping.uri.startsWith("urn:uuid")) {
        registry = this.localMappingsRegistry
      }
      registry = this.getRegistry(registry)
      if (!registry) {
        throw new Error("getMappings: No registry to get mappings from.")
      }
      mapping = await registry.getMapping({ mapping, ...config })
      if (_adjust) {
        this.adjustMapping(mapping)
      }
      return mapping
    },
    async getMappings({ registry, _adjust = true, ...config }) {
      registry = this.getRegistry(registry)
      if (!registry) {
        throw new Error("getMappings: No registry to get mappings from.")
      }
      if (!registry.has.mappings) {
        throw new Error(`getMappings: Registry ${registry.uri} does not support mappings.`)
      }
      // Adjust certain parameters in the config
      for (const { param, relatedItems = false } of [
        { param: "from", relatedItems: true },
        { param: "to", relatedItems: true },
        { param: "fromScheme" },
        { param: "toScheme" },
      ]) {
        if (config[param]) {
          config[param] = getItem(config[param], { relatedItems }) || config[param]
        }
      }
      const mappings = await registry.getMappings(config)
      if (_adjust) {
        for (let mapping of mappings) {
          this.adjustMapping(mapping)
        }
      }
      return mappings
    },
    _addIdentityParams(config) {
      config.params = config.params || {}
      config.params.identity = this.$settings.creatorUri
      config.params.identityName = this.$settings.creator
    },
    async postMapping({ registry, _adjust = true, _reload = true, _alert = true, _before, _after, ...config }) {
      registry = this.getRegistry(registry || config.mapping._registry)
      if (!registry) {
        throw new Error("postMapping: No registry to post mapping to.")
      }
      _before && _before()
      try {
        config.mapping = this.prepareMapping(config.mapping)
        this._addIdentityParams(config)
        const mapping = await registry.postMapping(config)
        if (_adjust) {
          this.adjustMapping(mapping)
        }
        if (_reload) {
          this.$store.commit("mapping/setRefresh", { registry: registry.uri })
        }
        if (_alert) {
          this.alert(this.$t("alerts.mappingSaved", [jskos.prefLabel(registry, { fallbackToUri: false })]), null, "success")
          // Additionally, if this is the first time the user saved into local mappings, show an alert:
          if (jskos.compare(registry, this.localMappingsRegistry) && !this.$settings.hasWrittenIntoLocalMappings) {
            this.alert(
              this.$t("alerts.localMappingsFirstSaved"),
              0,
              "warning",
            )
            this.$store.commit({
              type: "settings/set",
              prop: "hasWrittenIntoLocalMappings",
              value: true,
            })
          }
        }
        _after && _after()
        return mapping
      } catch (error) {
        if (_alert) {
          let message = `${this.$t("alerts.mappingNotSaved", [jskos.prefLabel(registry, { fallbackToUri: false })])} ${this.getErrorMessage(error)}`
          this.alert(message, null, "danger")
        }
        _after && _after(error)
        throw error
      }
    },
    async postMappings({ registry, _adjust = true, _reload = true, _alert = true, _before, _after, ...config }) {
      registry = this.getRegistry(registry)
      if (!registry) {
        throw new Error("postMappings: No registry to post mappings to.")
      }
      _before && _before()
      try {
        config.mappings = config.mappings.map(mapping => this.prepareMapping(mapping))
        this._addIdentityParams(config)
        const mappings = await registry.postMappings(config)
        if (_adjust) {
          for (let mapping of mappings) {
            this.adjustMapping(mapping)
          }
        }
        if (_reload) {
          this.$store.commit("mapping/setRefresh", { registry: registry.uri })
        }
        if (_alert) {
          this.alert(this.$t("alerts.mappingSaved", [jskos.prefLabel(registry, { fallbackToUri: false })]), null, "success")
        }
        _after && _after()
        return mappings
      } catch (error) {
        if (_alert) {
          let message = `${this.$t("alerts.mappingNotSaved", [jskos.prefLabel(registry, { fallbackToUri: false })])} ${this.getErrorMessage(error)}`
          this.alert(message, null, "danger")
        }
        _after && _after(error)
        throw error
      }
    },
    async putMapping({ registry, _adjust = true, _reload = true, _alert = true, _before, _after, ...config }) {
      registry = this.getRegistry(registry || config.mapping._registry)
      if (!registry) {
        throw new Error("putMapping: No registry to put mapping to.")
      }
      _before && _before()
      try {
        config.mapping = this.prepareMapping(config.mapping)
        this._addIdentityParams(config)
        const mapping = await registry.putMapping(config)
        if (_adjust) {
          this.adjustMapping(mapping)
        }
        if (_reload) {
          this.$store.commit("mapping/setRefresh", { registry: registry.uri })
        }
        if (_alert) {
          this.alert(this.$t("alerts.mappingSaved", [jskos.prefLabel(registry, { fallbackToUri: false })]), null, "success")
        }
        _after && _after()
        return mapping
      } catch (error) {
        if (_alert) {
          const message = `${this.$t("alerts.mappingNotSaved", [jskos.prefLabel(registry, { fallbackToUri: false })])} ${this.getErrorMessage(error)}`
          this.alert(message, null, "danger")
        }
        _after && _after(error)
        throw error
      }
    },
    async deleteMapping({ registry, _reload = true, _alert = true, _trash = true, _before, _after, ...config }) {
      registry = this.getRegistry(registry || config.mapping._registry)
      if (!registry) {
        throw new Error("deleteMapping: No registry to delete mapping from.")
      }
      _before && _before()
      try {
        await registry.deleteMapping(config)
        this.mappingWasDeleted({ mapping: config.mapping, registry, _trash })
        if (_reload) {
          this.$store.commit("mapping/setRefresh", { registry: registry.uri })
        }
        if (_alert) {
          this.alert(this.$t("alerts.mappingDeleted", [jskos.prefLabel(registry, { fallbackToUri: false })]), null, "success", this.$t("general.undo"), alert => {
            // Hide alert
            this.$store.commit({ type: "alerts/setCountdown", alert, countdown: 0 })
            this.$store.dispatch({ type: "mapping/restoreMappingFromTrash", uri: config.mapping.uri }).then(success => {
              if (success) {
                this.alert(this.$t("alerts.mappingRestored", [jskos.prefLabel(registry, { fallbackToUri: false })]), null, "success")
              } else {
                this.alert(this.$t("alerts.mappingNotRestored", [jskos.prefLabel(registry, { fallbackToUri: false })]), null, "danger")
              }
            })
          })
        }
        _after && _after()
        return true
      } catch (error) {
        if (_alert) {
          const message = `${this.$t("alerts.mappingNotDeleted", [jskos.prefLabel(registry, { fallbackToUri: false })])} ${this.getErrorMessage(error)}`
          this.alert(message, null, "danger")
        }
        _after && _after(error)
        throw error
      }
    },
    async deleteMappings({ registry, _reload = true, _alert = true, _trash = true, _before, _after, ...config }) {
      registry = this.getRegistry(registry || _.get(config, "mappings[0]._registry"))
      if (!registry) {
        throw new Error("deleteMapping: No registry to delete mapping from.")
      }
      _before && _before()
      try {
        await registry.deleteMappings(config)
        for (let mapping of config.mappings) {
          this.mappingWasDeleted({ mapping, registry, _trash })
        }
        if (_reload) {
          this.$store.commit("mapping/setRefresh", { registry: registry.uri })
        }
        if (_alert) {
          // TODO: Adjust!
          this.alert(this.$t("alerts.mappingDeleted", [jskos.prefLabel(registry, { fallbackToUri: false })]), null, "success", this.$t("general.undo"), alert => {
            // Hide alert
            this.$store.commit({ type: "alerts/setCountdown", alert, countdown: 0 })
            this.$store.dispatch({ type: "mapping/restoreMappingFromTrash", uri: config.mapping.uri }).then(success => {
              if (success) {
                this.alert(this.$t("alerts.mappingRestored", [jskos.prefLabel(registry, { fallbackToUri: false })]), null, "success")
              } else {
                this.alert(this.$t("alerts.mappingNotRestored", [jskos.prefLabel(registry, { fallbackToUri: false })]), null, "danger")
              }
            })
          })
        }
        _after && _after()
        return true
      } catch (error) {
        if (_alert) {
          const message = `${this.$t("alerts.mappingNotDeleted", [jskos.prefLabel(registry, { fallbackToUri: false })])} ${this.getErrorMessage(error)}`
          this.alert(message, null, "danger")
        }
        _after && _after(error)
        throw error
      }
    },
    mappingWasDeleted({ mapping, registry, _trash }) {
      // 1. Add mapping to trash
      if (_trash) {
        this.$store.commit({
          type: "mapping/addToTrash",
          mapping,
          registry,
        })
      }
      // 2. Check if current original was amongst the removed mappings
      if (mapping.uri == this.$store.state.mapping.original.uri && jskos.compare(registry, this.$store.state.mapping.original.registry)) {
        // Set original to null
        this.$store.commit({ type: "mapping/set" })
      }
      // 3. Adjust __MAPPED__ property of conceps in mapping
      if (jskos.mappingRegistryIsStored(registry)) {
        for (let [from, to] of [["from", "to"], ["to", "from"]]) {
          const targetScheme = getItem(mapping[`${to}Scheme`])
          const sourceConcepts = getItems(jskos.conceptsOfMapping(mapping, from))
          if (targetScheme) {
            for (let concept of sourceConcepts) {
              const existing = (concept.__MAPPED__ || []).find(item => jskos.compare(item.registry, registry) && jskos.compare(item.scheme, targetScheme))
              if (!existing || !existing.exist.length) {
                continue
              }
              this.$set(existing, "exist", existing.exist.filter(uri => uri != mapping.uri))
            }
          }
        }
      }
    },
    canCreateMapping({ registry, mapping, user = this.user }) {
      if (!mapping || !registry) {
        return false
      }
      // Check multiple things regarding fromScheme/toScheme
      for (let side of ["fromScheme", "toScheme"]) {
        // Require both sides
        if (!mapping[side]) {
          return false
        }
        // Check registry whitelist
        const whitelist = _.get(registry, `config.mappings.${side}Whitelist`)
        if (whitelist) {
          if (!whitelist.find(s => jskos.compare(s, mapping[side]))) {
            return false
          }
        }
        // Check cardinality
        const cardinality = _.get(registry, "config.mappings.cardinality")
        if (cardinality == "1-to-1" && jskos.conceptsOfMapping(mapping, "to").length > 1) {
          return false
        }
      }
      // Check if user is authorized in current registry
      if (!registry.isAuthorizedFor({
        type: "mappings",
        action: "create",
        user,
      })) {
        return false
      }
      return true
    },
    canUpdateMapping({ registry, mapping, user = this.user }) {
      if (!mapping) {
        return false
      }
      registry = registry || mapping._registry
      if (!registry) {
        return false
      }
      return registry.isAuthorizedFor({
        type: "mappings",
        action: "update",
        user,
        crossUser: !this.$jskos.userOwnsMapping(user, mapping),
      })
    },
    canDeleteMapping({ registry, mapping, user = this.user }) {
      if (!mapping) {
        return false
      }
      registry = registry || mapping._registry
      if (!registry) {
        return false
      }
      let crossUser = !jskos.userOwnsMapping(user, mapping)
      return registry.isAuthorizedFor({
        type: "mappings",
        action: "delete",
        user,
        crossUser,
      })
    },
    // Wrapper around cdk.repeat
    repeat(...params) {
      return cdk.repeat(...params)
    },
  },
}
