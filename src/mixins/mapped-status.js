/**
 * Mixin regarding mapped status for concepts.
 */

import { getItems } from "@/items"
import _ from "lodash"
import objects from "./cdk.js"

export default {
  mixins: [objects],
  computed: {
    loadConceptsMappedStatus() {
      return this.$store.state.settings.settings.components.ConceptListWrapper.loadConceptsMappedStatus
    },
    loadConceptsMappedStatusOtherScheme() {
      return _.isBoolean(this.isLeft) ? this.$store.state.selected.scheme[!this.isLeft] : null
    },
  },
  created() {
    this.loadMappingsForConcepts = _.debounce(this._loadMappingsForConcepts, 300)
  },
  watch: {
    loadConceptsMappedStatusConceptsToLoad() {
      this.loadMappingsForConcepts(this.loadConceptsMappedStatusConceptsToLoad || [])
    },
    currentRegistry() {
      this.loadMappingsForConcepts(this.loadConceptsMappedStatusConceptsToLoad || [])
    },
    loadConceptsMappedStatusOtherScheme() {
      this.loadMappingsForConcepts(this.loadConceptsMappedStatusConceptsToLoad || [])
    },
    loadConceptsMappedStatus() {
      this.loadMappingsForConcepts(this.loadConceptsMappedStatusConceptsToLoad || [])
    },
  },
  methods: {
    /**
     * Loads mappings for current items (in order to indicator whether it is mapped already).
     */
    _loadMappingsForConcepts(concepts) {
      // Don't load if disabled in settings
      if (!this.loadConceptsMappedStatus) {
        return
      }
      // TODO: Make sure to use items in store?
      const registry = this.currentRegistry
      const otherScheme = this.loadConceptsMappedStatusOtherScheme
      concepts = getItems(concepts.filter(concept => !_.get(concept, "__MAPPED__", []).find(item => this.$jskos.compare(item.registry, registry) && this.$jskos.compare(item.scheme, otherScheme))))
      const conceptUris = concepts.map(i => i.uri)
      if (otherScheme && conceptUris.length && registry) {
        Promise.all(_.chunk(conceptUris, 15).map(uris => this.getMappings({
          from: uris.join("|"),
          toScheme: otherScheme.uri,
          direction: "both",
          registry: registry.uri,
          limit: 500,
        }))).then(() => {
          // Set to false for every concept that still has no entry for current registry + other scheme
          for (let concept of concepts.filter(c => !_.get(c, "__MAPPED__", []).find(item => this.$jskos.compare(item.registry, registry) && this.$jskos.compare(item.scheme, otherScheme)))) {
            this.$set(concept, "__MAPPED__", [])
            concept.__MAPPED__.push({
              registry,
              scheme: otherScheme,
              exist: [],
            })
          }
        })
      }
    },
  },
}
