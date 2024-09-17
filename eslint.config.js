import gbv from "eslint-config-gbv"
import vue2 from "eslint-config-gbv/vue2"

export default [
  ...gbv,
  ...vue2,
  {
    ignores: [
      "releases",
      "dist",
    ],
  },
]
