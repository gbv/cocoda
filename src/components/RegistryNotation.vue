<template>
  <div
    v-b-tooltip.html.right="tooltip ? $util.prefLabel(registry) : ''"
    :class="{
      ['registry-enabled']: !disabled
    }"
    class="registry-notation" >
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
  width: 18px;
  height: 18px;
  .fontSize-verySmall;
  background-color: fadeout(@color-button-delete, 80%);
}
.registry-notation.registry-enabled {
  background-color: fadeout(@color-button-delete, 5%);
  .fontWeight-heavy;
}
</style>
