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
    <br>
    <p>
      For issues and suggestions, please use the
      <a
        href="https://github.com/gbv/cocoda/issues"
        target="_blank" >GitHub issue tracker</a>.
    </p>
    <p v-if="config.buildInfo.gitTag && config.buildInfo.gitTag != ''">
      Version: {{ config.buildInfo.gitTag }}
    </p>
    <p v-if="config.buildInfo.gitCommit && config.buildInfo.gitCommitShort">
      Current Commit:
      <a
        :href="'https://github.com/gbv/cocoda/commit/' + config.buildInfo.gitCommit"
        target="_blank" >
        {{ config.buildInfo.gitCommitShort }}
      </a>
    </p>
    <p v-if="config.buildInfo.buildDate">
      Build Date: {{ config.buildInfo.buildDate }}
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
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

p {
  margin: 5px 0 20px 0 !important;
}

</style>
