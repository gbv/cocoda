<template>
  <span>
    {{ dateShort }}
  </span>
</template>

<script>
import { computed, defineComponent } from "vue"

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

<style lang="less" scoped>
/*
 * Vue 2's template compiler condensed the whitespace around an interpolation
 * to a single space on either side and rendered `<span> 2018-09-12 </span>`.
 * Vue 3 drops whitespace-only text at an element's edges, so the date now sits
 * flush against whatever precedes or follows it -- the scheme and concept
 * details place a date right after its label and right before the next one,
 * and read "Created:2018-09-12Modified:". Set as padding so every caller gets
 * the spacing back at once.
 */
span {
  padding: 0 0.28em;
}
</style>
