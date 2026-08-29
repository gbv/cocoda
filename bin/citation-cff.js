#!/usr/bin/env node

import fs from "fs"

const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8"))

const quote = value => `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`

function parsePerson(value) {
  const match = String(value).match(/^\s*(.*?)\s*(?:<([^>]+)>)?\s*$/)
  const name = match?.[1] || String(value)
  const email = match?.[2]
  const parts = name.trim().split(/\s+/)
  const familyNames = parts.length > 1 ? parts.pop() : parts[0]
  const givenNames = parts.length > 0 && parts.join(" ") !== familyNames ? parts.join(" ") : undefined
  return { familyNames, givenNames, email }
}

function repositoryCode() {
  const repository = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url
  return repository?.replace(/^git\+/, "").replace(/\.git$/, "")
}

const people = [pkg.author, ...(pkg.contributors || [])].filter(Boolean).map(parsePerson)
const lines = [
  "cff-version: 1.2.0",
  `message: ${quote(`If you use ${pkg.name}, please cite it using the metadata from this file.`)}`,
  "type: software",
  `title: ${quote(pkg.description || pkg.name)}`,
  "authors:",
]

for (const person of people) {
  lines.push(`  - family-names: ${quote(person.familyNames)}`)
  if (person.givenNames) lines.push(`    given-names: ${quote(person.givenNames)}`)
  if (person.email) lines.push(`    email: ${quote(person.email)}`)
}

const repo = repositoryCode()
if (repo) lines.push(`repository-code: ${quote(repo)}`)
if (pkg.license) lines.push(`license: ${pkg.license}`)
if (pkg.version) lines.push(`version: ${quote(pkg.version)}`)

console.log(`${lines.join("\n")}\n`)
