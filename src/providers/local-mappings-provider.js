import _ from "lodash"
import jskos from "jskos-tools"
import BaseProvider from "./base-provider"
import localforage from "localforage"

/**
 * For saving and retrieving mappings from the browser's local storage.
 */
class LocalMappingsProvider extends BaseProvider {

  constructor(...params) {
    super(...params)
    this.queue = []
    this.localStorageKey = "cocoda-mappings--" + this.path
    let oldLocalStorageKey = "mappings"
    // Migration from old local storage key to new one if necessary
    Promise.all([localforage.getItem(oldLocalStorageKey), localforage.getItem(this.localStorageKey)]).then(results => {
      let [oldMappings, newMappings] = results
      if (oldMappings && !newMappings) {
        localforage.setItem(this.localStorageKey, oldMappings).then(() => {
          console.warn(`Migrated from old local storage key (${oldLocalStorageKey}) to new one (${this.localStorageKey})`)
        }).catch(error => {
          console.error("Error attempting to migrate from old storage key to new one:", error)
        })
      }
    })
  }

  /**
   * Returns a Promise that returns an object { mappings, done } with the local mappings and a done function that is supposed to be called when the transaction is finished.
   * This prevents conflicts when _saveMapping is called multiple times simultaneously.
   *
   * TODO: There might be a better solution for this...
   */
  getMappingsQueue(...params) {
    let last = _.last(this.queue) || Promise.resolve()
    return new Promise((resolve) => {
      function defer() {
        var res, rej

        var promise = new Promise((resolve, reject) => {
          res = resolve
          rej = reject
        })

        promise.resolve = res
        promise.reject = rej

        return promise
      }
      let promise = defer()
      let done = () => {
        promise.resolve()
      }
      this.queue.push(promise)

      last.then(() => {
        return this.getMappings(...params)
      }).then(mappings => {
        resolve({ mappings, done })
      })
    })
  }

  /**
   * Returns a Promise with a list of local mappings.
   */
  _getMappings({ from, to, direction, mode, identifier } = {}) {
    let params = {}
    if (from) {
      params.from = from.uri
    }
    if (to) {
      params.to = to.uri
    }
    if (direction) {
      params.direction = direction
    }
    if (mode) {
      params.mode = mode
    }
    if (identifier) {
      params.identifier = identifier
    }
    return localforage.getItem(this.localStorageKey).then(mappings => mappings || []).catch(() => []).then(mappings => {
      if (params.direction == "both") {
        params.mode = "or"
      }
      // Filter mappings according to params (support for from + to)
      // TODO: - Support more parameters.
      // TODO: - Move to its own things.
      // TODO: - Support memberList and memberChoice.
      // TODO: - Clean all this up.
      if (params.mode == "or") {
        mappings = mappings.filter(mapping => {
          let fromInFrom = null != mapping.from.memberSet.find(concept => {
            return concept.uri == params.from
          })
          let fromInTo = null != mapping.to.memberSet.find(concept => {
            return concept.uri == params.from
          })
          let toInFrom = null != mapping.from.memberSet.find(concept => {
            return concept.uri == params.to
          })
          let toInTo = null != mapping.to.memberSet.find(concept => {
            return concept.uri == params.to
          })
          return (params.direction == "forward" && (fromInFrom || toInTo)) ||
            (params.direction == "backward" && (fromInTo || toInFrom)) ||
            (params.direction == "both" && (fromInFrom || fromInTo || toInFrom || toInTo))
        })
      } else {
        if (params.from) {
          mappings = mappings.filter(mapping => {
            let target = params.direction == "backward" ? "to" : "from"
            return null != mapping[target].memberSet.find(concept => {
              return concept.uri == params.from
            })
          })
        }
        if (params.to) {
          mappings = mappings.filter(mapping => {
            let target = params.direction == "backward" ? "from" : "to"
            return null != mapping[target].memberSet.find(concept => {
              return concept.uri == params.to
            })
          })
        }
      }
      if (params.identifier) {
        mappings = mappings.filter(mapping => {
          return params.identifier.split("|").map(identifier => {
            return (mapping.identifier || []).includes(identifier)
          }).reduce((current, total) => current || total)
        })
      }
      return mappings
    })
  }

  /**
   * Saves mappings to local storage. Returns a Promise with a list of mappings that were saved.
   *
   * @param {*} mappings - list of mappings in object form: { mapping, original }
   */
  _saveMapping(mapping, original) {
    return this.getMappingsQueue().then(({ mappings: localMappings, done }) => {
      if (!mapping.created) {
        mapping.created = (new Date()).toISOString()
      } else if (original) {
        mapping.modified = (new Date()).toISOString()
      }
      original = original || {}
      // Filter out original mapping and other local mappings with the same content identifier.
      localMappings = localMappings.filter(m => {
        let findContentId = id => id.startsWith("urn:jskos:mapping:content:")
        let id1 = m.identifier ? m.identifier.find(findContentId) : null
        let id2 = (original.identifier || []).find(findContentId)
        let id3 = (mapping.identifier || []).find(findContentId)
        return id1 != id2 && id1 != id3
      })
      localMappings.push(mapping)

      // Minify mappings before saving back to local storage
      localMappings = localMappings.map(mapping => jskos.minifyMapping(mapping))
      return localforage.setItem(this.localStorageKey, localMappings).then(() => {
        return mapping
      }).catch(error => {
        console.error("local-mappings - error in saveMapping:", error)
        return null
      }).then(mapping => {
        done()
        return mapping
      })
    })
  }

  /**
   * Removes mappings from local storage. Returns a Promise with a list of mappings that were removed.
   */
  _removeMapping(mapping) {
    mapping = jskos.addMappingIdentifiers(mapping)
    return this.getMappingsQueue().then(({ mappings: localMappings, done }) => {
      let filter = (reverse = false) => mapping => m => {
        let findContentId = id => id.startsWith("urn:jskos:mapping:content:")
        let id1 = m.identifier ? m.identifier.find(findContentId) : null
        let id2 = mapping.identifier ? mapping.identifier.find(findContentId) : null
        let result = id1 == null || id2 == null || id1 != id2
        return reverse ? !result : result
      }
      // Remove by content identifier
      localMappings = localMappings.filter(filter()(mapping))
      // Minify mappings before saving back to local storage
      localMappings = localMappings.map(mapping => jskos.minifyMapping(mapping))
      return localforage.setItem(this.localStorageKey, localMappings).then(() => {
        return mapping
      }).catch(error => {
        console.error("local-mappings - error in removeMapping:", error)
        return null
      }).then(mapping => {
        done()
        return mapping
      })
    })
  }
}

LocalMappingsProvider.providerName = "LocalMappings"

export default LocalMappingsProvider
