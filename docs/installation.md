Cocoda can be installed on any web server. The easiest way is to use the latest pre-built release ([jq](https://stedolan.github.io/jq/) required):

```bash
# You can also manually download the latest release here: https://github.com/gbv/cocoda/releases/latest
wget -N $(curl -s https://api.github.com/repos/gbv/cocoda/releases/latest | jq -r '.assets[].browser_download_url')
unzip cocoda-*.zip
rm cocoda-*.zip
```

The directory `cocoda` is then ready to be served.

Alternatively, it's possible to clone the [Cocoda repository](https://github.com/gbv/cocoda):

```bash
git clone https://github.com/gbv/cocoda.git
cd cododa
```

Then install required Node modules with [npm](https://www.npmjs.com/get-npm) and run build:

```bash
npm install
npm run build
```

Files are created in directory `dist` to be served with any web server.
