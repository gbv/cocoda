import gbv from "eslint-config-gbv"
import vue from "eslint-config-gbv/vue"

export default [
  ...gbv,
  ...vue,
  {
    ignores: [
      "releases",
      "dist",
      // Vite's build.outDir; git-ignored, but eslint used to descend into it
      // and report tens of thousands of errors from bundled output.
      "dist-temp",
    ],
  },
]
