<template>
  <div id="mappingBrowser">
    <minimizer text="Mapping Browser" />
    <div
      v-show="schemeLeft != null || schemeRight != null"
      id="mappingBrowserWrapper">
      <div
        v-if="items.length > 0"
        class="defaultTableWrapper">
        <b-table
          ref="occurrencesTable"
          :items="items"
          :fields="fields"
          class="defaultTable"
          small
          thead-class="defaultTableHead"
          tbody-class="defaultTableBody">
          <span
            slot="sourceConcepts"
            slot-scope="data">
            <item-name
              v-for="concept in data.value"
              :key="concept.uri"
              :item="concept"
              :show-text="false"
              :show-tooltip="true"
              :is-link="$util.canConceptBeSelected(concept, schemeLeft)"
              :is-highlighted="$util.compareConcepts(concept, selectedLeft)"
              @mouseover.native="hover(concept)"
              @click.native="$util.canConceptBeSelected(concept, schemeLeft) && chooseUri(concept, true)" />
          </span>
          <span
            slot="targetConcepts"
            slot-scope="data">
            <item-name
              v-for="concept in data.value"
              :key="concept.uri"
              :item="concept"
              :show-text="false"
              :show-tooltip="true"
              :is-link="$util.canConceptBeSelected(concept, schemeRight)"
              :is-highlighted="$util.compareConcepts(concept, selectedRight)"
              @mouseover.native="hover(concept)"
              @click.native="$util.canConceptBeSelected(concept, schemeRight) && chooseUri(concept, false)" />
          </span>
          <span
            slot="type"
            slot-scope="data">
            <span
              v-b-tooltip.hover="{ title: data.value.prefLabel.en, delay: $util.delay.medium }"
              v-if="data.value != null">
              {{ data.value.notation[0] }}
            </span>
          </span>
          <span
            slot="actions"
            slot-scope="data">
            <font-awesome-icon
              v-b-tooltip.hover="{ title: 'edit mapping', delay: $util.delay.medium }"
              icon="edit"
              class="editButton"
              @click="edit(data)" />
          </span>
          <span
            slot="HEAD_actions"
            slot-scope="data">
            <font-awesome-icon icon="toolbox" />
          </span>
        </b-table>
      </div>
      <div
        v-else
        class="noItems font-heavy">No mappings available
      </div>
      <div
        class="mappingToolbar">
        <div>
          <b-dropdown
            :text="selectedOption.label"
            dropup
            no-flip
            class="optionsDropdown">
            <b-dropdown-item-button
              v-for="option in mappingOptions"
              :key="option.id"
              :disabled="!option.showCondition(vm)"
              href="#"
              @click="selectedOption = option">
              {{ option.label }}
            </b-dropdown-item-button>
          </b-dropdown>
        </div>
        <div />
        <div style="text-align: right;">{{ items.length }} mappings</div>
      </div>
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName"
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"
import Minimizer from "./Minimizer"

/**
 * The mapping browser component.
 */
export default {
  name: "MappingBrowser",
  components: { ItemName, FontAwesomeIcon, Minimizer },
  props: {
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
      vm: this,
      columns: [],
      mapping: this.$root.$data.mapping,
      mappingOptions: {
        showAll: {
          id: "showAll",
          label: "Show All Mappings",
          showCondition() {
            return true
          }
        },
        showSelected: {
          id: "showSelected",
          label: "Show Only Mappings To Selected Scheme",
          showCondition(vm) {
            return vm.schemeLeft != null && vm.schemeRight != null
          }
        }
      },
      selectedOption: null
    }
  },
  computed: {
    items() {
      let items = []
      let conceptList = [
        {
          concept: this.selectedLeft,
          fromTo: "from"
        },
        {
          concept: this.selectedRight,
          fromTo: "to"
        }
      ]
      let hashList = []
      for (let conceptItem of conceptList) {
        if (conceptItem.concept == null) {
          continue
        }
        let mappings = conceptItem.concept.MAPPINGS
        if (mappings == null) {
          // Load mappings
          this.loadMappings(conceptItem)
        } else {
          // Save mappings
          for (let mapping of mappings) {
            // Filter duplicate mappings
            if (!hashList.includes(this.$util.mappingHash(mapping))) {
              let item = {}
              item.mapping = mapping
              item.sourceScheme = mapping.fromScheme.notation[0]
              item.targetScheme = mapping.toScheme.notation[0]
              item.sourceConcepts = mapping.from.memberSet || mapping.from.memberChoice
              item.targetConcepts = mapping.to.memberSet || mapping.to.memberChoice
              // Filter mappings depending on selected option
              if (this.selectedOption.id == this.mappingOptions.showSelected.id) {
                // Only show if source and target schemes match with selected schemes
                if(!this.$util.compareSchemes(mapping.fromScheme, this.schemeLeft) || !this.$util.compareSchemes(mapping.toScheme, this.schemeRight)) {
                  continue
                }
              }
              // Highlight if selected concepts are in mapping and add inScheme to each concept
              let leftInSource = false
              for (let concept of item.sourceConcepts) {
                if (this.selectedLeft && concept.uri == this.selectedLeft.uri) {
                  leftInSource = true
                }
                concept.inScheme = concept.inScheme || [mapping.fromScheme]
              }
              let rightInSource = false
              for (let concept of item.targetConcepts) {
                if (this.selectedRight && concept.uri == this.selectedRight.uri) {
                  rightInSource = true
                }
                concept.inScheme = concept.inScheme || [mapping.toScheme]
              }
              if (leftInSource && rightInSource) {
                item._rowVariant = "info"
              }
              item.creator = mapping.creator || "?"
              item.type = this.$util.mappingTypeByType(mapping.type)
              items.push(item)
              hashList.push(this.$util.mappingHash(mapping))
            }
          }
        }
      }
      return items
    },
    fields() {
      return [
        {
          key: "sourceScheme",
          label: "Scheme",
          tdClass: "mtColShort",
          thClass: "mtColShort",
          sortable: true
        },
        {
          key: "sourceConcepts",
          label: "Concept",
          tdClass: "mtColShort",
          thClass: "mtColShort",
          sortable: true
        },
        {
          key: "type",
          label: "",
          sortable: false
        },
        {
          key: "targetScheme",
          label: "Scheme",
          tdClass: "mtColShort",
          thClass: "mtColShort",
          sortable: true
        },
        {
          key: "targetConcepts",
          label: "Concept",
          tdClass: "mtColShort",
          thClass: "mtColShort",
          sortable: true
        },
        {
          key: "creator",
          tdClass: "mtColNormal",
          thClass: "mtColNormal",
          sortable: true
        },
        {
          key: "actions",
          label: "",
          sortable: false
        }
      ]
    }
  },
  created() {
    for (let i = 0; i < 30; i++) {
      // this.items.push(this.sampleItem)
    }
    // Set default selectedOption
    this.selectedOption = this.mappingOptions.showAll
  },
  mounted() {
    this.$util.setupTableScrollSync()
  },
  methods: {
    add() {
      this.items.push(this.sampleItem)
    },
    remove() {
      this.items.pop()
    },
    edit(data) {
      this.mapping.jskos = this.$util.deepCopy(data.item.mapping)
      // Make sure concept object references are in sync
      this.mapping.jskos.from.memberSet = data.item.mapping.from.memberSet.slice()
      if (this.mapping.jskos.to.memberSet) {
        this.mapping.jskos.to.memberSet = data.item.mapping.to.memberSet.slice()
      } else if (this.mapping.jskos.to.memberList) {
        this.mapping.jskos.to.memberList = data.item.mapping.to.memberList.slice()
      } else if (this.mapping.jskos.to.memberChoice) {
        this.mapping.jskos.to.memberChoice = data.item.mapping.to.memberChoice.slice()
      }
      // Load concept prefLabel for each concept in mapping if necessary
      for (let concept of [].concat(this.mapping.jskos.from.memberSet, this.mapping.jskos.to.memberSet, this.mapping.jskos.to.memberList, this.mapping.jskos.to.memberChoice)) {
        this.hover(concept)
      }
    },
    hover(concept) {
      if(concept && !concept.prefLabel) {
        // Load prefLabel to be shown as tooltip
        if (!concept.inScheme || concept.inScheme.length == 0) {
          // TODO: - Error handling
          console.warn("No scheme for", concept)
          return
        }

        this.$api.objects.get(concept.uri, concept.inScheme[0].uri).then(result => {
          if (result && result.prefLabel) {
            this.$set(concept, "prefLabel", result.prefLabel)
          } else {
            // TODO: - Error handling
            this.$set(concept, "prefLabel", { de: " " })
          }
        })
      }
    },
    loadMappings(conceptItem) {
      // Get mappings
      let params = {}
      let concept = conceptItem.concept
      params[conceptItem.fromTo] = concept.uri
      this.$api.mappings(params).then(data => {
        concept.MAPPINGS = data
      }).catch(function(error) {
        console.error("API error (mappings):", error)
      })
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingBrowser {
  position: relative;
  display: flex;
}
#mappingBrowserWrapper {
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
}
.noItems {
  margin: 30px auto 5px auto;
}
.noItems {
  flex: 5 0 auto;
}
.mappingToolbar {
  margin: 0 10px;
  display: flex;
}
.mappingToolbar > div {
  width: 0;
  flex: 1;
}

.editButton {
  font-size: 12px;
  color: @buttonColor;
  user-select: none;
  cursor: pointer;
  &:hover {
    color: @buttonColorHover;
  }
}

</style>

<style lang="less">
@import "../style/main.less";

@table-cell-width: 120px;
@table-cell-width-short: 70px;
@table-cell-width-wide: 160px;
.mtColNormal {
  width: @table-cell-width * 3;
  min-width: @table-cell-width;
}
.mtColShort {
  width: @table-cell-width-short * 3;
  min-width: @table-cell-width-short;
}
.mtColWide {
  width: @table-cell-width-wide * 3;
  min-width: @table-cell-width-wide;
}

.table-info {
  background-color: @color-primary-1 !important;
  & > td, & > td {
    background-color: @color-primary-1 !important;
  }
}

// Overwriting bootstrap styles has to be done in global scope
.optionsDropdown {
  user-select: none;
  & > .btn {
    &:extend(.font-size-small);
    padding: 0.1rem 0.4rem;
    margin-bottom: 2px;
    background-color: @buttonColor;
    border-color: @buttonColor;
  }

  & > .dropdown-menu {
    &:extend(.font-size-small);
  }
}
</style>
