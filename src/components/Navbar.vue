<template>
  <b-navbar toggleable="md" type="dark">
    <b-navbar-brand href="#">{{ brand }}</b-navbar-brand>
    <b-navbar-nav class="ml-auto">
      <b-button variant="link" disabled>
        Login
      </b-button>
      <b-nav-item right :href="github" v-if="github">
        GitHub
      </b-nav-item>
    </b-navbar-nav>
  </b-navbar>
</template>

<script>
export default {
  name: 'Navbar',
  data () {
    return {
      brand: "Cocoda Prototype 2018",
      github: "https://github.com/gbv/cocoda"
    }
  }
}
</script>

<style scoped>
nav.navbar {
  background: #577fbb;
}
.navbar-dark .navbar-nav .nav-link, .btn-link {
  color: #fff;
}
.btn-link:disabled, .btn-link.disabled {
  text-decoration: line-through;
}
</style>
