import _ from "lodash"
import BaseProvider from "./base-provider"
import util from "../util"
import jskos from "jskos-tools"
import qs from "qs"

/**
 * Provider for the OpenRefine Reconciliation API.
 */
class ReconciliationApiProvider extends BaseProvider {

  constructor(...params) {
    super(...params)
    this.has.mappings = true
    this.cache = []
  }

  _getMappings({ from, to, mode }) {
    let swap = false
    let concept
    if (jskos.compare(this.registry.scheme, _.get(from, "inScheme[0]")) || !from) {
      concept = to
      swap = true
    } else {
      concept = from
    }
    // Temporary to filter out GND mapping requests...
    // FIXME: Remove!
    if (mode != "or" || !concept || !this.registry.baseUrl) {
      return Promise.resolve([])
    }
    // If concept's scheme is the same as reconciliation scheme, skip
    let scheme = _.get(concept, "inScheme[0]")
    if (!scheme || jskos.compare(scheme, this.registry.scheme)) {
      return Promise.resolve([])
    }
    // Prepare labels
    let language = util.getLanguage(concept.prefLabel)
    if (!language) {
      return Promise.resolve([])
    }
    let altLabels = _.get(concept, `altLabel.${language}`, [])
    if (_.isString(altLabels)) {
      altLabels = [altLabels]
    }
    let prefLabel = _.get(concept, `prefLabel.${language}`)
    let labels = altLabels.concat([prefLabel])
    labels = [prefLabel]
    // Get results from API or cache
    return this.__getReconciliationResults(labels, language).then(results => {
      results = [].concat(...Object.values(results).map(value => value.result))
      // Sort results, first by score descending, then by match, then by length of notation
      results = results.sort((a, b) => {
        if (a.score != b.score) {
          return b.score - a.score
        }
        if (a.match != b.match) {
          if (a.match) {
            return -1
          } else {
            return 1
          }
        }
        return a.id.length - b.id.length
      })
      // Map results to actual mappings
      let mappings = results.map(result => ({
        fromScheme: scheme,
        from: { memberSet: [concept] },
        toScheme: this.registry.scheme,
        to: { memberSet: [
          {
            uri: this.registry.namespace ? this.registry.namespace + result.id : result.id
          }
        ] },
        type: [
          result.match ?
            "http://www.w3.org/2004/02/skos/core#exactMatch" :
            (
              result.score >= 80 ?
                "http://www.w3.org/2004/02/skos/core#closeMatch" :
                "http://www.w3.org/2004/02/skos/core#mappingRelation"
            )
        ]
      }))
      if (swap) {
        // Swap mapping sides if only `to` was set
        mappings = mappings.map(mapping => Object.assign(mapping, {
          fromScheme: mapping.toScheme,
          from: mapping.to,
          toScheme: mapping.fromScheme,
          to: mapping.from,
        }))
      }
      return mappings
    })
  }

  /**
   * Internal function that either makes an API request or uses a local cache.
   *
   * @param {*} labels - list of labels
   */
  __getReconciliationResults(labels, language) {
    labels = labels.sort()
    // Use local cache.
    let resultsFromCache = this.cache.find(item => {
      return _.isEqual(item.labels, labels) && item.language == language
    })
    if (resultsFromCache) {
      return Promise.resolve(resultsFromCache.data)
    }
    // Prepare queries
    let queries = {}
    let index = 0
    for (let label of labels) {
      queries[`q${index}`] = {
        query: label
      }
      index += 1
    }
    let url =this.registry.baseUrl
    if (language) {
      url = url.replace("{language}", language)
    }
    queries = JSON.stringify(queries)
    return this.http.post(url, qs.stringify({ queries }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }).then(response => response.data).catch(() => []).then(data => {
      this.cache.push({
        labels,
        language,
        data
      })
      return data
    })
  }

}

ReconciliationApiProvider.providerName = "ReconciliationApi"

export default ReconciliationApiProvider
