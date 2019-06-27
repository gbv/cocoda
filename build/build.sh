#!/bin/bash

# move current current build-info.json to build-info.backup.json
mv build/build-info.json build/build-info.backup.json

# get github-milestones.json if it doesn't exist yet
DELETE_TEMP=
if [ ! -e ./temp/github-milestones.json ]; then
  DELETE_TEMP=yes
  mkdir temp
  wget 'https://api.github.com/repos/gbv/cocoda/milestones?state=closed&per_page=100' -O temp/github-milestones.json
fi

# write build info to build-info.json
./build/build-info.sh > ./build/build-info.json

GIT_BRANCH=$(([ ! -z "$TRAVIS_BRANCH" ] && echo $TRAVIS_BRANCH) || git rev-parse --abbrev-ref HEAD)
GIT_COMMIT_SHORT=$(git rev-parse --verify --short HEAD)

echo "Building for branch $GIT_BRANCH ($GIT_COMMIT_SHORT)..."

# if there was no config file before, remember this and delete the generated config at the end of the script
USERCONFIG=
MALFORMED_CONFIG=

if [ -e ./config/cocoda.json ]; then
  # Check for JSON validity
  node -e 'var fs = require("fs"); var config = fs.readFileSync("./config/cocoda.json"); try { JSON.parse(config); process.exit(0); } catch(error) { process.exit(1) }'
  if [ $? -eq 0 ]; then
    USERCONFIG=yes
  else
    echo "Error: User config is not valid JSON! Aborting build. Please fix config/cocoda.json."
    mv ./build/build-info.backup.json ./build/build-info.json
    exit 1
  fi
fi

[ $USERCONFIG ] && echo "Using user config for build..."

# if no user config exists and there is a config for the current branch, use that config
[ ! $USERCONFIG ] && [ -e ./config/cocoda.$GIT_BRANCH.json ] && echo "Using config file of branch $GIT_BRANCH for build..." && cp ./config/cocoda.$GIT_BRANCH.json ./config/cocoda.json

# make sure a cocoda.json file exists in all cases
[ ! -e ./config/cocoda.json ] && echo "Using empty user config for build..." && echo -n "{}" > ./config/cocoda.json

# build the app
vue-cli-service build --modern
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
[ ! $USERCONFIG ] && echo "Removing config generated during build..." && rm ./config/cocoda.json

# delete temp folder if it was created during build
[ $DELETE_TEMP ] && rm -r temp/

[ $success -eq 0 ] && echo "Build successfully deployed to folder dist/."

exit $success
