#!/bin/bash

# Just a small preparation script to be run before npm run dev

# 1. Create build info
npm run build-info

# 2. Make sure config/cocoda.json exists
[ ! -e ./config/cocoda.json ] && echo -n "{}" > ./config/cocoda.json

exit 0
