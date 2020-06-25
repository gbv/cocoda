/**
 * Mixin for drag and drop functionality.
 */

export default {
  methods: {
    dragStart(concept, event) {
      event.dataTransfer.setData("text", concept.uri)
      this.$store.commit({
        type: "setDraggedConcept",
        concept,
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
      let concept = this.$store.state.draggedConcept || this.getObject({ uri })
      if (concept) {
        this.droppedConcept(concept, ...params)
      }
    },
    // Supposed to be overridden by components
    droppedConcept() {},
  },
}
