<template>
  <flexible-table
    :items="items"
    :fields="fields">
    <span
      slot="registry"
      slot-scope="{ value }">
      <registry-notation
        :registry="value"
        :tooltip="false" />
    </span>
    <span
      slot="sourceConcepts"
      slot-scope="{ value }">
      <item-name
        v-for="concept in value"
        :key="concept.uri"
        :item="concept"
        :show-text="showLabels"
        :is-link="false"
        :is-highlighted="false"
        @mouseover.native="() => null"
        @click.native="() => null" />
    </span>
    <span
      slot="targetConcepts"
      slot-scope="{ value }">
      <span
        v-for="concept in value"
        :key="concept.uri">
        <item-name
          :item="concept"
          :show-text="showLabels"
          :is-link="false"
          :is-highlighted="false"
          @mouseover.native="() => null"
          @click.native="() => null" />
        <br>
      </span>
    </span>
    <span
      slot="type"
      slot-scope="{ value }">
      <span
        v-if="value != null"
        v-b-tooltip.hover="{ title: $jskos.prefLabel(value), delay: defaults.delay.medium }">
        {{ $jskos.notation(value) }}
      </span>
    </span>
    <span
      slot="actions"
      slot-scope="data">
      <font-awesome-icon
        v-for="(action, index) in actions"
        :key="index"
        v-b-tooltip.hover="{ title: action.title, delay: defaults.delay.medium, placement: 'left' }"
        :icon="action.icon"
        class="button"
        @click="$emit('click', { name: action.name, item: data.item })" />
    </span>
    <span
      slot="HEAD_actions" />
  </flexible-table>
</template>

<script>
import ItemName from "./ItemName.vue"
import RegistryNotation from "./RegistryNotation.vue"
import _ from "lodash"

export default {
  name: "MappingTable",
  components: { ItemName, RegistryNotation },
  props: {
    /**
     * The list of mappings to be displayed.
     */
    mappings: {
      type: Array,
      default: () => [],
    },
    /**
     * Whether to hide duplicate mappings.
     *
     * Switch to false to make sure that pagination works.
     */
    hideDuplicates: {
      type: Boolean,
      default: true,
    },
    /**
     *
     */
    actions: {
      type: Array,
      default: () => [],
    },
    /**
     * Whether to show the concepts' labels
     */
    showLabels: {
      type: Boolean,
      default: false,
    },
    /**
     * Whether to show the mapping registry.
     */
    showRegistry: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {

    }
  },
  computed: {
    /**
     * List of fields (columns) to be used in bootstrap table
     */
    fields() {
      let fields = [
        {
          key: "sourceScheme",
          label: "",
          width: "8%",
          minWidth: "",
          sortable: false,
        },
        {
          key: "sourceConcepts",
          label: this.$t("mappingBrowser.from"),
          width: "19%",
          minWidth: "",
          sortable: false,
          compare: (a, b) => this.$jskos.compareFunctions.mappingsByConcepts(a.mapping, b.mapping, "from"),
        },
        {
          key: "type",
          label: "",
          width: "7%",
          minWidth: "",
          sortable: false,
          compare: (a ,b) => {
            let labelA = this.$jskos.prefLabel(_.get(a, "type"), { fallbackToUri: false })
            let labelB = this.$jskos.prefLabel(_.get(b, "type"), { fallbackToUri: false })
            if (labelA < labelB) {
              return -1
            }
            if (labelA > labelB) {
              return 1
            }
            return 0
          },
        },
        {
          key: "targetScheme",
          label: "",
          width: "8%",
          minWidth: "",
          sortable: false,
        },
        {
          key: "targetConcepts",
          label: this.$t("mappingBrowser.to"),
          width: "19%",
          minWidth: "",
          sortable: false,
          compare: (a, b) => this.$jskos.compareFunctions.mappingsByConcepts(a.mapping, b.mapping, "to"),
        },
        {
          key: "creator",
          label: this.$t("mappingBrowser.creator"),
          width: "15%",
          minWidth: "",
          sortable: false,
        },
        {
          key: "date",
          label: this.$t("mappingBrowser.date"),
          width: "12%",
          minWidth: "",
          sortable: false,
        },
        {
          key: "actions",
          label: "",
          width: "7%",
          minWidth: "",
          sortable: false,
        },
      ]
      if (this.showRegistry) {
        fields = [{
          key: "registry",
          label: "",
          width: "5%",
          minWidth: "",
          sortable: false,
        }].concat(fields)
      }
      return fields
    },
    /**
     * List of items to be used in bootstrap table
     */
    items() {
      let items = []
      let hashList = []
      // Save mappings
      for (let mapping of this.mappings) {
        // Filter duplicate mappings
        let hash = mapping.identifier ? mapping.identifier.find(id => id && id.startsWith("urn:jskos:mapping:content:")) : null
        if (!this.hideDuplicates || !hash || !hashList.includes(hash)) {
          let item = {}
          item.mapping = mapping
          if (this.showRegistry) {
            item.registry = mapping._registry
          }
          item.sourceScheme = this.$jskos.notation(mapping.fromScheme)
          item.targetScheme = this.$jskos.notation(mapping.toScheme)
          item.sourceConcepts = mapping.from.memberSet || mapping.from.memberChoice
          item.targetConcepts = mapping.to.memberSet || mapping.to.memberChoice
          item.creator = mapping.creator && mapping.creator[0] || "?"
          if (typeof item.creator === "object") {
            item.creator = this.$jskos.prefLabel(item.creator)
          }
          item.type = this.$jskos.mappingTypeByType(mapping.type)
          item.date = mapping.modified || mapping.created
          item.date = item.date && item.date.slice(0, 10)
          items.push(item)
          hashList.push(hash)
        }
      }
      return items
    },
  },
  watch: {

  },
  methods: {

  },
}
</script>

<style lang="less" scoped>
@import "../style/colors.css";

.button {
  cursor: pointer;
  user-select: none;
  color: var(--color-button);
}
.button:hover {
  color: var(--color-button-hover);
}
svg.button {
  margin-left: 2px;
}
</style>
