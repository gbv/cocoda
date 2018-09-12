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
  width: 25px;
  top: 0;
  bottom: 0;
  text-align: center;
  z-index: @zIndex-2;
  user-select: none;
}
.mappingType {
  .m-borderRadius(4px);
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 5px;
  background-color: @color--mappingTypeSelection-background;
  color: @color--mappingTypeSelection;
}
.mappingTypeSelected, .mappingType:hover {
  background-color: @color--mappingTypeSelection-selected-background;
  color: @color--mappingTypeSelection-selected;
}

</style>
