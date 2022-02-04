# [Cocoda Mapping Tool](https://github.com/gbv/cocoda)
[![GitHub release](https://img.shields.io/github/release/gbv/cocoda.svg)](https://github.com/gbv/cocoda/releases/latest)
[![GitHub](https://img.shields.io/github/license/gbv/cocoda.svg)](https://github.com/gbv/cocoda/blob/master/LICENSE)
[![Build](https://github.com/gbv/cocoda/actions/workflows/build.yml/badge.svg)](https://github.com/gbv/cocoda/actions/workflows/build.yml)

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
Note that depending on your system, it might be necessary to use `sudo docker-compose`.

1. Create `docker-compose.yml`:

```yml
version: "3"

services:
  cocoda:
    image: coliconc/cocoda
    volumes:
      # Mount ./config folder into container
      - ./config:/config
    ports:
      # Use host port 8080
      - 8080:80
    restart: always
```

2. Create data folder and configuration file:

```bash
mkdir config
echo {} > config/cocoda.json
```

Note that if you skip this step, Docker will create the folder and the file itself. Depending on your system, they might not be owned by the right user account (likely root).

3. Start the application:

```bash
docker-compose up -d
```

This will create and start a Cocoda container running under host port 8080 with the configuration folder mounted under `./config`. Use `./config/cocoda.json` to configure the application (see below) and access it under `http://localhost:8080`.

## Application Setup

The configuration file under `/config/cocoda.json` inside the container (mounted to your host depending on your setup, see above) can be used to configure the application. By default, the file is empty (or rather an empty object `{}`). The file is merged with a default configuration (see [`cocoda.default.json`](https://github.com/gbv/cocoda/blob/dev/config/cocoda.default.json)) that offers a selection of preconfigured registries and other settings.

Please refer to the [documentation](https://github.com/gbv/cocoda#configuration) on how to use the configuration file.

After editing `cocoda.json`, the container does not have to be restarted. It is sufficient to reload the application in the browser.
