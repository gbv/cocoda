``` bash
# get the sources
git clone https://github.com/gbv/cocoda.git # or git@github.com:gbv/cocoda.git
cd cocoda

# install dependencies
npm ci

# create a local config file
echo '{}' > config/cocoda.json

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# serve documentation at localhost:6060
npm run styleguide
```
