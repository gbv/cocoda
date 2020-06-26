# [Cocoda Mapping Tool](https://github.com/gbv/cocoda)
[![GitHub release](https://img.shields.io/github/release/gbv/cocoda.svg)](https://github.com/gbv/cocoda/releases/latest)
[![GitHub](https://img.shields.io/github/license/gbv/cocoda.svg)](https://github.com/gbv/cocoda/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/gbv/cocoda.svg?branch=dev)](https://travis-ci.org/gbv/cocoda)

Cocoda is a web-based tool for creating mappings between knowledge organization systems. It is part of a larger infrastructure of [Project coli-conc](https://coli-conc.gbv.de).

- See [GitHub](https://github.com/gbv/cocoda) for more information about the tool.
- Hosted versions of Cocoda can be found [here](https://coli-conc.gbv.de/cocoda/).

## Supported Architectures
Currently, only `x86-64` is supported, but we are planning to add more architectures soon.

## Available Tags
- The current release version is available under `latest`. However, new major versions might break compatibility of the previously used config file, therefore it is recommended to use a version tag instead.
- We follow SemVer for versioning the application. Therefore, `x` offers the latest image for the major version x, `x.y` offers the latest image for the minor version `x.y`, and `x.y.z` offers the image for a specific patch version x.y.z.
- Additionally, the latest development version of Cocoda is available under `dev`.

## Usage
Here are some example snippets to help you get started running the image.

### docker
```bash
docker run -it \
  --name=cocoda \
  -p 8080:80 \
  -v /path/to/appdata:/config \
  --restart unless-stopped \
  coliconc/cocoda
```

This will create and start a Cocoda container running under host port 8080 with the configuration folder mounted under `/path/to/appdata`. Use `/path/to/appdata/cocoda.json` to configure the application (see below) and access it under `http://localhost:8080`.

### docker-compose
`docker-compose.yml`:
```yml
version: "3"

services:
  cocoda:
    image: coliconc/cocoda
    volumes:
      # Mount ./config folder into container
      - ./config:/config
    ports:
      # Default to port 8080
      - ${PORT:-8080}:80
    restart: always
```

Then start the application using `docker-compose up`. This will create and start a Cocoda container running under host port 8080 (or a custom port in `PORT`) with the configuration folder mounted under `./config`. Use `./config/cocoda.json` to configure the application (see below) and access it under `http://localhost:8080`.

## Application Setup

Cocoda will create a configuration file under `/config/cocoda.json` inside the image which can be used to configure the application. By default, the file is empty (or rather an empty object `{}`). The file is merged with a default configuration (see [`cocoda.default.json`](https://github.com/gbv/cocoda/blob/dev/config/cocoda.default.json)) that offers a selection of preconfigured registries and other configurations.

Please refer to the [documentation](https://github.com/gbv/cocoda#configuration) on how to use the configuration file.

After editing `cocoda.json`, the container does not have to be restarted. It is sufficient to reload the application in the browser.
