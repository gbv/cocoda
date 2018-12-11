<template>
  <b-modal
    ref="settingsModal"
    :title="$t('settings.title')"
    hide-footer
    centered
    size="md" >
    <p v-if="localSettings">
      <b-form-checkbox v-model="localSettings.conceptDetailShowAllAncestors">
        {{ $t("settings.showAllAncestors") }}
      </b-form-checkbox>
    </p>
    <p v-if="localSettings">
      <b-form-checkbox v-model="localSettings.conceptDetailDoNotTruncateNotes">
        {{ $t("settings.truncateNotes") }}
      </b-form-checkbox>
    </p>
    <p v-if="localSettings">
      <b-form-checkbox v-model="localSettings.mappingBrowserShowAll">
        {{ $t("settings.showAll") }}
      </b-form-checkbox>
    </p>
    <p>
      <b-button
        variant="primary"
        @click="resetFlex">
        {{ $t("settings.resetSizes") }}
      </b-button>
    </p>
    <br>
    <p v-if="localSettings">
      <b>{{ $t("settings.creator") }}</b>
      <b-form-input
        v-model="localSettings.creator"
        :placeholder="$t('settings.creatorPlaceholder')"
        type="text" />
    </p>
    <p>
      <b-button
        :variant="creatorRewritten ? 'success' : 'warning'"
        @click="rewriteCreator">
        {{ $t("settings.creatorRewrite") }}
      </b-button>
    </p>
    <div v-if="dlAllMappings">
      <h5>{{ $t("settings.localDownload") }}</h5>
      <a
        href=""
        @click.prevent="downloadFile('mappings.ndjson', dlAllMappings)" >
        {{ $t("settings.localDownloadJskos", [dlAllMappings.split("\n").length]) }}
      </a>
      <br><br>
      <span
        v-for="(download, index) in dlMappings"
        :key="index">
        {{ download.label }} ({{ download.mappings.length }}):
        <a
          href=""
          @click.prevent="downloadFile(download.filename + '.ndjson', download.ndjson)" >
          JSKOS
        </a>
        <a
          href=""
          @click.prevent="downloadFile(download.filename + '.csv', download.csv)" >
          CSV
        </a>
        <br>
      </span>
    </div>
    <br>
    <div>
      <h5>{{ $t("settings.localUpload") }}</h5>
      <b-form-file
        ref="fileUpload"
        v-model="uploadedFile"
        :state="Boolean(uploadedFile)"
        :placeholder="$t('settings.localUploadPlaceholder')"
        accept=".ndjson" />
      <p>
        {{ uploadedFileStatus }}
      </p>
    </div>
    <div>
      <h5>{{ $t("settings.localDeleteTitle") }}</h5>
      <b-button
        :disabled="!dlAllMappings"
        variant="danger"
        hide-footer
        @click="deleteMappingsButtons = true" >
        {{ $t("settings.localDeleteText") }}
      </b-button>
      <p
        v-if="deleteMappingsButtons">
        {{ $t("settings.localDeleteSure") }}
        <b-button
          variant="danger"
          size="sm"
          @click="deleteMappings" >{{ $t("general.yes") }}</b-button>
        <b-button
          variant="success"
          size="sm"
          @click="deleteMappingsButtons = false" >{{ $t("general.no") }}</b-button>
      </p>
    </div>
    <br>
    <p>
      <span>
        {{ $t("settings.suggestions1") }}
        <a
          href="https://github.com/gbv/cocoda/issues"
          target="_blank" >{{ $t("settings.suggestions2") }}</a>{{ $t("settings.suggestions3") }}
      </span>
      <span v-if="config.buildInfo.gitTag && config.buildInfo.gitTag != ''">
        {{ $t("settings.version") }}: {{ config.buildInfo.gitTag }}<br>
      </span>
      <span v-if="config.buildInfo.gitCommit && config.buildInfo.gitCommitShort">
        {{ $t("settings.currentCommit") }}:
        <a
          :href="'https://github.com/gbv/cocoda/commit/' + config.buildInfo.gitCommit"
          target="_blank" >
          {{ config.buildInfo.gitCommitShort }}
        </a><br>
      </span>
      <span v-if="config.buildInfo.buildDate">
        {{ $t("settings.buildDate") }}: {{ config.buildInfo.buildDate }}<br>
      </span>
      <span v-if="config.impressumUrl">
        <a
          :href="config.impressumUrl"
          target="_blank" >
          {{ $t("settings.impressum") }}
        </a>
      </span>
    </p>
  </b-modal>
</template>

<script>
import _ from "lodash"
import FileSaver from "file-saver"

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
      uploadedFile: null,
      uploadedFileStatus: "",
      deleteMappingsButtons: false,
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
    },
    uploadedFile() {
      if (this.uploadedFile) {
        let reader = new FileReader()
        reader.onloadend = evt => {
          let lines, importResult
          let contents = evt.target.result
          lines = contents.split("\n")
          importResult = {
            imported: 0,
            skipped: 0,
            error: 0,
            empty: 0,
          }
          let mappings = []
          for (let line of lines) {
            if (line === "") {
              importResult.empty += 1
              continue
            }
            try {
              let mapping = JSON.parse(line)
              mappings.push({ mapping })
            } catch(error) {
              importResult.error += 1
            }
          }
          this.$store.dispatch({ type: "mapping/saveMappings", mappings }).then(result => {
            importResult.imported = result.length
            importResult.skipped = lines.length - importResult.imported - importResult.error - importResult.empty
            this.uploadedFileStatus = `${importResult.imported} mappings imported, ${importResult.skipped} skipped, ${importResult.error} errored`
            this.$refs.fileUpload.reset()
            this.refreshDownloads()
            this.$store.commit("mapping/setRefresh", { onlyMain: true })
          })
        }
        reader.readAsText(this.uploadedFile)
      }
    },
  },
  methods: {
    show() {
      this.$refs.settingsModal.show()
      this.localSettings = _.cloneDeep(this.$settings)
      this.refreshDownloads()
    },
    refreshDownloads() {
      // Set download data variables
      this.dlAllMappings = null
      this.dlMappings = []
      this.$store.dispatch({ type: "mapping/getMappings", onlyFromMain: true }).then(mappings => {
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
          let csv = "\"fromNotation\",\"toNotation\",\"type\"\r\n"
          let mappingToCSV = this.$jskos.mappingToCSV({
            lineTerminator: "\r\n"
          })
          for (let mapping of download.mappings) {
            csv += mappingToCSV(mapping)
          }
          download.csv = csv
          // Label
          download.label = (this.$util.notation(_.get(download, "fromScheme"), "scheme") || "?") + " to " + (this.$util.notation(_.get(download, "toScheme"), "scheme") || "?")
          // Filename
          download.filename = `${this.$util.notation(_.get(download, "fromScheme"), "scheme") || "?"}_to_${this.$util.notation(_.get(download, "toScheme"), "scheme") || "?"}_${this.localSettings.creator}`
        }
      })
    },
    rewriteCreator() {
      // 1. Load all local mappings directly from API
      this.$store.dispatch({ type: "mapping/getMappings", onlyFromMain: true }).then(mappings => {
        // 2. Rewrite mappings to new creator
        for (let mapping of mappings) {
          _.set(mapping, "creator[0].prefLabel.de", this.localSettings.creator)
        }
        return this.$store.dispatch({ type: "mapping/saveMappings", mappings: mappings.map(mapping => ({ mapping, original: mapping })) })
      }).then(() => {
        this.creatorRewritten = true
        this.$store.commit("mapping/setRefresh", { onlyMain: true })
        this.refreshDownloads()
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
    downloadFile(filename, contents) {
      var blob = new Blob([contents], {type: "text/plain;charset=utf-8"})
      FileSaver.saveAs(blob, filename)
    },
    deleteMappings() {
      this.$store.dispatch({ type: "mapping/getMappings", onlyFromMain: true }).then(mappings => {
        return this.$store.dispatch({ type: "mapping/removeMappings", mappings }).then(removedMappings => {
          if (mappings.length != removedMappings.length) {
            console.warn(`Error when removing mappings, tried to remove ${mappings.length}, but only removed ${removedMappings.length}.`)
          }
          this.$store.commit("mapping/setRefresh", { onlyMain: true })
          this.refreshDownloads()
          this.deleteMappingsButtons = false
        })
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
