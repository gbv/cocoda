Software documentation and user manuals in multiple languages are located in directory `doc` written in Markdown. The documents are automatically published from the `dev` branch:

* [Software documentation](https://gbv.github.io/cocoda/)
* [English user manual](https://gbv.github.io/cocoda/dev/user-manual-en.html)
* [German user manual](https://gbv.github.io/cocoda/dev/user-manual-de.html)

To build the software documentation:

~~~sh
npm run styleguide
~~~

To build the user manuals:

~~~sh
npm run build-info
npm run user-manual
~~~
