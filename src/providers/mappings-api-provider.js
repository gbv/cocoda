import jskos from "jskos-tools"
import _ from "lodash"
import BaseProvider from "./base-provider"
// TODO: This should be removed in the future. Necessary methods should be moved to jskos-tools.
import util from "../util"

/**
 * For APIs that provide concordances and mappings in JSKOS format.
 */
class MappingsApiProvider extends BaseProvider {
  /**
   * Returns a Promise with a list of mappings from a jskos-server.
   */
  _getMappings({ from, fromScheme, to, toScheme, creator, type, partOf, offset, limit, direction, mode, identifier, options, cancelToken }) {
    let params = {}
    if (from) {
      params.from = _.isString(from) ? from : from.uri
    }
    if (fromScheme) {
      params.fromScheme = _.isString(fromScheme) ? fromScheme : fromScheme.uri
    }
    if (to) {
      params.to = _.isString(to) ? to : to.uri
    }
    if (toScheme) {
      params.toScheme = _.isString(toScheme) ? toScheme : toScheme.uri
    }
    if (creator) {
      params.creator = _.isString(creator) ? creator : util.prefLabel(creator)
    }
    if (type) {
      params.type = _.isString(type) ? type : type.uri
    }
    if (partOf) {
      params.partOf = _.isString(partOf) ? partOf : partOf.uri
    }
    if (offset) {
      params.offset = offset
    }
    if (limit) {
      params.limit = limit
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
    console.log(params)
    options = Object.assign({}, { params }, options)
    return this.get(this.registry.mappings, options, cancelToken).then(mappings => {
      mappings = mappings || []
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

  /**
   * Saves a mapping with http post or http put. Returns a Promise with the saved mapping.
   *
   * @param {*} mapping
   * @param {*} original
   */
  _saveMapping(mapping, original) {
    mapping = jskos.minifyMapping(mapping)
    mapping = jskos.addMappingIdentifiers(mapping)
    let uri = _.get(original, "uri")
    if (uri) {
      // If there is a URI, use PUT to update the mapping.
      return this.put(uri, mapping)
    } else {
      // Otherwise, use POST to save the mapping.
      return this.post(this.registry.mappings, mapping)
    }
  }

  /**
   * Removes a mapping with http delete. Returns a Promise with a boolean whether removal was successful.
   */
  _removeMapping(mapping) {
    let uri = _.get(mapping, "uri")
    if (uri) {
      return this.delete(uri).then(result => result === undefined ? false : true)
    } else {
      return Promise.resolve(false)
    }
  }

  /**
   * Adds a new annotation with http POST.
   */
  _addAnnotation(annotation) {
    return this.post(this.registry.annotations, annotation)
  }

  /**
   * Edits an annotation. If patch is given, http PATCH will be used, otherwise PUT.
   */
  _editAnnotation(annotation, patch) {
    let uri = _.get(annotation, "id")
    if (uri) {
      if (patch) {
        return this.patch(uri, patch)
      } else {
        return this.put(uri, annotation)
      }
    } else {
      return Promise.resolve(null)
    }
  }

  /**
   * Removes an annotation with http DELETE. Returns a Promise with a boolean whether removal was successful.
   */
  _removeAnnotation(annotation) {
    let uri = _.get(annotation, "id")
    if (uri) {
      return this.delete(uri).then(result => result === undefined ? false : true)
    } else {
      return Promise.resolve(false)
    }
  }

  /**
   * Returns a promise with a list of concordances.
   */
  _getConcordances() {
    if (!this.registry.concordances) {
      return Promise.resolve([])
    }
    return this.get(this.registry.concordances).then(concordances => {
      console.log(concordances)
      return concordances
    })
  }
}

MappingsApiProvider.providerName = "MappingsApi"

export default MappingsApiProvider
