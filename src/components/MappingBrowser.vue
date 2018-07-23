<template>
  <div id="mappingBrowser">
    <!-- Minimizer allows component to get minimized -->
    <minimizer text="Mapping Browser" />
    <div
      v-show="selected.scheme[true] != null || selected.scheme[false] != null"
      id="mappingBrowserWrapper" >
      <div
        v-if="items.length > 0"
        class="table-wrapper" >
        <!-- Mapping table -->
        <b-table
          ref="occurrencesTable"
          :items="items"
          :fields="fields"
          class="table"
          small
          thead-class="table-head"
          tbody-class="table-body" >
          <span
            slot="sourceConcepts"
            slot-scope="data" >
            <item-name
              v-for="concept in data.value"
              :key="concept.uri"
              :item="concept"
              :show-text="false"
              :show-tooltip="true"
              :is-link="$util.canConceptBeSelected(concept, selected.scheme[true])"
              :is-highlighted="$util.compareConcepts(concept, selected.concept[true])"
              @mouseover.native="hover(concept)"
              @click.native="$util.canConceptBeSelected(concept, selected.scheme[true]) && setSelected('concept', true, concept)" />
          </span>
          <span
            slot="targetConcepts"
            slot-scope="data" >
            <item-name
              v-for="concept in data.value"
              :key="concept.uri"
              :item="concept"
              :show-text="false"
              :show-tooltip="true"
              :is-link="$util.canConceptBeSelected(concept, selected.scheme[false])"
              :is-highlighted="$util.compareConcepts(concept, selected.concept[false])"
              @mouseover.native="hover(concept)"
              @click.native="$util.canConceptBeSelected(concept, selected.scheme[false]) && setSelected('concept', false, concept)" />
          </span>
          <span
            slot="type"
            slot-scope="data" >
            <span
              v-b-tooltip.hover="{ title: data.value.prefLabel.en, delay: $util.delay.medium }"
              v-if="data.value != null" >
              {{ data.value.notation[0] }}
            </span>
          </span>
          <span
            slot="actions"
            slot-scope="data" >
            <div class="mappingBrowserActions">
              <font-awesome-icon
                v-b-tooltip.hover="{ title: 'edit mapping', delay: $util.delay.medium }"
                icon="edit"
                class="button editButton"
                @click="edit(data)" />
              <font-awesome-icon
                v-b-tooltip.hover="{ title: 'delete mapping', delay: $util.delay.medium }"
                v-if="data.item.mapping.LOCAL"
                icon="trash-alt"
                class="button editButton"
                @click="removeMapping(data.item.mapping)"
              />
            </div>
          </span>
          <span
            slot="HEAD_actions"
            slot-scope="data" >
            <font-awesome-icon icon="toolbox" />
          </span>
        </b-table>
      </div>
      <div
        v-else-if="loading == 0"
        class="noItems fontWeight-heavy" >
        No mappings available
      </div>
      <!-- Mapping toolbar for options and infos -->
      <div
        v-if="loading == 0"
        class="mappingToolbar" >
        <div>
          <!-- Option dropdown menu -->
          <b-dropdown
            :text="selectedOption.label"
            dropup
            no-flip
            class="optionsDropdown" >
            <b-dropdown-item-button
              v-for="option in mappingOptions"
              :key="option.id"
              :disabled="!option.showCondition(vm)"
              href="#"
              @click="selectedOption = option" >
              {{ option.label }}
            </b-dropdown-item-button>
          </b-dropdown>
        </div>
        <div />
        <!-- Number of mappings in the table -->
        <div style="text-align: right;">
          {{ items.length }} mappings
          <font-awesome-icon
            v-b-tooltip.hover="{ title: 'refresh mappings', delay: $util.delay.medium }"
            icon="sync-alt"
            class="button"
            @click="refreshMappings"
          />
        </div>
      </div>
    </div>
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loading" />
  </div>
</template>

<script>
import ItemName from "./ItemName"
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"
import Minimizer from "./Minimizer"
import LoadingIndicatorFull from "./LoadingIndicatorFull"

/**
 * The mapping browser component.
 */
export default {
  name: "MappingBrowser",
  components: { ItemName, FontAwesomeIcon, Minimizer, LoadingIndicatorFull },
  data () {
    return {
      /** A separate reference to this (FIXME: Can this be removed?) */
      vm: this,
      loading: 0,
      /** Available options for mapping options */
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
            return vm.selected.scheme[true] != null && vm.selected.scheme[false] != null
          }
        }
      },
      /** Currently selected option */
      selectedOption: null
    }
  },
  computed: {
    /**
     * List of items to be used in bootstrap table
     */
    items() {
      let items = []
      let conceptList = [
        {
          concept: this.selected.concept[true],
          fromTo: "from"
        },
        {
          concept: this.selected.concept[false],
          fromTo: "to"
        }
      ]
      let hashList = []
      for (let conceptItem of conceptList) {
        if (conceptItem.concept == null) {
          continue
        }
        let mappings = conceptItem.concept.MAPPINGS ? conceptItem.concept.MAPPINGS[conceptItem.fromTo] : null
        if (mappings == null) {
          // Load mappings
          this.loadMappings(conceptItem)
        } else {
          // Save mappings
          for (let mapping of mappings) {
            // Filter duplicate mappings
            let hash = mapping.identifier ? mapping.identifier.find(id => id.startsWith("urn:jskos:mapping:content:")) : null
            if (!hash || !hashList.includes(hash)) {
              let item = {}
              item.mapping = mapping
              item.sourceScheme = mapping.fromScheme.notation[0]
              item.targetScheme = mapping.toScheme.notation[0]
              item.sourceConcepts = mapping.from.memberSet || mapping.from.memberChoice
              item.targetConcepts = mapping.to.memberSet || mapping.to.memberChoice
              // Filter mappings depending on selected option
              if (this.selectedOption.id == this.mappingOptions.showSelected.id) {
                // Only show if source and target schemes match with selected schemes
                if(!this.$util.compareSchemes(mapping.fromScheme, this.selected.scheme[true]) || !this.$util.compareSchemes(mapping.toScheme, this.selected.scheme[false])) {
                  continue
                }
              }
              // Highlight if selected concepts are in mapping and add inScheme to each concept
              let leftInSource = false
              for (let concept of item.sourceConcepts) {
                if (this.selected.concept[true] && concept.uri == this.selected.concept[true].uri) {
                  leftInSource = true
                }
                concept.inScheme = concept.inScheme || [mapping.fromScheme]
              }
              let rightInSource = false
              for (let concept of item.targetConcepts) {
                if (this.selected.concept[false] && concept.uri == this.selected.concept[false].uri) {
                  rightInSource = true
                }
                concept.inScheme = concept.inScheme || [mapping.toScheme]
              }
              if (leftInSource && rightInSource) {
                item._rowVariant = "info"
              }
              item.creator = mapping.creator && mapping.creator[0] || "?"
              item.type = this.$util.mappingTypeByType(mapping.type)
              items.push(item)
              hashList.push(hash)
            }
          }
        }
      }
      return items
    },
    /**
     * List of fields (columns) to be used in bootstrap table
     */
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
    },
    needsRefresh() {
      return this.$store.state.mapping.mappingsNeedRefresh
    }
  },
  watch: {
    needsRefresh(refresh) {
      if (refresh) {
        this.refreshMappings()
        this.$store.commit("mapping/setRefresh", false)
      }
    }
  },
  created() {
    // Set default selectedOption
    this.selectedOption = this.mappingOptions.showAll
  },
  mounted() {
    this.$util.setupTableScrollSync()
  },
  methods: {
    edit(data) {
      let mapping = this.$util.deepCopy(data.item.mapping)
      // Make sure concept object references are in sync
      mapping.from.memberSet = data.item.mapping.from.memberSet.slice()
      if (mapping.to.memberSet) {
        mapping.to.memberSet = data.item.mapping.to.memberSet.slice()
      } else if (mapping.to.memberList) {
        mapping.to.memberList = data.item.mapping.to.memberList.slice()
      } else if (mapping.to.memberChoice) {
        mapping.to.memberChoice = data.item.mapping.to.memberChoice.slice()
      }
      // Load concept prefLabel for each concept in mapping if necessary
      for (let concept of [].concat(mapping.from.memberSet, mapping.to.memberSet, mapping.to.memberList, mapping.to.memberChoice)) {
        this.hover(concept)
      }
      // Save mapping
      this.$store.commit({
        type: "mapping/set",
        mapping
      })
    },
    hover(concept) {
      if(concept && !concept.prefLabel) {
        // Load prefLabel to be shown as tooltip
        if (!concept.inScheme || concept.inScheme.length == 0) {
          // TODO: - Error handling
          console.warn("No scheme for", concept)
          return
        }

        this.getObject({ object: concept, scheme: concept.inScheme[0] }).then(result => {
          if (result && result.prefLabel) {
            this.$store.commit({
              type: "objects/set",
              object: concept,
              prop: "prefLabel",
              value: result.prefLabel
            })
          } else {
            // TODO: - Error handling
            this.$store.commit({
              type: "objects/set",
              object: concept,
              prop: "prefLabel",
              value: { de: " " }
            })
          }
        })
      }
    },
    loadMappings(conceptItem) {
      // Get mappings
      let params = {}
      let concept = conceptItem.concept
      params[conceptItem.fromTo] = concept.uri
      this.loading += 1
      this.$api.getMappings(params).then(data => {
        let mappings = concept.MAPPINGS
        if (!mappings) {
          // concept.MAPPINGS = { from: null, to: null }
          mappings =  { from: null, to: null }
        }
        mappings[conceptItem.fromTo] = data
        this.$store.commit({
          type: "objects/set",
          object: concept,
          prop: "MAPPINGS",
          value: mappings
        })
        this.loading -= 1
      }).catch(function(error) {
        console.error("API error (mappings):", error)
        this.loading -= 1
      })
    },
    removeMapping(mapping) {
      this.$api.removeMapping(mapping).then(success => {
        if (success) {
          this.alert("Mapping was deleted.", null, "success")
          this.$store.commit("mapping/setRefresh", true)
        } else {
          this.alert("Mapping could not be deleted.", null, "danger")
        }
      })
    },
    refreshMappings() {
      for (let concept of [this.selected.concept[true], this.selected.concept[false]]) {
        if (concept) {
          this.$store.commit({
            type: "objects/set",
            object: concept,
            prop: "MAPPINGS",
            value: null
          })
        }
      }
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

.mappingBrowserActions {
  display: flex;
  margin-top: 4px;
}
.editButton {
  font-size: 12px;
  margin: 0 2px;
  flex: 1;
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
}
.table-info > td, .table-info > td {
  background-color: @color-primary-1 !important;
}

// Overwriting bootstrap styles has to be done in global scope
.optionsDropdown {
  user-select: none;
}
.optionsDropdown > .btn {
  .fontSize-small;
  padding: 0.1rem 0.4rem;
  margin-bottom: 2px;
  background-color: @color-button;
  border-color: @color-button;
}
.optionsDropdown > .dropdown-menu {
  .fontSize-small;
}
</style>
