<template>
  <div class="mappingTypes">
    <div
      v-b-tooltip.hover.right="{ title: mappingType.prefLabel.en, delay: $util.delay.medium }"
      v-for="mappingType in mappingTypes"
      :key="mappingType.uri"
      :class="{
        mappingTypeSelected: (mappingType && mappingTypeSelected) && mappingType.uri == mappingTypeSelected.uri,
        mappingTypeHovered: (mappingType && mappingTypeHovered) && mappingType.uri == mappingTypeHovered.uri
      }"
      class="mappingType"
      @click="choose(mappingType)">
      {{ mappingType.notation[0] }}
    </div>
  </div>
</template>

<script>
/**
 * The mapping type selection component.
 */
export default {
  name: "MappingTypeSelection",
  props: {
    /**
     * The mapping for which the type should be selected.
     */
    mapping: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      mappingTypes: this.$util.mappingTypes,
      mappingTypeHovered: null
    }
  },
  computed: {
    /**
     * Returns a mapping type object for the current mapping
     */
    mappingTypeSelected() {
      let mapping = this.mapping ? this.mapping.jskos : null
      return this.$util.mappingTypeByType(mapping ? mapping.type : null)
    }
  },
  methods: {
    choose(mappingType) {
      // Save in mapping
      let mapping = this.mapping ? this.mapping.jskos : null
      if (mapping) {
        if (!mapping.type || !Array.isArray(mapping.type)) {
          this.$set(mapping, "type", [])
        }
        if (mapping.type.length == 0) {
          mapping.type.push(null)
        }
        this.$set(mapping.type, 0, mappingType.uri)
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.mappingTypes {
  width: 25px;
  top: 0;
  bottom: 0;
  text-align: center;
  z-index: 50;
  user-select: none;
}
.mappingType {
  font-family: "Courier New", Courier, monospace;
  cursor: pointer;
  box-shadow: 0 1px 2px 0 hsla(0, 0%, 0%, 0.2);
  &:hover {
    background-color: @color-primary-1;
    color: @color-primary-4;
  }
  border-radius: 5px;
  margin-bottom: 5px;
}
.mappingTypeSelected {
  background-color: @color-primary-4;
  color: @color-primary-1;
  &:extend(.font-heavy);
  &:hover {
    background-color: @color-primary-4;
    color: @color-primary-1;
  }
}

</style>
