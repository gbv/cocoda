<template>
  <span v-html="providerName" />
</template>

<script>
export default {
  name: "ProviderName",
  props: {
    provider: {
      type: Object,
      default: null
    }
  },
  computed: {
    providerName: function () {
      let label = this.$util.prefLabel(this.provider)
      let notation = this.$util.notation(this.provider)
      if (label) {
        return label.replace(notation, function () { return "<b>"+notation+"</b>" })
      } else {
        notation = 0
        return notation || "?"
      }
    }
  }
}
</script>
