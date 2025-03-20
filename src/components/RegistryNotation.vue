<template>
  <div
    v-if="notation"
    v-b-tooltip.html.left="tooltip ? $jskos.prefLabel(registry, { language: locale }) : ''"
    :class="{
      [isCurrentRegistry ? 'registry-current-enabled' : 'registry-enabled']: !disabled,
      'registry-notation-current': isCurrentRegistry,
    }"
    :style="`width: ${18 + 9 * (notation.length - 1)}px;`"
    class="registry-notation">
    {{ notation }}
  </div>
</template>

<script>
import computed from "@/mixins/computed.js"

export default {
  name: "RegistryNotation",
  mixins: [computed],
  props: {
    registry: {
      type: Object,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    tooltip: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    isCurrentRegistry() {
      return this.$jskos.compareFast(this.registry, this.$store.getters.getCurrentRegistry)
    },
    notation() {
      return this.$jskos.notation(this.registry) || ""
    },
  },
}
</script>

<style lang="less">
@import "@/style/main.less";
@import "../style/colors.css";

.registry-notation {
  user-select: none;
  display: inline-block;
  text-align: center;
  .m-borderRadius(5px);
  color: var(--color-background);
  height: 18px;
  .fontSize-verySmall;
  background-color: var(--color-secondary-dark-faded-30); // note: only used when disabled
}
.registry-notation:hover, .registry-notation.registry-enabled:hover {
  background-color: var(--color-secondary-dark-faded-65);
}
.registry-notation-current {
  background-color: var(--color-primary-opacity);
}
.registry-notation.registry-current-enabled {
  background-color: var(--color-primary);
  .fontWeight-heavy;
}
.registry-notation.registry-enabled {
  background-color: hsl(var(--color-secondary-dark));
  .fontWeight-heavy;
}
</style>
