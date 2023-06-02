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
        <span v-if="mismatchTagAllowedFor(annotation) && canEdit(annotation) && mismatchTagConcepts.length">
          <br>{{ $t("annotationPopover.reason") }}:
          <select
            :value="mismatchTagFor(annotation)?.uri || null"
            @change="changeMismatchTag(annotation, $event.target.value || null)">
            <option
              v-for="option in mismatchTagOptions"
              :key="option.value"
              :title="option.definition"
              :value="option.value"
              :disabled="option.disabled">{{ option.text }}</option>
          </select>
        </span>
        <span v-else-if="mismatchTagFor(annotation)">
          <br>{{ $t("annotationPopover.reason") }}: {{ mismatchTagLabel(mismatchTagFor(annotation)) }}
        </span>
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
import { getItem } from "@/items"

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
  computed: {
    mismatchTagConcepts() {
      return getItem(this.provider?._config?.annotations?.mismatchTagVocabulary)?.topConcepts ?? []
    },
    mismatchTagOptions() {
      return [{ value: null, text: "-" }]
        .concat(this.mismatchTagConcepts.map(concept => ({ value: concept.uri, text: this.mismatchTagLabel(concept), definition: this.mismatchTagDefinition(concept) })))
        .concat({ value: null, text: this.$t("annotationPopover.mailFeedbackListItem"), disabled: true })
    },
  },
  methods: {
    userOwnsAnnotation(annotation) {
      return this.$jskos.annotationCreatorMatches(annotation, this.userUris)
    },
    canRemove(annotation) {
      return !!this.provider?.isAuthorizedFor({
        type: "annotations",
        action: "delete",
        user: this.user,
        crossUser: !this.userOwnsAnnotation(annotation),
      })
    },
    canEdit(annotation) {
      return !!this.provider?.isAuthorizedFor({
        type: "annotations",
        action: "update",
        user: this.user,
        crossUser: !this.userOwnsAnnotation(annotation),
      })
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
    mismatchTagAllowedFor(annotation) {
      return annotation.motivation === "assessing" && annotation.bodyValue === "-1"
    },
    mismatchTagFor(annotation) {
      if (!this.mismatchTagAllowedFor(annotation)) {
        return null
      }
      const tag = annotation.body?.find(t => t.type === "SpecificResource" && t.purpose === "tagging" && t.value)
      if (!tag) {
        return null
      }
      return getItem({ uri: tag.value })
    },
    mismatchTagLabel(tag) {
      return this.$jskos.prefLabel(getItem(tag), { language: this.$i18n.locale, fallbackToUri: false })
    },
    mismatchTagDefinition(tag) {
      return this.$jskos.definition(getItem(tag), { language: this.$i18n.locale })
    },
    async changeMismatchTag(annotation, tag) {
      const body = tag ? [{
        type: "SpecificResource",
        value: tag,
        purpose: "tagging",
      }] : null
      try {
        await this.provider.patchAnnotation({ annotation: { id: annotation.id, body } })
        // TODO: Improve value refresh
        if (body) {
          annotation.body = body
        } else {
          delete annotation.body
        }
      } catch (error) {
        this.$log.error(`Error updating mismatch tag for annotation ${annotation.id}:`, error)
      }
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
  padding-right: 10px;
}
.annotationList > div > div:last-child {
  padding-left: 10px;
}
.annotationList > div > div:first-child, .annotationList > div > div:last-child {
  flex: none;
  display: flex;
  justify-content: center;
  align-content: center;
  flex-direction: column;
}
.annotationList > div:nth-child(odd) {
  background-color: @color-background;
}
.annotationList > div:nth-child(even) {
  background-color: fadeout(@color-text-veryLightGrey, 70%);
}

</style>
