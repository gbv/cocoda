<template>
  <span
    v-b-tooltip.html.right="tooltip ? tooltipHtml : ''"
    v-html="registryName" />
</template>

<script>
import computed from "@/mixins/computed.js"
import { getRegistryName } from "@/utils"

export default {
  name: "RegistryName",
  mixins: [computed],
  props: {
    registry: {
      type: Object,
      default: null,
    },
    tooltip: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    registryName() {
      return getRegistryName({ registry: this.registry, locale: this.locale })
    },
    tooltipHtml() {
      return this.$jskos.definition(this.registry, { language: this.locale }).join("<br>")
    },
  },
}
</script>
