#!/bin/bash

CURRENT_DIR=$(dirname $(realpath $0))
# navigate to project home
cd $CURRENT_DIR/../

GIT_TAG=$(git describe --abbrev=0 --tags || echo no tag)
GIT_COMMIT=$(git rev-parse --verify HEAD)
GIT_COMMIT_SHORT=$(git rev-parse --verify --short HEAD)
DATE=$(date)

# move current current build-info.json to build-info.backup.json
mv build/build-info.json build/build-info.backup.json
# move this file back after build:
# $ mv ./build/build-info.backup.json ./build/build-info.json

# write to build-info.json
cat > ./build/build-info.json <<EOL
{
  "gitTag": "${GIT_TAG}",
  "gitCommit": "${GIT_COMMIT}",
  "gitCommitShort": "${GIT_COMMIT_SHORT}",
  "buildDate": "${DATE}"
}
EOL
