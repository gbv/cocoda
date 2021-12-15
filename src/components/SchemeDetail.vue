<template>
  <div
    class="schemeDetail">
    <!-- Name of scheme -->
    <item-name
      :item="_item"
      :is-highlighted="true"
      font-size="normal" />

    <!-- License -->
    <div
      v-if="_item.license || licenseAttribution(_item)"
      class="schemeDetail-license">
      <span
        v-for="(license, index) in _item.license"
        :key="`schemeDetail-${isLeft}-license-${index}`">
        <a
          :href="license.uri"
          target="_blank">
          <img
            v-if="defaults.licenseBadges[license.uri]"
            :src="defaults.licenseBadges[license.uri]"
            class="schemeDetail-licenseBadge">
          <span v-else>
            {{ license.uri }}
          </span>
        </a>
      </span>
      <span v-if="licenseAttribution(_item)">
        by <a
          v-if="licenseAttribution(_item).url"
          :href="licenseAttribution(_item).url"
          target="_blank">
          <auto-link :link="licenseAttribution(_item).label" />
        </a>
        <span v-else>
          <auto-link :link="licenseAttribution(_item).label" />
        </span>
      </span>
    </div>

    <!-- URI and identifier -->
    <div
      v-for="(identifier, index) in [_item.uri].concat(_item.identifier).filter(identifier => identifier != null)"
      :key="`schemeDetail-${isLeft}-identifier-${index}`"
      class="schemeDetail-identifier">
      <font-awesome-icon :icon="identifier.startsWith('http') ? 'link' : 'id-card'" />
      <auto-link :link="identifier" />
    </div>
    <div class="schemeDetail-identifier">
      <span v-if="_item.created">
        <b>{{ $t("conceptDetail.created") }}:</b> <date-string :date="_item.created" />
      </span>
      <span v-if="_item.issued">
        <b>{{ $t("conceptDetail.issued") }}:</b> <date-string :date="_item.issued" />
      </span>
      <span v-if="_item.modified">
        <b>{{ $t("conceptDetail.modified") }}:</b> <date-string :date="_item.modified" />
      </span>
    </div>
    <div
      v-if="_item.languages"
      class="schemeDetail-identifier">
      <b>{{ $t("schemeDetail.languages") }}:</b> {{ _item.languages.join(", ") }}
    </div>
    <div
      v-if="_item.type && _item.type.length > 1"
      class="schemeDetail-identifier">
      <b>{{ $t("general.type") }}:</b>
      <span
        v-for="(type, index) in _item.type.filter(type => type != 'http://www.w3.org/2004/02/skos/core#ConceptScheme')"
        :key="`schemeDetail-${isLeft}-type-${index}`">
        {{ $jskos.prefLabel(kosTypes.find(t => t.uri == type), { language: locale }) || type }}
        <span v-if="index != _item.type.length - 2"> / </span>
      </span>
    </div>

    <!-- Data Source -->
    <div
      class="schemeDetail-identifier">
      <b>{{ $t("schemeDetail.registry") }}: </b>
      <registry-notation
        :registry="_item._registry"
        :tooltip="false" />
      &nbsp;
      <registry-name
        :registry="_item._registry"
        :tooltip="false" />
    </div>

    <!-- Link to mapping search -->
    <div
      v-if="$jskos.notation(_item)"
      class="schemeDetail-identifier">
      <a
        href=""
        @click.prevent="$emit('searchMappings', {
          fromScheme: isLeft ? $jskos.notation(_item) : null,
          fromNotation: isLeft ? '' : null,
          toScheme: !isLeft ? $jskos.notation(_item) : null,
          toNotation: !isLeft ? '' : null,
          direction: 'both'
        })">
        <font-awesome-icon icon="external-link-square-alt" />{{ $t("schemeDetail.availableMappings") }}
      </a>
    </div>

    <!-- Top Concepts -->
    <!-- TODO: Use topConcepts from scheme directly -->
    <item-detail-narrower
      v-if="settings.showTopConceptsInScheme && topConcepts[_item.uri] && topConcepts[_item.uri].length > 0"
      :narrower="topConcepts[_item.uri]"
      :is-left="isLeft"
      text="Top Concepts:" />
    <div v-else-if="settings.showTopConceptsInScheme">
      {{ $t("schemeDetail.noTopConcepts") }}
    </div>
  </div>
</template>

<script>
import AutoLink from "./AutoLink.vue"
import ItemName from "./ItemName.vue"
import ItemDetailNarrower from "./ItemDetailNarrower.vue"
import RegistryName from "./RegistryName.vue"
import RegistryNotation from "./RegistryNotation.vue"
import DateString from "./DateString.vue"

// Import mixins
import objects from "../mixins/cdk.js"

// KOS types
import kosTypes from "../../config/kos-types.json"
import { getItem } from "@/items"

/**
 * Component that displays a scheme's details (URI, notation, identifier, ...).
 */
export default {
  name: "SchemeDetail",
  components: {
    AutoLink, ItemName, ItemDetailNarrower, RegistryName, RegistryNotation, DateString,
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
  computed: {
    _item() {
      return getItem(this.item) || this.item
    },
  },
  methods: {
    licenseAttribution(detail) {
      let organisation = detail.publisher
      if (!organisation || organisation.length == 0) {
        return null
      }
      return {
        url: organisation[0].url || organisation[0].uri,
        label: this.$jskos.prefLabel(organisation[0]),
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
  margin: 5px 0px;
}
.schemeDetail-identifier svg {
  margin-right: 3px;
}
.schemeDetail-licenseBadge {
  margin-bottom: 3px;
  height: 15px;
}
</style>
