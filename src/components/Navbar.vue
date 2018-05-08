<template>
  <b-navbar toggleable="md" type="dark" variant="info">
    <b-navbar-brand href="#">{{ brand }}</b-navbar-brand>
  </b-navbar>
</template>

<script>
export default {
  name: 'Navbar',
  data () {
    return {
      brand: "Cocoda - Corcordance App"
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
