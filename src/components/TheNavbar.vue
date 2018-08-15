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
        height="40px" >
    </b-navbar-brand>
    <!-- Title -->
    <b-navbar-brand href="#">
      {{ title }}
    </b-navbar-brand>
    <!-- Links on right side -->
    <b-navbar-nav class="ml-auto">
      <!-- Login button -->
      <b-button
        variant="link"
        disabled >
        Login
      </b-button>
      <!-- GitHub button -->
      <b-nav-item
        v-if="github"
        :href="github"
        target="_blank" >
        <font-awesome-icon :icon="['fab', 'github']" />
        GitHub
      </b-nav-item>
      <!-- Feedback button -->
      <b-nav-item
        v-if="config.feedbackUrl"
        class="feedbackButton"
        @click="$refs.feedback.show()">
        Feedback
      </b-nav-item>
      <!-- Help button (links to documentation) -->
      <b-nav-item
        v-if="help"
        :href="help"
        target="_blank" >
        Help
      </b-nav-item>
      <!-- Settings button -->
      <b-nav-item @click="$refs.settings.show()">
        Settings
      </b-nav-item>
      <!-- Settings modal -->
      <the-settings ref="settings" />
      <!-- Feedback modal -->
      <b-modal
        v-if="config.feedbackUrl"
        ref="feedback"
        centered
        class="feedbackModal"
        hide-footer
        size="lg"
        title="Feedback" >
        <iframe
          :src="config.feedbackUrl + '?embedded=true'"
          frameborder="0"
          marginheight="0"
          marginwidth="0">
          Loading...
        </iframe>
      </b-modal>
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
  box-shadow: 0 1px 2px 0 @color-shadow;
}
.navbar-dark .navbar-nav .nav-link, .btn-link {
  color: @color--theNavbar-text;
}
.navbar-brand {
  color: @color--theNavbar-text !important;
}
.feedbackButton a.nav-link {
  color: @color-complement-3 !important;
}
.btn-link:disabled, .btn-link.disabled {
  text-decoration: line-through;
  color: @color--theNavbar-text;
}
</style>

<style>
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
