import jskos from "jskos-tools"
import _ from "lodash"
import BaseProvider from "./base-provider"

/**
 * For APIs that provide concordances and mappings in JSKOS format.
 */
class MappingsApiProvider extends BaseProvider {
  /**
   * Returns a Promise with a list of mappings from a jskos-server.
   */
  _getMappings({ from, to, direction, mode, identifier, options }) {
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
    options = Object.assign({}, { params }, options)
    return this.get(this.registry.mappings, options).then(mappings => {
      // Filter exact duplicates from result
      let newMappings = []
      for (let mapping of mappings) {
        if (!newMappings.find(m => _.isEqual(m, mapping))) {
          newMappings.push(mapping)
        }
      }
      return newMappings
    }).then(mappings => {
      for (let mapping of mappings) {
        // Add mapping type if not available
        mapping.type = mapping.type || [jskos.defaultMappingType.uri]
        // Add JSKOS mapping identifiers
        mapping = jskos.addMappingIdentifiers(mapping)
        // Add fromScheme and toScheme if missing
        if (!mapping.fromScheme) {
          mapping.fromScheme = _.get(mapping, "from.memberSet[0].inScheme[0]")
        }
        if (!mapping.toScheme) {
          mapping.toScheme = _.get(mapping, "to.memberSet[0].inScheme[0]")
        }
      }
      return mappings
    })
  }
}

MappingsApiProvider.providerName = "MappingsApi"

export default MappingsApiProvider
