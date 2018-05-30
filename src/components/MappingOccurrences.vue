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
        striped
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
    selectedLeft: {
      type: Object,
      default: null
    },
    selectedRight: {
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
      for (let concept of this.mapping.jskos.from.memberSet) {
        if (concept.OCCURRENCES == null) {
          this.loadOccurrences(concept)
        }
        items.push({
          from: concept.notation[0],
          to: "-",
          occurrences: this.occurrencesToString(concept.OCCURRENCES)
        })
      }
      for (let concept of this.mapping.jskos.to.memberSet) {
        if (concept.OCCURRENCES == null) {
          this.loadOccurrences(concept)
        }
        items.push({
          from: "-",
          to: concept.notation[0],
          occurrences: this.occurrencesToString(concept.OCCURRENCES)
        })
      }
      return items
    },
    fields() {
      let fromSchemeLabel = this.mapping.jskos.fromScheme ? this.mapping.jskos.fromScheme.notation[0].toUpperCase() : "-"
      let toSchemeLabel = this.mapping.jskos.toScheme ? this.mapping.jskos.toScheme.notation[0].toUpperCase() : "-"
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

