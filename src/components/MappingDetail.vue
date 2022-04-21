<template>
  <div>
    <b-modal
      ref="mappingDetail"
      :title="$t('mappingDetail.title')"
      class="fontSize-normal"
      centered
      hide-footer
      no-enforce-focus
      size="lg">
      <div v-if="mapping">
        <b-container
          class="mappingDetail-container"
          fluid>
          <!-- Source Scheme -->
          <b-row>
            <b-col cols="3">
              {{ $t("mappingDetail.sourceScheme") }}:
            </b-col>
            <b-col>
              <item-name
                :draggable="false"
                :item="mapping.fromScheme" />
            </b-col>
          </b-row>
          <!-- Source Concepts -->
          <b-row>
            <b-col cols="3">
              {{ $tc("mappingDetail.sourceConcept", $jskos.conceptsOfMapping(mapping, 'from').length) }}:
            </b-col>
            <b-col>
              <p
                v-for="concept in $jskos.conceptsOfMapping(mapping, 'from')"
                :key="`mappingDetail-from-${concept.uri}`">
                <item-name
                  :draggable="false"
                  :item="concept" />
              </p>
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
                :item="mapping.toScheme" />
            </b-col>
          </b-row>
          <!-- Target Concepts -->
          <b-row>
            <b-col cols="3">
              {{ $tc("mappingDetail.targetConcept", $jskos.conceptsOfMapping(mapping, 'to').length) }}:
            </b-col>
            <b-col>
              <p
                v-for="concept in $jskos.conceptsOfMapping(mapping, 'to')"
                :key="`mappingDetail-to-${concept.uri}`">
                <item-name
                  :draggable="false"
                  :item="concept" />
              </p>
            </b-col>
          </b-row>
          <!-- Mapping Type -->
          <b-row v-if="mapping.type && mapping.type.length">
            <b-col cols="3">
              {{ $t("mappingDetail.mappingType") }}:
            </b-col>
            <b-col>
              <a
                :href="$jskos.mappingTypeByType(mapping.type).uri"
                target="_blank">
                {{ $jskos.prefLabel($jskos.mappingTypeByType(mapping.type), { language: locale }) }} ({{ $jskos.notation($jskos.mappingTypeByType(mapping.type)) }})
              </a>
            </b-col>
          </b-row>
          <!-- Creator -->
          <b-row>
            <b-col cols="3">
              {{ $t("mappingDetail.creator") }}:
            </b-col>
            <b-col>
              <p
                v-for="(creator, index) in mapping.creator || []"
                :key="`mappingDetail-creator-${index}`">
                <auto-link
                  :link="creator.url || creator.uri"
                  :text="$jskos.prefLabel(creator)" />
              </p>
            </b-col>
          </b-row>
          <!-- Contributor -->
          <b-row v-if="contributors.length">
            <b-col cols="3">
              {{ $t("mappingDetail.contributor") }}:
            </b-col>
            <b-col>
              <p
                v-for="(contributor, index) in contributors"
                :key="`mappingDetail-contributor-${index}`">
                <auto-link
                  :link="contributor.url || contributor.uri"
                  :text="$jskos.prefLabel(contributor)" />
              </p>
            </b-col>
          </b-row>
          <!-- Created -->
          <b-row>
            <b-col cols="3">
              {{ $t("mappingDetail.created") }}:
            </b-col>
            <b-col><date-string :date="mapping.created" /></b-col>
          </b-row>
          <!-- Modified -->
          <b-row>
            <b-col cols="3">
              {{ $t("mappingDetail.modified") }}:
            </b-col>
            <b-col><date-string :date="mapping.modified" /></b-col>
          </b-row>
          <!-- Annotations -->
          <b-row
            v-if="mapping.annotations && mapping.annotations.length"
            style="position: relative;">
            <b-col cols="3">
              {{ $t("mappingDetail.annotations") }}:
            </b-col>
            <b-col>
              <annotation-list
                :annotations="mapping.annotations"
                :provider="mapping._registry" />
            </b-col>
            <div
              v-b-tooltip.hover="{ title: $t('dataModal.button'), delay: defaults.delay.medium }"
              class="dataModalButton"
              @click="$refs.dataModalAnnotations.show()">
              <font-awesome-icon icon="code" />
            </div>
          </b-row>
          <!-- PartOf -->
          <b-row>
            <b-col cols="3">
              {{ $t("mappingDetail.partOf") }}:
            </b-col>
            <b-col>
              <concordance-selection :mapping="mapping" />
            </b-col>
          </b-row>
          <!-- Identifier -->
          <b-row v-if="mapping.uri || mapping.identifier">
            <b-col cols="3">
              {{ $t("mappingDetail.identifier") }}:
            </b-col>
            <b-col>
              <p
                v-for="(identifier, index) in [mapping.uri].concat(mapping.identifier).filter(id => id != null)"
                :key="`mappingDetail-identifier-${index}`">
                <auto-link
                  :class="{
                    'fontWeight-heavy': identifier == mapping.uri
                  }"
                  :link="identifier" />
              </p>
            </b-col>
          </b-row>
          <!-- Catalog enrichments -->
          <b-row v-if="catalogEnrichmentLink">
            <b-col cols="3">
              {{ $t("mappingDetail.catalogEnrichment") }}:
            </b-col>
            <b-col>
              <auto-link
                :link="catalogEnrichmentLink" />
            </b-col>
          </b-row>
          <!-- Registry -->
          <b-row v-if="mapping._registry">
            <b-col cols="3">
              {{ $t("schemeSelection.registryFilter") }}:
            </b-col>
            <b-col>
              <registry-info
                :registry="mapping._registry"
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
      v-if="mapping"
      ref="dataModal"
      :data="mapping"
      :url="mapping.uri"
      type="mapping" />
    <data-modal
      v-if="mapping && mapping.annotations && mapping.annotations.length"
      ref="dataModalAnnotations"
      :data="mapping.annotations"
      type="annotation" />
  </div>
</template>

<script>
import DataModal from "./DataModal.vue"
import ItemName from "./ItemName.vue"
import AutoLink from "./AutoLink.vue"
import AnnotationList from "./AnnotationList.vue"
import RegistryInfo from "./RegistryInfo.vue"
import DateString from "./DateString.vue"
import ConcordanceSelection from "./ConcordanceSelection.vue"

import computed from "../mixins/computed.js"

/**
 * A component (bootstrap modal) that allows viewing and exporting JSKOS data.
 */
export default {
  name: "MappingDetail",
  components: { DataModal, ItemName, AutoLink, AnnotationList, RegistryInfo, DateString, ConcordanceSelection },
  mixins: [computed],
  props: {
    /**
     * Mapping object
     */
    mapping: {
      type: Object,
      default: null,
    },

  },
  computed: {
    catalogEnrichmentLink() {
      if (!this.mapping || !this.mapping.uri || !this.mapping.uri.startsWith("https://coli-conc.gbv.de/api/mappings/")) {
        return null
      }
      return "https://opac.k10plus.de/DB=2.299/CMD?ACT=SRCHA&IKT=8659&TRM=" + this.mapping.uri.replace(/[\W_]+/g,"+")
    },
    contributors() {
      return (this.mapping.contributor || []).filter(c => !this.$jskos.isContainedIn(c, this.mapping.creator))
    },
  },
  methods: {
    show() {
      this.$refs.mappingDetail.show()
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.mappingDetail-container > .row {
  margin-bottom: 10px;
}

.mappingDetail-container > .row > .col-3 {
  text-align: right;
}

.mappingDetail-container p {
  margin: 0 !important;
}

</style>
