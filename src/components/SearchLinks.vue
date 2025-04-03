<template v-if="searchLinks.length">
  <!-- Specific layout with BootstrapVue (i.e. for MappingDetail.vue) -->
  <b-row v-if="layoutMode === 'bootstrap' ">
    <b-col
      cols="3"
      style="text-align: end;">
      {{ title }}
    </b-col>
    <b-col
      :key="`${componentName}-searchLinks`"
      :title="title">
      <ul style="margin-bottom: 0;">
        <li
          v-for="(searchLink, index) in searchLinks"
          :key="`searchLink-${index}`">
          <a
            :href="searchLink.url"
            target="_blank">
            {{ searchLink.label }}
          </a>
        </li>
      </ul>
    </b-col>
  </b-row>
  
  <!-- Generic layout (i.e. for ConceptDetail.vue) -->
  <ul
    v-else
    style="margin-bottom: 0;">
    <li
      v-for="(searchLink, index) in searchLinks"
      :key="`searchLink-${isLeft}-${index}`">
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
    isLeft: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: "Search Links",
    },
    layoutMode: {
      type: String,
      default: "default",
    },
    componentName: {
      type: String,
      default: "MappingDetail",
    },
  },
}
</script>
  