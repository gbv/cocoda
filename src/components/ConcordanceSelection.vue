<template>
  <div>
    <b-form-select
      v-if="canRemoveMappingFromConcordance({ mapping, user }) || availableTargetConcordances.length > 0"
      size="sm"
      :options="concordanceOptions"
      :value="mapping.partOf && mapping.partOf[0] && mapping.partOf[0].uri || null"
      @change="changeConcordance" />
    <span v-else>
      {{ (mapping.partOf && mapping.partOf[0]) ? displayNameForConcordance(mapping.partOf[0]) : $t("mappingDetail.partOfNone") }}
    </span>
  </div>
</template>

<script>
import cdk from "../mixins/cdk.js"
import { displayNameForConcordance } from "@/utils"

export default {
  name: "ConcordanceSelection",
  mixins: [cdk],
  props: {
    mapping: {
      type: Object,
      default: null,
    },
    registry: {
      type: Object,
      default: null,
    },
  },
  computed: {
    isExistingMapping() {
      return !!this.mapping._registry
    },
    availableTargetConcordances() {
      return this.concordances.filter(concordance => this.canAddMappingToConcordance({
        registry: this.registry,
        mapping: this.mapping,
        concordance,
        user: this.user,
        isExistingMapping: this.isExistingMapping,
      }))
    },
    concordanceOptions() {
      let options = [
        { value: null, text: this.$t("mappingDetail.partOfNone") },
      ]
      for (let concordance of this.availableTargetConcordances) {
        let text = this.displayNameForConcordance(concordance)
        options.push({
          value: concordance.uri,
          text,
        })
      }

      return options
    },
  },
  methods: {
    displayNameForConcordance,
    async changeConcordance(uri) {
      const concordance = this.availableTargetConcordances.find(c => this.$jskos.compare(c, { uri }))
      // Behavior depends on whether the mapping already exists
      if (this.isExistingMapping) {
        await this.addMappingToConcordance({ mapping: this.mapping, concordance })
      }
      this.$emit("change", concordance)
    },
  },
}
</script>
