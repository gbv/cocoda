<template>
  <div
    id="mappingEditor"
    :style="{ flex: flex }">
    <div
      v-b-tooltip.hover
      class="mappingArrow"
      title="click to reverse mapping"
      @click="reverseMapping">
      {{ mapping.REVERSED ? "←" : "→" }}
    </div>
    <div
      v-for="(m, indexm) in mappingList()"
      :key="indexm"
      class="mappingEditorPart" >
      <div v-if="m.scheme">
        <div class="mappingScheme font-heavy">{{ labelForScheme(m.scheme) }}</div>
        <ul class="mappingConceptList">
          <li
            v-for="(concept, indexc) in m.concepts"
            :key="indexc" >
            <item-name
              :item="concept"
              :is-link="true"
              @click="selected(concept)" />
            <div
              class="mappingConceptDelete"
              @click="deleteFromMapping(indexm, indexc)">X</div>
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
    },
    deleteFromMapping(indexMapping, indexConcept) {
      if (indexMapping == 0 && !this.mapping.REVERSED || indexMapping == 1 && this.mapping.REVERSED) {
        this.mapping.from.splice(indexConcept, 1)
      } else {
        this.mapping.to.splice(indexConcept, 1)
      }
    },
    reverseMapping() {
      this.mapping.REVERSED = !this.mapping.REVERSED;
      [this.mapping.to, this.mapping.from] = [this.mapping.from, this.mapping.to];
      [this.mapping.toScheme, this.mapping.fromScheme] = [this.mapping.fromScheme, this.mapping.toScheme]
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingEditor {
  position: relative;
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
    position: relative;
    margin: 5px 0;
    & > .mappingConceptDelete {
      position: absolute;
      right: 5px;
      top: -5px;
      bottom: 0;
      margin: auto 0;
      cursor: pointer;
      z-index: 50;
      user-select: none;
      font-size: 12px;
      width: 12px;
      height: 12px;
      text-align: center;
      font-weight: bold;
      &:hover {
        color: @color-secondary-2-4;
      }
    }
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
  cursor: pointer;
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
  &:hover {
    color: @color-secondary-2-4;
  }
}
</style>
