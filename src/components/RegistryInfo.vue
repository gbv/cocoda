<template>
  <div
    :class="{
      'registry-info-inline': inline,
    }">
    <div>
      <registry-notation
        :registry="registry"
        :disabled="$store.state.settings.settings.mappingBrowserShowRegistry[registry.uri] === false"
        :tooltip="false" />
      <span
        :class="{
          'fontWeight-heavy': $store.state.settings.settings.mappingBrowserShowRegistry[registry.uri] !== false
        }">
        {{ $jskos.prefLabel(registry, { language: locale }) }}
      </span>
      <a
        v-if="showDetails"
        :href="registry.uri"
        target="_blank">
        <font-awesome-icon icon="link" />
      </a>
      <span
        v-if="showEditable && registry.isAuthorizedFor({
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
      {{ $jskos.definition(registry, { language: locale }).join(" ") }}
    </div>
    <div v-if="showCapabilities">
      <span
        v-for="type in ['schemes', 'concepts', 'mappings', 'annotations', 'occurrences']"
        :key="`settings-info-capabilities-${type}`">
        <span v-if="registry.has[type]">
          <font-awesome-icon
            v-if="registry.has[type]"
            style="color: green; margin-left: 5px;"
            icon="code" />
          {{ $t(`registryInfo.${type}`) }}
        </span>
      </span>
      <span
        v-if="registry.has.auth"
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
import RegistryNotation from "./RegistryNotation.vue"

// Import mixins
import auth from "../mixins/auth.js"
import computed from "../mixins/computed.js"

export default {
  name: "RegistryInfo",
  components: { RegistryNotation },
  mixins: [auth, computed],
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
    showEditable: {
      type: Boolean,
      default: true,
    },
    inline: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.registry-info-inline {
  display: inline-block;
}
.registry-info-inline > div {
  display: inline-block;
}
</style>
