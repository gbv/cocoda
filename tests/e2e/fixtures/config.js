/**
 * The Cocoda config the app under test receives instead of `config/cocoda.json`.
 *
 * Two properties make this work without any remote system:
 *
 *  - `overrideRegistries: true` makes store/actions.js:52 skip the merge with
 *    cocoda.default.json, so none of the coli-conc registries are configured.
 *  - no `auth` key, so App.vue:527 never initializes gbv-login-client. That is
 *    why the tests need no credentials.
 *
 * Mappings are written to the LocalMappings provider, which stores them in the
 * browser via localforage - no network, no account, and it is a registry real
 * users have too.
 */

export const MOCK_API = "http://mock.test/api"

export const registries = [
  {
    uri: "http://example.org/registry/concepts",
    provider: "ConceptApi",
    api: `${MOCK_API}/`,
    notation: ["T"],
    prefLabel: { en: "Test Terminologies" },
    stored: true,
  },
  {
    uri: "http://example.org/registry/local-mappings",
    provider: "LocalMappings",
    notation: ["L"],
    prefLabel: { en: "Local Mappings" },
    stored: true,
  },
  {
    // Read-only mappings backend, so the concordance app and the mapping
    // browser have something to list.
    uri: "http://example.org/registry/mappings",
    provider: "MappingsApi",
    api: `${MOCK_API}/mappings-api/`,
    notation: ["M"],
    prefLabel: { en: "Test Mappings" },
    stored: true,
  },
]

export const testConfig = {
  overrideRegistries: true,
  registries,
  title: "Cocoda Test",
  languages: ["en", "de"],
  favoriteSchemes: [],
  conceptLists: [],
  searchLinks: [],
  logos: [],
  menu: [],
  autoRefresh: {},
}
