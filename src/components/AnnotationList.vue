<template>
  <div class="annotationList">
    <div
      v-for="annotation in annotations"
      :key="annotation.uri">
      <!-- Value (currently: score) -->
      <div
        :class="{
          'text-success': annotation.bodyValue === '+1',
          'text-danger': annotation.bodyValue === '-1'
        }"
        class="fontSize-normal fontWeight-heavy">
        {{ annotation.bodyValue }}
      </div>
      <!-- Date and creator -->
      <div class="fontSize-verySmall">
        {{ $util.dateToString(annotation.created, true) }}<br>
        <auto-link
          :class="{
            'fontWeight-heavy': $util.annotations.creatorMatches(annotation, userUris)
          }"
          :link="$util.annotations.creatorUri(annotation)"
          :text="$util.annotations.creatorName(annotation)" />
      </div>
    </div>
  </div>
</template>

<script>
import AutoLink from "./AutoLink"

export default {
  name: "AnnotationList",
  components: { AutoLink },
  props: {
    annotations: {
      type: Array,
      default: () => [],
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.annotationList {
  max-height: 400px;
  overflow-y: scroll;
}
.annotationList > div {
  display: flex;
}
.annotationList > div > div {
  flex: 1;
}
.annotationList > div > div:first-child {
  flex: none;
  padding-right: 10px;
}
.annotationList > div:nth-child(odd) {
  background-color: white;
}
.annotationList > div:nth-child(even) {
  background-color: fadeout(@color-text-veryLightGrey, 70%);
}

</style>
