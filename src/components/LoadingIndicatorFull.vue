<template>
  <div class="fillAndCenter loadingIndicatorFull">
    <loading-indicator
      size="lg"
      class="loadingIndicatorFull-indicator" />
    <div class="loadingIndicatorFull-text fontWeight-heavy">
      Loading...
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
    LoadingIndicator
  }
}
</script>

<style lang="less">
@import "../style/z-index.less";
@import "../style/utilities.less";

.loadingIndicatorFull {
  z-index: @zIndex-8 !important;
}
.loadingIndicatorFull-text, .loadingIndicatorFull-indicator {
  flex: none;
}

</style>
