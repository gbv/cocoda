<template>
  <b-modal
    ref="settingsModal"
    hide-footer
    centered
    size="md"
    title="Cocoda Settings" >
    <p v-if="localSettings">
      <b>Creator for mappings</b>
      <b-form-input
        v-model="localSettings.creator"
        type="text"
        placeholder="Enter your name"/>
    </p>
    <p>
      <b-button
        :variant="creatorRewritten ? 'success' : 'warning'"
        @click="rewriteCreator">
        Rewrite creator for all local mappings
      </b-button>
    </p>
    <p v-if="localSettings">
      <b-form-checkbox v-model="localSettings.conceptDetailShowAllAncestors">
        Always show all ancestors in concept details.
      </b-form-checkbox>
    </p>
    <p v-if="localSettings">
      <b-form-checkbox v-model="localSettings.conceptDetailDoNotTruncateNotes">
        Do not truncate notes in concept details.
      </b-form-checkbox>
    </p>
    <p>
      <b-button
        variant="primary"
        @click="resetFlex">
        Reset component sizes
      </b-button>
    </p>
    <br>
    <div v-if="dlAllMappings">
      <h5>Download Local Mappings</h5>
      <a
        :href="'data:text/json;charset=utf-8,' + dlAllMappings"
        download="mappings.ndjson"
        target="_blank" >
        Download all {{ dlAllMappings.split("\n").length }} mappings as JSKOS
      </a>
      <br><br>
      <span
        v-for="(download, index) in dlMappings"
        :key="index">
        {{ download.label }} ({{ download.mappings.length }}):
        <a
          :href="'data:text/json;charset=utf-8,' + download.ndjson"
          :download="download.filename + '.ndjson'"
          target="_blank" >
          JSKOS
        </a>
        <a
          :href="'data:text/json;charset=utf-8,' + download.csv"
          :download="download.filename + '.csv'"
          target="_blank" >
          CSV
        </a>
        <br>
      </span>
    </div>
    <br>
    <p>
      <span>
        For issues and suggestions, please use the
        <a
          href="https://github.com/gbv/cocoda/issues"
          target="_blank" >GitHub issue tracker</a>.
      </span>
      <span v-if="config.buildInfo.gitTag && config.buildInfo.gitTag != ''">
        Version: {{ config.buildInfo.gitTag }}<br>
      </span>
      <span v-if="config.buildInfo.gitCommit && config.buildInfo.gitCommitShort">
        Current Commit:
        <a
          :href="'https://github.com/gbv/cocoda/commit/' + config.buildInfo.gitCommit"
          target="_blank" >
          {{ config.buildInfo.gitCommitShort }}
        </a><br>
      </span>
      <span v-if="config.buildInfo.buildDate">
        Build Date: {{ config.buildInfo.buildDate }}<br>
      </span>
    </p>
  </b-modal>
</template>

<script>
import _ from "lodash"

/**
 * The settings modal.
 */
export default {
  name: "TheSettings",
  data() {
    return {
      localSettings: null,
      creatorRewritten: false,
      dlAllMappings: null,
      dlMappings: [],
    }
  },
  watch: {
    localSettings: {
      handler() {
        this.$store.commit({
          type: "settings/save",
          settings: this.localSettings
        })
        this.creatorRewritten = false
      },
      deep: true
    }
  },
  methods: {
    show() {
      this.$refs.settingsModal.show()
      this.localSettings = _.cloneDeep(this.$settings)
      // Set download data variables
      this.dlAllMappings = null
      this.dlMappings = []
      this.$api.getLocalMappings().then(mappings => {
        // Set all mappings variable
        this.dlAllMappings = mappings.map(mapping => JSON.stringify(this.$jskos.minifyMapping(mapping))).join("\n")
        // First, determine available combinations of concept schemes
        for (let mapping of mappings) {
          let download = this.dlMappings.find(dl => this.$jskos.compare(mapping.fromScheme, dl.fromScheme) && this.$jskos.compare(mapping.toScheme, dl.toScheme))
          if (download) {
            download.mappings.push(mapping)
          } else {
            download = {
              fromScheme: mapping.fromScheme,
              toScheme: mapping.toScheme,
              mappings: [mapping],
            }
            this.dlMappings.push(download)
          }
        }
        // Then, set download property and label of each combination
        for (let download of this.dlMappings) {
          // Download as JSKOS/ndjson
          download.ndjson = download.mappings.map(mapping => JSON.stringify(this.$jskos.minifyMapping(mapping))).join("\n")
          // Download as CSV
          let csv = "fromNotation,toNotation,type\n"
          for (let mapping of download.mappings) {
            let from = _.get(mapping, "from.memberSet[0].notation[0]")
            let to = _.get(mapping, "to.memberSet[0].notation[0]")
            let type = this.$util.mappingTypeByUri(_.get(mapping, "type[0]"))
            if (from && to && type) {
              csv += `${from},${to},${type.short}\n`
            }
          }
          download.csv = csv
          // Label
          download.label = _.get(download, "fromScheme.notation[0]", "?") + " to " + _.get(download, "toScheme.notation[0]", "?")
          // Filename
          download.filename = `${_.get(download, "fromScheme.notation[0]", "?")}_to_${_.get(download, "toScheme.notation[0]", "?")}_${this.localSettings.creator}`
        }
      })
    },
    rewriteCreator() {
      // 1. Load all local mappings directly from API
      this.$api.getLocalMappings().then(mappings => {
        // 2. Rewrite mappings to new creator
        for (let mapping of mappings) {
          mapping.creator = [{
            prefLabel: {
              de: this.localSettings.creator
            }
          }]
        }
        return this.$api.saveMappings(mappings)
      }).then(() => {
        this.creatorRewritten = true
        this.$store.commit("mapping/setRefresh", true)
      })
    },
    resetFlex() {
      let flex = _.cloneDeep(this.localSettings.flex)
      _.forOwn(flex, (value, key) => {
        flex[key] = ""
      })
      this.$store.commit({
        type: "settings/set",
        prop: "flex",
        value: flex
      })
    },
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

p {
  margin: 5px 0 20px 0 !important;
}

</style>
