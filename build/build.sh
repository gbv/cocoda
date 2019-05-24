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
USERCONFIG=
MALFORMED_CONFIG=
BACKUP_FILENAME=./config/cocoda.backup.$(uuidgen).json

if [ -e ./config/cocoda.json ]; then
  # Check for JSON validity
  node -e 'var fs = require("fs"); var config = fs.readFileSync("./config/cocoda.json"); try { JSON.parse(config); process.exit(0); } catch(error) { process.exit(1) }'
  if [ $? -eq 0 ]; then
    USERCONFIG=yes
  else
    echo "Error: User config is not valid JSON! Config file was moved to $BACKUP_FILENAME and falling back to branch or empty user config."
    mv ./config/cocoda.json $BACKUP_FILENAME
    MALFORMED_CONFIG=yes
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

# restore malformed user config
[ $MALFORMED_CONFIG ] && mv $BACKUP_FILENAME ./config/cocoda.json && echo "Malformed user config was moved back to ./config/cocoda.json."

[ $success -eq 0 ] && echo "Build successfully deployed to folder dist/."

exit $success
