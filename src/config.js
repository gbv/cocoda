let defaultConfig = require("../config/cocoda.default.json")
let userConfig
try {
  userConfig = require("../config/cocoda.json")
} catch(error) {
  userConfig = {}
}
let config = Object.assign({}, defaultConfig, userConfig)

// load build info into config
let buildInfo = require("../build/build-info.json")
config.buildInfo = buildInfo

export default config
