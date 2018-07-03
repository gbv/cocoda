Cocoda can be installed on any web server. To create the set of static files, clone [the Cocoda repository](https://github.com/gbv/cocoda):

```bash
$ git clone https://github.com/gbv/cocoda.git
$ cd cododa
```

Then install required Node modules with [npm](https://www.npmjs.com/get-npm) and run build:

```bash
$ npm install
$ npm run build
```

Files are created in directory `dist` to be served with any web server.
