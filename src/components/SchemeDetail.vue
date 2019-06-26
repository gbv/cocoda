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
        :key="`schemeDetail-${isLeft}-license-${index}`">
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
      :key="`schemeDetail-${isLeft}-identifier-${index}`"
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
    <div
      v-if="item.type && item.type.length > 1"
      class="schemeDetail-identifier">
      <b>Type:</b>
      <span
        v-for="(type, index) in item.type.filter(type => type != 'http://www.w3.org/2004/02/skos/core#ConceptScheme')"
        :key="`schemeDetail-${isLeft}-type-${index}`">
        <auto-link
          :link="type"
          :text="$util.prefLabel(kosTypes.find(t => t.uri == type))" />
        <span v-if="index != item.type.length - 2">,</span>
      </span>
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
          toNotation: !isLeft ? '' : null,
          direction: 'both'
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

// Import mixins
import objects from "../mixins/objects"

// KOS types
import kosTypes from "../../config/kos-types.json"

/**
 * Component that displays a scheme's details (URI, notation, identifier, ...).
 */
export default {
  name: "SchemeDetail",
  components: {
    AutoLink, ItemName, ItemDetailNarrower,
  },
  mixins: [objects],
  props: {
    /**
     * The scheme object whose details should be displayed.
     */
    item: {
      type: Object,
      default: null,
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true,
    },
    /**
     * Settings - see [`ItemDetail`](#itemdetail).
     */
    settings: {
      type: Object,
      default: () => { return {} },
    },
  },
  data() {
    return {
      kosTypes,
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
        label: this.$util.prefLabel(organisation[0]),
      }
    },
  },
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
