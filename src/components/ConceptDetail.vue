<template>
  <div
    v-show="item != null"
    :style="{ flex: flex }"
    class="conceptDetail">
    <div
      v-if="detail != null"
      class="conceptDetailContent">
      <div
        v-if="item.ancestors.length > 0 && (item.ancestors.length > 1 || !item.ancestors.includes(null))"
        class="parents">
        <span
          v-for="(parent, index) in item.ancestors"
          :key="index">
          <item-name
            v-b-tooltip.hover
            :title="index != item.ancestors.length - 1 ? (parent.prefLabel.de ? parent.prefLabel.de : parent.prefLabel.en) : ''"
            :item="parent"
            :show-text="index == item.ancestors.length - 1"
            :is-link="true"
            @click.native="parentClicked(parent)" />
          <span v-if="index < item.ancestors.length - 1">
            ›
          </span>
        </span>
      </div>
      <span v-else><loading-indicator
        v-show="item.ancestors.length != 0 && !isScheme"
        size="sm" /></span>
      <item-name
        :item="detail"
        :font-size="1.2"
        class="label" />
      <p><auto-link :link="detail.uri" /></p>
      <p v-if="detail.identifier">
        <ul>
          <li
            v-for="(identifier, index) in detail.identifier"
            :key="index">
            <auto-link :link="identifier" />
          </li>
        </ul>
      </p>
      <p v-if="detail.altLabel">
        {{ detail.altLabel.de ? detail.altLabel.de[0] : detail.altLabel.en[0] }}
      </p>
      <p v-if="detail.definition">
        Definition: {{ detail.definition.de ? detail.definition.de[0] : detail.definition.en[0] }}
      </p>
      <p v-if="detail.scopeNote && detail.scopeNote.de">
        Scope Notes:
        <ul>
          <li
            v-for="(note, index) in detail.scopeNote.de"
            :key="index">
            {{ note }}
          </li>
        </ul>
      </p>
      <p v-if="detail.editorialNote && detail.editorialNote.de">
        Editorial Notes:
        <ul>
          <li
            v-for="(note, index) in detail.editorialNote.de"
            :key="index">
            {{ note }}
          </li>
        </ul>
      </p>
      <p v-if="detail.license">
        License:
        <ul>
          <li
            v-for="(license, index) in detail.license"
            :key="index">
            <auto-link :link="license.uri" />
          </li>
        </ul>
      </p>
      <p v-if="detail.publisher">
        Publisher:
        <ul>
          <li
            v-for="(publisher, index) in detail.publisher"
            :key="index">
            {{ publisher.prefLabel.de ? publisher.prefLabel.de : publisher.prefLabel.en }}
          </li>
        </ul>
      </p>
      <p v-if="detail.created">
        Created: {{ detail.created }}
      </p>
      <p v-if="detail.issued">
        Issued: {{ detail.issued }}
      </p>
      <p v-if="detail.modified">
        Modified: {{ detail.modified }}
      </p>
    </div>
    <div
      v-if="loading"
      class="loadingFull">
      <loading-indicator size="lg" />
    </div>
  </div>
</template>

<script>
import LoadingIndicator from "./LoadingIndicator"
import AutoLink from "./AutoLink"
import ItemName from "./ItemName"

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ConceptDetail",
  components: {
    LoadingIndicator, AutoLink, ItemName
  },
  props: {
    /**
     * The concept object whose details should be displayed.
     */
    item: {
      type: Object,
      default: null
    },
    /**
     * `true` means item is a scheme, `false` means item is a concept.
     */
    isScheme: {
      type: Boolean,
      default: false
    },
    /**
     * The height of the component as a flex value.
     */
    flex: {
      type: Number,
      default: 1
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    },
    /**
     * Reference to the scheme
     */
    voc: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      detail: null,
      loading: false
    }
  },
  watch: {
    /**
     * Refreshes data when item changes.
     */
    item: function() {
      this.detail = null
      if (this.item == null) return
      let itemBefore = this.item
      let vm = this
      this.loading = true
      // Get details from API
      this.$api.data(this.item.uri, this.$api.detailProperties)
        .then(function(data) {
          if (itemBefore != vm.item) {
            console.log("Item changed during the request, discarding data...")
          } else {
            if (Array.isArray(data) && data.length > 0)
              vm.detail = data[0]
            if (data.length > 1) {
              console.log("For some reason, more than one set of properties was received for ", vm.item)
            }
            vm.loading = false
          }
        }).catch(function(error) {
          console.log("Request failed", error)
          vm.loading = false
        })
    }
  },
  methods: {
    parentClicked(parent) {
      /**
       * Event when the user has chosen a result.
       *
       * @event chooseUri
       * @type {string} - uri that is chosen
       */
      this.$emit("chooseUri", parent.uri)
    }
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptDetail {
  font-size: 0.8em;
  height: 0;
  position: relative;
}
p {
  margin: 5px 0;
}
ul {
  margin-bottom: 0px;
}
.label {
  &:extend(.font-heavy);
}
.parents {
  margin-top: 5px;
}
.conceptDetailContent, .loadingFull {
  width: 100%;
  height: 100%;
  position: absolute;
  overflow-y: auto;
  top: 0;
  left: 0;
}
.conceptDetailContent {
  padding: 2px 8px 2px 8px;
}
.loadingFull {
  z-index: 100;
  background-color: #ffffff55;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
