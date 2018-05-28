<template>
  <div
    id="mappingOccurrences"
    :style="{ flex: flex }">
    <div class="test">
      <p>{{ selectedLeft ? selectedLeft.uri : "Not selected" }}</p>
      <p v-if="leftResult">{{ leftResult.count }}</p>
    </div>
    <div class="test">
      <p>{{ selectedRight ? selectedRight.uri : "Not selected" }}</p>
      <p v-if="rightResult">Occurrences: {{ rightResult.count }}</p>
    </div>
  </div>
</template>

<script>
import axios from "axios"

/**
 * The mapping occurrences component.
 */
export default {
  name: "MappingOccurrences",
  props: {
    /**
     * The height of the component as a flex value.
     */
    flex: {
      type: Number,
      default: 1
    },
    selectedLeft: {
      type: Object,
      default: null
    },
    selectedRight: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      leftResult: null,
      rightResult: null
    }
  },
  watch: {
    selectedLeft: function() {
      this.leftResult = null
      let vm = this
      if (this.selectedLeft == null) {
        return
      }
      axios.get("http://coli-conc.gbv.de/concordances/occurrences.php", {
        params: {
          concepts: vm.selectedLeft.uri
        }
      }).then(function(response) {
        vm.leftResult = response.data
      }).catch(function(error) {
        console.log(error)
      })
    },
    selectedRight: function() {
      this.rightResult = null
      let vm = this
      if (this.selectedRight == null) {
        return
      }
      axios.get("http://coli-conc.gbv.de/concordances/occurrences.php", {
        params: {
          concepts: vm.selectedRight.uri
        }
      }).then(function(response) {
        vm.rightResult = response.data
      }).catch(function(error) {
        console.log(error)
      })
    }
  }
}
</script>

<style scoped>
#mappingOccurrences {
  height: 0;
  overflow: hidden;
  display: flex;
}
.test {
  flex: 1;
  width: 0;
  margin: auto;
  text-align: center;
}
</style>
