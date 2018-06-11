var resizingMixin = {
  data () {
    return {
      flex: [],
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
      for (let index0 = 0; index0 < this.flex.length; index0 += 1) {
        newFlex.push([])
        for (let index1 = 0; index1 < this.flex[index0].length; index1 += 1) {
          let ref = this.$refs["mainElement" + index0 + "-" + index1]
          let el = (ref && ref.$el) || ref
          if(!el) {
            newFlex[index0].push(this.flex[index0][index1])
            continue
          }
          if (el.dataset.direction == "column") {
            newFlex[index0].push(el.offsetWidth)
          } else {
            newFlex[index0].push(el.offsetHeight)
          }

        }
      }
      this.flex = newFlex
    },
    startResizing(event, index0, index1, column = true) {
      let vm = this
      function endResizing() {
        document.removeEventListener("mousemove", onMouseMove)
        document.onmouseup = null
        document.body.style.cursor = "auto"
        document.body.style.userSelect = "auto"
        vm.resizing = false
      }
      if (this.resizing) {
        endResizing()
        return
      }
      this.resizing = true
      let start = column ? event.clientX : event.clientY
      document.body.style.cursor = column ? "col-resize" : "row-resize"
      document.body.style.userSelect = "none"
      function onMouseMove(event) {
        let moved = (column ? event.clientX : event.clientY) - start
        let newFlexLeft = vm.flex[index0][index1] + moved
        let newFlexRight = vm.flex[index0][index1+1] - moved
        let flexSum = vm.flex[index0].reduce(function(total, num) {
          return total + num
        })
        if (newFlexLeft / flexSum < 0.2 || newFlexRight / flexSum < 0.2) {
          console.log("don't change size")
        } else {
          start = column ? event.clientX : event.clientY
          vm.$set(vm.flex[index0], index1, newFlexLeft)
          vm.$set(vm.flex[index0], index1+1, newFlexRight)
        }
      }
      document.addEventListener("mousemove", onMouseMove)
      document.onmouseup = endResizing
    }
  }
}

export { resizingMixin }
