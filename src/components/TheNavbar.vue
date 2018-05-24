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

<style scoped>
nav.navbar {
  background: #577fbb;
  padding: 4px 16px 4px 16px;
  height: 40px;

}
.navbar-dark .navbar-nav .nav-link, .btn-link {
  color: #fff;
}
.btn-link:disabled, .btn-link.disabled {
  text-decoration: line-through;
}
</style>
