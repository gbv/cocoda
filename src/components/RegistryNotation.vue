<template>
  <div
    v-b-tooltip.html.right="tooltip ? $util.prefLabel(registry) : ''"
    :class="{
      ['fontWeight-heavy']: !disabled,
      ['registry-notation-enabled']: !disabled,
      ['registry-notation-disabled']: disabled
    }"
    class="registry-notation fontSize-small" >
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

<style lang="less" scoped>
@import "../style/main.less";

.registry-notation {
  user-select: none;
  display: inline-block;
  .m-borderRadius(5px);
  color: white;
  width: 18px;
  height: 18px;
}
.registry-notation-enabled {
  background-color: darken(@color-button-delete, 5%);
}
.registry-notation-disabled {
  background-color: fadeout(@color-button-delete, 80%);
}
</style>
