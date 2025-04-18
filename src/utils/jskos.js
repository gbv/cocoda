import * as _jskos from "jskos-tools"

const jskos = {
  ..._jskos,
  // Add a `compareFast` method to jskos (only compares URI)
  compareFast(object1, object2) {
    if (!object1 && !object2) {
      return true
    }
    if (!object1 || !object2) {
      return false
    }
    return object1.uri === object2.uri
  },
}

export default jskos
