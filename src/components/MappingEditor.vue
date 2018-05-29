<template>
  <div
    id="mappingEditor"
    :style="{ flex: flex }">
    <div class="mappingArrow">
      {{ mapping.REVERSED ? "←" : "→" }}
    </div>
    <div
      v-for="(m, index) in mappingList()"
      :key="index"
      class="mappingEditorPart" >
      <div v-if="m.scheme">
        <div class="mappingScheme font-heavy">{{ labelForScheme(m.scheme) }}</div>
        <ul class="mappingConceptList">
          <li
            v-for="(concept, index) in m.concepts"
            :key="index" >
            <item-name
              :item="concept"
              :is-link="true"
              @click="selected(concept)" />
          </li>
        </ul>
      </div>
      <div v-else >
        <div class="mappingNoConcepts">No Concepts</div>
      </div>
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName"

/**
 * The mapping editor component.
 */
export default {
  name: "MappingEditor",
  components: { ItemName },
  props: {
    /**
     * The height of the component as a flex value.
     */
    flex: {
      type: Number,
      default: 1
    }
  },
  data () {
    return {
      mapping: this.$root.$data.mapping
    }
  },
  computed: {
    mappingScheme() {
      return {
        left: !this.mapping.REVERSED ? this.mapping.fromScheme : this.mapping.toScheme,
        right: this.mapping.REVERSED ? this.mapping.fromScheme : this.mapping.toScheme
      }
    },
    mappingSchemeLabel() {
      return {
        left: this.labelForScheme(this.mappingScheme.left),
        right: this.labelForScheme(this.mappingScheme.right)
      }
    },
    mappingConcepts() {
      return {
        left: !this.mapping.REVERSED ? this.mapping.from : this.mapping.to,
        right: this.mapping.REVERSED ? this.mapping.from : this.mapping.to
      }
    }
  },
  methods: {
    mappingList() {
      return [
        { concepts: this.mappingConcepts.left, scheme: this.mappingScheme.left },
        { concepts: this.mappingConcepts.right, scheme: this.mappingScheme.right }
      ]
    },
    labelForScheme(scheme) {
      return scheme ? scheme.notation[0].toUpperCase() : "No Scheme"
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingEditor {
  height: 0;
  overflow: hidden;
  display: flex;
}
.mappingEditorPart {
  flex: 1;
  width: 0;
  padding: 10px 10px 5px 10px;
  margin-right: 5px;
  display: flex;
  flex-direction: column;
}
.mappingEditorPart > div {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
}
.mappingScheme {
  text-align: center;
  flex: none;
  margin: 0 0 5px 0;
}
.mappingConceptList {
  padding: 0 0 0 5px;
  flex: 1;
  height: 0;
  overflow: auto;
  list-style: none;
  & > li {
    margin: 5px 0;
  }
}
.mappingConceptLink:hover {
  color: @color-primary-0;
}
.mappingNoConcepts {
  position: relative;
  margin: 0 auto;
  top: 50%;
  transform: translateY(-50%);
}

.mappingArrow {
  position: absolute;
  margin: auto auto;
  text-align: center;
  font-size: 1.6em;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 1.6em;
  height: 1.6em;
  user-select: none;
}
</style>
