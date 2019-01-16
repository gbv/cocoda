/**
 * Mixin for drag and drop functionality.
 */

export default {
  methods: {
    dragStart(concept, event) {
      event.dataTransfer.setData("text", concept.uri)
      this.draggedConcept = concept
    },
    dragEnd() {
      this.draggedConcept = null
    },
    dragOver(event) {
      event.preventDefault()
    },
    drop(event, ...params) {
      event.preventDefault()
      let uri = event.dataTransfer.getData("text")
      let concept = this.draggedConcept || this._getObject({ uri })
      if (concept) {
        this.droppedConcept(concept, ...params)
      }
    },
    // Supposed to be overridden by components
    droppedConcept() {},
  }
}
