<template>
  <b-modal
    id="settingsModal"
    ref="settingsModal"
    :title="$t('settings.title')"
    hide-footer
    centered
    size="lg" >
    <b-card
      no-body
      footer-tag="footer">
      <b-tabs
        pills
        card
        vertical >
        <b-tab
          :title="$t('settings.tabAccount')"
          active>
          <p v-if="localSettings">
            <b>{{ $t("settings.creator") }}</b>
            <b-form-input
              v-model="localSettings.creator"
              :placeholder="$t('settings.creatorPlaceholder')"
              type="text" />
          </p>
        </b-tab>
        <b-tab
          :title="$t('settings.tabLayout')" >
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
          <p v-if="localSettings">
            <b-form-checkbox v-model="localSettings.mappingEditorClearOnSave">
              {{ $t("settings.mappingEditorClearOnSave") }}
            </b-form-checkbox>
          </p>
          <p v-if="localSettings">
            <b-form-checkbox v-model="localSettings.autoInsertLabels">
              {{ $t("settings.autoInsertLabels") }}
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
        </b-tab>
        <b-tab
          :title="$t('settings.tabSources')" >
          <registry-info
            v-for="(registry, index) in config.registries"
            :key="`settingsModal-registries-${index}`"
            :registry="registry"
            class="settings-sources" />
        </b-tab>
        <b-tab
          v-if="localMappingsSupported"
          :title="$t('settings.tabLocalMappings')" >
          <div v-if="localMappingsSupported && dlAllMappings && dlMappingsReady">
            <h5>{{ $t("settings.localDownload") }}</h5>
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
            <br>
            <a
              href=""
              @click.prevent="downloadFile('mappings.ndjson', dlAllMappings)" >
              {{ $t("settings.localDownloadJskos", [dlAllMappings.split("\n").length]) }}
            </a>
          </div>
          <br>
          <div v-if="localMappingsSupported">
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
          <div v-if="localMappingsSupported">
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
          <br><br>
          <p v-if="localMappingsSupported">
            <b-button
              :variant="creatorRewritten ? 'success' : 'warning'"
              @click="rewriteCreator">
              {{ $t("settings.creatorRewrite") }}
            </b-button>
          </p>
        </b-tab>
      </b-tabs>
      <span slot="footer">
        <a
          href="https://github.com/gbv/cocoda"
          target="_blank" >
          <font-awesome-icon :icon="['fab', 'github']" />
          GitHub
        </a>
        <span v-if="config.buildInfo.gitTag && config.buildInfo.gitTag != ''">
          •
          {{ $t("settings.version") }} {{ config.buildInfo.gitTag }}
        </span>
        <span v-if="config.buildInfo.gitCommit && config.buildInfo.gitCommitShort">
          •
          {{ $t("settings.currentCommit") }}:
          <a
            :href="'https://github.com/gbv/cocoda/commit/' + config.buildInfo.gitCommit"
            target="_blank" >
            {{ config.buildInfo.gitCommitShort }}
          </a>
        </span>
        <span v-if="config.buildInfo.buildDate">
          •
          {{ $t("settings.buildDate") }}: {{ config.buildInfo.buildDate }}
        </span>
        <span v-if="config.impressumUrl">
          •
          <a
            :href="config.impressumUrl"
            target="_blank" >
            {{ $t("settings.impressum") }}
          </a>
        </span>
        <br>
        <span>
          {{ $t("settings.suggestions1") }}
          <a
            href="https://github.com/gbv/cocoda/issues"
            target="_blank" >{{ $t("settings.suggestions2") }}</a>{{ $t("settings.suggestions3") }}
        </span>
      </span>
    </b-card>

  </b-modal>
</template>

<script>
import _ from "lodash"
import RegistryInfo from "./RegistryInfo"

/**
 * The settings modal.
 */
export default {
  name: "TheSettings",
  components: { RegistryInfo },
  data() {
    return {
      localSettings: null,
      creatorRewritten: false,
      dlMappingsReady: false,
      dlAllMappings: null,
      dlMappings: [],
      uploadedFile: null,
      uploadedFileStatus: "",
      deleteMappingsButtons: false,
    }
  },
  computed: {
    localMappingsSupported() {
      let registry = this.config.registries.find(registry => registry.uri == "http://coli-conc.gbv.de/registry/local-mappings")
      return registry != null
    },
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
      if (this.uploadedFile && this.localMappingsSupported) {
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
          this.$store.dispatch({ type: "mapping/saveMappings", mappings, registry: "http://coli-conc.gbv.de/registry/local-mappings" }).then(result => {
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
      if (!this.localMappingsSupported) {
        return
      }
      // Set download data variables
      this.dlMappingsReady = false
      this.dlAllMappings = null
      this.dlMappings = []
      let mappings = []
      this.$store.dispatch({ type: "mapping/getMappings", registry: "http://coli-conc.gbv.de/registry/local-mappings" }).then(result => {
        mappings = result
        // First, load concepts for all mappings into Vuex store (to have the labels available)
        // TODO: Add support for loading multiple concepts together.
        let promises = []
        for (let mapping of mappings) {
          for (let side of ["from", "to"]) {
            for (let concept of this.$jskos.conceptsOfMapping(mapping, side)) {
              let scheme = mapping[side + "Scheme"]
              if (!concept.inScheme || !concept.inScheme.length) {
                concept.inScheme = [scheme]
              }
              promises.push(this.$store.dispatch({
                type: "objects/load",
                object: concept,
                scheme
              }))
            }
          }
        }
        return Promise.all(promises)
      }).then(() => {
        // Function for minifying and stringifying a mapping for JSKOS export.
        // TODO: Code duplication with MappingBrowser! This should actually go into jskos-tools.
        let jskosExport = m => {
          let mapping = this.$jskos.minifyMapping(m)
          // Add labels to concepts in mapping
          for (let concept of this.$jskos.conceptsOfMapping(mapping)) {
            let conceptInStore = this.$store.getters["objects/get"](concept)
            let language = this.$util.getLanguage(_.get(conceptInStore, "prefLabel"))
            if (language) {
              concept.prefLabel = _.pick(conceptInStore.prefLabel, [language])
            }
          }
          return JSON.stringify(mapping)
        }
        // Set all mappings variable
        this.dlAllMappings = mappings.map(jskosExport).join("\n")
        // First, determine available combinations of concept schemes
        for (let mapping of mappings) {
          // Adjust schemes with store
          mapping.fromScheme = this.$store.getters["objects/get"](mapping.fromScheme) || mapping.fromScheme
          mapping.toScheme = this.$store.getters["objects/get"](mapping.toScheme) || mapping.toScheme
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
          download.ndjson = download.mappings.map(jskosExport).join("\n")
          // Download as CSV
          let csv = "\"fromNotation\",\"fromLabel\",\"toNotation\",\"toLabel\",\"type\"\r\n"
          let mappingToCSV = this.$jskos.mappingToCSV({
            lineTerminator: "\r\n",
            language: "de", // NOTE: Hardcoded language here and when preparing labels for CSV export because mappingToCSV doesn't support a language override in each call (yet).
          })
          for (let mapping of download.mappings) {
            // Prepare labels
            for (let concept of this.$jskos.conceptsOfMapping(mapping)) {
              let conceptInStore = this.$store.getters["objects/get"](concept)
              let language = this.$util.getLanguage(_.get(conceptInStore, "prefLabel"))
              if (language) {
                // NOTE: Hardcoded language, see note above.
                concept.prefLabel = { de: _.get(conceptInStore.prefLabel, language) }
              }
            }
            // Append to CSV
            csv += mappingToCSV(mapping)
          }
          download.csv = csv
          // Label
          download.label = (this.$util.notation(_.get(download, "fromScheme"), "scheme") || "?") + " to " + (this.$util.notation(_.get(download, "toScheme"), "scheme") || "?")
          // Filename
          download.filename = `${this.$util.notation(_.get(download, "fromScheme"), "scheme") || "?"}_to_${this.$util.notation(_.get(download, "toScheme"), "scheme") || "?"}_${this.localSettings.creator}`
        }
        this.dlMappingsReady = true
      })
    },
    rewriteCreator() {
      if (!this.localMappingsSupported) {
        return
      }
      // 1. Load all local mappings directly from API
      this.$store.dispatch({ type: "mapping/getMappings", registry: "http://coli-conc.gbv.de/registry/local-mappings" }).then(mappings => {
        // 2. Rewrite mappings to new creator
        for (let mapping of mappings) {
          _.set(mapping, "creator[0].prefLabel.de", this.localSettings.creator)
        }
        return this.$store.dispatch({ type: "mapping/saveMappings", mappings: mappings.map(mapping => ({ mapping, original: mapping })), registry: "http://coli-conc.gbv.de/registry/local-mappings" })
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
    deleteMappings() {
      if (!this.localMappingsSupported) {
        return
      }
      this.$store.dispatch({ type: "mapping/getMappings", registry: "http://coli-conc.gbv.de/registry/local-mappings" }).then(mappings => {
        return this.$store.dispatch({ type: "mapping/removeMappings", mappings, registry: "http://coli-conc.gbv.de/registry/local-mappings" }).then(removedMappings => {
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

.settings-sources {
  margin-bottom: 15px;
}

</style>

<style>

#settingsModal .modal-dialog {
  height: 90%;
}
#settingsModal .modal-content {
  height: 100%;
}

#settingsModal .modal-body {
  padding: 0;
}

#settingsModal .modal-body .card {
  border: none;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
}
#settingsModal .modal-body .card .tabs {
  height: 100%;
}
#settingsModal .modal-body .card .col, #settingsModal .modal-body .card .card-header {
  overflow-y: scroll;
}

</style>
