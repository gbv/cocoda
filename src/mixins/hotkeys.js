/**
 * Mixin regarding keyboard shortcuts.
 *
 * Shortcuts from config are added here depending on the component. To handle the shortcut, override the method `shortcutHandler`, e.g. like this:
 *
 * ```javascript
 * shortcutHandler({ action }) {
 *  switch(action) {
 *    case "firstShortcut":
 *      // Do something
 *      break
 *    case "secondShortcut":
 *      // Do something else
 *      break
 *  }
 * }
 * ```
 *
 * You also need to enable shortcuts in `mounted`:
 *
 * ```javascript
 * mounted() {
 *   this.enableShortcuts()
 * }
 * ```
 *
 * Custom properties can be added the the shortcut in config, for example `isLeft`, to have conditional shortcuts depending on the instance of the component.
 *
 * For examples how to configure shortcuts, look at the existing shortcuts in `cocoda.default.json`. You can override shortcuts in `cocoda.json` by adding one with the same `id`. You can also add additional keys for existing shortcuts by copying the shortcut and changing the `id` and `keys` values.
 *
 */

import _ from "lodash"

export default {
  data() {
    return {
      hotkeys: [],
    }
  },
  methods: {
    /**
     * Override this method in components (see above).
     */
    shortcutHandler() {},
    enableShortcuts() {
      let component = this.$options.name
      let shortcuts = 0
      for (let shortcut of this.config.shortcuts || []) {
        if (shortcut.component === component) {
          this.addHotkey(shortcut.keys, () => {
            this.shortcutHandler(shortcut)
          })
          shortcuts += 1
        }
      }
      if (shortcuts) {
        document.addEventListener("keydown", this.hotkeyHandler)
      }
    },
    hotkeyHandler(event) {
      let shortcut = _.pick(event, ["key", "keyCode", "metaKey", "ctrlKey", "altKey", "shiftKey"])
      if (_.get(event, "srcElement.tagName") == "INPUT") {
        // Skip certain shortcuts for input elements
        let toSkip = [
          {
            key: "a",
            ctrlKey: true,
            metaKey: false,
            altKey: false,
            shiftKey: false,
          },
          {
            key: "a",
            ctrlKey: false,
            metaKey: true,
            altKey: false,
            shiftKey: false,
          },
        ]
        let skip = false
        for (let sc of toSkip) {
          if (_.isEqual(sc, shortcut)) {
            skip = true
            break
          }
        }
        if (skip) {
          return
        }
      }
      let pass = true
      // Find out if a modal is currently opened
      const modals = document.getElementsByClassName("modal show")
      // Only run shortcuts if there are no modals
      if (modals.length == 0) {
        for (let sc of this.hotkeys) {
          // Omit either key or keyCode
          const omit = sc.shortcut.key ? "keyCode" : "key"
          if (_.isEqual(_.omit(shortcut, [omit]), _.omit(sc.shortcut, [omit]))) {
            pass = sc.handler() && pass
          }
        }
      }
      if (!pass) {
        event.stopPropagation()
        event.preventDefault()
        event.returnValue = false
        event.cancelBubble = true
      }
    },
    addHotkey(shortcuts, handler) {
      shortcuts = shortcuts.split(",")
      for (let sc of shortcuts) {
        let keys = sc.split("+")
        let key = null
        let keyCode = null
        let metaKey = false
        let ctrlKey = false
        let altKey = false
        let shiftKey = false
        for (let k of keys) {
          if (k == "ctrl") {
            ctrlKey = true
          } else if (k == "alt" || k == "option") {
            altKey = true
          } else if (k == "meta" || k == "command") {
            metaKey = true
          } else if (k == "shift") {
            shiftKey = true
          } else {
            if (k.startsWith("keyCode:")) {
              keyCode = parseInt(k.replace("keyCode:", ""))
            } else {
              key = k
            }
          }
        }
        this.hotkeys.push({
          handler,
          shortcut: {
            key, keyCode, metaKey, ctrlKey, altKey, shiftKey,
          },
        })
      }
    },
  },
}
