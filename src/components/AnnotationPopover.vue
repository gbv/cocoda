<template>
  <div
    :id="`annotationPopoverTop-${iid}`"
    class="annotationPopoverTop">
    <b-popover
      v-if="enable"
      ref="annotationPopover"
      :target="element"
      :container="`annotationPopoverTop-${iid}`"
      :show.sync="show"
      boundary="window"
      placement="lefttop" >
      <loading-indicator-full
        v-if="loading"
        style="z-index: 1100;" />
      <!-- Main Annotation Popover div -->
      <div
        ref="annotationPopoverDiv"
        class="annotationPopover">
        <!-- Left side -->
        <div
          v-if="annotations.length"
          class="annotationPopover-left">
          <!-- Annotation history -->
          <annotation-list
            :annotations="annotations"
            class="annotationPopover-history" />
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
                'button': provider && provider.auth,
                'button-disabled': !provider || !provider.auth,
                'annotationPopover-voting-button': true
              }"
              icon="thumbs-up"
              @click="provider && provider.auth && assessing('+1')" />
          </div>
          <!-- Score -->
          <div class="annotationPopover-score">
            <span
              :class="{
                'text-success': score.startsWith('+'),
                'text-danger': score.startsWith('-')
              }"
              class="fontWeight-heavy" >
              {{ score }}
            </span>
          </div>
          <!-- Downvote button -->
          <div>
            <font-awesome-icon
              :class="{
                'annotationPopover-voting-button-current': ownScore == '-1',
                'button': provider && provider.auth,
                'button-disabled': !provider || !provider.auth,
                'annotationPopover-voting-button': true
              }"
              icon="thumbs-down"
              @click="provider && provider.auth && assessing('-1')" />
          </div>
        </div>
      </div>
    </b-popover>
  </div>
</template>

<script>
import _ from "lodash"
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import AnnotationList from "./AnnotationList"

export default {
  name: "AnnotationPopover",
  components: { LoadingIndicatorFull, AnnotationList },
  props: {
    id: {
      type: String,
      default: null,
    },
    idPrefix: {
      type: String,
      default: ""
    },
    mapping: {
      type: Object,
      default: null
    },
  },
  data() {
    return {
      iid: null,
      imapping: null,
      show: false,
      loading: false,
    }
  },
  computed: {
    enable() {
      return this.iid && this.element
    },
    elementId() {
      return this.idPrefix + (this.iid || "")
    },
    element() {
      return document.getElementById(this.elementId)
    },
    mousePosition() {
      return this.$store.state.mousePosition
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
      return this.annotations.find(annotation => this.$util.annotations.creatorMatches(annotation, this.userUris))
    },
    ownScore() {
      return _.get(this.ownAssessment, "bodyValue")
    },
    provider() {
      return _.get(this.imapping, "_provider")
    },
  },
  watch: {
    id() {
      // Delay setting internal IDs and mapping as a workaround for a bootstrap-vue bug
      if (this.id && this.id != this.iid) {
        this.iid = null
        _.delay(() => {
          this.iid = this.id
          this.imapping = this.mapping
        }, 50)
      }
    },
    mousePosition({ x, y }) {
      // Show/hide popover depending on mouse position relative to popover and originating button
      if (this.element) {
        let show = false
        for (let [element, delta] of [[this.$refs.annotationPopoverDiv, 25], [this.element, 0]]) {
          if (element) {
            let { top, bottom, left, right } = element.getBoundingClientRect()
            if (y < bottom + delta && y > top - delta && x < right + delta && x > left - delta) {
              show = true
            }
          }
        }
        this.show = show
      }
    },
    /**
     * Make sure the div is always scrolled to the bottom
     */
    show() {
      this.scrollToBottom()
    },
    annotations() {
      this.scrollToBottom()
    },
    iid() {
      this.scrollToBottom()
    },
  },
  methods: {
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
    alertInternal(message) {
      if (this.$store.getters.getCurrentRegistry.provider.has.auth && !this.$store.getters.getCurrentRegistry.provider.auth) {
        message += " " + this.$t("general.authNecessary")
      }
      this.alert(message, null, "danger")
    },
    assessing(value) {
      let provider = this.provider
      if (!provider || !provider.has.annotations) {
        console.warn("No provider found to add annotation.")
        return
      }
      let uri = _.get(this.imapping, "uri")
      if (!uri) {
        console.warn("No URI found to add annotation.")
        return
      }
      this.loading = true
      let promise
      // Three cases:
      // 1. Case: User has not assessed this mapping -> add an annotation
      if (!this.ownAssessment) {
        let annotation = {
          target: uri,
          motivation: "assessing",
          bodyValue: value,
        }
        if (this.creator && this.creator.uri && this.creatorName) {
          annotation.creator = {
            id: this.creator.uri,
            name: this.creatorName
          }
        }
        promise = provider.addAnnotation(annotation).then(annotation => {
          // Check if URI stayed the same
          let newUri = _.get(this.imapping, "uri")
          if (uri != newUri || !annotation) {
            // Don't add annotation to mapping
            this.alertInternal("Adding annotation failed.")
            return
          }
          this.imapping.annotations.push(annotation)
        })
      } else {
        if (this.ownScore != value) {
          // 2. Case: User has assessed and changes the value
          promise = provider.editAnnotation(this.ownAssessment, { bodyValue: value }).then(annotation => {
            if (annotation) {
              this.ownAssessment.bodyValue = value
            } else {
              this.alertInternal("Editing annotation failed.")
            }
          })
        } else {
          // 3. Case: User has assessed and removes his value
          promise = this.remove(this.annotations.indexOf(this.ownAssessment))
        }
      }
      promise.then(() => {
        this.loading = false
      })
    },
    remove(index) {
      let provider = this.provider
      if (!provider || !provider.has.annotations) {
        console.warn("No provider found to add annotation.")
        return
      }
      let annotation = this.annotations[index]
      if (!annotation) {
        return
      }
      this.loading = true
      return provider.removeAnnotation(annotation).then(success => {
        this.loading = false
        // Check if annotation stayed the same or deletion was not successful
        if (annotation.id != this.annotations[index].id || !success) {
          // Don't remove annotation because it changed
          this.alertInternal("Removing annotation failed.")
          return
        }
        this.$delete(this.imapping.annotations, index)
      })
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.annotationPopover {
  display: flex;
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
  color: @color-primary-3;
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
