<template>
  <span>
    {{ dateShort }}
  </span>
</template>

<script>
import { computed, defineComponent } from "@/composition-api"

export default defineComponent({
  props: {
    date: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const dateShort = computed(() => props.date.slice(0, 10))
    return {
      dateShort,
    }
  },
})
</script>
