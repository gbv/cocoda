<template>
  <b-modal
    ref="settingsModal"
    hide-footer
    centered
    size="md"
    title="Cocoda Settings" >
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
/**
 * The settings modal.
 */
export default {
  name: "TheSettings",
  methods: {
    show() {
      this.$refs.settingsModal.show()
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

</style>
