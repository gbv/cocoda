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

Before creating a release, be aware of the following prerequisites:

- You are on the dev branch and your working tree is clean.
- You have the rights to push to the Cocoda repository.
- Your internet connection is working correctly.

If these are filfilled, you can create a release by running one of the following commands:

```bash
# patch release, e.g. 0.8.0 -> 0.8.1
npm run release patch

# minor release, e.g. 0.8.1 -> 0.9.0
npm run release minor

# major release, e.g. 0.9.0 -> 1.0.0
npm run release major
```

After successfully creating a release, the script will show you some possible next steps.

If there were any errors during the release, make sure to clean up your repository before trying again (reverting the version commit, etc.).

## Contribute
We are open to pull requests, but before spending a lot of time implementing a new feature, please create an issue to discuss whether this is something we can imagine being in the main application.

If you have feature suggestions, please open an issue as well, even if you can't implement it. We're happy for every idea!

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License
MIT ©2019 Verbundzentrale des GBV (VZG)

[documentation]: https://gbv.github.io/cocoda/
