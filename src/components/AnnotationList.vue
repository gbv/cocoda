<template>
  <div class="annotationList">
    <div
      v-for="(annotation, index) in annotations"
      :key="annotation.uri">
      <!-- Value (currently: score) -->
      <div
        :class="{
          'text-success': annotation.bodyValue === '+1',
          'text-danger': annotation.bodyValue === '-1'
        }"
        class="fontSize-normal fontWeight-heavy">
        <span
          v-if="annotation.motivation == 'moderating'"
          v-b-tooltip.hover="$t('mappingBrowser.mappingConfirmedTooltip')">
          <font-awesome-icon
            class="text-success"
            icon="check" />
        </span>
        <span v-else>
          {{ annotation.bodyValue }}
        </span>
      </div>
      <!-- Date and creator -->
      <div class="fontSize-verySmall">
        <date-string :date="annotation.created" /><br>
        <auto-link
          :class="{
            'fontWeight-heavy': $jskos.annotationCreatorMatches(annotation, userUris)
          }"
          :link="$jskos.annotationCreatorUri(annotation)"
          :text="$jskos.annotationCreatorName(annotation)" />
      </div>
      <div>
        <font-awesome-icon
          v-if="canRemove(annotation)"
          class="button button-delete"
          icon="trash-alt"
          @click="remove(index)" />
      </div>
    </div>
  </div>
</template>

<script>
import AutoLink from "./AutoLink.vue"
import DateString from "./DateString.vue"

// Import mixins
import auth from "@/mixins/auth.js"

export default {
  name: "AnnotationList",
  components: { AutoLink, DateString },
  mixins: [auth],
  props: {
    annotations: {
      type: Array,
      default: () => [],
    },
    provider: {
      type: Object,
      default: null,
    },
  },
  methods: {
    canRemove(annotation) {
      return this.$jskos.annotationCreatorMatches(annotation, this.userUris)
    },
    async remove(index) {
      if (!this.provider) {
        return false
      }
      const annotation = this.annotations[index]
      // Remove confirmation
      this.$emit("loading", true)
      let success
      try {
        success = await this.provider.deleteAnnotation({ annotation })
      } catch(error) {
        success = false
        this.alert(`${this.$t("alerts.annotationNotRemoved")} ${this.getErrorMessage(error)}`, null, "danger")
      }
      this.$emit("loading", false)
      // Check if annotation stayed the same or deletion was not successful
      if (annotation.id != this.annotations[index].id || !success) {
        // Don't remove annotation because it changed
        return false
      }
      // Remove annotation from list
      this.$delete(this.annotations, index)
      // Show alert
      this.alert(this.$t("alerts.annotationRemoved"), null, "success")
      // Emit event
      this.$emit("refresh-annotations", { annotations: this.annotations })
      return success
    },
  },
}
</script>

<style lang="less" scoped>
@import "@/style/main.less";

.annotationList {
  max-height: 300px;
  overflow-y: auto;
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
.annotationList > div > div:last-child {
  flex: none;
  padding-left: 10px;
}
.annotationList > div:nth-child(odd) {
  background-color: @color-background;
}
.annotationList > div:nth-child(even) {
  background-color: fadeout(@color-text-veryLightGrey, 70%);
}

</style>
