
let providers = {}

import BaseProvider from "./base-provider"
providers[BaseProvider.providerName] = BaseProvider

import LocalMappingsProvider from "./local-mappings-provider"
providers[LocalMappingsProvider.providerName] = LocalMappingsProvider

import MappingsApiProvider from "./mappings-api-provider"
providers[MappingsApiProvider.providerName] = MappingsApiProvider

import OccurrencesApiProvider from "./occurrences-api-provider"
providers[OccurrencesApiProvider.providerName] = OccurrencesApiProvider

import ConceptApiProvider from "./concept-api-provider"
providers[ConceptApiProvider.providerName] = ConceptApiProvider

import ReconciliationApiProvider from "./reconciliation-api-provider"
providers[ReconciliationApiProvider.providerName] = ReconciliationApiProvider

import SearchSuggestionProvider from "./search-suggestion-provider"
providers[SearchSuggestionProvider.providerName] = SearchSuggestionProvider

import SkosmosApiProvider from "./skosmos-api-provider"
providers[SkosmosApiProvider.providerName] = SkosmosApiProvider

// Add more providers here.

export default providers
