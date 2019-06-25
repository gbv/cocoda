#!/bin/bash

# Stash changes before running script
git stash save -u before-build-all

GIT_BRANCH=master

git checkout $GIT_BRANCH
rm -rf releases
mkdir releases

for TAG in $(git tag)
do
  # 1. Checkout tag
  git checkout $TAG
  # 2. Install dependencies
  npm i
  # 3. Move config into right place
  cp config/cocoda.master.json config/cocoda.json
  # 4. Create build
  npm run build
  # 5 Create build-info.json from scratch (due to new properties)
  # VERSION=$(node -pe "require('./package.json').version")
  VERSION=$TAG
  GIT_COMMIT=$(git rev-parse --verify HEAD)
  GIT_COMMIT_SHORT=$(git rev-parse --verify --short HEAD)
  BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  DATE=$(node -pe "var date = new Date($(git show -s --format=%ct)*1000); console.log(date); process.exit(0);")
  cat > dist/build-info.json <<EOL
{
  "version": "${VERSION}",
  "gitBranch": "${GIT_BRANCH}",
  "gitCommit": "${GIT_COMMIT}",
  "gitCommitShort": "${GIT_COMMIT_SHORT}",
  "buildDate": "${BUILD_DATE}",
  "date": "${DATE}"
}
EOL
  # 6. Move build to separate folder
  mv dist releases/$TAG
  # 7. Reset repo for next checkout
  git reset --hard
done

git checkout dev

# Apply stash after script
git stash pop
