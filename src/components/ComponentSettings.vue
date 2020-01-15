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
        <slot>
          <template v-for="setting in settings">
            <b-form-checkbox
              v-if="setting.type == 'Boolean'"
              :key="`componentSettings-${setting.key}-${isLeft}`"
              v-model="settingsValues[setting.key]"
              v-b-tooltip.hover="{ title: $util.lmContent(setting, 'definition'), delay: $util.delay.medium }"
              style="user-select: none;">
              {{ $util.prefLabel(setting) }}
            </b-form-checkbox>
            <div
              v-else-if="setting.type == 'Number'"
              :key="`componentSettings-${setting.key}-${isLeft}`"
              v-b-tooltip.hover="{ title: $util.lmContent(setting, 'definition'), delay: $util.delay.medium }">
              {{ $util.prefLabel(setting) }}
              <b-input
                v-model="settingsValues[setting.key]"
                type="number"
                :min="setting.min"
                :max="setting.max"
                size="sm"
                style="display: inline-block; width: auto;"
                @click="$event.target.select()" />
            </div>
            <p
              v-else
              :key="`componentSettings-${setting.key}-${isLeft}`"
              :class="setting.class">
              {{ $util.prefLabel(setting) }}
            </p>
          </template>
        </slot>
      </div>
    </b-popover>
  </div>
</template>

<script>
import _ from "lodash"

import clickHandler from "../mixins/click-handler"
import computed from "../mixins/computed"

export default {
  name: "ComponentSettings",
  mixins: [clickHandler, computed],
  props: {
    /**
     * The tooltip for the settings button.
     */
    tooltip: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      id: "",
      isShown: false,
      parentName: this.$parent.$options.name,
      isLeft: this.$parent.isLeft,
    }
  },
  computed: {
    // Returns all settings of the current parent component in an array
    settings() {
      let result = []
      let settings = this.$store.state.settings.componentSettings[this.parentName] || {}
      for (let setting of Object.keys(settings)) {
        result.push(Object.assign({
          key: setting,
        }, settings[setting]))
      }
      return result
    },
    // Returns an object with setting values which includes setters to set those values via Vuex
    settingsValues() {
      let values = {}
      // Define setter and getter for each setting separately
      for (let setting of Object.keys(this.$store.state.settings.componentSettings[this.parentName])) {
        const sideDependent = this.$store.state.settings.componentSettings[this.parentName][setting].sideDependent
        const isLeft = sideDependent ? this.isLeft : undefined
        const type = this.$store.state.settings.componentSettings[this.parentName][setting].type
        const defaultValue = this.$store.state.settings.componentSettings[this.parentName][setting].default
        const minValue = this.$store.state.settings.componentSettings[this.parentName][setting].min
        const maxValue = this.$store.state.settings.componentSettings[this.parentName][setting].max
        Object.defineProperty(values, setting, {
          get: () => {
            if (sideDependent) {
              return this.$settings.components[this.parentName][setting][isLeft]
            }
            return this.$settings.components[this.parentName][setting]
          },
          set: (value) => {
            // Convert value to correct type
            if (type == "Boolean" && !_.isBoolean(value)) {
              value = !!value
            }
            if (type == "Number" && !_.isNumber(value)) {
              value = parseInt(value)
              // Also check against min/max values
              if (isNaN(value) || value < minValue || value > maxValue) {
                console.warn(`Tried to save invalid value for setting ${this.parentName} -> ${setting}, fallback to default value (${defaultValue}).`)
                value = defaultValue
              }
            }
            this.$store.commit({
              type: "settings/setComponentSetting",
              component: this.parentName,
              setting,
              isLeft,
              value,
            })
          },
        })
      }
      return values
    },
  },
  created() {
    this.id = this.$util.generateID()
  },
  methods: {
    clickHandlers() {
      return [{
        elements: [
          this.$refs.popover,
          document.getElementById(`componentSettings-icon-${this.id}`),
        ],
        handler: () => {
          this.hide()
        },
      }]
    },
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
  right: 0px;
  bottom: 2px;
  z-index: @zIndex-2;
}
.componentSettings > .button {
  color: @color-text-mediumLightGrey;
}
.componentSettings > .button:hover {
  color: @color-button-hover;
}
</style>
