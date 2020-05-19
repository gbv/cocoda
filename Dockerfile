# Step 1: Build Cocoda via node:12-alpine image.
FROM node:12-alpine AS builder
WORKDIR /usr/src/app

## We need bash and git.
RUN apk add --no-cache bash
RUN apk add --no-cache git

## Install dependencies (separate step to utilize caching)
COPY package*.json ./
RUN npm ci

## Copy app source and build application
COPY . .
RUN npm run build

# Step 2: Use nginx:alpine image as actual base image and copy files from dist/ into it.
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

## Copy application from builder
COPY --from=builder /usr/src/app/dist .

## Create symlink for configuration
## -> The config folder can then be mounted via /config
RUN mkdir /config
RUN mv ./cocoda.json ./cocoda-previous.json
RUN ln -s /config/cocoda.json ./cocoda.json

## Copy default configuration file if necessary and run nginx
CMD [ -f /config/cocoda.json ] || cp ./cocoda-previous.json /config/cocoda.json; exec nginx -g 'daemon off;'
