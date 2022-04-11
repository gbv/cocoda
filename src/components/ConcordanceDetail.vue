<template>
  <div>
    <b-modal
      ref="concordanceDetail"
      :title="$t('mappingBrowser.concordanceDetailTitle')"
      class="fontSize-normal"
      centered
      hide-footer
      no-enforce-focus
      size="lg">
      <div v-if="concordance">
        <b-container
          class="concordanceDetail-container"
          fluid>
          <!-- Source Scheme -->
          <b-row>
            <b-col cols="3">
              {{ $t("mappingDetail.sourceScheme") }}:
            </b-col>
            <b-col>
              <item-name
                :draggable="false"
                :item="concordance.fromScheme" />
            </b-col>
          </b-row>
          <!-- Target Scheme -->
          <b-row>
            <b-col cols="3">
              {{ $t("mappingDetail.targetScheme") }}:
            </b-col>
            <b-col>
              <item-name
                :draggable="false"
                :item="concordance.toScheme" />
            </b-col>
          </b-row>
          <!-- Description -->
          <b-row v-if="concordance.scopeNote">
            <b-col cols="3">
              {{ $t("mappingBrowser.description") }}:
            </b-col>
            <b-col>
              <p
                v-for="(language) in Object.keys(concordance.scopeNote)"
                :key="`concordanceDetail-scopeNote-${language}`">
                {{ concordance.scopeNote[language].join(";") }}
                <sup class="text-lightGrey">{{ language }}</sup>
              </p>
            </b-col>
          </b-row>
          <!-- Creator -->
          <b-row>
            <b-col cols="3">
              {{ $t("mappingDetail.creator") }}:
            </b-col>
            <b-col>
              <p
                v-for="(creator, index) in concordance.creator || []"
                :key="`concordanceDetail-creator-${index}`">
                <auto-link
                  :link="creator.url || creator.uri"
                  :text="$jskos.prefLabel(creator)" />
              </p>
            </b-col>
          </b-row>
          <!-- Created -->
          <b-row>
            <b-col cols="3">
              {{ $t("mappingDetail.created") }}:
            </b-col>
            <b-col><date-string :date="concordance.created" /></b-col>
          </b-row>
          <!-- Modified -->
          <b-row>
            <b-col cols="3">
              {{ $t("mappingDetail.modified") }}:
            </b-col>
            <b-col><date-string :date="concordance.modified" /></b-col>
          </b-row>
          <!-- Distributions -->
          <b-row v-if="concordance.distributions && concordance.distributions.length">
            <b-col cols="3">
              {{ $t("mappingBrowser.download") }}:
            </b-col>
            <b-col>
              <span
                v-for="(distribution, index) in concordance.distributions"
                :key="index">
                <a
                  v-if="nameOfDistribution(distribution)"
                  :href="distribution.download">
                  {{ nameOfDistribution(distribution) }}
                </a>
              </span>
            </b-col>
          </b-row>
          <!-- Extent -->
          <b-row>
            <b-col cols="3">
              {{ $t("registryInfo.mappings") }}:
            </b-col>
            <b-col>{{ concordance.extent }}</b-col>
          </b-row>
          <!-- Identifier -->
          <b-row v-if="concordance.uri || concordance.identifier">
            <b-col cols="3">
              {{ $t("mappingDetail.identifier") }}:
            </b-col>
            <b-col>
              <p
                v-for="(identifier, index) in [concordance.uri].concat(concordance.identifier).filter(id => id != null)"
                :key="`concordanceDetail-identifier-${index}`">
                <auto-link
                  :class="{
                    'fontWeight-heavy': identifier == concordance.uri
                  }"
                  :link="identifier" />
              </p>
            </b-col>
          </b-row>
          <!-- Registry -->
          <b-row v-if="concordance._registry">
            <b-col cols="3">
              {{ $t("schemeSelection.registryFilter") }}:
            </b-col>
            <b-col>
              <registry-info
                :registry="concordance._registry"
                :show-details="false"
                :show-capabilities="false" />
            </b-col>
          </b-row>
        </b-container>
      </div>
      <div
        v-b-tooltip.hover="{ title: $t('dataModal.button'), delay: defaults.delay.medium }"
        class="dataModalButton"
        @click="$refs.dataModal.show()">
        <font-awesome-icon icon="code" />
      </div>
    </b-modal>
    <data-modal
      v-if="concordance"
      ref="dataModal"
      :data="concordance"
      :url="concordance.uri"
      type="concordance" />
  </div>
</template>

<script>
import DataModal from "./DataModal.vue"
import ItemName from "./ItemName.vue"
import AutoLink from "./AutoLink.vue"
import RegistryInfo from "./RegistryInfo.vue"
import DateString from "./DateString.vue"

import computed from "../mixins/computed.js"

/**
 * A component (bootstrap modal) that allows viewing and exporting JSKOS data.
 */
export default {
  name: "ConcordanceDetail",
  components: { DataModal, ItemName, AutoLink, RegistryInfo, DateString },
  mixins: [computed],
  props: {
    /**
     * Concordance object
     */
    concordance: {
      type: Object,
      default: null,
    },

  },
  methods: {
    show() {
      this.$refs.concordanceDetail.show()
    },
    nameOfDistribution(distribution) {
      let mimetype = distribution.mimetype
      if (mimetype.includes("json")) {
        return "JSKOS"
      }
      if (mimetype.includes("csv")) {
        return "CSV"
      }
      return null
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.concordanceDetail-container > .row {
  margin-bottom: 10px;
}

.concordanceDetail-container > .row > .col-3 {
  text-align: right;
}

.concordanceDetail-container p {
  margin: 0 !important;
}

</style>
