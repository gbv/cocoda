#!/bin/bash

# Make sure jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq could not be found, but is required to run this script"
    exit 1
fi

mkdir temp
wget 'https://api.github.com/repos/gbv/cocoda/milestones?state=closed&per_page=100' -O temp/github-milestones.json
# Copy build-info.js to a temporary directory so it will be accessible throughout all the builds
cp build/build-info.js temp/build-info.js

# Stash changes before running script
git stash push -u -m before-build-all

function cleanup {
  echo
  echo "==================== Cleaning up ===================="
  rm -r temp
  git reset --hard
  git checkout dev

  # Apply stash after script
  git stash pop stash@{$((git stash list | grep -w before-build-all) | cut -d "{" -f2 | cut -d "}" -f1)}
  
  test -e build/build-info.backup.json && rm build/build-info.backup.json

  # Run one more install to get back to current dependencies
  npm ci
}
trap cleanup EXIT

GIT_BRANCH=master

git checkout $GIT_BRANCH
rm -rf releases
mkdir releases

DEFAULT_TAGS="master dev $(git tag)"
TAGS="${*:1}"
TAGS="${TAGS:-$DEFAULT_TAGS}"

for TAG in $TAGS
do
  echo
  echo "==================== Building $TAG ===================="
  # Checkout tag
  git checkout $TAG
  # Install dependencies
  npm ci
  # Override supported jskos-api version
  # (without this, older Cocoda versions won't be compatible with newer JSKOS Server versions, even though the v2 API is mostly backwards-compatible)
  # (See https://stackoverflow.com/a/61049639 for why a variable is necessary)
  packageJson="$(jq 'del(."jskos-api")' package.json)"
  echo -E "${packageJson}" > package.json
  # Create build
  npm run build
  # Create build-info.json from scratch (due to new properties)
  VERSION=$TAG GIT_BRANCH=$GIT_BRANCH temp/build-info.js > dist/build-info.json
  # Move build to separate folder
  mv dist releases/$TAG
  # Reset repo for next checkout
  git reset --hard
  echo
  echo "==================== Finished building $TAG ===================="
done

# Create symlink for "master" if exists
test -e releases/master && ln -s master releases/app
