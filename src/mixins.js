var resizingMixin = {
  data () {
    return {
      flexes: [],
      resizing: false,
      _resizingOnMouseMove: null
    }
  },
  mounted() {
    this.resetFlex()
  },
  methods: {
    resetFlex() {
      let newFlex = []
      for (let index = 0; index < this.flexes.length; index += 1) {
        let el = this.$refs["mainElement" + index].$el
        if (el.dataset.direction == "column") {
          newFlex.push(el.offsetWidth)
        } else {
          newFlex.push(el.offsetHeight)
        }
      }
      this.flexes = newFlex
    },
    startResizing(event, index, column = true) {
      let vm = this
      function endResizing() {
        document.removeEventListener("mousemove", onMouseMove)
        document.onmouseup = null
        document.body.style.cursor = "default"
        vm.resizing = false
      }
      if (this.resizing) {
        endResizing()
        return
      }
      this.resizing = true
      let start = column ? event.clientX : event.clientY
      document.body.style.cursor = column ? "col-resize" : "row-resize"
      function onMouseMove(event) {
        let moved = (column ? event.clientX : event.clientY) - start
        let newFlexLeft = vm.flexes[index] + moved
        let newFlexRight = vm.flexes[index+1] - moved
        let flexSum = vm.flexes.reduce(function(total, num) {
          return total + num
        })
        if (newFlexLeft / flexSum < 0.2 || newFlexRight / flexSum < 0.2) {
          console.log("don't change size")
        } else {
          start = column ? event.clientX : event.clientY
          vm.$set(vm.flexes, index, newFlexLeft)
          vm.$set(vm.flexes, index+1, newFlexRight)
        }
      }
      document.addEventListener("mousemove", onMouseMove)
      document.onmouseup = endResizing
    }
  }
}

export { resizingMixin }
