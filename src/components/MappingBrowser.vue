<template>
  <div id="mappingBrowser">
    <b-tabs
      v-model="tab"
      pills
      justified>
      <b-tab
        title="Concordances">
        <template v-if="concordances && concordances.length">
          <div style="display: flex;">
            <div
              v-for="field in concordanceTableFields"
              :key="field.key"
              :style="'padding: 0px 10px 0px 0px; flex: 0 0 ' + field.width">
              <b-input
                v-if="field.key == 'from'"
                v-model="concordanceFilter.from"
                type="text"
                style="width: 55%; display: inline-block;"
                size="sm"
                placeholder="from" />
              <b-input
                v-if="field.key == 'to'"
                v-model="concordanceFilter.to"
                type="text"
                style="width: 75%; display: inline-block;"
                size="sm"
                placeholder="to" />
              <b-input
                v-if="field.key == 'creator'"
                v-model="concordanceFilter.creator"
                type="text"
                style="width: 80%; display: inline-block;"
                size="sm"
                placeholder="creator" />
              <span
                v-if="concordanceFilter[field.key] != null"
                v-b-tooltip.hover="{ title: 'clear filter', delay: $util.delay.medium }"
                icon="times"
                class="button mappingBrowser-from650"
                @click="concordanceFilter[field.key] = ''">
                x
              </span>
              <b-button
                v-if="field.key == 'from'"
                class="mappingBrowser-from750"
                variant="link"
                size="sm"
                style="padding-right: 0; margin-right: -5px;"
                @click="[concordanceFilter.from, concordanceFilter.to] = [concordanceFilter.to, concordanceFilter.from]">
                <font-awesome-icon icon="exchange-alt" />
              </b-button>
            </div>
          </div>
          <div style="flex: 1; height: 0; position: relative;">
            <flexible-table
              style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;"
              :fields="concordanceTableFields"
              :items="concordanceTableItems">
              <span
                slot="download"
                slot-scope="{ value }">
                <span
                  v-for="(distribution, index) in value"
                  :key="index">
                  <a
                    v-if="nameOfDistribution(distribution)"
                    :href="distribution.download">
                    {{ nameOfDistribution(distribution) }}
                  </a></span>
              </span>
              <span
                slot="mappings"
                slot-scope="{ value }">
                {{ (parseInt(value) || "?").toLocaleString() }}
              </span>
              <span
                slot="actions"
                slot-scope="{ item }">
                <font-awesome-icon
                  v-b-tooltip.hover="{ title: 'Show Mappings', delay: $util.delay.medium }"
                  icon="external-link-square-alt"
                  class="button"
                  @click="showMappingsForConcordance(item.concordance)" />
              </span>
            </flexible-table>
          </div>
          <div style="display: flex;">
            <p style="font-weight: bold; flex: 1;">
              {{ concordanceTableItems.length }} concordances
            </p>
            <p style="text-align: right; font-weight: bold;">
              Total: {{ concordanceTableItems.reduce((total, current) => {
                return total + parseInt(current.mappings) || 0
              }, 0).toLocaleString() }}
            </p>
          </div>
        </template>
      </b-tab>
      <b-tab
        title="Mapping Search">
        <p>I'm the second tab</p>
      </b-tab>
      <b-tab
        title="Mapping Navigator">
        <p>I'm the tab with the very, very long title</p>
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import FlexibleTable from "vue-flexible-table"
import _ from "lodash"

export default {
  name: "MappingBrowser",
  components: { FlexibleTable },
  data() {
    return {
      tab: 0,
      concordances: null,
      concordanceFilter: {
        from: "",
        to: "",
        creator: "",
      }
    }
  },
  computed: {
    concordanceTableFields() {
      return [
        {
          key: "from",
          label: "from",
          width: "13%",
          minWidth: "",
          sortable: true,
          align: "left",
          titleClass: "test",
        },
        {
          key: "to",
          label: "to",
          width: "9%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "description",
          label: "description",
          width: "24%",
          minWidth: "",
          sortable: true,
          align: "left",
          class: "mappingBrowser-from750"
        },
        {
          key: "creator",
          label: "creator",
          width: "16%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "date",
          label: "date",
          width: "10%",
          minWidth: "",
          sortable: true,
          align: "left",
          class: "mappingBrowser-from550"
        },
        {
          key: "download",
          label: "download",
          width: "11%",
          minWidth: "",
          sortable: false,
          align: "left",
          class: "mappingBrowser-from650"
        },
        {
          key: "mappings",
          label: "mappings",
          width: "13%",
          minWidth: "",
          sortable: true,
          align: "right",
          compare: (a, b) => (parseInt(a.mappings) || 0) - (parseInt(b.mappings) || 0),
        },
        {
          key: "actions",
          label: "",
          width: "4%",
          sortable: false,
          align: "right",
        },
      ]
    },
    concordanceTableItems() {
      let items = []
      for (let concordance of this.concordances) {
        let item = { concordance }
        item.from = this.$util.notation(_.get(concordance, "fromScheme")) || "-"
        item.to = this.$util.notation(_.get(concordance, "toScheme")) || "-"
        item.description = _.get(concordance, "scopeNote.de[0]") || _.get(concordance, "scopeNote.en[0]") || "-"
        item.creator = _.get(concordance, "creator[0].prefLabel.de") || _.get(concordance, "creator[0].prefLabel.en") || "-"
        item.date = _.get(concordance, "modified") || _.get(concordance, "created") || ""
        item.download = _.get(concordance, "distributions", [])
        item.mappings = _.get(concordance, "extent")
        if (item.from.toLowerCase().startsWith(this.concordanceFilter.from.toLowerCase()) && item.to.toLowerCase().startsWith(this.concordanceFilter.to.toLowerCase()) && item.creator.toLowerCase().startsWith(this.concordanceFilter.creator.toLowerCase())) {
          items.push(item)
        }
      }
      return items
    },
  },
  watch: {
    tab(newValue) {
      console.log(newValue)
    }
  },
  created() {

  },
  mounted() {
    if (!this.concordances) {
      let promises = []
      for (let registry of this.config.registries.filter(r => r.provider.has.concordances)) {
        promises.push(registry.provider.getConcordances())
      }
      Promise.all(promises).then(results => {
        let concordances = _.flatten(results)
        this.concordances = concordances
      })
    }
  },
  methods: {
    showMappingsForConcordance(concordance) {
      // Change tab to mapping search.
      this.tab = 1
      concordance
      // Clear all other search parameters.
      // this.clear()
      // Change concordance.
      // this.concordance = concordance.uri
      // Search.
      // this.currentPage = 1
      // this.searchClicked()
    },
    nameOfDistribution(distribution) {
      let mimetype = distribution.mimetype
      if (mimetype.includes("json")) {
        return "JSKOS"
      }
      if (mimetype.includes("csv")) {
        return "CSV"
      }
      return null
    },
  },
}
</script>

<style lang="less">
@import "../style/main.less";

#mappingBrowser {
  max-width: 100%;
}

#mappingBrowser[max-width~="750px"] .mappingBrowser-from750 {
  display: none;
}
#mappingBrowser[max-width~="650px"] .mappingBrowser-from650 {
  display: none;
}
#mappingBrowser[max-width~="550px"] .mappingBrowser-from550 {
  display: none;
}

#mappingBrowser > .tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}
#mappingBrowser > .tabs > div:first-child {
  flex: none;
}
#mappingBrowser > .tabs > div:first-child > ul > li > a {
  padding: 2px 0;
}
#mappingBrowser > .tabs > .tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
#mappingBrowser > .tabs > .tab-content > .tab-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 5px;
}
#mappingBrowser > .tabs > .tab-content > .tab-pane:focus {
  outline: 0;
}

</style>
