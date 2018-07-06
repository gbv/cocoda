The web application is build with [Vue](https://vuejs.org/), based on independent [components](#components). Data is processed and communicated with backend services in [JSKOS data format for Knowledge Organization Systems](https://gbv.github.io/jskos/). Core entities of JSKOS are:

* **Concept Schemes** are classifications, thesauri, authority files or other kinds of knowledge organization systems.
* **Concepts** are conceptual entity in a concept scheme, for instance a class in a classification or a record in an authority file.
* **Concept Mappings** are directed connections between concepts from two concept schemes.
* **Concordances** are collections of mappings between two concepts schemes.
* **Concept Occurrences** give the number of times one or more concepts are used, for instance in a specific database.

Backend services include:

* **Terminology Providers** such as <https://api.dante.gbv.de/> provide
  information about concept schemes and concepts.
* **Mapping Providers** can be queried for existing mappings and mapping recommendations.
* **Mapping Repositories** allow creation, modification, and annotation of new mappings.
* **Occurrence Providers** can be queried for usage statistics of concepts in collections.
* **Identity Providers** manage user accounts and provide access tokens via OAuth2.
