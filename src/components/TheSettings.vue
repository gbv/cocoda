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
      this.$api.getLocalMappings().then(mappings => {
        this.dlAllMappings = mappings.map(mapping => JSON.stringify(this.$jskos.minifyMapping(mapping))).join("\n")
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
