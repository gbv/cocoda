<template>
  <div
    class="mappingTypes"
    @mouseover="hovered = true"
    @mouseout="hovered = false" >
    <div
      v-b-tooltip.hover.right="{ title: mappingType.prefLabel.en, delay: $util.delay.medium }"
      v-for="mappingType in mappingTypes"
      :key="mappingType.uri"
      :class="{
        mappingTypeSelected: (mappingType && mappingTypeSelected) && mappingType.uri == mappingTypeSelected.uri,
        'fontWeight-heavy': (mappingType && mappingTypeSelected) && mappingType.uri == mappingTypeSelected.uri,
        mappingTypeHovered: (mappingType && mappingTypeHovered) && mappingType.uri == mappingTypeHovered.uri
      }"
      :style="`display: ${((mappingType && mappingTypeSelected) && mappingType.uri == mappingTypeSelected.uri) || hovered ? 'inline-block' : 'none'};`"
      class="mappingType"
      @click="choose(mappingType)" >
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
      hovered: false,
      mappingTypes: this.$jskos.mappingTypes,
      mappingTypeHovered: null
    }
  },
  computed: {
    /**
     * Returns a mapping type object for the current mapping
     */
    mappingTypeSelected() {
      let mapping = this.mapping
      return this.$jskos.mappingTypeByType(mapping ? mapping.type : null)
    }
  },
  methods: {
    choose(mappingType) {
      this.$store.commit({
        type: "mapping/setType",
        uri: mappingType.uri
      })
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.mappingTypes {
  width: 72px;
  text-align: center;
  z-index: @zIndex-2;
  user-select: none;
  font-size: 1.25rem;
}
.mappingType {
  .button;
  .m-borderRadius(4px);
  display: inline-block;
  width: 30px;
  height: 30px;
  margin: 2px;
  font-weight: bold;
}
.mappingTypeSelected, .mappingType:hover {
  background-color: @color-highlight;
  color: @color-text-grey;
}

</style>
