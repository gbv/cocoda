<template>
  <!-- Generic layout (i.e. for ConceptDetail.vue) -->
  <ul
    v-if="searchLinks.length"
    style="margin-bottom: 0;">
    <li
      v-for="(searchLink, index) in searchLinks"
      :key="`${listKeyPrefix}-${index}`">
      <a
        :href="searchLink.url"
        target="_blank">
        {{ searchLink.label }}
      </a>
    </li>
  </ul>
</template>
  
<script>
export default {
  props: {
    searchLinks: {
      type: Array,
      required: true,
    },
    listKeyPrefix: {
      type: String,
      required: true,
    },
  },
}
</script>
  