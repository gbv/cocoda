import jskos from "jskos-tools"
import MappingsApiProvider from "./mappings-api-provider"

/**
 * Extension of normal mappings API to provide experimental support for saving mappings. Will be replaced by MappingsApiProvider as soon as it has support for saving mappings.
 *
 * Only for use with KENOM instance of Cocoda for now.
 */
class KenomMappingsApiProvider extends MappingsApiProvider {
  /**
   * Saves mappings to local storage. Returns a Promise with a list of mappings that were saved.
   *
   * @param {*} mappings - list of mappings in object form: { mapping, original }
   */
  _saveMappings(mappings = []) {
    let promises = []
    for (let { mapping } of mappings) {
      mapping = jskos.minifyMapping(mapping)
      mapping = jskos.addMappingIdentifiers(mapping)
      promises.push(this.http.post(this.registry.mappings, {
        mapping
      }))
    }
    return Promise.all(promises).then(results => {
      let savedMappings = []
      for (let { data } of results) {
        if (data.ok) {
          savedMappings.push(data.mapping)
        }
      }
      return savedMappings
    })
  }
}

KenomMappingsApiProvider.providerName = "KenomMappingsApi"

export default KenomMappingsApiProvider
