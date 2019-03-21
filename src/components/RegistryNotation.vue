<template>
  <div
    v-b-tooltip.html.left="tooltip ? $util.prefLabel(registry) : ''"
    :class="{
      [isCurrentRegistry ? 'registry-current-enabled' : 'registry-enabled']: !disabled,
      'registry-notation-current': isCurrentRegistry,
    }"
    :style="`width: ${18 + 12 * ($util.notation(registry).length - 1)}px;`"
    class="registry-notation">
    {{ $util.notation(registry) }}
  </div>
</template>

<script>
export default {
  name: "RegistryNotation",
  props: {
    registry: {
      type: Object,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    tooltip: {
      type: Boolean,
      default: true
    },
  },
  computed: {
    isCurrentRegistry() {
      return this.$jskos.compare(this.registry, this.$store.getters.getCurrentRegistry)
    },
  },
}
</script>

<style lang="less">
@import "../style/main.less";

.registry-notation {
  user-select: none;
  display: inline-block;
  text-align: center;
  .m-borderRadius(5px);
  color: white;
  height: 18px;
  .fontSize-verySmall;
  background-color: fadeout(@color-button-delete, 80%);
}
.registry-notation-current {
  background-color: fadeout(@color-select, 50%);
}
.registry-notation.registry-current-enabled {
  background-color: @color-select;
  .fontWeight-heavy;
}
.registry-notation.registry-enabled {
  background-color: fadeout(@color-button-delete, 5%);
  .fontWeight-heavy;
}
</style>
