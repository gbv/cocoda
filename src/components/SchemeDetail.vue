<template>
  <div
    class="schemeDetail fontSize-small">

    <!-- Name of scheme -->
    <item-name
      :item="item"
      :is-highlighted="true"
      font-size="normal"
    />

    <!-- License -->
    <div
      v-if="item.license"
      class="schemeDetail-license">
      <span
        v-for="(license, index) in item.license"
        :key="index">
        <a
          :href="license.uri"
          target="_blank">
          <img
            v-if="licenseBadges[license.uri]"
            :src="licenseBadges[license.uri]"
            class="schemeDetail-licenseBadge">
          <span v-else>{{ license.uri }}</span>
        </a>
        <span v-if="licenseAttribution(item)">
          by <a
            v-if="license.uri.indexOf('by') >= 0 && licenseAttribution(item).url"
            :href="licenseAttribution(item).url"
            target="_blank">
            <auto-link :link="licenseAttribution(item).label" />
          </a>
          <span v-else><auto-link :link="licenseAttribution(item).label" /></span>
        </span>
      </span>
    </div>

    <!-- URI and identifier -->
    <div
      v-for="(identifier, index) in [item.uri].concat(item.identifier)"
      v-if="identifier != null"
      :key="index"
      :class="identifier.startsWith('http') ? 'schemeDetail-identifier' : 'schemeDetail-identifier'">
      <font-awesome-icon :icon="identifier.startsWith('http') ? 'link' : 'id-card'" />
      <auto-link :link="identifier" />
    </div>

    <!-- Top Concepts -->
    <div
      v-if="settings.showTopConceptsInScheme && item.TOPCONCEPTS && item.TOPCONCEPTS.length > 0"
      class="schemeDetail-top">
      <div class="fontWeight-heavy">Top Concepts:</div>
      <div
        v-for="concept in item.TOPCONCEPTS"
        v-if="concept != null"
        :key="concept.uri"
        class="schemeDetail-topItem">
        <font-awesome-icon
          class="u-flip-horizontal"
          icon="level-down-alt" />
        <item-name
          :item="concept"
          :is-link="true"
          font-size="small"
          @click.native="chooseUri(concept, isLeft)" />
      </div>
      <!-- Show LoadingIndicator when top concepts exist, but are not loaded yet -->
      <loading-indicator
        v-if="item.TOPCONCEPTS.length != 0 && item.TOPCONCEPTS.includes(null)"
        size="sm" />
    </div>
    <div v-else-if="settings.showTopConceptsInScheme">No top concepts</div>

  </div>
</template>

<script>
import AutoLink from "./AutoLink"
import ItemName from "./ItemName"
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"
import LoadingIndicator from "./LoadingIndicator"

/**
 * Component that displays a scheme's details (URI, notation, identifier, ...).
 */
export default {
  name: "SchemeDetail",
  components: {
    AutoLink, ItemName, FontAwesomeIcon, LoadingIndicator
  },
  props: {
    /**
     * The scheme object whose details should be displayed.
     */
    item: {
      type: Object,
      default: null
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    },
    /**
     * Settings - see `ItemDetail`
     */
    settings: {
      type: Object,
      default: () => { return {} }
    }
  },
  data () {
    return {
      /** Image URLs for specific licenses */
      licenseBadges: {
        "http://creativecommons.org/publicdomain/zero/1.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/cc-zero.svg",
        "http://creativecommons.org/licenses/by-nc-nd/3.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc-nd.svg",
        "http://creativecommons.org/licenses/by-nc-nd/4.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc-nd.svg",
        "http://creativecommons.org/licenses/by-nc-sa/4.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc-sa.svg",
        "http://creativecommons.org/licenses/by-sa/4.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-sa.svg",
        "http://opendatacommons.org/licenses/odbl/1.0/": "https://img.shields.io/badge/License-ODbL-lightgrey.svg",
        "http://www.wtfpl.net/": "https://img.shields.io/badge/License-WTFPL-lightgrey.svg"
      }
    }
  },
  watch: {
    item() {
      // Scroll to top when item changed
      // TODO: Move to ItemDetail?
      this.$el.parentElement.scrollTop = 0
    }
  },
  mounted() {
    // Scroll to top
    // TODO: Move to ItemDetail?
    this.$el.parentElement.scrollTop = 0
  },
  methods: {
    licenseAttribution(detail) {
      let organisation = detail.creator || detail.publisher
      if (!organisation || organisation.length == 0) {
        return null
      }
      return {
        url: organisation[0].url,
        label: organisation[0].prefLabel.de || organisation[0].prefLabel.en || ""
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.schemeDetail-license {
  margin-top: 5px;
}

.schemeDetail-identifier {
  margin: 5px;
}
.schemeDetail-identifier a {
  .m-borderRadius(5px);
  background-color: @color-background-select;
  padding: 0 3px;
}

.schemeDetail-top {
  margin: 5px;
}

.schemeDetail-licenseBadge {
  margin-bottom: 3px;
  height: 15px;
}
</style>
