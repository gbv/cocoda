#!/bin/bash

# Make sure jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq could not be found, but is required to run this script"
    exit 1
fi

# Make sure fnm is installed
if ! command -v fnm &> /dev/null
then
    echo "fnm is required to run this script to be able to build older versions of Cocoda"
    echo "(Feel free to submit a PR that also allows nvm)"
    exit 1
fi

mkdir temp
wget 'https://api.github.com/repos/gbv/cocoda/milestones?state=closed&per_page=100' -O temp/github-milestones.json
# Copy build-info.js to a temporary directory so it will be accessible throughout all the builds
cp build/build-info.js temp/build-info.js

# Move node_modules to temporary directory so that we can restore it afterwards
mv node_modules temp/

# Stash changes before running script
git stash push -u -m before-build-all

# Save current Node version to reset after building all the versions
FNM_VERSION="$(fnm current)"

# shellcheck disable=SC2317
function cleanup {
  echo
  echo "==================== Cleaning up ===================="
  if [ "$1" != "0" ]; then
    echo "Note: Error $1 occurred on line $2"
    echo
  fi

  git reset --hard
  git checkout dev

  # Apply stash after script
  git stash pop stash@\{"$( (git stash list | grep -w before-build-all) | cut -d "{" -f2 | cut -d "}" -f1)"\}
  
  test -e build/build-info.backup.json && rm build/build-info.backup.json

  # Return to previous Node.js version
  if [ "$FNM_VERSION" != "" ] && [ "$FNM_VERSION" != "none" ]; then
    fnm use "$FNM_VERSION"
  fi

  # Restore previous node_modules
  rm -r ./node_modules
  mv temp/node_modules ./

  rm -r temp

  if [ "$1" != "0" ]; then
    exit 1
  fi
  exit 0
}
trap 'cleanup $? $LINENO' EXIT

rm -rf releases
mkdir releases

# From: https://stackoverflow.com/a/18558871
beginswith() { case $2 in "$1"*) true;; *) false;; esac; }

DEFAULT_TAGS="$(git tag) master dev"
TAGS="${*:1}"
TAGS="${TAGS:-$DEFAULT_TAGS}"

for TAG in $TAGS
do
  echo
  echo "==================== Building $TAG ===================="
  # Checkout tag
  git checkout $TAG
  # Switch Node.js version on certain tags
  if beginswith "0." "$TAG" || beginswith "1.0." "$TAG" || beginswith "1.1." "$TAG" || beginswith "1.2." "$TAG" || beginswith "1.3." "$TAG"; then
    fnm use --install-if-missing 10
  elif beginswith "1.4." "$TAG" || beginswith "1.5." "$TAG" || beginswith "1.6." "$TAG" || beginswith "1.7." "$TAG"; then
    fnm use --install-if-missing 14
  else
    fnm use --install-if-missing 20
  fi
  # Install dependencies
  npm ci
  # Override supported jskos-api version
  # (without this, older Cocoda versions won't be compatible with newer JSKOS Server versions, even though the v2 API is mostly backwards-compatible)
  # (See https://stackoverflow.com/a/61049639 for why a variable is necessary)
  # TODO: This doesn't seem to work for version 1.4.0 +/- (probably because the value is expected); we can't use "^1.0 || ^2.0" there either because it wasn't supported at that time...
  packageJson="$(jq '."jskos-api"=""' package.json)"
  echo -E "${packageJson}" > package.json
  # Create build
  npm run build
  # Create build-info.json from scratch (due to new properties)
  VERSION=$TAG temp/build-info.js > dist/build-info.json
  # Move build to separate folder
  mv dist releases/$TAG
  # Reset repo for next checkout
  git reset --hard
  echo
  echo "==================== Finished building $TAG ===================="
done

# Create symlink for "master" if exists
test -e releases/master && ln -s master releases/app

exit 0
