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
        style="height: 60px; margin-right: 60px" >
    </b-navbar-brand>
    <!-- Title -->
    <b-navbar-brand href="#">
      {{ config.title }}
    </b-navbar-brand>
    <!-- Links on right side -->
    <b-navbar-nav class="ml-auto">
      <b-nav-item-dropdown
        :text="config.languages[$i18n.locale] || '?'"
        right>
        <b-dropdown-item
          v-for="(label, language) in config.languages"
          :key="language"
          href="#"
          @click="$i18n.locale = language">
          {{ label }}
        </b-dropdown-item>
      </b-nav-item-dropdown>
      <!-- Feedback button -->
      <b-nav-item
        v-if="config.feedbackUrl"
        @click="$refs.feedback.show()">
        {{ $t("navbar.feedback") }}
      </b-nav-item>
      <!-- Help button (links to documentation) -->
      <b-nav-item
        v-if="config.helpUrl"
        :href="config.helpUrl"
        target="_blank" >
        {{ $t("navbar.help") }}
      </b-nav-item>
      <!-- GitHub button -->
      <b-nav-item
        v-if="config.githubUrl"
        :href="config.githubUrl"
        target="_blank" >
        <font-awesome-icon :icon="['fab', 'github']" />
        {{ $t("navbar.github") }}
      </b-nav-item>
      <!-- Settings button -->
      <b-nav-item @click="$refs.settings.show()">
        <font-awesome-icon icon="cog" />
        {{ creatorName || $t("navbar.settings") }}
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
          {{ $t("navbar.settingsLoading") }}
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
  computed: {
    creatorName() {
      return this.$settings.creator
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

nav.navbar {
  padding: 4px 16px 4px 16px;
  height: 54px;
  background-color: @color-primary-1;
}
.navbar-brand {
  color: @color-text-dark !important;
}
.btn-link:disabled, .btn-link.disabled {
  text-decoration: line-through;
  color: @color-text-lightGrey;
}
</style>

<style lang="less">
@import "../style/main.less";

.nav-link, .nav-link > span, .btn-link {
  color: @color-text-dark !important;
}
.nav-link:hover, .btn-link:hover {
  color: @color-text-lightGrey !important;
}
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
