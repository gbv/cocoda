#!/usr/bin/env node

const { execSync: _execSync } = require("child_process")
const execSync = (cmd) => {
  let stdout = _execSync(cmd).toString()
  if (stdout.endsWith("\n")) {
    stdout = stdout.slice(0, stdout.length - 1)
  }
  return stdout
}

const pkg = require("../package.json")

// Use existing VERSION variable first, then version from package.json
const version = process.env.VERSION || pkg.version
// Get jskos-api version from package.json
const jskosApi = pkg["jskos-api"]

// Use existing GIT_BRANCH variable first, then TRAVIS_BRANCH, then branch from git command
const gitBranch = execSync("([ ! -z \"$GIT_BRANCH\" ] && echo $GIT_BRANCH) || ([ ! -z \"$TRAVIS_BRANCH\" ] && echo $TRAVIS_BRANCH) || git rev-parse --abbrev-ref HEAD")
// Commit hashes
const gitCommit = execSync("git rev-parse --verify HEAD")
const gitCommitShort = execSync("git rev-parse --verify --short HEAD")
// Commit message
const gitCommitMessage = execSync("git log --oneline -1")
// Build date
const buildDate = execSync("date -u +\"%Y-%m-%dT%H:%M:%SZ\"")
// Commit date
const date = new Date(execSync("git show -s --format=%ct") * 1000)

// Milestone URL (if github-milestones.json exists)
let ms
try {
  ms = require("../temp/github-milestones.json")
} catch (error) {
  ms = []
}
let m = ms.find(a => a.title == version)
const milestoneUrl = m ? m.html_url + "?closed=1" : null

console.log(JSON.stringify({
  version,
  gitBranch,
  gitCommit,
  gitCommitShort,
  gitCommitMessage,
  buildDate,
  date,
  milestoneUrl,
  jskosApi,
}, null, 2))
