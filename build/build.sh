#!/bin/bash

# move current current build-info.json to build-info.backup.json
mv build/build-info.json build/build-info.backup.json

# write build info to build-info.js
GIT_TAG=$(git describe --abbrev=0 --tags || echo "")
GIT_COMMIT=$(git rev-parse --verify HEAD)
GIT_COMMIT_SHORT=$(git rev-parse --verify --short HEAD)
DATE=$(date)
cat > ./build/build-info.json <<EOL
{
  "gitTag": "${GIT_TAG}",
  "gitCommit": "${GIT_COMMIT}",
  "gitCommitShort": "${GIT_COMMIT_SHORT}",
  "buildDate": "${DATE}"
}
EOL

# make sure a cocoda.json file exists
[ ! -e ./config/cocoda.json ] && echo -n "{}" > ./config/cocoda.json

# build the app
node build/build.js

# move empty build-info.json back after build to not cause a git file change
mv ./build/build-info.backup.json ./build/build-info.json
