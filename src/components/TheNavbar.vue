<template>
  <b-navbar
    toggleable="md"
    type="dark">
    <b-navbar-brand
      v-for="(logo, index) in $config.logos || []"
      :key="index"
      :href="logo.url"
      target="_blank">
      <img
        :src="'./static/' + logo.file"
        :alt="logo.alt || 'logo'"
        height="40px" >
    </b-navbar-brand>
    <b-navbar-brand href="#">{{ title }}</b-navbar-brand>
    <b-navbar-nav class="ml-auto">
      <b-button
        variant="link"
        disabled>
        Login
      </b-button>
      <b-nav-item
        v-if="github"
        :href="github"><font-awesome-icon :icon="['fab', 'github']" /> GitHub</b-nav-item>
      <b-nav-item
        v-if="help"
        :href="help">Help</b-nav-item>
    </b-navbar-nav>
  </b-navbar>
</template>

<script>
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"

/**
 * The navigation bar.
 */
export default {
  name: "TheNavbar",
  components: {
    FontAwesomeIcon
  },
  data () {
    return {
      /** The title text displayed in the top left corner. */
      title: "Cocoda Prototype",
      /** The link to the GitHub project. */
      github: "https://github.com/gbv/cocoda",
      /** The link to help page. */
      help: "https://gbv.github.io/cocoda/"
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

nav.navbar {
  padding: 4px 16px 4px 16px;
  height: 40px;
  background-color: @color-primary-0;
  box-shadow: 0 1px 2px 0 hsla(0, 0%, 0%, 0.2);
}
.navbar-dark .navbar-nav .nav-link, .btn-link, .navbar-brand {
  color: hsla(100, 100%, 100%, 0.8) !important;
}
.btn-link:disabled, .btn-link.disabled {
  text-decoration: line-through;
}
</style>
