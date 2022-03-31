<template>
  <b-modal
    ref="addConcordanceModal"
    :title="$t('concordanceEditor.addConcordance')"
    class="fontSize-normal"
    centered
    hide-footer
    size="md">
    <p>
      <b>{{ $t("schemeSelection.source") }}:</b><br>
      <item-name
        v-if="fromScheme"
        :font-size="'large'"
        :item="fromScheme" />
      <span v-else>
        {{ $t("concordanceEditor.pleaseSelect") }}
      </span>
    </p>
    <p>
      <b>{{ $t("schemeSelection.target") }}:</b><br>
      <item-name
        v-if="toScheme"
        :font-size="'large'"
        :item="toScheme" />
      <span v-else>
        {{ $t("concordanceEditor.pleaseSelect") }}
      </span>
    </p>
    <p>
      <b>Notation:</b>
      <b-input
        v-model="notation"
        type="text"
        :placeholder="notationDefault"
        :disabled="editing" />
    </p>
    <p>
      <b>{{ $t("mappingBrowser.description") }}:</b>
      <span
        v-for="lang in config.languages"
        :key="lang">
        <b-input
          v-model="description[lang]"
          type="text"
          :placeholder="$t('mappingBrowser.description')" />
        <sup class="text-lightGrey">{{ lang }}</sup>
      </span>
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
  </b-modal>
</template>

<script>
import ItemName from "./ItemName.vue"

import computed from "../mixins/computed.js"
import cdk from "../mixins/cdk.js"

import _ from "lodash"
import jskos from "jskos-tools"

/**
 * ...
 *
 * TODO:
 * - additional contributors
 */
export default {
  name: "ConcordanceEditorModal",
  components: { ItemName },
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
      }
      for (const lang of this.config.languages) {
        if (this.description[lang]) {
          if (!concordance.scopeNote) {
            concordance.scopeNote = {}
          }
          concordance.scopeNote[lang] = [this.description[lang]]
        }
      }
      return concordance
    },
    canCreate() {
      return this.canCreateConcordance({ concordance: this._concordance })
    },
    currentRegistry() {
      return this.$store.getters.getCurrentRegistry
    },
  },
  watch: {
    concordance() {
      if (this.concordance) {
        this.notation = _.get(this.concordance, "notation[0]", "")
        for (const lang of this.config.languages) {
          this.$set(this.description, lang, _.get(this.concordance, `scopeNote.${lang}[0]`, ""))
        }
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
    },
    async addConcordance() {
      console.log(this.description.en, this.description.de)
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
      } })
      if (concordance) {
        this.hide()
      }
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

</style>
