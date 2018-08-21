import router from "../router"

/**
 * Plugin that performs operations when a concept was selected.
 */
const selectedPlugin = store => {
  store.subscribe((mutation, state) => {
    // Check for selecting a concept
    if (mutation.type == "selected/set") {
      let isLeft = mutation.payload.isLeft
      let noQueryRefresh = mutation.payload && mutation.payload.noQueryRefresh
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
            value: schemeInStore,
            noQueryRefresh
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
                value: concept,
                noQueryRefresh
              })
            })
          } else {
            store.commit({
              type: "selected/set",
              kind: "concept",
              isLeft: isLeft,
              value: conceptInStore,
              noQueryRefresh
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

/**
 * Plugin that sets URL parameters after selected scheme/concept/mapping changed.
 */
const routerParamPlugin = store => {
  store.subscribe(mutation => {
    const mutationTypes = [
      "selected/clear",
      "selected/set",
      "mapping/add",
      "mapping/remove",
      "mapping/removeAll",
      "mapping/set",
      "mapping/setType",
      "mapping/switch",
    ]
    if (mutationTypes.includes(mutation.type)) {
      if (mutation.payload && mutation.payload.noQueryRefresh) {
        return
      }
      // Add selected schemes and concepts
      let kinds = ["scheme", "concept"]
      let sides = { true: "Left", false: "Right" }
      let query = {}
      for (let kind of kinds) {
        for (let isLeft of [true, false]) {
          let key = kind + sides[isLeft]
          let object = store.state.selected[kind][isLeft]
          if (object && object.uri) {
            query[key] = object.uri
          }
        }
      }
      // Add mapping
      let mapping = store.state.mapping.mapping
      // - Type
      // TODO: Support multiples
      if (mapping.type && mapping.type.length) {
        query["mapping.type"] = mapping.type[0]
      }
      let directions = ["from", "to"]
      for (let direction of directions) {
        // - Members
        // TODO: Support multiples
        // TODO: Support relations (memberSet or memberChoice)
        if (mapping[direction].memberSet.length) {
          query[`mapping.${direction}`] = mapping[direction].memberSet[0].uri
        }
        // - Schemes
        if (mapping[`${direction}Scheme`]) {
          query[`mapping.${direction}Scheme`] = mapping[`${direction}Scheme`].uri
        }
      }
      // Push route
      router.push({ query })
    }
  })
}

export default [selectedPlugin, mappingIdentifierPlugin, routerParamPlugin]
