/**
 * Plugin that performs operations when a concept was selected.
 */
const selectedPlugin = store => {
  store.subscribe((mutation, state) => {
    // Check for selecting a concept
    if (mutation.type == "selected/set") {
      let isLeft = mutation.payload.isLeft
      if (mutation.payload.kind == "concept") {
        let concept = mutation.payload.value
        if (!concept) {
          store.commit({
            type: "alerts/add",
            text: "The selected concept could not be loaded.",
            variant: "warning",
          })
          return
        }
        let conceptInStore,
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
                store.commit({
                  type: "objects/set",
                  object: child,
                  prop: "ancestors",
                  value: concept.ancestors.concat([concept])
                })
              }
            }
            return Promise.all(promises)
          })
        }
      }
    }
  })
}

/**
 * Plugin that recalculates the mapping identifier for the current mapping on each change.
 */
const mappingIdentifierPlugin = store => {
  store.subscribe((mutation) => {
    // Check for selecting a concept
    if (mutation.type.startsWith("mapping") && !mutation.type.endsWith("setIdentifier")) {
      store.commit("mapping/setIdentifier")
    }
  })
}

export default [selectedPlugin, mappingIdentifierPlugin]
