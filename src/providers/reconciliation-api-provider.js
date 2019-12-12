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
    let swap
    let concept
    let fromConceptScheme = _.get(from, "inScheme[0]")
    let toConceptScheme = _.get(to, "inScheme[0]")
    let fromScheme
    let toScheme
    if (!from || jskos.isContainedIn(fromConceptScheme, this.registry.schemes || [])) {
      swap = true
      concept = to
      fromScheme = toConceptScheme
      toScheme = (this.registry.schemes || []).find(scheme => jskos.compare(scheme, _.get(to, "inScheme[0]"))) || (this.registry.schemes || [])[0]
    } else {
      swap = false
      concept = from
      fromScheme = fromConceptScheme
      toScheme = (this.registry.schemes || []).find(scheme => jskos.compare(scheme, _.get(from, "inScheme[0]"))) || (this.registry.schemes || [])[0]
    }
    // Temporary to filter out GND mapping requests...
    // FIXME: Remove!
    if (mode != "or" || !concept || !this.registry.reconcile) {
      return Promise.resolve([])
    }
    // If concept's scheme is the same as reconciliation scheme, skip
    if (!fromScheme || !toScheme || jskos.compare(fromScheme, toScheme)) {
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
    return this.__getReconciliationResults(labels, language).then(({ url, data: results }) => {
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
      // Prepare namespace
      let namespace = _.get(toScheme, "namespace", "")
      // Map results to actual mappings
      let mappings = results.map(result => ({
        fromScheme,
        from: { memberSet: [concept] },
        toScheme,
        to: { memberSet: [
          {
            uri: namespace + result.id,
          },
        ] },
        type: [
          result.match ?
            "http://www.w3.org/2004/02/skos/core#exactMatch" :
            (
              result.score >= 80 ?
                "http://www.w3.org/2004/02/skos/core#closeMatch" :
                "http://www.w3.org/2004/02/skos/core#mappingRelation"
            ),
        ],
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
      mappings.url = url
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
      return Promise.resolve(resultsFromCache)
    }
    // Prepare queries
    let queries = {}
    let index = 0
    for (let label of labels) {
      queries[`q${index}`] = {
        query: label,
      }
      index += 1
    }
    let url =this.registry.reconcile
    if (language) {
      url = url.replace("{language}", language)
    }
    queries = JSON.stringify(queries)
    if (url.startsWith("http:") && window.location.protocol == "https:") {
      return Promise.resolve({})
    }
    return this.post(url, qs.stringify({ queries }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }).then(data => {
      data = data || {}
      let newCacheEntry = {
        labels,
        language,
        data,
        url: `${url}${url.includes("?") ? "&" : "?"}${qs.stringify({ queries })}`,
      }
      this.cache.push(newCacheEntry)
      return newCacheEntry
    })
  }

}

ReconciliationApiProvider.providerName = "ReconciliationApi"
ReconciliationApiProvider.stored = false

export default ReconciliationApiProvider
