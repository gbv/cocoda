import Vue from "vue"
import * as CocodaSDK from "cocoda-sdk"
import MeshApiProvider from "@/utils/mesh-api-provider.js"
import BootstrapVue from "bootstrap-vue"
import VueScrollTo from "vue-scrollto"
import jskos from "@/utils/jskos.js"
import log from "@/utils/log.js"
import store from "@/store/index.js"
import { Tabs, Tab } from "cocoda-vue-tabs"
import { library } from "@fortawesome/fontawesome-svg-core"
import { faStar, faPlusCircle, faExchangeAlt, faThumbsUp, faThumbsDown, faAngleDown, faAngleRight, faAngleLeft, faLevelUpAlt, faLevelDownAlt, faEllipsisV, faEllipsisH, faSortUp, faTimesCircle, faLink, faIdCard, faUser, faSearch, faFilter, faCode, faCog, faDownload, faCaretDown, faInfoCircle, faComment, faEdit, faSave, faTrashAlt, faBan, faWindowMinimize, faPlusSquare, faCheck, faCheckSquare, faLock, faLockOpen, faExternalLinkSquareAlt, faLongArrowAltDown, faLongArrowAltUp, faExternalLinkAlt, faPuzzlePiece, faExclamation, faShareAltSquare, faRecycle, faCaretSquareLeft, faCaretSquareRight, faClipboard, faAngleDoubleRight, faClone, faExclamationCircle, faQuestionCircle, faChevronUp, faChevronDown, faPencilAlt, faArrowRight, faArrowLeft, faArrowUp, faArrowDown, faSyncAlt, faList, faSitemap, faSeedling, faArrowRightToBracket, faDiagramProject, faEnvelope } from "@fortawesome/free-solid-svg-icons"
import { faGithub } from "@fortawesome/free-brands-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import globalMixins from "@/mixins/global.js"

// Add all providers to cocoda-sdk
Object.keys(CocodaSDK).filter(key => key.endsWith("Provider")).forEach(key => {
  CocodaSDK.cdk.addProvider(CocodaSDK[key])
})

CocodaSDK.cdk.addProvider(MeshApiProvider)

// Import BootstrapVue
Vue.use(BootstrapVue)
// Note: bootstrap css files are imported only for the app.js entry point.

// Add vue-scrollto
Vue.use(VueScrollTo)

// Add jskos-tools, use with this.$jskos in components
Vue.prototype.$jskos = jskos

// Add logger, use with this.$log.log/warn/error in components
Vue.prototype.$log = log

// Set Vuex store and path on jskos-tools' languagePreference
const storePath = "getters.languages"
jskos.languagePreference.store = store
jskos.languagePreference.path = storePath

// Add cocoda-vue-tabs
Vue.component("Tabs", Tabs)
Vue.component("Tab", Tab)

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
Vue.component("FontAwesomeIcon", FontAwesomeIcon)

// Add objects mixin
Vue.mixin(globalMixins)
