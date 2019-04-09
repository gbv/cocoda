/**
 * Global mixin for helper functions.
 */

import _ from "lodash"

export default {
  methods: {
    /**
     * Returns the provider object for a scheme or concept.
     *
     * @param {*} object
     */
    getProvider(object) {
      return _.get(object, "_provider") || _.get(object, "inScheme[0]._provider")
    },
  }
}
