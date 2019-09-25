<template>
  <div class="registry-info">
    <div>
      <registry-notation
        :registry="registry"
        :disabled="$store.state.settings.settings.mappingBrowserShowRegistry[registry.uri] === false"
        :tooltip="false" />
      <div
        class="settings-info-title"
        :class="{
          'fontWeight-heavy': $store.state.settings.settings.mappingBrowserShowRegistry[registry.uri] !== false
        }"
        style="display: inline-block">
        {{ $util.prefLabel(registry) }}
      </div>
    </div>
    <div class="settings-info-definition">
      {{ $util.definition(registry).join(" ") }}
    </div>
    <div class="settings-info-uri fontSize-small">
      <auto-link :link="registry.uri" />
    </div>
    <div
      v-if="showCapabilities"
      class="settings-info-capabilities">
      <span
        v-for="type in ['schemes', 'concepts', 'mappings', 'occurrences']"
        :key="`settings-info-capabilities-${type}`">
        <span v-if="registry.provider.has[type]">
          <font-awesome-icon
            v-if="registry.provider.has[type]"
            style="color: green; margin-left: 5px;"
            icon="check" />
          {{ $t(`registryInfo.${type}`) }}
        </span>
      </span>
      <span
        v-if="registry.provider.has.auth"
        style="margin-left: 5px;">
        <span
          v-if="authorized"
          style="color: green;">
          <font-awesome-icon icon="lock-open" />
          {{ $t("registryInfo.authenticated") }}
        </span>
        <span
          v-else
          style="color: red;">
          <font-awesome-icon icon="lock" />
          {{ $t("registryInfo.notAuthenticated") }}
        </span>
      </span>
    </div>
  </div>
</template>

<script>
import AutoLink from "./AutoLink"
import RegistryNotation from "./RegistryNotation"

// Import mixins
import auth from "../mixins/auth"

export default {
  name: "RegistryInfo",
  components: { AutoLink, RegistryNotation },
  mixins: [auth],
  props: {
    registry: {
      type: Object,
      default: null,
    },
    showCapabilities: {
      type: Boolean,
      default: true,
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";
</style>
