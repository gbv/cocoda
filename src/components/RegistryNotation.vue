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

.registry-notation {
  user-select: none;
  display: inline-block;
  text-align: center;
  .m-borderRadius(5px);
  color: @color-background;
  height: 18px;
  .fontSize-verySmall;
  background-color: fadeout(@color-secondary-dark, 70%); // note: only used when disabled
}
.registry-notation:hover, .registry-notation.registry-enabled:hover {
  background-color: fadeout(@color-secondary-dark, 35%);
}
.registry-notation-current {
  background-color: fadeout(@color-primary, 70%);
}
.registry-notation.registry-current-enabled {
  background-color: @color-primary;
  .fontWeight-heavy;
}
.registry-notation.registry-enabled {
  background-color: @color-secondary-dark;
  .fontWeight-heavy;
}
</style>
