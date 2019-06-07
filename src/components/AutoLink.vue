<template>
  <a
    v-if="isValidURL(link)"
    :href="link"
    class="u-textBreak"
    target="_blank">{{ text || link }}</a>
  <span v-else>{{ text || link }}</span>
</template>

<script>

/**
 * Represents an element that automatically converts a valid URL into a link.
 */
export default {
  name: "AutoLink",
  props: {
    /**
     * The string that is potentially a URL.
     */
    link: {
      type: String,
      default: ""
    },
    /**
     * The text that is shown (defaults to URL).
     */
    text: {
      type: String,
      default: null
    }
  },
  methods: {
    // from: https://stackoverflow.com/a/43467144/11050851
    isValidURL(string) {
      try {
        new URL(string)
        return true
      } catch (_) {
        return false
      }
    }
  }
}
</script>
