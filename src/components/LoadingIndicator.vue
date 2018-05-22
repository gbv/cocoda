<template>
   <div class="loader" :class="'loader-' + size"></div>
</template>

<script>
export default {
  name: 'LoadingIndicator',
  props: ['size'],
  data () {
    return {}
  }
}
</script>

<!-- from: https://www.w3schools.com/howto/howto_css_loader.asp -->
<style scoped>
.loader {
  border: 4px solid #f3f3f3; /* Light grey */
  border-top: 4px solid #3498db; /* Blue */
  border-radius: 50%;
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
