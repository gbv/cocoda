<template>
  <div class="componentSettings">
    <font-awesome-icon
      :id="`componentSettings-icon-${id}`"
      v-b-tooltip.hover="{ title: tooltip, delay: $util.delay.medium }"
      icon="cog"
      class="button" />
    <b-popover
      :show.sync="isShown"
      :target="`componentSettings-icon-${id}`"
      triggers="click"
      placement="bottomright">
      <div ref="popover">
        <slot />
      </div>
    </b-popover>
  </div>
</template>

<script>
import clickHandler from "../mixins/click-handler"

export default {
  name: "ComponentSettings",
  mixins: [clickHandler],
  props: {
    /**
     * The tooltip for the settings button.
     */
    tooltip: {
      type: String,
      default: ""
    },
  },
  data() {
    return {
      id: "",
      isShown: false,
    }
  },
  computed: {
    clickHandlers() {
      return [{
        elements: [
          this.$refs.popover,
          document.getElementById(`componentSettings-icon-${this.id}`)
        ],
        handler: () => {
          this.hide()
        }
      }]
    }
  },
  created() {
    this.id = this.$util.generateID()
  },
  methods: {
    show() {
      this.isShown = true
    },
    hide() {
      this.isShown = false
    },
    toggle() {
      this.isShown = !this.isShown
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.componentSettings {
  position: absolute;
  left: 0px;
  top: -6px;
  z-index: @zIndex-2;
}
</style>