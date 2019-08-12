Cocoda can be installed on any web server. The easiest way is to use the latest pre-built release ([jq](https://stedolan.github.io/jq/) required):

```bash
# You can also manually download the latest release here: https://github.com/gbv/cocoda/releases/latest
wget -N $(curl -s https://api.github.com/repos/gbv/cocoda/releases/latest | jq -r '.assets[].browser_download_url')
unzip cocoda-*.zip
rm cocoda-*.zip
```

The directory `cocoda` is then ready to be [served with any web server](#serving-the-files).

Alternatively, it's possible to clone the [Cocoda repository](https://github.com/gbv/cocoda):

```bash
git clone https://github.com/gbv/cocoda.git
cd cododa
```

Then install required Node modules with [npm](https://www.npmjs.com/get-npm) and run build:

```bash
npm ci
npm run build
```

Files are created in directory `dist` to be [served with any web server](#serving-the-files). Note: It is recommended to use Node.js v10 or above.

### Serving the Files

Any file server can be used to serve the files. No special configuration is necessary. Some examples:

**Using the `http-server` npm package:**
```bash
npm install -g http-server
# using the pre-built release:
http-server -p 8000 cocoda/
# or using the manual build:
http-server -p 8000 dist/
```

**Using `php`:**
```bash
# using the pre-built release:
php -S 127.0.0.1:8000 -t cocoda/
# or using the manual build:
php -S 127.0.0.1:8000 -t dist/
```

The Cocoda instance will be available at http://localhost:8000. Other alternatives can be found [here](https://gist.github.com/willurd/5720255).
