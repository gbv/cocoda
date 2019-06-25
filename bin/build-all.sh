#!/bin/bash

# Stash changes before running script
git stash save -u before-build-all

wget https://api.github.com/repos/gbv/cocoda/milestones?state=closed -O github-milestones.json

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
  MILESTONE_URL=$(node -pe "let ms = require('./github-milestones.json'); let m = ms.find(a => a.title == '$VERSION'); if(m) console.log('\"' + m.html_url + '?closed=1\"'); else console.log('null'); process.exit(0)")
  cat > dist/build-info.json <<EOL
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
  # 6. Move build to separate folder
  mv dist releases/$TAG
  # 7. Reset repo for next checkout
  git reset --hard
done

rm github-milestones.json
git checkout dev

# Apply stash after script
git stash pop
