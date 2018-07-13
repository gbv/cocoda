<template>
  <b-navbar
    toggleable="md"
    type="dark" >
    <!-- Load logos from config -->
    <b-navbar-brand
      v-for="(logo, index) in $config.logos || []"
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
      <!-- Help button (links to documentation) -->
      <b-nav-item
        v-if="help"
        :href="help"
        target="_blank" >
        Help
      </b-nav-item>
      <!-- Settings button -->
      <b-nav-item @click="$refs.settingsModal.show()">
        Settings
      </b-nav-item>
      <!-- Settings modal (TODO: Move to separate component) -->
      <b-modal
        ref="settingsModal"
        hide-footer
        centered
        size="md"
        title="Cocoda Settings" >
        <p v-if="$config.buildInfo.gitTag && $config.buildInfo.gitTag != ''">
          Version: {{ $config.buildInfo.gitTag }}
        </p>
        <p v-if="$config.buildInfo.gitCommit && $config.buildInfo.gitCommitShort">
          Current Commit:
          <a
            :href="'https://github.com/gbv/cocoda/commit/' + $config.buildInfo.gitCommit"
            target="_blank" >
            {{ $config.buildInfo.gitCommitShort }}
          </a>
        </p>
        <p v-if="$config.buildInfo.buildDate">
          Build Date: {{ $config.buildInfo.buildDate }}
        </p>
      </b-modal>
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
  box-shadow: 0 1px 2px 0 @color-shadow;
}
.navbar-dark .navbar-nav .nav-link, .btn-link, .navbar-brand {
  color: @color--theNavbar-text !important;
}
.btn-link:disabled, .btn-link.disabled {
  text-decoration: line-through;
}
</style>
