<template>
  <div class="fontSize-small">
    <template v-for="({ sources, languages, margin, classes }, text, index) in contentMap">
      <div
        :key="index"
        :style="`margin-bottom: ${margin ? 5 : 0}px;`"
        :class="classes || ''">
        <span @click="$emit('click', text)">
          {{ text }}
        </span>
        <sup class="text-lightGrey">{{ sources.join(", ") }}; {{ languages.join(", ") }}</sup>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: "ContentMap",
  props: {
    contentMap: {
      type: Object,
      required: true,
    },
  },
}
</script>
