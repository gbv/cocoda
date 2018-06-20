<template>
  <div
    class="conceptDetail font-size-small">
    <minimizer text="Concept Detail" />
    <div
      v-if="detail != null"
      class="conceptDetailContent">
      <div
        v-if="item.ancestors && item.ancestors.length > 0 && (item.ancestors.length > 1 || !item.ancestors.includes(null))"
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
            font-size="small"
            @click.native="chooseUri(parent, isLeft)" />
          <span v-if="index < item.ancestors.length - 1">
            ›
          </span>
        </span>
      </div>
      <span v-else-if="item.ancestors"><loading-indicator
        v-show="item.ancestors.length != 0 && !isScheme"
        size="sm" /></span>
      <item-name
        :item="detail"
        :is-highlighted="true"
        font-size="normal"
        class="label" />
      <p><font-awesome-icon icon="link" /> <auto-link :link="detail.uri" /></p>
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
        <span
          v-for="(label, index) in [].concat(detail.altLabel.de, detail.altLabel.en)"
          v-if="label != null && label != ''"
          :key="index">
          {{ label }}<br>
        </span>
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
      <p v-if="gndMappings.length != 0">
        GND mappings:
        <span
          v-for="(mapping, index) in gndMappings"
          :key="index">
          <a
            :href="mapping.uri"
            target="_blank">
            <b-badge class="badgeLink">{{ mapping.notation[0] }}</b-badge>
          </a>&nbsp;
        </span>
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
      v-else-if="!loading"
      class="loadingFull font-size-normal font-heavy">Please select a scheme/concept.</div>
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
import Minimizer from "./Minimizer"
import axios from "axios"
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ConceptDetail",
  components: {
    LoadingIndicator, AutoLink, ItemName, Minimizer, FontAwesomeIcon
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
      loading: false,
      gndMappings: []
    }
  },
  watch: {
    /**
     * Refreshes data when item changes.
     */
    item: function() {
      this.loadDetails()
    }
  },
  created() {
    this.loadDetails()
  },
  methods: {
    loadDetails() {
      this.detail = this.item
      this.gndMappings = []
      if (this.item == null) return
      let itemBefore = this.item
      let vm = this
      this.loading = true
      // Get details from API
      this.$api.data(this.voc, this.item.uri, this.$api.detailProperties)
        .then(function(data) {
          if (itemBefore != vm.item) {
            console.log("Item changed during the request, discarding data...")
          } else {
            if (Array.isArray(data) && data.length > 0) {
              vm.detail = data[0]
            }
            if (data.length > 1) {
              console.log("For some reason, more than one set of properties was received for ", vm.item)
            }
            vm.loading = false
          }
        }).catch(function(error) {
          console.log("Request failed", error)
          vm.loading = false
        })

      // Get GND mappings
      // TODO: - Put into its own mapping providers module.
      axios.get("//coli-conc.gbv.de/api/mappings", {
        params: {
          from: this.item.uri
        }
      }).then(function(response) {
        vm.gndMappings = []
        let data = response.data
        for(let mapping of data) {
          if (mapping.toScheme.uri == "http://bartoc.org/en/node/430") {
            vm.gndMappings = vm.gndMappings.concat(mapping.to.memberSet || [])
          }
        }
      }).catch(function(error) {
        console.log("API error (GND mappings):", error)
      })
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptDetail {
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
.badgeLink:hover {
  background-color: @color-secondary-2-4;
}
</style>
