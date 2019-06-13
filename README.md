# Cocoda Mapping Tool

[![GitHub release](https://img.shields.io/github/release/gbv/cocoda.svg)](https://github.com/gbv/cocoda/releases/latest)
[![GitHub](https://img.shields.io/github/license/gbv/cocoda.svg)](https://github.com/gbv/cocoda/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/gbv/cocoda.svg?branch=dev)](https://travis-ci.org/gbv/cocoda)

> A web-based tool for creating mappings between knowledge organization systems.

Try out the [latest release](https://coli-conc.gbv.de/cocoda/), the [current development version](https://coli-conc.gbv.de/cocoda/dev/), and consult the [documentation] (also includes a user manual)!

## Table of Contents
- [Install](#install)
- [Usage](#usage)
- [Build](#build)
- [Maintainers](#maintainers)
- [Publish](#publish)
- [Contribute](#contribute)
- [License](#license)

## Install
```bash
git clone https://github.com/gbv/cocoda.git
cd cocoda
npm install
# If developing on macOS, it is recommended to install fsevents: npm i --no-save fsevents
```

## Usage
To run the dev server, run `npm run dev`. By default, it will be available at http://localhost:8080.

For more information, see the [documentation].

## Build
```bash
npm run build
```

The build files will be in the folder `dist`. Those can be served using an http server or by simply opening `index.html`.

For more information, see the [documentation].

## Maintainers
- [@stefandesu](https://github.com/stefandesu)
- [@nichtich](https://github.com/nichtich)

## Publish
**For maintainers only.**

Use the following step-by-step guide to preprare and create a new Cocoda release:

1. Switch to the dev branch if necessary.
  ```bash
  git checkout dev
  ```

2. Run tests and manual checks to confirm that there are no more bugs left.

3. Update the version numbers in `package.json` and `package-lock.json`.

4. Commit those changes with the commit message `Release version x.y.z`.
  ```bash
  git commit -am "Release version x.y.z"
  ```

5. Tag the commit with the version number.
  ```bash
  git tag x.y.z
  ```

6. Push the changes including the tag.
  ```bash
  git push --tags origin dev
  ```

7. Wait for the webhook to finish and check the deployed dev version [here](https://coli-conc.gbv.de/cocoda/dev/).

8. If everything looks and works like it's supposed to, change to the master branch and merge dev into master:
  ```bash
  git checkout master
  git merge dev
  ```

  There should not be any merge conflicts and the merge should be a fast-forward merge.

9. Push the master branch.
  ```bash
  git push
  ```

10. Don't forget to switch back to dev to not accidentally work on master afterwards:
  ```bash
  git checkout dev
  ```

11. Either wait for the cronjob to update the deployed master branch from GitHub or trigger the update manually (if using [cocoda-services](https://github.com/gbv/cocoda-services), just type `./update.sh cocoda`). Note: If the config format changed in any way and there is a user specific config, make sure to update that config file according to the new format.

12. Check the deployed master version if everything works correctly.

13. Go to [this page](https://github.com/gbv/cocoda/tags), click on the little ellipsis next to the newest tag, and choose "Create release".

14. Let the title of the release be "Cocoda x.y.z". Write release notes according to the changes for this release, and publish the release.

15. If necessary, let social media know about the update.

**Note:** This process will soon be streamlined and made into a script (https://github.com/gbv/cocoda/issues/348).

## Contribute
We are open to pull requests, but before spending a lot of time implementing a new feature, please create an issue to discuss whether this is something we can imagine being in the main application.

If you have feature suggestions, please open an issue as well, even if you can't implement it. We're happy for every idea!

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License
MIT ©2019 Verbundzentrale des GBV (VZG)

[documentation]: https://gbv.github.io/cocoda/
