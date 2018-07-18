import Vue from "vue"
import Vuex from "vuex"
import selected from "./modules/selected"
import objects from "./modules/objects"
import { plugins } from "./plugins"

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    selected, objects
  },
  plugins,
})
