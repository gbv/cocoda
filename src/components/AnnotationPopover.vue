<template>
  <div
    :id="`annotationPopoverTop-${iid}`"
    class="annotationPopoverTop">
    <b-popover
      v-if="enable"
      ref="annotationPopover"
      :target="element"
      :show.sync="show"
      boundary="window"
      placement="lefttop">
      <loading-indicator-full
        v-if="loading"
        style="z-index: 1100;" />
      <!-- Main Annotation Popover div -->
      <div
        ref="annotationPopoverDiv"
        class="annotationPopover">
        <div class="annotationPopover-upper">
          <!-- Left side -->
          <div
            v-if="annotations.length"
            class="annotationPopover-left">
            <!-- Annotation history -->
            <annotation-list
              :annotations="annotations"
              :provider="provider"
              class="annotationPopover-history"
              @loading="loading = $event" />
          </div>
          <!-- Right side: voting and score -->
          <div class="annotationPopover-voting">
            <!-- Dummy div with flex: 1 so that buttons are always at the bottom -->
            <div />
            <!-- Upvote button -->
            <div>
              <font-awesome-icon
                :class="{
                  'annotationPopover-voting-button-current': ownScore == '+1',
                  'button': canSaveAnnotation,
                  'button-disabled': !canSaveAnnotation,
                  'annotationPopover-voting-button': true
                }"
                icon="thumbs-up"
                @click="canSaveAnnotation && assessing('+1')" />
            </div>
            <!-- Score -->
            <div class="annotationPopover-score">
              <span
                :class="{
                  'text-success': score.startsWith('+'),
                  'text-danger': score.startsWith('-')
                }"
                class="fontWeight-heavy">
                {{ score }}
              </span>
            </div>
            <!-- Downvote button -->
            <div>
              <font-awesome-icon
                :class="{
                  'annotationPopover-voting-button-current': ownScore == '-1',
                  'button': canSaveAnnotation,
                  'button-disabled': !canSaveAnnotation,
                  'annotationPopover-voting-button': true
                }"
                icon="thumbs-down"
                @click="canSaveAnnotation && assessing('-1')" />
            </div>
          </div>
        </div>
        <div
          v-if="canConfirm"
          class="annotationPopover-lower">
          <b-button
            class="bbutton-small"
            variant="primary"
            @click="confirm">
            {{ $t("annotationPopover.addConfirmation") }}
          </b-button>
        </div>
      </div>
    </b-popover>
  </div>
</template>

<script>
import _ from "lodash"
import LoadingIndicatorFull from "./LoadingIndicatorFull.vue"
import AnnotationList from "./AnnotationList.vue"

// Import mixins
import auth from "../mixins/auth.js"
import hoverHandler from "../mixins/hover-handler.js"

export default {
  name: "AnnotationPopover",
  components: { LoadingIndicatorFull, AnnotationList },
  mixins: [auth, hoverHandler],
  props: {
    id: {
      type: String,
      default: null,
    },
    idPrefix: {
      type: String,
      default: "",
    },
    mapping: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      show: false,
      loading: false,
    }
  },
  computed: {
    iid() {
      return this.id
    },
    imapping() {
      return this.mapping
    },
    enable() {
      return this.iid && this.element
    },
    elementId() {
      return this.idPrefix + (this.iid || "")
    },
    element() {
      return document.getElementById(this.elementId)
    },
    annotations() {
      return _.get(this.imapping, "annotations") || []
    },
    score() {
      let score = 0
      for (let { bodyValue } of this.annotations.filter(annotation => annotation.motivation == "assessing")) {
        score += parseInt(bodyValue) || 0
      }
      let sign = score > 0 ? "+" : (score < 0 ? "-" : "±")
      return `${sign}${Math.abs(score)}`
    },
    ownAssessment() {
      if (!this.userUris && this.creator.uri) {
        // Special case: If the user is not logged in (i.e. no userUris), and there is a creator URI, AND the registry allows crossUser requests for updating/deleting annotations.
        if (this.provider.isAuthorizedFor({
          type: "annotations",
          action: "update",
          user: this.user,
          crossUser: true,
        }) && this.provider.isAuthorizedFor({
          type: "annotations",
          action: "delete",
          user: this.user,
          crossUser: true,
        })) {
          return this.annotations.find(annotation => annotation.motivation == "assessing" && annotation.creator && annotation.creator.id == this.creator.uri)
        }
        return null
      }
      return this.annotations.find(annotation => annotation.motivation == "assessing" && this.$jskos.annotationCreatorMatches(annotation, this.userUris))
    },
    ownScore() {
      return _.get(this.ownAssessment, "bodyValue")
    },
    provider() {
      return _.get(this.imapping, "_registry")
    },
    canSaveAnnotation() {
      if (!this.provider) {
        return false
      }
      return this.provider.isAuthorizedFor({
        type: "annotations",
        action: "create",
        user: this.user,
      })
    },
    canConfirm() {
      if (!this.provider) {
        return false
      }
      if (this.annotations.find(annotation => annotation.motivation == "moderating" && this.$jskos.annotationCreatorMatches(annotation, this.userUris))) {
        // Already exists
        return false
      }
      if (this.provider.isAuthorizedFor({
        type: "annotations",
        action: "create",
        user: this.user,
      })) {
        // Check if user is in "moderatingIdentities" in jskos-server config
        const moderatingIdentities = _.get(this.provider, "_config.annotations.moderatingIdentities") || []
        if (_.intersection(moderatingIdentities, this.userUris).length > 0) {
          return true
        }
      }
      return false
    },
  },
  watch: {
    /**
     * Make sure the div is always scrolled to the bottom
     */
    show(current, previous) {
      if (current && !previous) {
        this.$emit("show")
      } else if (previous && !current) {
        this.$emit("hide")
      }
      this.scrollToBottom()
    },
    annotations() {
      this.scrollToBottom()
    },
    iid() {
      this.scrollToBottom()
      // If shown, hide, then show again; workaround to a small bug
      if (this.show) {
        this.show = false
        this.$nextTick(() => {
          this.show = true
        })
      }
    },
  },
  methods: {
    hoverHandlers() {
      return [
        {
          elements: [
            this.$refs.annotationPopoverDiv,
            this.element,
          ],
          delta: 5,
          handler: (isInside) => {
            this.show = isInside
          },
        },
      ]
    },
    scrollToBottom() {
      if (this.show) {
        // Scroll to bottom of list of annotations
        _.delay(() => {
          if (this.$refs.annotationPopoverDiv) {
            let history = this.$refs.annotationPopoverDiv.getElementsByClassName("annotationPopover-history")[0]
            if (history) {
              history.scrollTop = 20000
            }
          }
        }, 50)
      }
    },
    assessing(value) {
      let provider = this.provider
      if (!provider || !provider.has.annotations) {
        this.$log.warn("No provider found to add annotation.")
        this.alert(this.$t("alerts.annotationError"), null, "danger")
        return
      }
      const mapping = this.imapping
      const uri = _.get(mapping, "uri")
      if (!uri) {
        this.$log.warn("No URI found to add annotation.")
        this.alert(this.$t("alerts.annotationError"), null, "danger")
        return
      }
      this.loading = true
      const handleError = (error, type) => {
        this.alert(`${this.$t("alerts." + type)} ${this.getErrorMessage(error)}`, null, "danger")
      }
      let promise
      const ownAssessment = this.ownAssessment
      // Three cases:
      // 1. Case: User has not assessed this mapping -> add an annotation
      if (!ownAssessment) {
        if (!this.canSaveAnnotation) {
          this.alert(this.$t("alerts.annotationNotSaved"), null, "danger")
          this.loading = false
          return
        }
        let annotation = {
          target: uri,
          motivation: "assessing",
          bodyValue: value,
        }
        if (this.creator && this.creator.uri) {
          annotation.creator = {
            id: this.creator.uri,
          }
          if (this.creatorName) {
            annotation.creator.name = this.creatorName
          }
        }
        promise = provider.postAnnotation({ annotation }).then(annotation => {
          if (!annotation) {
            // Don't add annotation to mapping
            this.alert(this.$t("alerts.annotationNotSaved"), null, "danger")
            return
          } else {
            this.alert(this.$t("alerts.annotationSaved"), null, "success")
          }
          mapping.annotations.push(annotation)
          this.$emit("refresh-annotations", { uri, annotations: mapping.annotations })
        }).catch(error => handleError(error, "annotationNotSaved"))
      } else {
        if (this.ownScore != value) {
          if (!this.provider.isAuthorizedFor({
            type: "annotations",
            action: "update",
            user: this.user,
          })) {
            this.alert(this.$t("alerts.annotationNotSaved"), null, "danger")
            this.loading = false
            return
          }
          // 2. Case: User has assessed and changes the value
          promise = provider.patchAnnotation({ annotation: { id: ownAssessment.id, bodyValue: value } }).then(annotation => {
            if (annotation) {
              ownAssessment.bodyValue = value
              this.alert(this.$t("alerts.annotationSaved"), null, "success")
              this.$emit("refresh-annotations", { uri, annotations: mapping.annotations })
            } else {
              this.alert(this.$t("alerts.annotationNotSaved"), null, "danger")
            }
          }).catch(error => handleError(error, "annotationNotSaved"))
        } else {
          if (!this.provider.isAuthorizedFor({
            type: "annotations",
            action: "delete",
            user: this.user,
          })) {
            this.alert(this.$t("alerts.annotationNotRemoved"), null, "danger")
            this.loading = false
            return
          }
          // 3. Case: User has assessed and removes his value
          promise = this.remove(mapping.annotations.indexOf(ownAssessment), mapping).then(success => {
            if (success) {
              this.alert(this.$t("alerts.annotationRemoved"), null, "success")
              this.$emit("refresh-annotations", { uri, annotations: mapping.annotations })
            } else {
              this.alert(this.$t("alerts.annotationNotRemoved"), null, "danger")
            }
          }).catch(error => handleError(error, "annotationNotRemoved"))
        }
      }
      promise.catch(error => {
        this.$log.error("AnnotationPopover - Error adding annotation", error)
        this.alert(this.$t("alerts.annotationError"), null, "danger")
      }).then(() => {
        this.loading = false
      })
    },
    remove(index, mapping = this.imapping) {
      let provider = this.provider
      let annotation = _.get(mapping, `annotations[${index}]`)
      if (!annotation) {
        return
      }
      this.loading = true
      return provider.deleteAnnotation({ annotation }).then(success => {
        this.loading = false
        if (!success) {
          return false
        }
        this.$delete(mapping.annotations, index)
        return success
      })
    },
    async confirm() {
      const provider = this.provider
      if (!provider || !provider.has.annotations) {
        this.$log.warn("No provider found to add annotation.")
        this.alert(this.$t("alerts.annotationError"), null, "danger")
        return
      }
      const uri = _.get(this.imapping, "uri")
      if (!uri) {
        this.$log.warn("No URI found to add annotation.")
        this.alert(this.$t("alerts.annotationError"), null, "danger")
        return
      }
      // Add confirmation
      let annotation = {
        target: uri,
        motivation: "moderating",
      }
      if (this.creator && this.creator.uri) {
        annotation.creator = {
          id: this.creator.uri,
        }
        if (this.creatorName) {
          annotation.creator.name = this.creatorName
        }
      }
      this.loading = true
      try {
        annotation = await provider.postAnnotation({ annotation })
      } catch (error) {
        annotation = null
      }
      this.loading = false
      // Check if URI stayed the same
      const newUri = _.get(this.imapping, "uri")
      if (uri != newUri || !annotation) {
        // Don't add annotation to mapping
        this.alert(this.$t("alerts.annotationNotSaved"), null, "danger")
        return
      } else {
        this.alert(this.$t("alerts.annotationSaved"), null, "success")
      }
      this.imapping.annotations.push(annotation)
      this.$emit("refresh-annotations", { uri, annotations: this.annotations })
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.annotationPopover {
  display: flex;
  flex-direction: column;
}
.annotationPopover-upper {
  flex: 1;
  display: flex;
  justify-content: center;
}
.annotationPopover-lower > button {
  width: 100%;
  margin-top: 5px;
}
.annotationPopover-left {
  flex: 1;
  padding: 5px 0px 5px 0px;
  min-width: 100px;
  display: flex;
  flex-direction: column;
}
.annotationPopover-history {
  flex: 1;
}
.annotationPopover-score {
  .fontSize-large;
  text-align: right;
  padding-top: 5px;
}
.annotationPopover-voting {
  flex: none;
  min-width: 24px;
  display: flex;
  flex-direction: column;
  font-size: 20px;
}
.annotationPopover-voting > div {
  flex: none;
  text-align: center;
}
.annotationPopover-voting > div:first-child {
  flex: 1;
}
.annotationPopover-voting-button-current {
  color: @color-primary;
}

.bbutton-small {
  .fontSize-small;
  padding: 2px 4px;
}

</style>

<style>
.annotationPopover-history > div {
  padding: 8px 10px;
}
/* Global styles overriding bootstrap classes */
.annotationPopoverTop .popover {
  max-width: 500px;
  z-index: 1040;
}
.annotationPopoverTop .popover > .popover-body {
  padding: 0px 6px 4px 6px;
}
</style>
