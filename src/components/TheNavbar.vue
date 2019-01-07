<template>
  <b-navbar
    toggleable="md"
    type="dark" >
    <!-- Load logos from config -->
    <b-navbar-brand
      v-for="(logo, index) in config.logos || []"
      :key="index"
      :href="logo.url"
      target="_blank" >
      <img
        :src="'./static/' + logo.file"
        :alt="logo.alt || 'logo'"
        style="height: 42px;" >
    </b-navbar-brand>
    <!-- Title -->
    <b-navbar-brand href="#">
      {{ config.title }}
    </b-navbar-brand>
    <!-- Links on right side -->
    <b-navbar-nav class="ml-auto">
      <!-- Menu buttons (from configuration) -->
      <b-nav-item
        v-for="item in config.menu"
        :key="item.url"
        :href="item.url"
        target="_blank" >
        {{ $util.prefLabel(item) }}
      </b-nav-item>
      <!-- Settings button -->
      <b-nav-item @click="$refs.settings.show()">
        <font-awesome-icon icon="cog" />
        {{ creatorName || $t("navbar.settings") }}
      </b-nav-item>
      <!-- Settings modal -->
      <the-settings ref="settings" />
    </b-navbar-nav>
  </b-navbar>
</template>

<script>
import TheSettings from "./TheSettings"

/**
 * The navigation bar.
 */
export default {
  name: "TheNavbar",
  components: {
    TheSettings
  },
  computed: {
    creatorName() {
      return this.$settings.creator
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

nav.navbar {
  padding: 2px 8px;
  height: 42px;
  background-color: @color-primary-1;
}
.navbar-brand {
  color: @color-text-dark !important;
}
.btn-link:disabled, .btn-link.disabled {
  text-decoration: line-through;
  color: @color-text-lightGrey;
}
</style>

<style lang="less">
@import "../style/main.less";

.nav-link, .nav-link > span, .btn-link {
  color: @color-text-dark !important;
}
.nav-link:hover, .btn-link:hover {
  color: @color-text-lightGrey !important;
}
.feedbackModal .modal-dialog {
  height: 90%;
}
.feedbackModal .modal-content {
  height: 100%;
}
.feedbackModal iframe {
  overflow:hidden;
  position:absolute;
  height:100%;
  width:100%;
  top:0;
  bottom:0;
  left:0;
  right:0;
}
</style>
