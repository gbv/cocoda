<template>
  <div class="mappingTypes">
    <div
      v-b-tooltip.hover.right="mappingType.LABEL"
      v-for="mappingType in mappingTypes"
      :key="mappingType.uri"
      :style="mappingType.STYLE || ''"
      :class="{
        mappingTypeSelected: (mappingType && mappingTypeSelected) && mappingType.uri == mappingTypeSelected.uri,
        mappingTypeHovered: (mappingType && mappingTypeHovered) && mappingType.uri == mappingTypeHovered.uri
      }"
      class="mappingType"
      @click="choose(mappingType)">
      {{ mappingType.SYMBOL }}
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
      mappingTypeSelected: null,
      mappingTypeHovered: null
    }
  },
  computed: {},
  created() {
    this.mappingTypeSelected = this.$util.mappingTypeByUri(
      this.mapping && this.mapping.type && this.mapping.type.length > 0 ? this.mapping.type[0] : this.$util.defaultMappingType.uri
    )
  },
  methods: {
    choose(mappingType) {
      this.mappingTypeSelected = mappingType
      // Save in mapping
      let mapping = this.mapping ? this.mapping.jskos : null
      if (mapping) {
        if (!mapping.type) {
          this.$set(mapping, "type", [])
        }
        if (mapping.type.length == 0) {
          mapping.type.push(null)
        }
        this.$set(mapping.type, 0, this.mappingTypeSelected.uri)
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.mappingTypes {
  width: 30px;
  margin: auto 0px;
  top: 0;
  bottom: 0;
  text-align: center;
  z-index: 50;
  user-select: none;
}
.mappingType {
  font-size: 18px;
  height: 30px;
  width: 30px;
  cursor: pointer;
  &:hover {
    box-shadow: 0 0 1pt 2pt fadeout(@buttonColorHover, 30%);
  }
  border-radius: 15px;
}
.mappingTypeSelected {
  background-color: @color-primary-4;
  color: @color-primary-1;
}

</style>
