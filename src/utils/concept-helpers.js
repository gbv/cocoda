/**
 * Helper methods for concept contents. Used in combination with ConceptMap component.
 *
 * TODO: Some of these methods are getting called several times. This can probably be optimized.
 */

import _ from "lodash"
import jskos from "jskos-tools"
import { getItem } from "@/items"
import i18n from "@/utils/i18n.js"

function gndTermsForConcept(concept) {
  const gnd = getItem({ uri: "http://bartoc.org/en/node/430" })
  // Assemble gndTerms array for display
  let mappings = _.get(concept, "__GNDMAPPINGS__", [])
  let concepts = []
  for (let mapping of mappings) {
    for (let concept of jskos.conceptsOfMapping(mapping)) {
      if (jskos.compare(gnd, _.get(concept, "inScheme[0]")) && !concepts.find(c => jskos.compare(c.concept, concept))) {
        concepts.push({
          concept: getItem(concept),
          type: jskos.mappingTypeByType(mapping.type),
        })
      }
    }
  }
  let gndTerms = []
  let relevanceOrder = ["conceptDetail.relevanceVeryHigh", "conceptDetail.relevanceHigh", "conceptDetail.relevanceMedium", "conceptDetail.relevanceLow", "conceptDetail.relevanceGeneric"]
  for (let relevance of relevanceOrder) {
    for (let { concept } of concepts.filter(c => c.type.RELEVANCE == i18n.t(relevance, "en"))) {
      if (concept && (jskos.prefLabel(concept, { fallbackToUri: false }))) {
        gndTerms.push(_.escape(jskos.prefLabel(concept)))
      }
    }
  }
  return gndTerms
}

// TODO: Externalize this (maybe even as setting)
// TODO: Make sure multiple scheme URIs work
// Custom titles for certain vocabularies
const customTitles = [
  {
    get _scheme() {
      return getItem({ uri: "http://bartoc.org/en/node/18785" })
    },
    altLabel: "Synonym",
    scopeNote: "hier",
    note: "Verweisung",
    definition: "Erläuterung",
  },
]

function contentForConcept(concept) {
  const gndTerms = gndTermsForConcept(concept)
  const content = [
    {
      title: i18n.t("conceptDetail.prefLabel"),
      prop: "prefLabel",
      languageMap: concept.prefLabel,
    },
    {
      title: i18n.t("conceptDetail.altLabel"),
      prop: "altLabel",
      languageMap: concept.altLabel,
      isArray: true,
    },
    {
      title: i18n.t("conceptDetail.gnd"),
      languageMap: gndTerms.length ? { de: gndTerms } : null,
      isArray: true,
    },
    {
      title: i18n.t("conceptDetail.scope"),
      prop: "scopeNote",
      languageMap: concept.scopeNote,
      isArray: true,
    },
    {
      title: i18n.t("conceptDetail.editorial"),
      prop: "editorialNote",
      languageMap: concept.editorialNote,
      isArray: true,
    },
    {
      title: i18n.t("conceptDetail.note"),
      prop: "note",
      languageMap: concept.note,
      isArray: true,
    },
    {
      title: i18n.t("conceptDetail.definition"),
      prop: "definition",
      languageMap: concept.definition,
      isArray: true,
    },
  ]
  const titles = customTitles.find(t => jskos.compare(t._scheme, concept?.inScheme?.[0]))
  if (titles) {
    content.forEach(entry => {
      entry.title = titles[entry.prop] ?? entry.title
    })
  }
  return content.filter(part => part.languageMap && Object.keys(part.languageMap).length)
}

function allLanguagesForConcept(concept) {
  const content = contentForConcept(concept)
  const props = content.map(part => part.prop).filter(Boolean)
  const languageSet = new Set()
  for (let prop of props) {
    Object.keys(concept[prop] ?? {}).forEach(key => languageSet.add(key))
  }
  return Array.from(languageSet).filter(language => language !== "-")
}

function mainLanguagesForConcept(concept) {
  const content = contentForConcept(concept)
  const props = content.map(part => part.prop).filter(Boolean)
  let language
  for (let prop of props) {
    language = jskos.languagePreference.selectLanguage(concept[prop])
    if (language) {
      break
    }
  }
  const languages = []
  if (language) {
    languages.push(language)
  }
  const mainLanguage = jskos.languagePreference.getLanguages()?.[0]
  if (language !== mainLanguage) {
    languages.push(mainLanguage)
  }
  const allLanguages = allLanguagesForConcept(concept)
  if (language !== "en" && allLanguages.includes("en")) {
    languages.push("en")
  }
  return languages
}

function additionalLanguagesForConcept(concept) {
  return allLanguagesForConcept(concept).filter(language => !mainLanguagesForConcept(concept).includes(language))
}

export function mainLanguagesContentMapForConcept(concept) {
  return contentMapForConceptByLanguages(concept, mainLanguagesForConcept(concept))

}

export function additionalLanguagesContentMapForConcept(concept) {
  return contentMapForConceptByLanguages(concept, additionalLanguagesForConcept(concept))
}

function contentMapForConceptByLanguages(concept, languages) {
  const content = contentForConcept(concept)
  const contentMap = {}
  let lastOfSecion
  for (const { title, languageMap, isArray, prop } of content) {
    for (let language of languages) {
      if (!languageMap[language]) {
        continue
      }
      const array = isArray ? languageMap[language] : [languageMap[language]]
      if (!array.length) {
        continue
      }
      for (let text of array) {
        if (!contentMap[text]) {
          lastOfSecion = contentMap[text] = {
            props: new Set(),
            sources: new Set(),
            languages: new Set(),
          }
        }
        contentMap[text].sources.add(title)
        contentMap[text].languages.add(language)
        prop && contentMap[text].props.add(prop)
      }
    }
    if (lastOfSecion) {
      lastOfSecion.margin = true
    }
  }
  // Convert all sets into arrays
  Object.values(contentMap).forEach(value => {
    value.sources = Array.from(value.sources)
    value.languages = Array.from(value.languages)
    value.props = Array.from(value.props)
  })
  return contentMap
}
