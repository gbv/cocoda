<template>
  <div
    class="schemeDetail">
    <!-- Name of scheme -->
    <item-name
      :item="item"
      :is-highlighted="true"
      font-size="normal" />

    <!-- License -->
    <div
      v-if="item.license || licenseAttribution(item)"
      class="schemeDetail-license">
      <span
        v-for="(license, index) in item.license"
        :key="index">
        <a
          :href="license.uri"
          target="_blank">
          <img
            v-if="$util.licenseBadges[license.uri]"
            :src="$util.licenseBadges[license.uri]"
            class="schemeDetail-licenseBadge">
          <span v-else>
            {{ license.uri }}
          </span>
        </a>
      </span>
      <span v-if="licenseAttribution(item)">
        by <a
          v-if="licenseAttribution(item).url"
          :href="licenseAttribution(item).url"
          target="_blank">
          <auto-link :link="licenseAttribution(item).label" />
        </a>
        <span v-else>
          <auto-link :link="licenseAttribution(item).label" />
        </span>
      </span>
    </div>

    <!-- URI and identifier -->
    <div
      v-for="(identifier, index) in [item.uri].concat(item.identifier).filter(identifier => identifier != null)"
      :key="index"
      class="schemeDetail-identifier">
      <font-awesome-icon :icon="identifier.startsWith('http') ? 'link' : 'id-card'" />
      <auto-link :link="identifier" />
    </div>
    <div
      v-if="item.created"
      class="schemeDetail-identifier">
      <b>{{ $t("conceptDetail.created") }}:</b> {{ $util.dateToString(item.created, true) }}
    </div>
    <div
      v-if="item.modified"
      class="schemeDetail-identifier">
      <b>{{ $t("conceptDetail.modified") }}:</b> {{ $util.dateToString(item.modified, true) }}
    </div>
    <div
      v-if="item.languages"
      class="schemeDetail-identifier">
      <b>{{ $t("schemeDetail.languages") }}:</b> {{ item.languages.join(", ") }}
    </div>

    <!-- Link to mapping search -->
    <div
      v-if="$util.notation(item)"
      class="schemeDetail-identifier">
      <a
        href=""
        @click.prevent="$emit('searchMappings', {
          fromScheme: isLeft ? $util.notation(item) : null,
          fromNotation: isLeft ? '' : null,
          toScheme: !isLeft ? $util.notation(item) : null,
          toNotation: !isLeft ? '' : null
        })">
        {{ $t("schemeDetail.availableMappings") }}
      </a>
    </div>

    <!-- Top Concepts -->
    <item-detail-narrower
      v-if="settings.showTopConceptsInScheme && topConcepts[item.uri] && topConcepts[item.uri].length > 0"
      :narrower="topConcepts[item.uri]"
      :is-left="isLeft"
      text="Top Concepts:" />
    <div v-else-if="settings.showTopConceptsInScheme">
      {{ $t("schemeDetail.noTopConcepts") }}
    </div>
  </div>
</template>

<script>
import AutoLink from "./AutoLink"
import ItemName from "./ItemName"
import ItemDetailNarrower from "./ItemDetailNarrower"

/**
 * Component that displays a scheme's details (URI, notation, identifier, ...).
 */
export default {
  name: "SchemeDetail",
  components: {
    AutoLink, ItemName, ItemDetailNarrower
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
     * Settings - see [`ItemDetail`](#itemdetail).
     */
    settings: {
      type: Object,
      default: () => { return {} }
    }
  },
  methods: {
    licenseAttribution(detail) {
      let organisation = detail.creator || detail.publisher
      if (!organisation || organisation.length == 0) {
        return null
      }
      return {
        url: organisation[0].url || organisation[0].uri,
        label: this.$util.prefLabel(organisation[0])
      }
    },
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
.schemeDetail-identifier svg {
  margin-right: 3px;
}
.schemeDetail-licenseBadge {
  margin-bottom: 3px;
  height: 15px;
}
</style>
