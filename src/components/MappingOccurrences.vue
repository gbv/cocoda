<template>
  <div
    id="mappingOccurrences"
    :style="{ flex: flex }">
    <div class="defaultTableWrapper">
      <b-table
        ref="occurrencesTable"
        :items="items"
        :fields="fields"
        class="defaultTable"
        small
        thead-class="defaultTableHead"
        tbody-class="defaultTableBody" />
    </div>
  </div>
</template>

<script>
import axios from "axios"

/**
 * The mapping occurrences component.
 */
export default {
  name: "MappingOccurrences",
  props: {
    /**
     * The height of the component as a flex value.
     */
    flex: {
      type: Number,
      default: 1
    },
    /**
     * The selected concept from the left hand concept browser.
     */
    selectedLeft: {
      type: Object,
      default: null
    },
    /**
     * The selected concept from the right hand concept browser.
     */
    selectedRight: {
      type: Object,
      default: null
    },
    /**
     * The selected scheme from the left hand concept browser.
     */
    schemeLeft: {
      type: Object,
      default: null
    },
    /**
     * The selected scheme from the right hand concept browser.
     */
    schemeRight: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      leftResult: null,
      rightResult: null,
      mapping: this.$root.$data.mapping
    }
  },
  computed: {
    items() {
      let items = []
      let intermediateItems = []
      // Add selected concepts
      // TODO: - Scheme for selected concept might differ from scheme for mapping.
      if (!this.mapping.reversed) {
        intermediateItems.push({
          concept: this.selectedLeft,
          type: "from",
          _rowVariant: "info"
        }, {
          concept: this.selectedRight,
          type: "to",
          _rowVariant: "success"
        })
      } else {
        intermediateItems.push({
          concept: this.selectedRight,
          type: "from",
          _rowVariant: "success"
        }, {
          concept: this.selectedLeft,
          type: "to",
          _rowVariant: "info"
        })
      }
      for (let concept of this.mapping.jskos.from.memberSet) {
        if ((!this.selectedLeft || this.selectedLeft.uri != concept.uri) && (!this.selectedRight || this.selectedRight.uri != concept.uri)) {
          intermediateItems.push({
            concept: concept,
            type: "from"
          })
        }
      }
      for (let concept of this.mapping.jskos.to.memberSet) {
        if ((!this.selectedLeft || this.selectedLeft.uri != concept.uri) && (!this.selectedRight || this.selectedRight.uri != concept.uri)) {
          intermediateItems.push({
            concept: concept,
            type: "to"
          })
        }
      }
      for (let item of intermediateItems) {
        if (item.concept == null) {
          continue
        }
        if (item.concept.OCCURRENCES == null) {
          this.loadOccurrences(item.concept)
        }
        items.push({
          occurrences: this.occurrencesToString(item.concept.OCCURRENCES),
          _rowVariant: item._rowVariant ? item._rowVariant : ""
        })
        items[items.length-1][item.type] = item.concept.notation[0]
      }
      return items
    },
    fields() {
      let fromSchemeSelected = this.mapping.reversed ? this.schemeRight : this.schemeLeft
      let fromSchemeLabel =
        this.mapping.jskos.fromScheme ?
          this.mapping.jskos.fromScheme.notation[0].toUpperCase() :
          (fromSchemeSelected ? fromSchemeSelected.notation[0].toUpperCase() : "-")
      let toSchemeSelected = this.mapping.reversed ? this.schemeLeft : this.schemeRight
      let toSchemeLabel =
        this.mapping.jskos.toScheme ?
          this.mapping.jskos.toScheme.notation[0].toUpperCase() :
          (toSchemeSelected ? toSchemeSelected.notation[0].toUpperCase() : "-")
      return [
        {
          key: "from",
          label: fromSchemeLabel,
          tdClass: "moColWide",
          thClass: "moColWide"
        },
        {
          key: "to",
          label: toSchemeLabel,
          tdClass: "moColWide",
          thClass: "moColWide"
        },
        {
          key: "occurrences",
          tdClass: "moColShort",
          thClass: "moColShort"
        }
      ]
    }
  },
  methods: {
    loadOccurrences(concept) {
      axios.get("//coli-conc.gbv.de/occurrences/api/", {
        params: {
          members: concept.uri
        }
      }).then(function(response) {
        concept.OCCURRENCES = response.data.length > 0 ? response.data[0].count : -1
      }).catch(function(error) {
        console.log(error)
        concept.OCCURRENCES = -1
      })
    },
    occurrencesToString(occurrences) {
      if (occurrences == null) {
        return "..."
      } else if (occurrences == -1) {
        return "-"
      } else {
        return occurrences
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingOccurrences {
  height: 0;
  display: flex;
  flex-direction: column;
}

</style>

<style>
.moColWide {
  width: 200px;
  min-width: 200px;
}
.moColShort {
  width: 150px;
  min-width: 100px;
}
</style>

