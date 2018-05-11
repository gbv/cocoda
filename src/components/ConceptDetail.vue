<template>
   <div v-if="item != null" class="conceptDetail">
      <p>Type: {{ isSchema ? "Schema" : "Concept" }}</p>
      <span v-if="detail != null">
        <p>URI: <possible-link :link="detail.uri" /></p>
        <p v-if="detail.notation">
          Notations: <b-badge v-for="(notation, index) in detail.notation" :key="index">
            {{ notation }}
          </b-badge>
        </p>
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
      </span>
      <span v-else>
        <loading-indicator v-show="loading" />
      </span>
   </div>
</template>

<script>
import axios from 'axios'
import LoadingIndicator from './LoadingIndicator'
import PossibleLink from './PossibleLink'

/**
 * Displays an item's (either schema or concept) details (URI, notation, identifier, ...)
 * isSchema == true means item contains a schema's notation (needed to get data from API).
 * isSchema == false means item contains a concept's uri.
 */
export default {
  name: 'ConceptDetail',
  props: ["item", "isSchema"],
  components: {
    LoadingIndicator, PossibleLink
  },
  data () {
    return {
      detail: null,
      loading: false
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
      // TODO: - Move API calls into its own class.
      let params = {
        properties: "*"
      }
      let url = ""
      if (this.isSchema) {
        url = 'http://api.dante.gbv.de/voc/'+this.item
      } else {
        url = 'http://api.dante.gbv.de/data'
        params.uri = this.item
      }
      axios.get(url, {
        params: params
        })
        .then(function(response) {
          if (itemBefore != vm.item) {
            console.log('Item changed during the request, discarding data...')
          } else {
            if (Array.isArray(response.data) && response.data.length > 0)
            vm.detail = response.data[0]
            if (response.data.length > 1) {
              console.log('For some reason, more than one set of properties was received for ', vm.item)
            }
            vm.loading = false
          }
        }).catch(function(error) {
          console.log('Request failed', error)
          vm.loading = false
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
}
p {
  margin: 5px 0;
}
ul {
  margin-bottom: 0px;
}
</style>
