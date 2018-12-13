<template>
  <span
    v-b-tooltip.html.right="tooltip"
    v-html="registryName" />
</template>

<script>
export default {
  name: "RegistryName",
  props: {
    registry: {
      type: Object,
      default: null
    }
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
    tooltip() {
      return this.$util.definition(this.registry).join("<br>")
    },
  }
}
</script>
