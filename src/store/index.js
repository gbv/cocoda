import Vue from "vue"
import Vuex from "vuex"
import selected from "./modules/selected"
import objects from "./modules/objects"

Vue.use(Vuex)

// Plugins
const selectedPlugin = store => {
  store.subscribe((mutation, state) => {
    // Check for selecting a concept
    if (mutation.type == "selected/set") {
      let isLeft = mutation.payload.isLeft
      if (mutation.payload.kind == "concept") {
        let concept = mutation.payload.value,
          conceptInStore,
          scheme = concept.inScheme ? concept.inScheme[0] : null

        // Set scheme if a concept is selected without the scheme
        if (state.selected.scheme[isLeft] == null) {
          let schemeInStore = store.getters["objects/get"](scheme)
          store.commit({
            type: "selected/set",
            kind: "scheme",
            isLeft: isLeft,
            value: schemeInStore
          })
        }

        // Check if concept is already in store and if not, load its data and set selected to that
        if (!concept.INSTORE) {
          conceptInStore = store.getters["objects/get"](concept)
          if (!conceptInStore) {
            store.dispatch({
              type: "objects/load",
              object: concept,
              scheme: scheme
            }).then(concept => {
              store.commit({
                type: "selected/set",
                kind: "concept",
                isLeft: isLeft,
                value: concept
              })
            })
          } else {
            store.commit({
              type: "selected/set",
              kind: "concept",
              isLeft: isLeft,
              value: conceptInStore
            })
          }
        } else {
          // TODO: Make sure this is canceled when there's a new request
          // Load concept's ancestors and their children
          store.dispatch({
            type: "objects/ancestors",
            object: concept
          }).then(concept => {
            if (concept == null) return
            // Load children for all ancestors
            let promises = [Promise.resolve(concept)]
            for (let ancestor of concept.ancestors) {
              promises.push(store.dispatch({
                type: "objects/narrower",
                object: ancestor
              }))
            }
            // If children were loaded before ancestors, then the children's ancestors property is set to [null]
            if (concept.narrower && !concept.narrower.includes(null)) {
              for (let child of concept.narrower) {
                child.ancestors = concept.ancestors.concat([concept])
              }
            }
            return Promise.all(promises)
          }).then(result => {
            if (result == null) return
            let concept = result[0]
            // Set all ancestors to open
            // FIXME: This will be task of ConceptTree.
            for (let ancestor of concept.ancestors) {
              ancestor.ISOPEN = true
            }
          })
        }

      }
    }
  })
}

export default new Vuex.Store({
  modules: {
    selected, objects
  },
  plugins: [selectedPlugin]
})
