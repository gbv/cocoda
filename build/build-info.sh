#!/bin/bash

# Use existing VERSION variable first, then version from package.json
VERSION=$(([ ! -z "$VERSION" ] && echo $VERSION) || node -pe "require('./package.json').version")

# Use existing GIT_BRANCH variable first, then TRAVIS_BRANCH, then branch from git command
GIT_BRANCH=$(([ ! -z "$GIT_BRANCH" ] && echo $GIT_BRANCH) || ([ ! -z "$TRAVIS_BRANCH" ] && echo $TRAVIS_BRANCH) || git rev-parse --abbrev-ref HEAD)

# Commit hashes
GIT_COMMIT=$(git rev-parse --verify HEAD)
GIT_COMMIT_SHORT=$(git rev-parse --verify --short HEAD)
# Build date
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Commit date
DATE=$(node -pe "var date = new Date($(git show -s --format=%ct)*1000); console.log(date); process.exit(0);")
# Milestone URL (if github-milestones.json exists)
MILESTONE_URL=$(node -pe "let ms; try { ms = require('./temp/github-milestones.json'); } catch(error) { ms = []; } let m = ms.find(a => a.title == '$VERSION'); if(m) console.log('\"' + m.html_url + '?closed=1\"'); else console.log('null'); process.exit(0)")
cat <<EOL
{
  "version": "${VERSION}",
  "gitBranch": "${GIT_BRANCH}",
  "gitCommit": "${GIT_COMMIT}",
  "gitCommitShort": "${GIT_COMMIT_SHORT}",
  "buildDate": "${BUILD_DATE}",
  "date": "${DATE}",
  "milestoneUrl": ${MILESTONE_URL}
}
EOL
