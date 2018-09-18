<template>
  <div class="mappingTypes">
    <div
      v-b-tooltip.hover.right="{ title: mappingType.prefLabel.en, delay: $util.delay.medium }"
      v-for="mappingType in mappingTypes"
      :key="mappingType.uri"
      :class="{
        mappingTypeSelected: (mappingType && mappingTypeSelected) && mappingType.uri == mappingTypeSelected.uri,
        'fontWeight-heavy': (mappingType && mappingTypeSelected) && mappingType.uri == mappingTypeSelected.uri,
        mappingTypeHovered: (mappingType && mappingTypeHovered) && mappingType.uri == mappingTypeHovered.uri
      }"
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
      mappingTypes: this.$util.mappingTypes,
      mappingTypeHovered: null
    }
  },
  computed: {
    /**
     * Returns a mapping type object for the current mapping
     */
    mappingTypeSelected() {
      let mapping = this.mapping
      return this.$util.mappingTypeByType(mapping ? mapping.type : null)
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
  width: 60px;
  top: 0;
  bottom: 0;
  text-align: center;
  z-index: @zIndex-2;
  user-select: none;
}
.mappingType {
  .button;
  .m-borderRadius(4px);
  display: inline-block;
  width: 24px;
  height: 24px;
  margin: 2px;
  font-weight: bold;
}
.mappingTypeSelected, .mappingType:hover {
  background-color: @color-highlight;
  color: @color-text-grey;
}

</style>
