<template>
  <div
    :class="'loader-' + size"
    class="loader" />
</template>

<script>

/**
 * Component that displays a spinning loading indicator.
 */
export default {
  name: "LoadingIndicator",
  props: {
    /**
     * The size of the loading indicator.
     * `sm, md, lg`
     */
    size: {
      type: String,
      default: "md",
    },
  },
}
</script>

<!-- from: https://www.w3schools.com/howto/howto_css_loader.asp -->
<style lang="less" scoped>
@import "@/style/main.less";

.loader {
  .m-borderRadius(50%);
  border: 4px solid var(--color--loadingIndicator-border);
  border-top: 4px solid var(--color--loadingIndicator-border-top);
  width: 24px;
  height: 24px;
  animation: spin 2s linear infinite;
}
.loader-sm {
  width: 16px;
  height: 16px;
}
.loader-md {
  width: 24px;
  height: 24px;
}
.loader-lg {
  width: 32px;
  height: 32px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
