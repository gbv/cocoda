/**
 * Mixin for drag and drop functionality.
 */

import { getItem, getItemByUri } from "@/items"

export default {
  methods: {
    dragStart(concept, event) {
      event.dataTransfer.setData("text", concept.uri)
      this.$store.commit({
        type: "setDraggedConcept",
        concept: { uri: concept.uri },
      })
    },
    dragEnd() {
      this.$store.commit({
        type: "setDraggedConcept",
        concept: null,
      })
    },
    dragOver(event) {
      event.preventDefault()
    },
    drop(event, ...params) {
      event.preventDefault()
      let uri = event.dataTransfer.getData("text")
      let concept = getItem(this.$store.state.draggedConcept) || getItemByUri(uri)
      if (concept) {
        this.droppedConcept(concept, ...params)
      }
      this.dragEnd()
    },
    // Supposed to be overridden by components
    droppedConcept() {},
  },
}
