let defaultConfig = require("../config/cocoda.default.json")
let userConfig
try {
  userConfig = require("../config/cocoda.json")
} catch(error) {
  userConfig = {}
}
let config = Object.assign({}, defaultConfig, userConfig)

export default config
