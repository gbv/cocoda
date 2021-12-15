<template>
  <span
    v-b-tooltip.hover="{ title: tooltip, delay: defaults.delay.medium }">
    {{ dateShort }}
  </span>
</template>

<script>
import { computed, defineComponent } from "@vue/composition-api"

export default defineComponent({
  props: {
    date: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const dateShort = computed(() => props.date.slice(0, 10))
    const tooltip = computed(() => props.date.length > 10 ? props.date.replace("T", " ").replace("Z", " (UTC)") : null)
    return {
      dateShort,
      tooltip,
    }
  },
})
</script>
