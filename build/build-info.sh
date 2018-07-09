#!/bin/bash

CURRENT_DIR=$(dirname $(realpath $0))
# navigate to project home
cd $CURRENT_DIR/../

GIT_TAG=$(git describe --abbrev=0 --tags || echo no tag)
GIT_COMMIT=$(git rev-parse --verify HEAD)
DATE=$(date)

# write to build-info.json
cat > ./build/build-info.json <<EOL
{
  "gitTag": "${GIT_TAG}",
  "gitCommit": "${GIT_COMMIT}",
  "buildDate": "${DATE}"
}
EOL
