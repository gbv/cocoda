<template>
  <b-modal
    ref="addConcordanceModal"
    :title="$t(editing ? 'concordanceEditor.editConcordance' : 'concordanceEditor.addConcordance')"
    class="fontSize-normal"
    centered
    hide-footer
    size="md">
    <p>
      <b>{{ $t("schemeSelection.source") }}</b>
      <item-suggest
        v-if="!editing && !fromScheme"
        :search="searchSchemes"
        @select="selectScheme({ isLeft: true, scheme: $event })" />
      <br v-else>
      <item-name
        v-if="fromScheme"
        :font-size="'large'"
        :item="fromScheme" />
      <span
        v-else
        class="concordanceEditor-subtitle">
        {{ $t("concordanceEditor.pleaseSelect") }}
      </span>
      <font-awesome-icon
        v-if="fromScheme"
        v-b-tooltip.hover="{ title: $t('general.clearScheme'), delay: defaults.delay.medium }"
        class="button"
        style="margin: -3px 2px 0px 4px;"
        icon="times-circle"
        @click="selectScheme({ isLeft: true, scheme: null })" />
    </p>
    <p>
      <b>{{ $t("schemeSelection.target") }}</b>
      <item-suggest
        v-if="!editing && !toScheme"
        :search="searchSchemes"
        @select="selectScheme({ isLeft: false, scheme: $event })" />
      <br v-else>
      <item-name
        v-if="toScheme"
        :font-size="'large'"
        :item="toScheme" />
      <span
        v-else
        class="concordanceEditor-subtitle">
        {{ $t("concordanceEditor.pleaseSelect") }}
      </span>
      <font-awesome-icon
        v-if="toScheme"
        v-b-tooltip.hover="{ title: $t('general.clearScheme'), delay: defaults.delay.medium }"
        class="button"
        style="margin: -3px 2px 0px 4px;"
        icon="times-circle"
        @click="selectScheme({ isLeft: false, scheme: null })" />
    </p>
    <p>
      <b>Notation</b>
      <b-input
        v-model="notation"
        type="text"
        size="sm"
        :placeholder="notationDefault"
        :disabled="editing" />
      <span class="concordanceEditor-subtitle">{{ $t("concordanceEditor.notationSubtext") }}</span>
    </p>
    <p>
      <b>{{ $t("mappingBrowser.description") }}</b>
      <span
        v-for="lang in config.languages"
        :key="lang">
        <b-input
          v-model="description[lang]"
          type="text"
          size="sm"
          :placeholder="$t('mappingBrowser.description')" />
        <span class="concordanceEditor-subtitle">{{ $t(`languages.${lang}`) }} ({{ lang }})</span>
      </span>
    </p>
    <p>
      <b>{{ $t("concordanceEditor.contributor") }}</b>
      <b-form-textarea
        v-model="contributor"
        rows="3"
        max-rows="6"
        size="sm"
        style="margin-bottom: 3px;" />
      <span class="concordanceEditor-subtitle">{{ $t("concordanceEditor.contributorSubtextDefault") }}</span>
      <span
        v-if="contributorSubtextError"
        class="concordanceEditor-subtitle">{{ contributorSubtextError }}</span>
    </p>
    <p>
      <b-button
        v-if="editing"
        variant="primary"
        @click="saveChanges">
        {{ $t("concordanceEditor.save") }}
      </b-button>
      <b-button
        v-else
        variant="primary"
        :disabled="!canCreate"
        @click="addConcordance">
        {{ $t("concordanceEditor.addConcordance") }}
      </b-button>
    </p>
    <p v-if="editing && canDeleteConcordance({ concordance })">
      <b>{{ $t("concordanceEditor.deleteConcordanceTitle") }}</b><br>
      <b-button
        variant="danger"
        @click="deleteConcordance({ concordance }); hide()">
        {{ $t("concordanceEditor.deleteConcordanceButton") }}
      </b-button>
      <span class="concordanceEditor-subtitle">{{ $t("concordanceEditor.deleteConcordanceSubtitle") }}</span>
    </p>
  </b-modal>
</template>

<script>
import ItemName from "./ItemName.vue"
import ItemSuggest from "./ItemSuggest.vue"

import computed from "@/mixins/computed.js"
import cdk from "@/mixins/cdk.js"

import _ from "lodash"
import jskos from "jskos-tools"
import { compareItems, getItem } from "@/items"

/**
 * ...
 */
export default {
  name: "ConcordanceEditorModal",
  components: { ItemName, ItemSuggest },
  mixins: [computed, cdk],
  props: {
    /**
     * Concordance object to be edited. If empty, a new concordance will be created.
     */
    concordance: {
      type: Object,
      default: () => null,
    },
  },
  data() {
    return {
      notation: "",
      description: {},
      contributor: "",
    }
  },
  computed: {
    editing() {
      return !!this.concordance
    },
    fromScheme() {
      return this.editing ? this.concordance.fromScheme : this.selected.scheme[true]
    },
    toScheme() {
      return this.editing ? this.concordance.toScheme : this.selected.scheme[false]
    },
    notationDefault() {
      const fromSchemeNotation = this.getNotation(this.fromScheme).toLowerCase()
      const toSchemeNotation = this.getNotation(this.toScheme).toLowerCase()
      let notation = `${fromSchemeNotation}-${toSchemeNotation}`
      let index = null
      while (this.concordances.find(c => jskos.notation(c) === notation)) {
        if (index) {
          index += 1
        } else {
          index = 2
        }
        notation = `${fromSchemeNotation}-${toSchemeNotation}-${index}`
      }
      return notation
    },
    _concordance() {
      const concordance = {
        notation: [this.notation || this.notationDefault],
        fromScheme: this.fromScheme ? { uri: this.fromScheme.uri } : null,
        toScheme: this.toScheme ? { uri: this.toScheme.uri } : null,
        contributor: this.contributorArray,
      }
      for (const lang of this.config.languages) {
        if (this.description[lang]) {
          if (!concordance.scopeNote) {
            concordance.scopeNote = {}
          }
          concordance.scopeNote[lang] = [this.description[lang]]
        }
      }
      // Allow explicit removal of scopeNote
      if (this.concordance?.scopeNote && !concordance.scopeNote) {
        concordance.scopeNote = null
      }
      return concordance
    },
    canCreate() {
      return this.canCreateConcordance({ concordance: this._concordance })
    },
    currentRegistry() {
      return this.$store.getters.getCurrentRegistry
    },
    contributorArray() {
      return this.contributor.split("\n").filter(Boolean).map(entry => {
        const [, uri = "", name] = entry.match(/([^ ]+)\s*(.*)/) || [null, entry]
        const contributor = { uri }
        if (name) {
          contributor.prefLabel = { en: name }
        }
        return contributor
      })
    },
    contributorSubtextError() {
      const invalidContributorLineNumbers = []
      let line = 1
      for (const contributor of this.contributorArray) {
        if (!this.$jskos.isValidUri(contributor.uri)) {
          invalidContributorLineNumbers.push(line)
        }
        line += 1
      }
      if (invalidContributorLineNumbers.length) {
        return `${this.$t("concordanceEditor.contributorSubtextInvalidPrefix")} ${invalidContributorLineNumbers.join(", ")}.`
      }
      return null
    },
  },
  watch: {
    concordance() {
      if (this.concordance) {
        this.notation = _.get(this.concordance, "notation[0]", "")
        for (const lang of this.config.languages) {
          this.$set(this.description, lang, _.get(this.concordance, `scopeNote.${lang}[0]`, ""))
        }
        this.contributor = (this.concordance.contributor || []).map(c => {
          let line = c.uri
          const name = this.$jskos.prefLabel(c, { fallbackToUri: false })
          if (name) {
            line += ` ${name}`
          }
          return line
        }).join("\n")
      } else {
        this.reset()
      }
    },
  },
  created() {
    this.reset()
  },
  methods: {
    show() {
      this.$refs.addConcordanceModal.show()
    },
    hide() {
      this.$refs.addConcordanceModal.hide()
    },
    reset() {
      this.notation = ""
      for (const lang of this.config.languages) {
        this.$set(this.description, lang, "")
      }
      this.contributor = ""
    },
    async addConcordance() {
      const concordance = await this.postConcordance({ concordance: this._concordance })
      if (concordance) {
        this.reset()
        this.hide()
      }
    },
    async saveChanges() {
      const concordance = await this.patchConcordance({ concordance: {
        uri: this.concordance.uri,
        scopeNote: this._concordance.scopeNote,
        contributor: this._concordance.contributor,
      } })
      if (concordance) {
        this.hide()
      }
    },
    async searchSchemes(query) {
      query = query.toLowerCase()
      const results = this.schemes.map(scheme => getItem(scheme)).filter(
        scheme => (scheme.notation || []).concat(Object.values(scheme.prefLabel || {})).join("").toLowerCase().includes(query),
      )
      // Convert to OpenSearch Suggest Format
      const result = [query]
      result[1] = results.map(r => jskos.notation(r) + " " + jskos.prefLabel(r))
      result[2] = results.map(() => "")
      result[3] = results.map(r => r.uri)
      return result
    },
    selectScheme({ isLeft, scheme }) {
      if (compareItems(scheme, this.selected.scheme[isLeft])) {
        return
      }
      this.setSelected({
        isLeft,
        scheme,
      })
    },
  },
}
</script>

<style lang="less" scoped>
@import "@/style/main.less";

p {
  margin: 10px 0 !important;
}

.concordanceEditor-subtitle {
  .text-lightGrey;
  .fontSize-verySmall;
  display:block;
  line-height: 1.3;
  margin: 2px 0 4px 3px;
}

</style>
