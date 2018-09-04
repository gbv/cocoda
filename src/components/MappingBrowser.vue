<template>
  <div id="mappingBrowser">
    <!-- Minimizer allows component to get minimized -->
    <minimizer text="Mapping Browser" />
    <div
      v-show="selected.scheme[true] != null || selected.scheme[false] != null"
      id="mappingBrowserWrapper" >
      <!-- Mapping table -->
      <flexible-table
        :items="items"
        :fields="fields"
        class="mappingBrowser-table"
        @hover="hoveredMapping = $event && $event.mapping" >
        <span
          slot="sourceConcepts"
          slot-scope="{ value }" >
          <item-name
            v-for="concept in value"
            :key="concept.uri"
            :item="concept"
            :show-text="false"
            :show-tooltip="true"
            :is-link="true"
            :is-highlighted="$jskos.compare(concept, selected.concept[true]) || $jskos.compare(concept, selected.concept[false])"
            @mouseover.native="hover(concept)"
            @click.native="setSelected('concept', true, concept)" />
        </span>
        <span
          slot="targetConcepts"
          slot-scope="{ value }" >
          <span
            v-for="concept in value"
            :key="concept.uri">
            <item-name
              :item="concept"
              :show-text="false"
              :show-tooltip="true"
              :is-link="true"
              :is-highlighted="$jskos.compare(concept, selected.concept[false]) || $jskos.compare(concept, selected.concept[true])"
              @mouseover.native="hover(concept)"
              @click.native="setSelected('concept', false, concept)" />
            <br>
          </span>
        </span>
        <span
          slot="type"
          slot-scope="{ value }" >
          <span
            v-b-tooltip.hover="{ title: value.prefLabel.en, delay: $util.delay.medium }"
            v-if="value != null" >
            {{ value.notation[0] }}
          </span>
        </span>
        <span
          slot="actions"
          slot-scope="data" >
          <font-awesome-icon
            v-b-tooltip.hover="{ title: 'edit mapping', delay: $util.delay.medium }"
            icon="edit"
            class="button mappingBrowser-toolbar-button"
            @click="edit(data)" />
          <font-awesome-icon
            v-b-tooltip.hover="{ title: 'delete mapping', delay: $util.delay.medium }"
            v-if="data.item.mapping.LOCAL"
            icon="trash-alt"
            class="button mappingBrowser-toolbar-button"
            @click="removeMapping(data.item.mapping)"
          />
        </span>
        <span
          slot="HEAD_actions"
          slot-scope="data" />
      </flexible-table>
      <div
        v-show="loading == 0 && items.length == 0"
        class="noItems fontWeight-heavy" >
        No mappings available
      </div>
      <!-- Mapping toolbar for options and infos -->
      <div
        v-if="loading == 0"
        class="mappingToolbar" >
        <div>
          <!-- Options -->
          <b-form-checkbox
            v-model="showAll"
            style="user-select: none;">
            all schemes
          </b-form-checkbox>
          <b-form-checkbox
            v-model="showOnlyLocal"
            style="user-select: none;">
            only local
          </b-form-checkbox>
          <b-form-checkbox
            v-model="showReverse"
            style="user-select: none;">
            both sides
          </b-form-checkbox>
        </div>
        <div style="flex: 1" />
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
import Minimizer from "./Minimizer"
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import FlexibleTable from "vue-flexible-table"

/**
 * The mapping browser component.
 */
export default {
  name: "MappingBrowser",
  components: { ItemName, Minimizer, LoadingIndicatorFull, FlexibleTable },
  data () {
    return {
      /** A separate reference to this (FIXME: Can this be removed?) */
      vm: this,
      loading: 0,
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
        let mappings = conceptItem.concept.MAPPINGS ? (conceptItem.concept.MAPPINGS.from || []).concat(conceptItem.concept.MAPPINGS.to || []) : null
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
              item.sourceScheme = mapping.fromScheme.notation[0].toUpperCase()
              item.targetScheme = mapping.toScheme.notation[0].toUpperCase()
              item.sourceConcepts = mapping.from.memberSet || mapping.from.memberChoice
              item.targetConcepts = mapping.to.memberSet || mapping.to.memberChoice
              // Filter mappings depending on option
              if (!this.showAll && this.selected.scheme[true] != null && this.selected.scheme[false] != null) {
                // Hide if schemes do not match at all
                if((!this.$jskos.compare(mapping.fromScheme, this.selected.scheme[true]) || !this.$jskos.compare(mapping.toScheme, this.selected.scheme[false])) && (!this.$jskos.compare(mapping.fromScheme, this.selected.scheme[false]) || !this.$jskos.compare(mapping.toScheme, this.selected.scheme[true]))) {
                  continue
                }
              }
              if (this.showOnlyLocal) {
                // Hide non-local mappings
                if (!mapping.LOCAL) {
                  continue
                }
              }
              if (!this.showReverse) {
                // Hide reverse mappings
                if (!this.$jskos.compare(mapping.fromScheme, this.selected.scheme[true]) && !this.$jskos.compare(mapping.toScheme, this.selected.scheme[false])) {
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
                item._rowClass = "mappingBrowser-table-row-match"
              }
              item.creator = mapping.creator && mapping.creator[0] || "?"
              if (typeof item.creator === "object") {
                item.creator = item.creator.prefLabel.de || item.creator.prefLabel.en || "?"
              }
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
          width: "10%",
          minWidth: "",
          sortable: true
        },
        {
          key: "sourceConcepts",
          label: "Concept",
          width: "22%",
          minWidth: "",
          sortable: true,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "from")
        },
        {
          key: "type",
          label: "Type",
          width: "8%",
          minWidth: "",
          sortable: true,
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
          label: "Scheme",
          width: "10%",
          minWidth: "",
          sortable: true
        },
        {
          key: "targetConcepts",
          label: "Concept",
          width: "22%",
          minWidth: "",
          sortable: true,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to")
        },
        {
          key: "creator",
          width: "20%",
          minWidth: "",
          sortable: true
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
    needsRefresh() {
      return this.$store.state.mapping.mappingsNeedRefresh
    },
    showAll: {
      get() {
        return this.$settings.mappingBrowserAllSchemes
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "mappingBrowserAllSchemes",
          value
        })
      }
    },
    showOnlyLocal: {
      get() {
        return this.$settings.mappingBrowserOnlyLocal
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "mappingBrowserOnlyLocal",
          value
        })
      }
    },
    showReverse: {
      get() {
        return this.$settings.mappingBrowserShowReverse
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "mappingBrowserShowReverse",
          value
        })
      }
    },
  },
  watch: {
    needsRefresh(refresh) {
      if (refresh) {
        this.refreshMappings()
        this.$store.commit("mapping/setRefresh", false)
      }
    }
  },
  mounted() {
    this.$util.setupTableScrollSync()
  },
  methods: {
    edit(data) {
      let mapping = this.$jskos.copyDeep(data.item.mapping)
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
        mapping,
        original: data.item.mapping
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
      let concept = conceptItem.concept
      let mappings = concept.MAPPINGS
      if (!mappings) {
        mappings =  { from: [], to: [] }
        // Save empty mappings to indicate that mappings are already loading.
        this.$store.commit({
          type: "objects/set",
          object: concept,
          prop: "MAPPINGS",
          value: mappings
        })
      } else if (mappings.from != null && mappings.to != null) {
        return
      }
      // Load mappings in both directions
      for (let fromTo of ["from", "to"]) {
        let params = {}
        params[fromTo] = concept.uri
        this.loading += 1
        this.$api.getMappings(params).then(data => {
          mappings[fromTo] = data
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
      }
    },
    removeMapping(mapping) {
      this.$api.removeMapping(mapping).then(success => {
        if (success) {
          this.alert("Mapping was deleted.", null, "success")
        } else {
          this.alert("Mapping could not be deleted.", null, "danger")
        }
        this.$store.commit("mapping/setRefresh", true)
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
.mappingBrowser-table {
  flex: 1;
}
.noItems {
  margin: 30px auto 5px auto;
  flex: 5 0 auto;
}
.mappingToolbar {
  margin: 0 10px;
  display: flex;
}
.mappingToolbar > div {
  flex: none;
}
.mappingBrowser-toolbar-button {
  font-size: 12px;
}

</style>

<style lang="less">
@import "../style/main.less";

.mappingBrowser-table-row-match {
  background-color: @color-primary-1;
}

</style>
