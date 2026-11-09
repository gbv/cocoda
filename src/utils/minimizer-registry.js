/**
 * Registry of the MiniMizer instances currently mounted.
 *
 * Cocoda's minimizers, resizing sliders and the mapping editor need to reach
 * each other, but they sit in unrelated component subtrees: the column
 * minimizers are children of App, the inner ones children of ItemDetail and
 * ConceptListWrapper. In the DOM they are nested, in the component tree they
 * are cousins.
 *
 * That relationship used to be resolved through the DOM, reading
 * `element.__vue__` to get from a node back to its component. Vue 3 does not
 * attach that, so every minimizer registers itself here instead and lookups go
 * through the registry. The element is still what identifies "which minimizer
 * belongs to this box", because that really is a layout relationship - but the
 * instance now comes from the registry rather than from the node.
 *
 * Entries are deliberately a plain array: they hold DOM nodes and are only read
 * imperatively while manipulating layout, never rendered.
 */
export function createMinimizerRegistry() {
  const entries = []

  return {
    entries,

    /**
     * Adds a minimizer. Returns the function that removes it again.
     */
    register(entry) {
      entries.push(entry)
      return () => {
        const index = entries.indexOf(entry)
        if (index !== -1) {
          entries.splice(index, 1)
        }
      }
    },

    /**
     * All minimizers rendered inside `element`, except `exclude`.
     */
    within(element, { exclude = null } = {}) {
      if (!element) {
        return []
      }
      return entries.filter(entry =>
        entry.el !== exclude && element.contains(entry.el),
      )
    },

    /**
     * The minimizer that belongs to `element`.
     *
     * `maxDepth` reproduces the ownership heuristic the DOM lookup relied on:
     * a minimizer one or two levels below the box is that box's own, anything
     * deeper belongs to a nested component.
     */
    ownedBy(element, { maxDepth = 2 } = {}) {
      if (!element) {
        return null
      }
      return entries.find(entry => {
        let parent = entry.el?.parentElement
        for (let depth = 0; depth < maxDepth; depth += 1) {
          if (parent === element) {
            return true
          }
          parent = parent?.parentElement
        }
        return false
      }) || null
    },

    byName(name) {
      return entries.find(entry => entry.name === name) || null
    },
  }
}

export const minimizerRegistryKey = Symbol("minimizerRegistry")
