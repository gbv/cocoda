<template>
  <div class="registry-info">
    <div class="settings-info-title fontWeight-heavy">
      {{ $util.prefLabel(registry) }}
    </div>
    <div class="settings-info-uri">
      <auto-link :link="registry.uri" />
    </div>
    <div class="settings-info-definition">
      {{ $util.definition(registry).join(" ") }}
    </div>
    <div class="settings-info-capabilities">
      <span
        v-for="type in ['schemes', 'concepts', 'mappings', 'occurrences']"
        :key="`settings-info-capabilities-${type}`" >
        <span v-if="registry.provider.has[type]">
          <font-awesome-icon
            v-if="registry.provider.has[type]"
            style="color: green; margin-left: 5px;"
            icon="check" />
          {{ type }}
        </span>
      </span>
    </div>
  </div>
</template>

<script>
import AutoLink from "./AutoLink"

export default {
  name: "RegistryNotation",
  components: { AutoLink },
  props: {
    registry: {
      type: Object,
      default: null
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";
</style>
