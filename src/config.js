let defaultConfig = require("../config.default.json")
let userConfig
try {
  userConfig = require("../config.json")
} catch(error) {
  userConfig = {}
}
let config = Object.assign({}, defaultConfig, userConfig)
console.log(config)

export default config
