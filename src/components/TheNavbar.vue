<template>
  <b-navbar
    toggleable="md"
    type="dark">
    <b-navbar-brand href="#">{{ brand }}</b-navbar-brand>
    <b-navbar-nav class="ml-auto">
      <b-button
        variant="link"
        disabled>
        Login
      </b-button>
      <b-nav-item
        v-if="github"
        :href="github"
        right>
        GitHub
      </b-nav-item>
    </b-navbar-nav>
  </b-navbar>
</template>

<script>

/**
 * The navigation bar.
 */
export default {
  name: "TheNavbar",
  data () {
    return {
      /** The title text displayed in the top left corner. */
      brand: "Cocoda Prototype 2018",
      /** The link to the GitHub project. */
      github: "https://github.com/gbv/cocoda"
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

nav.navbar {
  padding: 4px 16px 4px 16px;
  height: 40px;
  background-color: @color-primary-base;
}
.navbar-dark .navbar-nav .nav-link, .btn-link, .navbar-brand {
  color: @color-primary-0;
}
.btn-link:disabled, .btn-link.disabled {
  text-decoration: line-through;
}
</style>
