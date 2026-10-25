import gbv from "eslint-config-gbv"
import vue2 from "eslint-config-gbv/vue2"

export default [
  ...gbv,
  ...vue2,
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
