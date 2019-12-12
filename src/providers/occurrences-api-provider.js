import jskos from "jskos-tools"
import _ from "lodash"
import BaseProvider from "./base-provider"

/**
 * For APIs that provide occurrences in JSKOS format.
 */
class OccurrencesApiProvider extends BaseProvider {

  constructor(...params) {
    super(...params)
    this.occurrencesCache = []
    this.has.occurrences = true
  }

  occurrencesIsSupported(scheme) {
    let promise
    if (this.occurrencesSupportedSchemes && this.occurrencesSupportedSchemes.length) {
      promise = Promise.resolve(this.occurrencesSupportedSchemes)
    } else {
      // Load supported schemes from API
      promise = this.http.get(this.registry.occurrences + "voc").then(response => {
        this.occurrencesSupportedSchemes = _.get(response, "data", [])
        return this.occurrencesSupportedSchemes
      }).catch(() => {
        // Set to empty list, will try to load again on next request.
        this.occurrencesSupportedSchemes = []
        return this.occurrencesSupportedSchemes
      })
    }
    return promise.then(supportedSchemes => {
      let supported = false
      for (let supportedScheme of supportedSchemes) {
        if (jskos.compare(scheme, supportedScheme)) {
          supported = true
        }
      }
      return supported
    })
  }

  /**
   * Returns a Promise with a list of occurrences.
   */
  _getOccurrences({ from, to, concepts }) {
    let promises = []
    concepts = (concepts || []).concat([from, to])
    for (let concept of concepts) {
      promises.push(this.occurrencesIsSupported(_.get(concept, "inScheme[0]")).then(supported => {
        if (supported && concept.uri) {
          return concept.uri
        } else {
          return null
        }
      }))
    }
    return Promise.all(promises).then(uris => {
      uris = uris.filter(uri => uri != null)
      if (uris.length == 0) {
        return []
      }
      let promises = []
      for (let uri of uris) {
        promises.push(this.__getOccurrences({
          params: {
            member: uri,
            scheme: "*",
            threshold: 5,
          },
        }).catch(() => {
          return []
        }))
      }
      // Another request for co-occurrences between two specific concepts
      if (uris.length > 1) {
        let urisString = uris.join(" ")
        promises.push(this.__getOccurrences({
          params: {
            member: urisString,
            threshold: 5,
          },
        }).catch(() => {
          return []
        }))
      }
      return Promise.all(promises)
    }).then(results => {
      let occurrences = _.concat([], ...results)
      // Filter duplicates
      let existingUris = []
      let indexesToDelete = []
      for (let i = 0; i < occurrences.length; i += 1) {
        let occurrence = occurrences[i]
        if (!occurrence) {
          continue
        }
        let uris = occurrence.memberSet.reduce((total, current) => total.concat(current.uri), []).sort().join(" ")
        if (existingUris.includes(uris)) {
          indexesToDelete.push(i)
        } else {
          existingUris.push(uris)
        }
      }
      indexesToDelete.forEach(value => {
        delete occurrences[value]
      })
      // Filter null values
      occurrences = occurrences.filter(o => o != null)
      // Sort occurrences
      return occurrences.sort((a, b) => parseInt(b.count || 0) - parseInt(a.count || 0))
    }).catch(error => {
      console.error("Occurrences Error:", error)
      return []
    })
  }

  /**
   * Internal function for getOccurrences that either makes an API request or uses a local cache.
   *
   * @param {*} params
   */
  __getOccurrences(options) {
    // Use local cache.
    let resultsFromCache = this.occurrencesCache.find(item => {
      return _.isEqual(item.options.params, options.params)
    })
    if (resultsFromCache) {
      return Promise.resolve(resultsFromCache.data)
    }
    return this.get(this.registry.occurrences, options).then(data => {
      this.occurrencesCache.push({
        options,
        data,
      })
      return data
    })
  }
}

OccurrencesApiProvider.providerName = "OccurrencesApi"
OccurrencesApiProvider.stored = false

export default OccurrencesApiProvider
