<template>
  <ul
    v-if="links.length"
    style="margin: 0;">
    <li
      v-for="(link, index) in links"
      :key="`${keyPrefix}-${index}`">
      <a
        :href="link.url"
        target="_blank">
        {{ link.label }}
      </a>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    links: {
      type: Array,
      required: true,
    },
    keyPrefix: {
      type: String,
      required: true,
    },
  },
}
</script>
