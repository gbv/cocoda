#!/bin/sh

# Copy default configuration file if necessary
if [ ! -f /config/cocoda.json ]; then
  cp ./cocoda-previous.json /config/cocoda.json
fi

# Run nginx
exec nginx -g 'daemon off;'
