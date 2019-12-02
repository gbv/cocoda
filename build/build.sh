#!/bin/bash

# get github-milestones.json if it doesn't exist yet
DELETE_TEMP=
if [ ! -e ./temp/github-milestones.json ]; then
  DELETE_TEMP=yes
  mkdir temp
  wget 'https://api.github.com/repos/gbv/cocoda/milestones?state=closed&per_page=100' -O temp/github-milestones.json
fi

# write build info to build-info.json
npm run build-info

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

# create and move user manual
PANDOC=$(pandoc --version 2>/dev/null | awk 'NR==1 && $2>=2.3 {print}')
MODIFIED_DOCS=$(git show --pretty="" --name-only HEAD docs/)
BUILD_PDF="${BUILD_PDF:-$MODIFIED_DOCS}"
if [ -z "$PANDOC" ]; then
  echo "Pandoc 2 required to build user manual! Skipping documentation."
  echo
else
  echo "Creating user manual (HTML)..."
  npm run manual
  cp docs/*/user-manual-*.html dist/
  echo
  if [ -z "$BUILD_PDF" ]; then
    echo "Skipping creation of PDF manual"
  else
    if [ hash xetex 2>/dev/null ]; then
      echo "Creating user manual (PDF)..."
      npm run manual-pdf
      make -C docs/de book
      cp docs/*/user-manual-*.pdf dist/
    else
      echo "Missing tools to create PDF user manual! Skipping this."
    fi
  fi
fi

# # delete config file if it was generated during this script
[ ! $USERCONFIG ] && echo "Removing config generated during build..." && rm ./config/cocoda.json

# delete temp folder if it was created during build
[ $DELETE_TEMP ] && rm -r temp/

[ $success -eq 0 ] && echo "Build successfully deployed to folder dist/."

exit $success
