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
          <div v-if="localSettings">
            <h5>{{ $t("settings.creatorTitle") }}</h5>
            <p>
              {{ $t("settings.creatorInfo") }}
            </p>
            <p>
              <b>{{ $t("settings.creator") }}</b>
              <b-form-input
                v-model="localSettings.creator"
                :placeholder="$t('settings.creatorPlaceholder')"
                type="text" />
            </p>
            <p>
              <b>{{ $t("settings.creatorUrl") }}</b>
              <b-form-input
                v-model="localSettings.creatorUrl"
                placeholder="https://"
                type="text" />
            </p>
            <p>
              <b>{{ $t("settings.creatorUri") }}</b>
              <b-form-input
                v-model="localSettings.creatorUri"
                placeholder="https://"
                type="text"
                @input="checkCredentials" />
            </p>
            <div v-if="$store.getters.authAvailable || availableMappingRegistries.length">
              <h5>{{ $t("settings.accountTitle") }}</h5>
              <p>{{ $t("settings.accountInfo") }}</p>
            </div>
            <p v-if="$store.getters.authAvailable">
              <b>{{ $t("settings.creatorCredentials") }}</b>
              <b-form-input
                v-model="localSettings.creatorCredentials"
                :class="{
                  'border-success': $store.state.authorized != null && !Object.values($store.state.authorized).includes(false),
                  'border-danger': $store.state.authorized != null && !Object.values($store.state.authorized).includes(true),
                  'border-warning': $store.state.authorized != null && Object.values($store.state.authorized).includes(false) && Object.values($store.state.authorized).includes(true)
                }"
                type="password"
                @input="checkCredentials" />
              <span
                v-if="$store.state.authorized != null"
                :class="{
                  'text-success': !Object.values($store.state.authorized).includes(false),
                  'text-danger': !Object.values($store.state.authorized).includes(true),
                  'text-warning': Object.values($store.state.authorized).includes(false) && Object.values($store.state.authorized).includes(true)
              }" >
                {{
                  !Object.values($store.state.authorized).includes(false) ?
                    $t("settings.credentialsCorrect") :
                    (
                      Object.values($store.state.authorized).includes(true) ?
                        $t("settings.credentialsPartiallyIncorrect") :
                        $t("settings.credentialsIncorrect")
                    )
                }}
              </span>
            </p>
            <p
              v-if="availableMappingRegistries.length"
              style="margin-bottom: 10px !important;" >
              <b>{{ $t("settings.mappingRegistry") }}</b>
              <b-form-select v-model="localSettings.mappingRegistry">
                <option
                  v-for="registry in availableMappingRegistries"
                  :key="`settings-registry-${registry.uri}`"
                  :value="registry.uri" >
                  {{ $util.prefLabel(registry) }}
                </option>
              </b-form-select>
              {{ $t("settings.mappingRegistryExplanation") }}
            </p>
            <p>
              <registry-info :registry="$store.getters.getCurrentRegistry" />
            </p>
          </div>
        </b-tab>
        <b-tab
          :title="$t('settings.tabLayout')" >
          <p v-if="localSettings">
            <b>{{ $t("settings.language") }}</b>
            <b-form-select v-model="$i18n.locale">
              <option
                v-for="language in config.languages"
                :key="language"
                :value="language" >
                {{ $t(`languages.${language}`) }}
              </option>
            </b-form-select>
          </p>
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
            <b-form-checkbox v-model="only1to1mappings">
              {{ $t("settings.only1to1mappings") }}
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
          <div v-if="localMappingsSupported && dlAllMappings">
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
          <p v-if="localMappingsSupported && dlAllMappings">
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
        <span v-if="config.buildInfo.version && config.buildInfo.version != ''">
          •
          {{ $t("settings.version") }} {{ config.buildInfo.version }}
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
          {{ $t("settings.buildDate") }}: {{ $util.dateToString(config.buildInfo.buildDate) }}
        </span>
        <span v-if="config.impressum">
          •
          <a
            :href="config.impressum"
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
    only1to1mappings: {
      get() {
        return this.localSettings.mappingCardinality == "1-to-1" ? true : false
      },
      set(value) {
        this.localSettings.mappingCardinality = value ? "1-to-1" : "1-to-n"
      },
    },
    availableMappingRegistries() {
      return this.config.registries.filter(registry => registry.provider.has.canSaveMappings)
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
            this.$store.commit("mapping/setRefresh", { registry: "http://coli-conc.gbv.de/registry/local-mappings" })
          })
        }
        reader.readAsText(this.uploadedFile)
      }
    },
  },
  created() {
    // Debounce checkCredentials by 350 ms
    this.checkCredentials = _.debounce(this._checkCredentials, 350)
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
      this.getMappings({ registry: "http://coli-conc.gbv.de/registry/local-mappings" }).then(result => {
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
              promises.push(this.loadDetails(concept, { scheme }))
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
            let conceptInStore = this._getObject(concept)
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
          mapping.fromScheme = this._getObject(mapping.fromScheme) || mapping.fromScheme
          mapping.toScheme = this._getObject(mapping.toScheme) || mapping.toScheme
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
          // Minify all mappings first
          download.mappings = download.mappings.map(mapping => this.$jskos.minifyMapping(mapping))
          for (let mapping of download.mappings) {
            // Prepare labels
            for (let concept of this.$jskos.conceptsOfMapping(mapping)) {
              let conceptInStore = this._getObject(concept)
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
          _.set(mapping, "creator", [this.$store.getters["settings/creator"]])
        }
        return this.$store.dispatch({ type: "mapping/saveMappings", mappings: mappings.map(mapping => ({ mapping, original: mapping })), registry: "http://coli-conc.gbv.de/registry/local-mappings" })
      }).then(() => {
        this.creatorRewritten = true
        this.$store.commit("mapping/setRefresh", { registry: "http://coli-conc.gbv.de/registry/local-mappings" })
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
          let removedMappingsCount = removedMappings.filter(success => success).length
          if (mappings.length != removedMappingsCount) {
            console.warn(`Error when removing mappings, tried to remove ${mappings.length}, but only removed ${removedMappingsCount}.`)
          }
          this.$store.commit("mapping/setRefresh", { registry: "http://coli-conc.gbv.de/registry/local-mappings" })
          this.refreshDownloads()
          this.deleteMappingsButtons = false
        })
      })
    },
    _checkCredentials() {
      this.$store.dispatch("checkAuth")
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
#settingsModal .modal-body .card .col-auto {
  min-width: 200px;
}

</style>
