#!/bin/bash

revertversion () {
  # Delete tag
  git tag -d $(git describe --tags)
  # Revert commit
  git reset --hard HEAD~1
  if [ $? -ne 0 ]; then
    echo "Error: Reverting version commit failed. Please make sure to clean up your local repository manually."
  else
    version=$(node -pe "require('./package.json').version")
    echo "Version was reverted back to $version."
  fi
}

iferror () {
  if [ $? -ne 0 ]; then
    echo "Error: $1"
    echo "Note: The release script was aborted midway. Please make sure to clean up before trying again."
    exit 1
  fi
}

waitforenter () {
  echo "Note that aborting this script results in unfinished changes in your local and possibly the remote repository."
  read -p "Error: $1, press enter to try again."
}

# 1. Check parameter
semver=$1
if [[ $semver != major && $semver != minor && $semver != patch ]] ; then
  echo 'Please provide a semver string as first parameter: "major", "minor", or "patch".'
  exit 1
fi

# 2. Check for git changes
if [[ `git status --porcelain` ]]; then
  echo "A clean git repository is necessary to create a release. Please commit, discard, or stash the current changes:"
  git status --porcelain
  exit 1
fi

# 3. If current branch is not dev, either offer to publish from current branch, or abort
source=dev
current=$(git rev-parse --abbrev-ref HEAD)
if [[ $source != "$current" ]]; then
  echo "You are currently on branch $current. Releases are usually done from $source."
  read -p "Are you sure to run the release from $current? (N/y) " -r
  if [[ ! $REPLY =~ ^[Yy]$ ]]
  then
    exit 1
  fi
  source=$current
fi

echo "Creating a $semver release from branch $source..."

echo "- Pulling changes from remote..."
git pull --quiet --rebase 2>&1 >/dev/null
iferror "Pulling changes failed, not creating a release."

# echo "- Running tests..."
# npm test 2>&1 >/dev/null
# iferror "Tests failed, not creating a release."

echo "- Running npm version..."
unset npm_config_prefix
npm version $semver 2>&1 >/dev/null
iferror "npm version failed, aborting."

version=$(node -pe "require('./package.json').version")
echo "- ... version $version created!"

read -p "Are you sure to push and release version $version? (N/y) " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
  revertversion
  exit 1
fi

echo "- Pushing $source..."
git push --quiet 2>&1 >/dev/null
while [ $? -ne 0 ]; do
  waitforenter "Pushing dev failed"
  git push
done

echo "- Checking out master and merging $source into master..."
git checkout --quiet master 2>&1 >/dev/null
git merge "$source" 2>&1 >/dev/null
while [ $? -ne 0 ]; do
  waitforenter "Merging failed"
  git merge "$source"
done

echo "- Pushing master branch with tags..."
git push --quiet --tags origin master 2>&1 >/dev/null
while [ $? -ne 0 ]; do
  waitforenter "Pushing master failed"
  git push --tags origin master
done

echo "- Going back to $source..."
git checkout --quiet "$source" 2>&1 >/dev/null

echo
echo "Release $version from branch $source seemed to be successful!"
echo "Next steps:"
[[ $source != "dev" ]] && echo "- Consider merging $source into dev: git checkout dev; git merge $source"
echo "- Wait until the GitHub release workflow is finished and edit and publish the release draft for $version under https://github.com/gbv/cocoda/releases."
echo "- After publishing the release on GitHub, the master instance under https://coli-conc.gbv.de/cocoda/app/ should be updated automatically via a webhook (please check a few minutes after publishing the release)."
echo "- Optional: Create new screencast with updates."
echo "- Optional: Post about update on social media."
