import * as CocodaSDK from "cocoda-sdk"
import MeshApiProvider from "@/utils/mesh-api-provider.js"
import { createBootstrap, Components as BootstrapComponents, Directives as BootstrapDirectives } from "bootstrap-vue-next"
import VueScrollTo from "vue-scrollto"
import jskos from "@/utils/jskos.js"
import log from "@/utils/log.js"
import store from "@/store/index.js"
import * as JskosVueTabs from "jskos-vue-tabs"
import { library } from "@fortawesome/fontawesome-svg-core"
import { faStar, faPlusCircle, faExchangeAlt, faThumbsUp, faThumbsDown, faAngleDown, faAngleRight, faAngleLeft, faLevelUpAlt, faLevelDownAlt, faEllipsisV, faEllipsisH, faSortUp, faTimesCircle, faLink, faIdCard, faUser, faSearch, faFilter, faCode, faCog, faDownload, faCaretDown, faInfoCircle, faComment, faEdit, faSave, faTrashAlt, faBan, faWindowMinimize, faPlusSquare, faCheck, faCheckSquare, faLock, faLockOpen, faExternalLinkSquareAlt, faLongArrowAltDown, faLongArrowAltUp, faExternalLinkAlt, faPuzzlePiece, faExclamation, faShareAltSquare, faRecycle, faCaretSquareLeft, faCaretSquareRight, faClipboard, faAngleDoubleRight, faClone, faExclamationCircle, faQuestionCircle, faChevronUp, faChevronDown, faPencilAlt, faArrowRight, faArrowLeft, faArrowUp, faArrowDown, faSyncAlt, faList, faSitemap, faSeedling, faArrowRightToBracket, faDiagramProject, faEnvelope } from "@fortawesome/free-solid-svg-icons"
import { faGithub } from "@fortawesome/free-brands-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import globalMixins from "@/mixins/global.js"

import FlexibleTable from "vue-flexible-table"
import "vue-flexible-table/dist/style.css"
import "jskos-vue-tabs/dist/style.css"
import "vue-virtual-scroller/dist/vue-virtual-scroller.css"

// Add all providers to cocoda-sdk
Object.keys(CocodaSDK).filter(key => key.endsWith("Provider")).forEach(key => {
  CocodaSDK.cdk.addProvider(CocodaSDK[key])
})

CocodaSDK.cdk.addProvider(MeshApiProvider)

// Set Vuex store and path on jskos-tools' languagePreference.
// Both are module singletons, so this stays outside the app instance.
const storePath = "getters.languages"
jskos.languagePreference.store = store
jskos.languagePreference.path = storePath

// Add fontawesome
library.add(faStar)
library.add(faPlusCircle)
library.add(faExchangeAlt)
library.add(faThumbsUp)
library.add(faThumbsDown)
library.add(faAngleDown)
library.add(faAngleRight)
library.add(faAngleLeft)
library.add(faLevelUpAlt)
library.add(faLevelDownAlt)
library.add(faEllipsisV)
library.add(faEllipsisH)
library.add(faSortUp)
library.add(faTimesCircle)
library.add(faLink)
library.add(faIdCard)
library.add(faUser)
library.add(faSearch)
library.add(faFilter)
library.add(faCode)
library.add(faCog)
library.add(faDownload)
library.add(faCaretDown)
library.add(faInfoCircle)
library.add(faComment)
library.add(faEdit)
library.add(faSave)
library.add(faTrashAlt)
library.add(faBan)
library.add(faWindowMinimize)
library.add(faPlusSquare)
library.add(faCheck)
library.add(faCheckSquare)
library.add(faLock)
library.add(faLockOpen)
library.add(faExternalLinkSquareAlt)
library.add(faLongArrowAltDown)
library.add(faLongArrowAltUp)
library.add(faExternalLinkAlt)
library.add(faGithub)
library.add(faPuzzlePiece)
library.add(faExclamation)
library.add(faShareAltSquare)
library.add(faRecycle)
library.add(faCaretSquareLeft)
library.add(faCaretSquareRight)
library.add(faClipboard)
library.add(faAngleDoubleRight)
library.add(faClone)
library.add(faExclamationCircle)
library.add(faQuestionCircle)
library.add(faChevronUp)
library.add(faChevronDown)
library.add(faPencilAlt)
library.add(faArrowRight)
library.add(faArrowLeft)
library.add(faArrowUp)
library.add(faArrowDown)
library.add(faSyncAlt)
library.add(faList)
library.add(faSitemap)
library.add(faSeedling)
library.add(faArrowRightToBracket)
library.add(faDiagramProject)
library.add(faEnvelope)

/**
 * Restores bootstrap-vue's defaults for the two floating-ui directives.
 *
 * Both fixes are about behaviour the old library had and the new one does not,
 * and both would otherwise have to be repeated at each of the ~80 call sites.
 *
 * **null bindings.**
 *
 * bootstrap-vue-next decides whether a directive is active with
 * `typeof values !== "object" || values.active !== false`. Since
 * `typeof null === "object"`, a null value reads `.active` off null and throws
 * - and it throws from a directive hook, i.e. inside Vue's post-flush queue.
 * Vue's dev build re-throws unhandled component errors, which escapes
 * `flushPostFlushCbs` before the scheduler resets `isFlushing` and
 * `currentFlushPromise`: no further flush is ever scheduled and the whole app
 * stops re-rendering. Event handlers still run, so the symptom is that every
 * button and tooltip goes dead while native behaviour (links, focus) keeps
 * working.
 *
 * `v-b-tooltip="condition ? {…} : null"` was the ordinary way to switch a
 * tooltip off in bootstrap-vue, so translate null to the new library's own
 * off switch instead of hunting down every binding.
 *
 * **Where the tooltip is rendered.**
 *
 * bootstrap-vue mounted tooltips on `document.body` unless told otherwise;
 * bootstrap-vue-next inserts them next to the target element and does not
 * teleport. Cocoda's tooltips mostly hang off small icons inside table cells
 * with `overflow: hidden`, so they came out clipped and squeezed into a few
 * characters' width. The `.body` modifier is this library's equivalent of the
 * old `container: "body"`; floating-ui still positions against the target, so
 * only the clipping changes. `.child`, which asks for the opposite, is left
 * alone.
 */
function withBootstrapVueDefaults(directive) {
  const adjust = binding => {
    const modifiers = binding.modifiers.child ? binding.modifiers : { ...binding.modifiers, body: true }
    return { ...binding, modifiers, value: binding.value === null ? { active: false } : binding.value }
  }
  const wrapped = {}
  for (const [hook, fn] of Object.entries(directive)) {
    wrapped[hook] = typeof fn === "function"
      ? (el, binding, ...rest) => fn(el, adjust(binding), ...rest)
      : fn
  }
  return wrapped
}

/**
 * Installs everything Cocoda needs into a Vue application instance.
 *
 * In Vue 2 all of this was registered on the global Vue singleton. In Vue 3
 * plugins, global components, mixins and globalProperties belong to a single
 * app instance, and Cocoda mounts two apps (see src/entry/). Both entry points
 * therefore call this function; registering into one of them only would leave
 * the other without $jskos, the global mixin and the shared components.
 */
export function installCocoda(app) {
  app.use(FlexibleTable)
  app.use(JskosVueTabs)
  app.use(VueScrollTo)

  // createBootstrap() only installs bootstrap-vue-next's own plugins (registry,
  // rtl, orchestrator); components and directives are not registered by it.
  // Cocoda uses <b-*> and v-b-* throughout its templates, so register them all
  // globally, as bootstrap-vue did.
  // teleportTo: bootstrap-vue rendered popovers into document.body unless a
  // `container` was named. bootstrap-vue-next renders them where they stand,
  // which leaves them laid out inside whatever element happens to hold the
  // target - for Cocoda that is often a settings cog in a near-zero-width
  // absolutely positioned corner, and the panel came out a few characters
  // wide. Set as a default so the ~9 call sites do not each have to say it.
  app.use(createBootstrap({ components: { BPopover: { teleportTo: "body" } } }))
  for (const [name, component] of Object.entries(BootstrapComponents)) {
    app.component(name, component)
  }
  for (const [name, directive] of Object.entries(BootstrapDirectives)) {
    // Exported as `vBTooltip`; registering it as "BTooltip" makes the template
    // form v-b-tooltip resolve. Only the two floating-ui directives get the
    // compatibility wrapper - for the others, modifiers mean something else
    // entirely (v-b-modal.someId names the modal).
    const isFloating = name === "vBTooltip" || name === "vBPopover"
    app.directive(name.replace(/^v/, ""), isFloating ? withBootstrapVueDefaults(directive) : directive)
  }

  // Use with this.$jskos in components
  app.config.globalProperties.$jskos = jskos
  // Use with this.$log.log/warn/error in components
  app.config.globalProperties.$log = log

  app.component("FontAwesomeIcon", FontAwesomeIcon)
  app.mixin(globalMixins)

  // Without a handler, Vue's dev build re-throws errors from components,
  // watchers and directive hooks. When one of those runs in the scheduler's
  // post-flush phase, the throw skips the scheduler's own cleanup and the app
  // stops rendering altogether - a single faulty tooltip binding took the whole
  // UI down that way. Log and carry on, which is what the production build
  // does anyway.
  // console.error rather than $log, which stays silent outside development.
  app.config.errorHandler = (error, instance, info) => {
    console.error(`Vue error (${info}) in <${instance?.$options?.name ?? "unknown"}>:`, error)
  }

  return app
}
