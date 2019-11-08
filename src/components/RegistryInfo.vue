<template>
  <div>
    <div>
      <registry-notation
        :registry="registry"
        :disabled="$store.state.settings.settings.mappingBrowserShowRegistry[registry.uri] === false"
        :tooltip="false" />
      <span
        :class="{
          'fontWeight-heavy': $store.state.settings.settings.mappingBrowserShowRegistry[registry.uri] !== false
        }">
        {{ $util.prefLabel(registry) }}
      </span>
      <a
        v-if="showDetails"
        :href="registry.uri"
        target="_blank">
        <font-awesome-icon icon="link" />
      </a>
      <span
        v-if="registry.isAuthorizedFor({
          type: 'mappings',
          action: 'create',
          user: user,
        })"
        v-b-tooltip="$t('registryInfo.canSaveMappings')"
        style="font-size: 12px; padding-left: 5px;">
        <font-awesome-icon icon="pencil-alt" />
      </span>
    </div>
    <div v-if="showDetails">
      {{ $util.definition(registry).join(" ") }}
    </div>
    <div v-if="showCapabilities">
      <span
        v-for="type in ['schemes', 'concepts', 'mappings', 'annotations', 'occurrences']"
        :key="`settings-info-capabilities-${type}`">
        <span v-if="registry.provider.has[type]">
          <font-awesome-icon
            v-if="registry.provider.has[type]"
            style="color: green; margin-left: 5px;"
            icon="code" />
          {{ $t(`registryInfo.${type}`) }}
        </span>
      </span>
      <span
        v-if="registry.provider.has.auth"
        style="margin-left: 5px;">
        <span
          v-if="registry.isAuthorizedFor({
            type: 'mappings',
            action: 'create',
            user: user,
          })"
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
import RegistryNotation from "./RegistryNotation"

// Import mixins
import auth from "../mixins/auth"

export default {
  name: "RegistryInfo",
  components: { RegistryNotation },
  mixins: [auth],
  props: {
    registry: {
      type: Object,
      default: null,
    },
    showDetails: {
      type: Boolean,
      default: true,
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
