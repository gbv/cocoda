<template>
  <b-modal
    id="settingsModal"
    ref="settingsModal"
    :title="$t('settings.title')"
    hide-footer
    centered
    size="lg">
    <b-card
      no-body
      footer-tag="footer">
      <tabs
        fill
        :value="tab"
        @change="$emit('update:tab', $event.index)">
        <tab
          :title="$t('settingsTabs')[0]">
          <div v-if="localSettings">
            <p v-if="user && authorized">
              <span
                class="text-success">
                {{ $t("settings.loggedIn") }}
              </span>
              <a
                :href="$store.state.auth.about.baseUrl + 'account'"
                target="_blank">
                {{ $t("settings.accountPage") }}
              </a> •
              <a
                href=""
                @click.prevent="login(null)">
                {{ $t("settings.logOutButton") }}
              </a>
            </p>
            <p v-else>
              <span class="text-danger">
                {{ $t("settings.loggedOut") }}
              </span>
            </p>
            <p v-if="$store.state.auth.available && !user && providers.length">
              <b-button
                v-for="provider in providers"
                :key="`login-provider-${provider.id}`"
                block
                variant="light"
                @click="login(provider)">
                <img
                  v-if="provider.image"
                  :src="provider.image"
                  height="20px"
                  style="margin-right: 5px;">
                {{ $t("settings.logInButton") }} via {{ provider.name }}
              </b-button>
            </p>
            <div v-if="$store.state.auth.connected">
              <p>
                <span v-html="$t('settings.accountInfo', { url: config.auth })" />
                <a
                  v-if="$store.state.auth.about.urls.imprint"
                  :href="$store.state.auth.about.urls.imprint"
                  target="_blank">
                  {{ $t("settings.impressum") }}
                </a> •
                <a
                  v-if="$store.state.auth.about.urls.privacy"
                  :href="$store.state.auth.about.urls.privacy"
                  target="_blank">
                  {{ $t("settings.privacyPolicy") }}
                </a>
              </p>
            </div>
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
              <b>{{ $t("settings.creatorUri") }}</b>
              <span v-if="!user || !userUris || !userUris.length">
                <b-form-input
                  v-model="localSettings.creatorUri"
                  :state="!localSettings.creatorUri || $jskos.isValidUri(localSettings.creatorUri)"
                  placeholder="https://"
                  type="text" />
                <span
                  v-if="localSettings.creatorUri && !$jskos.isValidUri(localSettings.creatorUri)"
                  class="text-danger">
                  {{ $t("settings.creatorUriInvalid") }}
                </span>
              </span>
              <span v-else>
                <b-form-select v-model="localSettings.creatorUri">
                  <option
                    v-for="uri in userUris"
                    :key="`settings-uris-${uri}`"
                    :value="uri">
                    {{ uri }}
                  </option>
                </b-form-select>
              </span>
            </p>
          </div>
        </tab>
        <tab
          :title="$t('settingsTabs')[1]">
          <h4>{{ $t("settings.mappingRegistries") }}</h4>
          <div
            v-for="(registry, index) in config.registries.filter(registry => $jskos.mappingRegistryIsStored(registry))"
            :key="`settingsModal-mapping-registries-${index}`"
            class="settingsModal-mapping-registry"
            :class="{'selected-registry': $jskos.compareFast(registry, currentRegistry)}">
            <b-form-checkbox
              v-model="showRegistry[registry.uri]"
              :disabled="$jskos.compareFast(registry, currentRegistry)" />
            <registry-info
              :registry="registry"
              class="settings-sources"
              @click.native="$store.commit({
                type: 'settings/set',
                prop: 'mappingRegistry',
                value: registry.uri
              })" />
          </div>
          <h4>{{ $t("settings.otherRegistries") }}</h4>
          <div
            v-for="(registry, index) in config.registries.filter(registry => !$jskos.mappingRegistryIsStored(registry))"
            :key="`settingsModal-other-registries-${index}`"
            class="settingsModal-mapping-registry">
            <b-form-checkbox
              v-if="registry.has.mappings"
              v-model="showRegistry[registry.uri]" />
            <registry-info
              :registry="registry"
              class="settings-sources" />
          </div>
        </tab>
        <tab
          :title="$t('settingsTabs')[2]">
          <div class="settingsModal-componentSettings-component">
            <div
              v-if="localSettings"
              class="form-inline">
              <label style="padding-right: 0.5em">{{ $t("settings.language") }}:</label>
              <b-form-select v-model="$i18n.locale">
                <option
                  v-for="language in config.languages"
                  :key="language"
                  :value="language">
                  {{ $t(`languages.${language}`) }}
                </option>
              </b-form-select>
            </div>
            <span
              class="fontSize-small text-lightGrey"
              v-html="$t('settings.languageContribution')" />
          </div>
          <div
            v-if="localSettings"
            class="settingsModal-componentSettings-component">
            <h5>{{ $t("settings.preferredLanguages") }}</h5>
            <div>
              {{ $t("settings.preferredLanguagesAdd") }}:
              <b-form-input
                v-model="languageToAdd"
                size="sm"
                list="languages-datalist"
                @keydown.native="addLanguageKeydown"
                @input.native="addLanguageInput" />
              <datalist id="languages-datalist">
                <option
                  v-for="lang in allLanguages"
                  :key="lang.uri">
                  {{ lang.notation[0] }} {{ $jskos.prefLabel(lang, { language: locale }) }}
                </option>
              </datalist>
            </div>
            <ul>
              <li
                v-for="(lang, index) in localSettings.preferredLanguages"
                :key="index">
                <div
                  class="button fontSize-verySmall"
                  style="display: inline-block; margin-right: 2px;"
                  @click="removeLanguage(lang)">
                  <font-awesome-icon icon="times-circle" />
                </div>
                <div
                  class="button fontSize-verySmall"
                  style="display: inline-block; margin-right: 2px;"
                  @click="moveLanguage(index, 1)">
                  <font-awesome-icon icon="arrow-down" />
                </div>
                <div
                  class="button fontSize-verySmall"
                  style="display: inline-block;"
                  @click="moveLanguage(index, -1)">
                  <font-awesome-icon icon="arrow-up" />
                </div>
                {{ $jskos.prefLabel(languageConceptByTag(lang), { language: locale }) || lang }}
              </li>
            </ul>
          </div>
          <div class="settingsModal-componentSettings-component">
            <b-button
              variant="secondary"
              @click="resetFlex">
              {{ $t("settings.resetSizes") }}
            </b-button>
          </div>
          <!-- Component Settings -->
          <div
            v-for="component in components"
            :key="`settings-componentSettings-${component.name}`"
            class="settingsModal-componentSettings-component">
            <h5>{{ component.name }}</h5>
            <div
              v-for="setting in component.settings"
              :key="`settings-componentSettings-${component.name}-${setting.key}-${setting.isLeft}`">
              <div v-if="setting.type == 'Boolean'">
                <b-form-checkbox
                  v-model="component.settingsValues[setting.key + (setting.sideDependent ? `-${setting.isLeft}` : '')]"
                  style="user-select: none;">
                  {{ $jskos.prefLabel(setting, { language: locale }) }} {{ setting.sideDependent ? ` (${$t("general." + (setting.isLeft ? "left" : "right"))})` : "" }}
                </b-form-checkbox>
                <span class="fontSize-small text-lightGrey">
                  {{ ($jskos.languageMapContent(setting, 'definition', { language: locale }) || [])[0] }} {{ $t("general.default") }}: {{ setting.default ? $t("general.enabled") : $t("general.disabled") }}
                </span>
              </div>
              <div
                v-else-if="setting.type == 'Number'"
                v-b-tooltip.hover="{ title: $jskos.languageMapContent(setting, 'definition', { language: locale }), delay: defaults.delay.medium }">
                {{ $jskos.prefLabel(setting, { language: locale }) }} {{ setting.sideDependent ? ` (${$t("general." + (setting.isLeft ? "left" : "right"))})` : "" }}
                <b-input
                  v-model="component.settingsValues[setting.key + (setting.sideDependent ? `-${setting.isLeft}` : '')]"
                  type="number"
                  :min="setting.min"
                  :max="setting.max"
                  size="sm"
                  style="display: inline-block; width: auto;"
                  @click="$event.target.select()" />
                <br>
                <span class="fontSize-small text-lightGrey">
                  {{ ($jskos.languageMapContent(setting, 'definition', { language: locale }) || [])[0] }} {{ $t("general.default") }}: {{ setting.default }}
                </span>
              </div>
              <div
                v-else
                :class="setting.class">
                {{ $jskos.prefLabel(setting, { language: locale }) }}
              </div>
            </div>
          </div>
        </tab>
        <tab
          v-if="config.shortcuts && config.shortcuts.length"
          :title="$t('settingsTabs')[3]">
          <table
            class="table table-borderless"
            style="height: unset;">
            <tbody>
              <tr
                v-for="shortcut in config.shortcuts"
                :key="`settingsModal-shortcuts-${shortcut.id}`">
                <td>
                  <span v-html="shortcut.keys.split(',').map(keys => keys.split('+').map(key => `<kbd>${replaceKey(key)}</kbd>`).join(' + ')).join(` ${$t('general.or')} `)" />
                </td>
                <td class="text-left">
                  {{ $jskos.prefLabel(shortcut, { language: locale }) || shortcut.action }}
                </td>
              </tr>
            </tbody>
          </table>
        </tab>
        <tab
          v-if="localMappingsRegistry"
          :title="$t('settingsTabs')[4]">
          <div>
            <p>{{ $t("settings.localMappingsInfo") }}</p>
          </div>
          <div v-if="localMappingsRegistry && dlAllMappings && dlMappingsReady">
            <h4>{{ $t("settings.localDownload") }}</h4>
            <span
              v-for="(download, index) in dlMappings"
              :key="index">
              {{ download.label }} ({{ download.mappings.length }}):
              <a
                href=""
                @click.prevent="downloadFile(download.filename + '.ndjson', download.ndjson)">
                JSKOS
              </a>
              <a
                href=""
                @click.prevent="downloadFile(download.filename + '.csv', download.csv)">
                CSV
              </a>
              <br>
            </span>
            <br>
            <a
              href=""
              @click.prevent="downloadFile('mappings.ndjson', dlAllMappings)">
              {{ $t("settings.localDownloadJskos", [dlAllMappings.split("\n").length]) }}
            </a>
            <br>
            <a
              href=""
              @click.prevent="downloadFile('mappings.csv', dlAllMappingsCsv)">
              {{ $t("settings.localDownloadCsv", [dlAllMappingsCsv.split("\n").length - 2]) }}
            </a>
          </div>
          <br>
          <div v-if="localMappingsRegistry">
            <h4>{{ $t("settings.localUpload") }}</h4>
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
          <div v-if="localMappingsRegistry && dlAllMappings">
            <h4>{{ $t("settings.localDeleteTitle") }}</h4>
            <b-button
              :disabled="!dlAllMappings"
              variant="danger"
              hide-footer
              @click="deleteMappingsButtons = true">
              {{ $t("settings.localDeleteText") }}
            </b-button>
            <p
              v-if="deleteMappingsButtons">
              {{ $t("settings.localDeleteSure") }}
              <b-button
                variant="danger"
                size="sm"
                @click="deleteMappings_">
                {{ $t("general.yes") }}
              </b-button>
              <b-button
                variant="success"
                size="sm"
                @click="deleteMappingsButtons = false">
                {{ $t("general.no") }}
              </b-button>
            </p>
          </div>
          <br><br>
          <div v-if="localMappingsRegistry && dlAllMappings">
            <h4>{{ $t("settings.creatorRewriteTitle") }}</h4>
            <p v-html="$t('settings.creatorRewriteText')" />
            <p class="fontSize-small">
              <b>Name:</b> {{ $jskos.prefLabel(creator, { language: locale }) }}<br>
              <b>URI:</b> {{ creator.uri }}
            </p>
            <p>
              <b-button
                :variant="creatorRewritten ? 'success' : 'warning'"
                @click="rewriteCreator">
                {{ $t("settings.creatorRewriteButton") }}
              </b-button>
            </p>
          </div>
        </tab>
        <span class="settingsModal-footer">
          <a
            href="https://github.com/gbv/cocoda"
            target="_blank">
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
              v-b-tooltip.hover="{ title: config.buildInfo.gitCommitMessage, delay: defaults.delay.short }"
              :href="'https://github.com/gbv/cocoda/commit/' + config.buildInfo.gitCommit"
              target="_blank">
              {{ config.buildInfo.gitCommitShort }}
            </a>
          </span>
          <span v-if="config.buildInfo.buildDate">
            •
            {{ $t("settings.buildDate") }}: {{ dateToString(config.buildInfo.buildDate) }}
          </span>
          <br>
          <span>
            {{ $t("settings.suggestions1") }}
            <a
              href="https://github.com/gbv/cocoda/issues"
              target="_blank">{{ $t("settings.suggestions2") }}</a>{{ $t("settings.suggestions3") }}
          </span>
        </span>
      </tabs>
    </b-card>
  </b-modal>
</template>

<script>
import _ from "lodash"
import RegistryInfo from "./RegistryInfo.vue"
import { cdk } from "cocoda-sdk"

// Import mixins
import auth from "../mixins/auth.js"
import objects from "../mixins/cdk.js"
import computed from "../mixins/computed.js"
import { getItem } from "@/items"

/**
 * The settings modal.
 */
export default {
  name: "TheSettings",
  components: { RegistryInfo },
  mixins: [auth, objects, computed],
  props: {
    tab: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      localSettings: null,
      creatorRewritten: false,
      dlMappingsReady: false,
      dlAllMappings: null,
      dlAllMappingsCsv: null,
      dlMappings: [],
      uploadedFile: null,
      uploadedFileStatus: "",
      deleteMappingsButtons: false,
      // Debounce handler
      updateLocalSettings: _.debounce(() => {
        this.$store.commit({
          type: "settings/save",
          settings: _.cloneDeep(this.localSettings),
        })
        this.creatorRewritten = false
      }, 200),
      // Registry for languages
      languagesRegistry: cdk.initializeRegistry({
        provider: "ConceptApi",
        api: "https://bartoc.org/api/",
        schemes: [{ uri: "http://bartoc.org/en/node/20287" }],
      }),
      allLanguages: [],
      languageToAdd: "",
      addLanguageKeypress: false,
    }
  },
  computed: {
    availableMappingRegistries() {
      return this.config.registries.filter(registry => registry.isAuthorizedFor({
        type: "mappings",
        action: "create",
        user: this.user,
      }))
    },
    // List of components with name, settings, and settingsValues
    components() {
      let components = []
      for (let componentName of Object.keys(this.$store.state.settings.componentSettings)) {
        let component = {
          name: componentName,
          settings: [],
          settingsValues: {},
        }
        for (let settingKey of Object.keys(this.$store.state.settings.componentSettings[componentName])) {
          let setting = this.$store.state.settings.componentSettings[componentName][settingKey]
          for (let isLeft of setting.sideDependent ? [true, false] : [undefined]) {
            component.settings.push(Object.assign({ key: settingKey, isLeft }, setting))
            // Define getter and setter on settingsValues
            Object.defineProperty(component.settingsValues, settingKey + (setting.sideDependent ? `-${isLeft}` : ""), {
              get: () => {
                if (setting.sideDependent) {
                  return this.$settings.components[componentName][settingKey][isLeft]
                }
                return this.$settings.components[componentName][settingKey]
              },
              set: (value) => {
                // Convert value to correct type
                if (setting.type == "Boolean" && !_.isBoolean(value)) {
                  value = !!value
                }
                if (setting.type == "Number" && !_.isNumber(value)) {
                  value = parseInt(value)
                  if (isNaN(value) || value < setting.min || value > setting.max) {
                    this.$log.warn(`Tried to save invalid value for setting ${componentName} -> ${settingKey}, fallback to default value (${setting.default}).`)
                    value = setting.default
                  }
                }
                this.$store.commit({
                  type: "settings/setComponentSetting",
                  component: componentName,
                  setting: settingKey,
                  isLeft,
                  value,
                })
              },
            })
          }
        }
        components.push(component)
      }
      return components
    },
  },
  watch: {
    localSettings: {
      handler() {
        this.updateLocalSettings()
      },
      deep: true,
    },
    uploadedFile() {
      if (this.uploadedFile && this.localMappingsRegistry) {
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
              mappings.push(mapping)
            } catch(error) {
              importResult.error += 1
            }
          }
          this.postMappings({ mappings, registry: this.localMappingsRegistry, _alert: false, _refresh: false }).then(result => {
            importResult.imported = result.length
            importResult.skipped = lines.length - importResult.imported - importResult.error - importResult.empty
            this.uploadedFileStatus = `${importResult.imported} mappings imported, ${importResult.skipped} skipped, ${importResult.error} errored`
            this.$refs.fileUpload.reset()
            this.refreshDownloads()
            this.$store.commit("mapping/setRefresh", { registry: this.localMappingsRegistry })
          }).catch(error => {
            this.$log.error("TheSettings - Error uploading mappings", error)
          })
        }
        reader.readAsText(this.uploadedFile)
      }
    },
    "localSettings.creatorUri"(uri) {
      // Find name in identity and set creator
      if (this.user) {
        let name = this.user.name
        const identity = Object.values(this.user.identities).find(i => i.uri === uri)
        if (identity) {
          name = identity.name
        }
        if (name) {
          this.localSettings.creator = name
        }
      }
    },
  },
  created() {
    this.languagesRegistry.getTop({ scheme: this.languagesRegistry.schemes[0] }).then(topConcepts => {
      this.allLanguages = topConcepts
    })
  },
  methods: {
    show() {
      this.$refs.settingsModal.show()
      this.localSettings = _.cloneDeep(this.$settings)
      this.refreshDownloads()
    },
    refreshDownloads() {
      if (!this.localMappingsRegistry) {
        return
      }
      // Set download data variables
      this.dlMappingsReady = false
      this.dlAllMappings = null
      this.dlMappings = []
      let mappings = []
      this.getMappings({ registry: this.localMappingsRegistry }).then(result => {
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
              promises.push(this.loadConcepts([concept], { scheme }))
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
            let conceptInStore = getItem(concept)
            let language = this.$jskos.languagePreference.selectLanguage(_.get(conceptInStore, "prefLabel"))
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
          mapping.fromScheme = getItem(mapping.fromScheme) || mapping.fromScheme
          mapping.toScheme = getItem(mapping.toScheme) || mapping.toScheme
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
        let mappingCSV = this.$jskos.mappingCSV({
          lineTerminator: "\r\n",
          labels: true,
          creator: true,
          language: "de", // NOTE: Hardcoded language here and when preparing labels for CSV export because mappingCSV doesn't support a language override in each call (yet).
        })
        let minifiedMappings = []
        // Then, set download property and label of each combination
        for (let download of this.dlMappings) {
          // Download as JSKOS/ndjson
          download.ndjson = download.mappings.map(jskosExport).join("\n")
          // Download as CSV
          // Minify all mappings first
          download.mappings = download.mappings.map(mapping => this.$jskos.minifyMapping(mapping))
          // Add to minifiedMappings
          minifiedMappings = minifiedMappings.concat(download.mappings)
          for (let mapping of download.mappings) {
            // Prepare labels
            // ... for concepts
            for (let concept of this.$jskos.conceptsOfMapping(mapping)) {
              let conceptInStore = getItem(concept)
              let language = this.$jskos.languagePreference.selectLanguage(_.get(conceptInStore, "prefLabel"))
              if (language) {
                // NOTE: Hardcoded language, see note above.
                concept.prefLabel = { de: _.get(conceptInStore.prefLabel, language) }
              }
            }
            // ... for creator
            if (mapping.creator && mapping.creator[0]) {
              mapping.creator[0].prefLabel = { de: this.$jskos.prefLabel(mapping.creator[0], { fallbackToUri: false, language: this.locale }) }
            }
          }
          download.csv = mappingCSV.fromMappings(download.mappings)
          // Label
          download.label = (this.$jskos.notation(_.get(download, "fromScheme"), "scheme") || "?") + " to " + (this.$jskos.notation(_.get(download, "toScheme"), "scheme") || "?")
          // Filename
          download.filename = `${this.$jskos.notation(_.get(download, "fromScheme"), "scheme") || "?"}_to_${this.$jskos.notation(_.get(download, "toScheme"), "scheme") || "?"}_${this.localSettings.creator}`
        }
        // Set CSV export for all mappings
        this.dlAllMappingsCsv = mappingCSV.fromMappings(minifiedMappings)
        this.dlMappingsReady = true
      }).catch(error => {
        this.$log.error("TheSettings - Error refreshing local mappings download", error)
      })
    },
    async rewriteCreator() {
      if (!this.localMappingsRegistry) {
        return
      }
      try {
        // 1. Load all local mappings directly from API
        const mappings = await this.getMappings({ registry: this.localMappingsRegistry })
        // 2. Put all mappings (updates creator automatically)
        for (let mapping of mappings) {
          await this.putMapping({ mapping, _reload: false, _alert: false })
        }
        this.creatorRewritten = true
        this.$store.commit("mapping/setRefresh", { registry: this.localMappingsRegistry })
        this.refreshDownloads()
      } catch(error) {
        this.$log.error("TheSettings - Error rewriting creator", error)
      }
    },
    resetFlex() {
      let flex = _.cloneDeep(this.localSettings.flex)
      _.forOwn(flex, (value, key) => {
        flex[key] = ""
      })
      this.$store.commit({
        type: "settings/set",
        prop: "flex",
        value: flex,
      })
    },
    async deleteMappings_() {
      if (!this.localMappingsRegistry) {
        return
      }
      try {
        const mappings = await this.getMappings({ registry: this.localMappingsRegistry })
        await this.deleteMappings({ mappings, registry: this.localMappingsRegistry, _alert: false, _refresh: false, _trash: false })
        this.$store.commit("mapping/setRefresh", { registry: this.localMappingsRegistry })
        this.refreshDownloads()
        this.deleteMappingsButtons = false
        // Also clear mapping trash
        this.$store.commit("mapping/clearTrash")
      } catch(error) {
        this.$log.error("TheSettings - Error deleting local mappings", error)
      }
    },
    login(provider) {
      let url
      let eventType
      if (provider) {
        // Open login window
        url = provider.loginURL
        eventType = "login"
      } else {
        // Open logout window
        url = this.config.auth + "logout"
        eventType = "logout"
      }
      this.$store.commit({
        type: "auth/openWindow",
        url,
        eventType,
      })
    },
    replaceKey(key) {
      let replacements = {
        shift: "Shift",
        alt: "Alt",
        option: "Alt",
        ctrl: "Ctrl",
        meta: "Cmd",
        command: "Cmd",
      }
      return replacements[key] || key
    },
    languageConceptByTag(tag) {
      return this.allLanguages.find(c => c.notation[0] === tag)
    },
    addLanguageKeydown(event) {
      if (event.key) {
        this.addLanguageKeypress = true
      }
      if (event.key === "Enter") {
        this.addLanguage()
      }
    },
    addLanguageInput() {
      if (!this.addLanguageKeypress) {
        this.addLanguage()
      }
      this.addLanguageKeypress = false
    },
    addLanguage() {
      const tag = this.languageToAdd.split(" ")[0]
      if (this.allLanguages.length === 0 || this.allLanguages.find(lang => lang.notation[0] === tag)) {
        this.localSettings.preferredLanguages.push(tag)
        this.languageToAdd = ""
      }
    },
    removeLanguage(lang) {
      this.localSettings.preferredLanguages = this.localSettings.preferredLanguages.filter(l => l !== lang)
    },
    moveLanguage(fromIndex, direction) {
      const toIndex = fromIndex + direction
      if (toIndex === -1 || toIndex === this.localSettings.preferredLanguages.length) {
        return
      }
      const lang = this.localSettings.preferredLanguages[fromIndex]
      this.localSettings.preferredLanguages.splice(fromIndex, 1)
      this.localSettings.preferredLanguages.splice(toIndex, 0, lang)
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

p {
  margin: 5px 0 20px 0 !important;
}

.settings-sources {
  padding: 6px 5px;
}
.selected-registry {
  background-color: @color-select-2;
}
.settingsModal-mapping-registry {
  display: flex;
  justify-content: center;
  align-items: center;
}
.settingsModal-mapping-registry:hover {
  background-color: @color-primary-5;
  cursor: pointer;
}
// First Child: Checkbox
.settingsModal-mapping-registry > div:first-child {
  flex: none;
  margin-left: 5px;
  margin-right: -5px;
}
// Last Child: Registry Info
.settingsModal-mapping-registry > div:last-child {
  flex: 1;
}
.settingsModal-componentSettings-component {
  margin-bottom: 20px;
}
.settingsModal-componentSettings-component > div {
  margin-bottom: 5px;
}
.settingsModal-footer {
  padding: .75rem 1.25rem;
  background-color: #00000008;
  border-top: 1px solid rgba(0,0,0,.125);
}
</style>

<style>

#settingsModal h4 {
  padding-top: 15px;
}

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
  /* Note: This is a Firefox workaround. Footer will be hidden if the content is too tall. */
  overflow: hidden;
}
#settingsModal .modal-body .card .cocoda-vue-tabs {
  height: 100%;
}
#settingsModal .modal-body .card .cocoda-vue-tabs .cocoda-vue-tabs-content {
  padding: 20px 20px 5px 20px;
}

</style>
