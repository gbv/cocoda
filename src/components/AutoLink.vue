<template>
  <a
    v-if="isValidURL(link)"
    :href="link"
    target="_blank">{{ link }}</a>
  <span v-else>{{ link }}</span>
</template>

<script>

/**
 * Represents an element that automatically converts a valid URL into a link.
 */
export default {
  name: "AutoLink",
  props: {
    link: {
      type: String,
      default: ""
    }
  },
  methods: {
    // from: https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url (User VicJordan)
    isValidURL: function(string) {
      return !!string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g)
    }
  }
}
</script>

<style scoped>
a {
  word-break: break-all;
}
</style>
