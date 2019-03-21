#!/bin/bash

# move current current build-info.json to build-info.backup.json
mv build/build-info.json build/build-info.backup.json

# write build info to build-info.js
VERSION=$(node -pe "require('./package.json').version")
GIT_BRANCH=$(([ ! -z "$TRAVIS_BRANCH" ] && echo $TRAVIS_BRANCH) || git rev-parse --abbrev-ref HEAD)

GIT_COMMIT=$(git rev-parse --verify HEAD)
GIT_COMMIT_SHORT=$(git rev-parse --verify --short HEAD)
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > ./build/build-info.json <<EOL
{
  "version": "${VERSION}",
  "gitBranch": "${GIT_BRANCH}",
  "gitCommit": "${GIT_COMMIT}",
  "gitCommitShort": "${GIT_COMMIT_SHORT}",
  "buildDate": "${DATE}"
}
EOL

echo "Building for branch $GIT_BRANCH ($GIT_COMMIT_SHORT)..."

# if there was no config file before, remember this and delete the generated config at the end of the script
DELETECONFIG=
[ ! -e ./config/cocoda.json ] && DELETECONFIG=yes

[ -e ./config/cocoda.json ] && echo "Using user config for build..."

# if no user config exists and there is a config for the current branch, use that config
[ ! -e ./config/cocoda.json ] && [ -e ./config/cocoda.$GIT_BRANCH.json ] && echo "Using config file of branch $GIT_BRANCH for build..." && cp ./config/cocoda.$GIT_BRANCH.json ./config/cocoda.json

# make sure a cocoda.json file exists in all cases
[ ! -e ./config/cocoda.json ] && echo "Using empty user config for build..." && echo -n "{}" > ./config/cocoda.json

# build the app
vue-cli-service build
success=$?

if [ $success -eq 0 ]; then
  # remove previous dist directory
  [ -e dist/ ] && [ -e dist-temp/ ] && rm -r dist
  # rename dist-temp to dist
  [ -e dist-temp/ ] && mv dist-temp dist
else
  echo "Build has failed!"
fi

# move empty build-info.json back after build to not cause a git file change
mv ./build/build-info.backup.json ./build/build-info.json

# # delete config file if it was generated during this script
[ $DELETECONFIG ] && echo "Removing config generated during build..." && rm ./config/cocoda.json

exit $success
