import Vue from "vue"
import Vuex from "vuex"
import selected from "./modules/selected"
import objects from "./modules/objects"

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    selected, objects
  },
})
