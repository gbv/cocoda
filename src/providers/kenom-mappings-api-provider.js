import jskos from "jskos-tools"
import MappingsApiProvider from "./mappings-api-provider"

/**
 * Extension of normal mappings API to provide experimental support for saving mappings. Will be replaced by MappingsApiProvider as soon as it has support for saving mappings.
 *
 * Only for use with KENOM instance of Cocoda for now.
 */
class KenomMappingsApiProvider extends MappingsApiProvider {
  /**
   * Saves a mapping with http post. Returns a Promise with the saved mapping.
   *
   * @param {*} mappings - list of mappings in object form: { mapping, original }
   */
  _saveMapping(mapping) {
    mapping = jskos.minifyMapping(mapping)
    mapping = jskos.addMappingIdentifiers(mapping)
    return this.post(this.registry.mappings, {
      mapping
    })
  }
}

KenomMappingsApiProvider.providerName = "KenomMappingsApi"

export default KenomMappingsApiProvider
