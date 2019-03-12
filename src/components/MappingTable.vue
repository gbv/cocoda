<template>
  <flexible-table
    :items="items"
    :fields="fields">
    <span
      slot="sourceConcepts"
      slot-scope="{ value }" >
      <item-name
        v-for="concept in value"
        :key="concept.uri"
        :item="concept"
        :show-text="showLabels"
        :show-tooltip="showTooltip"
        :is-link="false"
        :is-highlighted="false"
        @mouseover.native="() => null"
        @click.native="() => null" />
    </span>
    <span
      slot="targetConcepts"
      slot-scope="{ value }" >
      <span
        v-for="concept in value"
        :key="concept.uri">
        <item-name
          :item="concept"
          :show-text="showLabels"
          :show-tooltip="showTooltip"
          :is-link="false"
          :is-highlighted="false"
          @mouseover.native="() => null"
          @click.native="() => null" />
        <br>
      </span>
    </span>
    <span
      slot="type"
      slot-scope="{ value }" >
      <span
        v-b-tooltip.hover="{ title: $util.prefLabel(value), delay: $util.delay.medium }"
        v-if="value != null" >
        {{ $util.notation(value) }}
      </span>
    </span>
    <span
      slot="actions"
      slot-scope="data" >
      <font-awesome-icon
        v-b-tooltip.hover="{ title: action.title, delay: $util.delay.medium }"
        v-for="(action, index) in actions"
        :key="index"
        :icon="action.icon"
        class="button"
        @click="$emit('click', { name: action.name, item: data.item })" />
    </span>
    <span
      slot="HEAD_actions" />
  </flexible-table>
</template>

<script>
import ItemName from "./ItemName"
import FlexibleTable from "vue-flexible-table"

export default {
  name: "MappingTable",
  components: { ItemName, FlexibleTable },
  props: {
    /**
     * The list of mappings to be displayed.
     */
    mappings: {
      type: Array,
      default: () => []
    },
    /**
     * Whether to hide duplicate mappings.
     *
     * Switch to false to make sure that pagination works.
     */
    hideDuplicates: {
      type: Boolean,
      default: true
    },
    /**
     *
     */
    actions: {
      type: Array,
      default: () => []
    },
    /**
     * Whether to show a tooltip with prefLabels for concepts.
     */
    showTooltip: {
      type: Boolean,
      default: true
    },
    /**
     * Whether to show the concepts' labels
     */
    showLabels: {
      type: Boolean,
      default: false
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
      return [
        {
          key: "sourceScheme",
          label: "",
          width: "10%",
          minWidth: "",
          sortable: false
        },
        {
          key: "sourceConcepts",
          label: "from",
          width: "22%",
          minWidth: "",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "from")
        },
        {
          key: "type",
          label: "",
          width: "8%",
          minWidth: "",
          sortable: false,
          compare: (a ,b) => {
            let labelA = _.get(a, "type.prefLabel.en", "")
            let labelB = _.get(b, "type.prefLabel.en", "")
            if (labelA < labelB) {
              return -1
            }
            if (labelA > labelB) {
              return 1
            }
            return 0
          }
        },
        {
          key: "targetScheme",
          label: "",
          width: "10%",
          minWidth: "",
          sortable: false
        },
        {
          key: "targetConcepts",
          label: "to",
          width: "22%",
          minWidth: "",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to")
        },
        {
          key: "creator",
          label: "creator",
          width: "20%",
          minWidth: "",
          sortable: false
        },
        {
          key: "actions",
          label: "",
          width: "8%",
          minWidth: "",
          sortable: false
        }
      ]
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
        let hash = mapping.identifier ? mapping.identifier.find(id => id.startsWith("urn:jskos:mapping:content:")) : null
        if (!this.hideDuplicates || !hash || !hashList.includes(hash)) {
          let item = {}
          item.mapping = mapping
          item.sourceScheme = this.$util.notation(mapping.fromScheme)
          item.targetScheme = this.$util.notation(mapping.toScheme)
          item.sourceConcepts = mapping.from.memberSet || mapping.from.memberChoice
          item.targetConcepts = mapping.to.memberSet || mapping.to.memberChoice
          item.creator = mapping.creator && mapping.creator[0] || "?"
          if (typeof item.creator === "object") {
            item.creator = item.creator.prefLabel.de || item.creator.prefLabel.en || "?"
          }
          item.type = this.$jskos.mappingTypeByType(mapping.type)
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

  }
}
</script>

<style lang="less" scoped>
@import "../style/colors.less";

.button {
  cursor: pointer;
  user-select: none;
  color: @color-button;
}
.button:hover {
  color: @color-button-hover;
}
svg.button {
  margin-left: 2px;
}
</style>
