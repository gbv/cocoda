<template>
  <div class="fillAndCenter loadingIndicatorFull">
    <div>
      <loading-indicator
        :size="size"
        class="loadingIndicatorFull-indicator"
        :style="size == 'sm' ? 'display: inline-block;' : 'margin: 0 auto;'" />
      <div
        class="loadingIndicatorFull-text fontWeight-heavy"
        :style="size == 'sm' ? 'display: inline-block;' : ''">
        {{ $t("general.loading") }}
      </div>
    </div>
  </div>
</template>

<script>
import LoadingIndicator from "./LoadingIndicator"

/**
 * Component that shows a loading indicator overlay covering another component.
 */
export default {
  name: "LoadingIndicatorFull",
  components: {
    LoadingIndicator,
  },
  props: {
    /**
     * The size of the loading indicator.
     * `sm, md, lg`
     *
     * Size `sm` causes loading text to be inline with loading indicator.
     */
    size: {
      type: String,
      default: "lg",
    },
  },
}
</script>

<style lang="less">
@import "../style/z-index.less";
@import "../style/utilities.less";

.loadingIndicatorFull {
  z-index: @zIndex-8 !important;
  background-color: @color-loading-overlay-background;
  animation: fadein 0.5s;
}
@keyframes fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.loadingIndicatorFull-text, .loadingIndicatorFull-indicator {
  flex: none;
}

</style>
