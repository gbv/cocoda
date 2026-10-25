import { MOCK_API, testConfig } from "../fixtures/config.js"
import {
  schemes,
  topConcepts,
  narrower,
  conceptsByUri,
  concordances,
  mappings,
} from "../fixtures/data.js"

/**
 * Serves every network request the app makes during the e2e tests.
 *
 * Nothing leaves the browser: `/cocoda.json` is answered with the test config
 * (see fixtures/config.js) and all JSKOS API calls are answered from the
 * fixtures. Any request that is neither of those is failed deliberately and
 * recorded, so a test can assert that no unexpected backend was contacted -
 * a silent fallback to a real server would otherwise be easy to miss.
 *
 * The URL layout mirrors what cocoda-sdk's ConceptApi provider derives from
 * the registry's `api` option (see its `_setup()`): /voc, /voc/top, /data,
 * /narrower, /ancestors, /types, /suggest, /search.
 */

function json(route, body) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    headers: {
      "Access-Control-Allow-Origin": "*",
      // The concept list pages through results and reads the total from here.
      "X-Total-Count": String(Array.isArray(body) ? body.length : 1),
    },
    body: JSON.stringify(body),
  })
}

/** `uri` may appear multiple times; cocoda-sdk also joins them with "|". */
function requestedUris(url) {
  const raw = url.searchParams.getAll("uri")
  return raw.flatMap(value => value.split("|")).filter(Boolean)
}

function applyPaging(url, list) {
  const limit = Number(url.searchParams.get("limit") ?? 0)
  const offset = Number(url.searchParams.get("offset") ?? 0)
  return limit > 0 ? list.slice(offset, offset + limit) : list.slice(offset)
}

/**
 * The status document a jskos-server would return. It has to list the
 * endpoints explicitly: once a non-empty status object is returned,
 * cocoda-sdk stops deriving undefined endpoints from `api`.
 */
function statusDocument() {
  return {
    ok: 1,
    config: { baseUrl: `${MOCK_API}/` },
    schemes: `${MOCK_API}/voc`,
    top: `${MOCK_API}/voc/top`,
    concepts: `${MOCK_API}/voc/concepts`,
    data: `${MOCK_API}/data`,
    narrower: `${MOCK_API}/narrower`,
    ancestors: `${MOCK_API}/ancestors`,
    types: `${MOCK_API}/types`,
    suggest: `${MOCK_API}/suggest`,
    search: `${MOCK_API}/search`,
  }
}

/**
 * TheSettings.vue:490 hard-codes a BARTOC registry for the list of selectable
 * languages, independent of the Cocoda config - so it has to be mocked
 * separately even though no test config mentions bartoc.org.
 */
const BARTOC_API = "https://bartoc.org/api"
const languageScheme = {
  uri: "http://bartoc.org/en/node/20287",
  prefLabel: { en: "Languages" },
  type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
}
const languageConcepts = [
  { uri: "http://example.org/lang/en", notation: ["en"], prefLabel: { en: "English" }, inScheme: [{ uri: languageScheme.uri }] },
  { uri: "http://example.org/lang/de", notation: ["de"], prefLabel: { en: "German" }, inScheme: [{ uri: languageScheme.uri }] },
]

function handleBartoc(route, url) {
  const path = url.pathname.replace(/^\/api/, "") || "/"
  switch (path) {
    case "/status":
      return json(route, {
        ok: 1,
        schemes: `${BARTOC_API}/voc`,
        top: `${BARTOC_API}/voc/top`,
        concepts: `${BARTOC_API}/voc/concepts`,
        data: `${BARTOC_API}/data`,
      })
    case "/voc":
      return json(route, [languageScheme])
    case "/voc/top":
    case "/voc/concepts":
    case "/data":
      return json(route, languageConcepts)
    default:
      return json(route, [])
  }
}

/**
 * Read-only JSKOS mappings backend. `config` is what cocoda-sdk turns into the
 * registry's `has.mappings` / `has.concordances` capabilities, so declaring
 * only `read` here keeps the registry non-writable - writing happens through
 * LocalMappings instead, which needs no account.
 */
const MAPPINGS_API = `${MOCK_API}/mappings-api`

function handleMappingsApi(route, url) {
  const path = url.pathname.replace(/^\/api\/mappings-api/, "") || "/"
  switch (path) {
    case "/status":
      return json(route, {
        ok: 1,
        config: {
          mappings: { read: true, create: false, update: false, delete: false },
          concordances: { read: true, create: false, update: false, delete: false },
        },
        mappings: `${MAPPINGS_API}/mappings`,
        concordances: `${MAPPINGS_API}/concordances`,
        annotations: `${MAPPINGS_API}/annotations`,
      })
    case "/concordances":
      return json(route, applyPaging(url, concordances))
    case "/mappings":
      return json(route, applyPaging(url, mappings))
    case "/annotations":
      return json(route, [])
    default:
      return json(route, [])
  }
}

function conceptsFor(uris) {
  return uris.map(uri => conceptsByUri[uri]).filter(Boolean)
}

function searchConcepts(query) {
  const needle = (query || "").toLowerCase()
  if (!needle) {
    return []
  }
  return Object.values(conceptsByUri).filter(concept =>
    Object.values(concept.prefLabel || {}).some(label => label.toLowerCase().includes(needle))
    || (concept.notation || []).some(n => n.toLowerCase().includes(needle)),
  )
}

function handleApi(route, url) {
  const path = url.pathname.replace(/^\/api/, "") || "/"

  switch (path) {
    case "/status":
      return json(route, statusDocument())

    case "/voc": {
      const uris = requestedUris(url)
      return json(route, uris.length
        ? schemes.filter(scheme => uris.includes(scheme.uri))
        : applyPaging(url, schemes))
    }

    case "/voc/top": {
      const [schemeUri] = requestedUris(url)
      return json(route, applyPaging(url, topConcepts[schemeUri] || []))
    }

    case "/voc/concepts":
    case "/data":
      return json(route, conceptsFor(requestedUris(url)))

    case "/narrower": {
      const [uri] = requestedUris(url)
      return json(route, narrower[uri] || [])
    }

    case "/ancestors": {
      const [uri] = requestedUris(url)
      const concept = conceptsByUri[uri]
      const parents = (concept?.broader || []).map(b => conceptsByUri[b.uri]).filter(Boolean)
      return json(route, parents)
    }

    case "/types":
      return json(route, [])

    case "/search":
      return json(route, applyPaging(url, searchConcepts(url.searchParams.get("search"))))

    case "/suggest": {
      // OpenSearch Suggest format: [query, labels, descriptions, uris]
      const query = url.searchParams.get("search")
      const results = searchConcepts(query).slice(0, 10)
      return json(route, [
        query || "",
        results.map(c => `${c.notation[0]} ${c.prefLabel.en}`),
        results.map(() => ""),
        results.map(c => c.uri),
      ])
    }

    default:
      return json(route, [])
  }
}

/**
 * Installs the request mocks on a page.
 *
 * @returns {object} `unexpected` holds URLs that were blocked because they
 *   targeted neither the app itself nor a mocked API. `detailRequests` records
 *   every concept URI the app asked details for - that is how a test can tell
 *   whether lazy loading actually followed the visible part of a long list.
 */
export async function installMocks(page, { config = testConfig } = {}) {
  const unexpected = []
  const detailRequests = []

  // Order matters: when several routes match, Playwright uses the one
  // registered LAST. The catch-all therefore has to go in first, otherwise it
  // would shadow the specific handlers below and let the real config through.

  // Anything that leaves the app's own origin is a bug in the test setup or an
  // unmocked backend. Fail it loudly rather than letting it reach out.
  await page.route("**/*", (route, request) => {
    const url = request.url()
    const isAppOrigin = url.startsWith("http://localhost:8080/")
      || url.startsWith("data:") || url.startsWith("blob:")
    if (isAppOrigin) {
      return route.continue()
    }
    unexpected.push(url)
    return route.abort()
  })

  await page.route(`${MOCK_API}/**`, route => {
    const url = new URL(route.request().url())
    if (url.pathname.startsWith("/api/mappings-api")) {
      return handleMappingsApi(route, url)
    }
    const path = url.pathname.replace(/^\/api/, "")
    if (path === "/data" || path === "/voc/concepts") {
      detailRequests.push(...requestedUris(url))
    }
    return handleApi(route, url)
  })

  await page.route(`${BARTOC_API}/**`, route => {
    handleBartoc(route, new URL(route.request().url()))
  })

  // The app fetches ./cocoda.json at runtime (store/actions.js loadConfig).
  await page.route("**/cocoda.json", route => json(route, config))

  return { unexpected, detailRequests }
}
