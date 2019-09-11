import jskos from "jskos-tools"
import _ from "lodash"
import BaseProvider from "./base-provider"

// TODO: This should be removed in the future. Necessary methods should be moved to jskos-tools.
import util from "../util"

/**
 * Skosmos API Wrapper.
 */
class SkosmosApiProvider extends BaseProvider {

  constructor(...params) {
    super(...params)
    this.has.schemes = true
    this.has.top = false
    this.has.data = true
    this.has.concepts = true
    this.has.narrower = true
    this.has.ancestors = true
    this.has.types = false
    this.has.suggest = true
    this.has.search = true
    // Set concepts and topConcepts for schemes
    for (let scheme of this.registry.schemes) {
      scheme.concepts = [null]
      scheme.topConcepts = []
    }
  }

  async _getSchemes() {
    if (!this.registry.loadSchemeInfo) {
      return this.registry.schemes
    }
    const schemes = []
    const language = this.languages[0] || "en"
    for (let scheme of this.registry.schemes || []) {
      const url = `${this.registry.api}${scheme.VOCID}/?lang=${language}`
      const data = await this.get(url)
      const resultScheme = data.conceptschemes.find(s => jskos.compare(s, scheme))
      if (resultScheme && resultScheme.prefLabel) {
        _.set(scheme, `prefLabel.${language}`, resultScheme.prefLabel)
      }
      // TODO: If there is no label, redo the request with one of the available languages.
      schemes.push(scheme)
    }
    return schemes
  }

  async _getTop() {
    return []
  }

  getDataUrl(concept, { addFormatParameter = true } = {}) {
    const scheme = _.get(concept, "inScheme[0]")
    if (!concept.uri || !scheme || !scheme.VOCID) {
      return null
    }
    return `${this.registry.api}${scheme.VOCID}/data${addFormatParameter ? "?format=application/json" : ""}`
  }

  async _getConcepts(concepts) {
    if (!_.isArray(concepts)) {
      concepts = [concepts]
    }
    const newConcepts = []
    for (let concept of concepts) {
      const url = this.getDataUrl(concept, { addFormatParameter: false })
      if (!url) {
        continue
      }
      const result = await this.get(url, {
        params: {
          uri: concept.uri,
          format: "application/json",
        },
      })
      const resultConcept = result && result.graph && result.graph.find(c => jskos.compare(c, concept))
      if (resultConcept) {
        // Set prefLabel
        for (let prefLabel of resultConcept.prefLabel || []) {
          _.set(concept, `prefLabel.${prefLabel.lang}`, prefLabel.value)
        }
        // Set altLabel
        if (resultConcept.altLabel && !_.isArray(resultConcept.altLabel)) {
          resultConcept.altLabel = [resultConcept.altLabel]
        }
        for (let altLabel of resultConcept.altLabel || []) {
          if (_.get(concept, `altLabel.${altLabel.lang}`)) {
            concept.altLabel[altLabel.lang].push(altLabel.value)
            concept.altLabel[altLabel.lang] = _.uniq(concept.altLabel[altLabel.lang])
          } else {
            _.set(concept, `altLabel.${altLabel.lang}`, [altLabel.value])
          }
        }
        // Set broader/narrower
        // TODO: Fix issue that sets ancestors (because they don't apply here)
        for (let type of ["broader", "narrower"]) {
          concept[type] = resultConcept[type] || concept[type]
          if (concept[type] && !_.isArray(concept[type])) {
            concept[type] = [concept[type]]
          }
          // Set prefLabel for broader/narrower
          for (let relative of concept[type] || []) {
            const resultRelative = result.graph.find(c => jskos.compare(c, relative))
            if (resultRelative) {
              for (let prefLabel of resultRelative.prefLabel || []) {
                _.set(relative, `prefLabel.${prefLabel.lang}`, prefLabel.value)
              }
            }
          }
        }
        newConcepts.push(concept)
      }
    }
    return newConcepts
  }

  async _getNarrower() {
    return []
  }

  async _getAncestors() {
    return []
  }

  async _suggest(search, options = {}) {
    const concepts = await this._search(search, options)
    const result = [search, [], [], []]
    for (let concept of concepts) {
      const notation = util.notation(concept)
      const label = util.prefLabel(concept)
      result[1].push((notation ? notation + " " : "") + label)
      result[2].push("")
      result[3].push(concept.uri)
    }
    return result
  }

  /**
   * Search not yet implemented.
   */
  async _search(search, { scheme, limit, cancelToken } = {}) {
    if (!scheme || !scheme.VOCID) {
      return []
    }
    const url = `${this.registry.api}${scheme.VOCID}/search`
    const options = {
      params: {
        query: `${search}*`,
        unique: 1,
        maxhits: limit || 100,
      },
    }
    const response = await this.get(url, options, cancelToken)
    if (!response) {
      return []
    }
    const concepts = []
    for (let concept of response.results || []) {
      const notation = util.notation({ uri: concept.uri, inScheme: [scheme] })
      const label = concept.matchedPrefLabel || concept.altLabel || concept.prefLabel
      const newConcept = {
        uri: concept.uri,
        prefLabel: {
          [concept.lang]: label,
        },
        inScheme: [scheme],
      }
      if (notation) {
        newConcept.notation = [notation]
      }
      concepts.push(newConcept)
    }
    return concepts
  }

  async _getTypes() {
    return []
  }

}

SkosmosApiProvider.providerName = "SkosmosApi"

export default SkosmosApiProvider
