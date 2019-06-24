<template>
  <span
    v-b-tooltip.html.right="tooltip ? tooltipHtml : ''"
    v-html="registryName" />
</template>

<script>
export default {
  name: "RegistryName",
  props: {
    registry: {
      type: Object,
      default: null
    },
    tooltip: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    registryName: function () {
      let label = this.$util.prefLabel(this.registry)
      let notation = this.$util.notation(this.registry)
      if (label) {
        return label.replace(notation, function () { return "<b>"+notation+"</b>" })
      } else {
        notation = 0
        return notation || "?"
      }
    },
    tooltipHtml() {
      return this.$util.definition(this.registry).join("<br>")
    },
  }
}
</script>
