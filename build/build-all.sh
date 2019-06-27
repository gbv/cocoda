#!/bin/bash

mkdir temp
wget 'https://api.github.com/repos/gbv/cocoda/milestones?state=closed&per_page=100' -O temp/github-milestones.json
# Copy build-info.sh to a temporary directory so it will be accessible throughout all the builds
cp build/build-info.sh temp/build-info.sh

# Stash changes before running script
git stash save -u before-build-all

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
  VERSION=$TAG GIT_BRANCH=$GIT_BRANCH temp/build-info.sh > dist/build-info.json
  # 6. Move build to separate folder
  mv dist releases/$TAG
  # 7. Reset repo for next checkout
  git reset --hard
done

rm -r temp
git checkout dev

# Apply stash after script
git stash pop

# Run one more install to get back to current dependencies
npm i
