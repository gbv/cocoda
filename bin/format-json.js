#!/usr/bin/env node

/**
 * Receives a single JSON file as an argument. Tries to fix that file and returns an error if the file is invalid.
 */

const fs = require("fs")
const input = process.argv[2]

let raw = fs.readFileSync(input, { encoding: "utf-8" })
let pretty

try {
  pretty = JSON.stringify(JSON.parse(raw), null, 2)
} catch(error) {
  console.error(`${input} is not a valid JSON file!`)
  process.exit(1)
}

if (pretty != raw) {
  try {
    fs.writeFileSync(input, pretty)
  } catch(error) {
    console.error(`Error while fixing ${input}: ${error}`)
    process.exit(1)
  }
}

process.exit(0)
