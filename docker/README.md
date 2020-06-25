## Secrets
Set `DOCKER_USERNAME` and `DOCKER_PASSWORD` in GitHub under Settings -> Secrets to make deployment via Docker Hub work.

## Build Docker Container
```bash
docker build -t cocoda -f docker/Dockerfile .
```

## Run Docker Container (locally)
```bash
docker run -it --name cocoda -p 8091:80 cocoda
```

## docker-compose (via Docker Hub)
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
```
