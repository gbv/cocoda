Use the following step-by-step guide to preprare and create a new Cocoda release:

1. Switch to the dev branch if necessary.

  ```bash
  git checkout dev
  ```

1. Run tests and manual checks to confirm that there are no more bugs left.

1. Update the version numbers in `package.json` and `package-lock.json`.

1. Commit those changes with the commit message `Release version x.y.z`.

  ```bash
  git commit -am "Release version x.y.z"
  ```

1. Tag the commit with the version number.

  ```bash
  git tag x.y.z
  ```

1. Push the changes including the tag.

  ```bash
  git push --tags origin dev
  ```

1. Wait for the Travis build to finish and check the deployed dev version [here](https://gbv.github.io/cocoda/dev/).

1. If everything looks and works like it's supposed to, change to the master branch and merge dev into master:

  ```bash
  git checkout master
  git merge dev
  ```

  There should not be any merge conflicts and the merge should be a fast-forward merge.

1. Push the master branch.

  ```bash
  git push
  ```

1. Don't forget to switch back to dev to not accidentally work on master afterwards:

  ```bash
  git checkout dev
  ```

1. Either wait for the cronjob to update the deployed master branch from GitHub or trigger the update manually (if using [cocoda-services](https://github.com/gbv/cocoda-services), just type `./update.sh cocoda`). Note: If the config format changed in any way and there is a user specific config, make sure to update that config file according to the new format.

1. Check the deployed master version if everything works correctly.

1. Go to [this page](https://github.com/gbv/cocoda/tags), click on the little ellipsis next to the newest tag, and choose "Create release".

1. Let the title of the release be "Cocoda x.y.z". Write release notes according to the changes for this release, and publish the release.

1. If necessary, let social media know about the update.
