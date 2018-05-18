<template>
  <div v-if="item != null" class="conceptDetail">
      <div v-if="detail != null" class="conceptDetailContent">
        <div class="parents">
          <span v-for="parent in parents" :key="parent.uri">
            <item-name :item="parent" /> →
          </span>
        </div>
        <loading-indicator v-show="loadingParents" size="sm" />
        <item-name :item="detail" class="label" />
        <p>{{ isSchema ? "Schema" : "Concept" }} - <possible-link :link="detail.uri" /></p>
        <p v-if="detail.identifier">
          Identifier:
          <ul>
            <li v-for="(identifier, index) in detail.identifier" :key="index">
              <possible-link :link="identifier" />
            </li>
          </ul>
        </p>
        <p v-if="detail.altLabel">
          Label: {{ detail.altLabel.de ? detail.altLabel.de[0] : detail.altLabel.en[0] }}
        </p>
        <p v-if="detail.definition">
          Definition: {{ detail.definition.de ? detail.definition.de[0] : detail.definition.en[0] }}
        </p>
        <p v-if="detail.license">
          License:
          <ul>
            <li v-for="(license, index) in detail.license" :key="index">
              <possible-link :link="license.uri" />
            </li>
          </ul>
        </p>
        <p v-if="detail.publisher">
          Publisher:
          <ul>
            <li v-for="(publisher, index) in detail.publisher" :key="index">
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
      <div v-if="loading" class="loadingFull">
        <loading-indicator size="lg"  />
      </div>
   </div>
</template>

<script>
import * as api from './api'
import LoadingIndicator from './LoadingIndicator'
import PossibleLink from './PossibleLink'
import ItemName from './ItemName'

/**
 * Displays an item's (either schema or concept) details (URI, notation, identifier, ...)
 * isSchema == true means item contains a schema's notation (needed to get data from API).
 * isSchema == false means item contains a concept's uri.
 */
export default {
  name: 'ConceptDetail',
  props: ["item", "isSchema"],
  components: {
    LoadingIndicator, PossibleLink, ItemName
  },
  data () {
    return {
      detail: null,
      loading: false,
      loadingParents: false,
      parents: []
    }
  },
  watch: {
    item: function(newValue, oldValue) {
      this.detail = null
      if (this.item == null) return;
      let itemBefore = this.item
      let vm = this
      this.loading = true
      // Get details from API
      api.data(this.item.uri, api.detailProperties)
        .then(function(data) {
          if (itemBefore != vm.item) {
            console.log('Item changed during the request, discarding data...')
          } else {
            if (Array.isArray(data) && data.length > 0)
            vm.detail = data[0]
            if (data.length > 1) {
              console.log('For some reason, more than one set of properties was received for ', vm.item)
            }
            vm.loading = false
          }
        }).catch(function(error) {
          console.log('Request failed', error)
          vm.loading = false
        })
      // Get ancestors from API
      this.parents = []
      if (this.loadingParents) {
        // TODO: Cancel previous load request
      } else {
        this.loadingParents = true
      }
      api.ancestors(this.item.uri, api.defaultProperties, null)
        .then(function(data) {
          vm.parents = data
          vm.loadingParents = false
        }).catch(function(error) {
          console.log('Request failed', error)
          vm.loadingParents = false
        })
    }
  }
}
</script>

<style scoped>
.conceptDetail {
  margin-top: 5px;
  font-size: 0.8em;
  flex: 1;
  overflow-y: auto;
  position: relative;
}
p {
  margin: 5px 0;
}
ul {
  margin-bottom: 0px;
}
.label {
  font-size: 1.5em;
}
.parents {
  font-size: 0.9em;
  margin-top: 5px;
}
.parents > span {
  margin-right: 5px;
}
.conceptDetailContent, .loadingFull {
  width: 100%;
  height: 100%;
  position: absolute;
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
