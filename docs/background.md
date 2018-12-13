The web application is build with [Vue](https://vuejs.org/), based on independent [components](#components). Data is processed and communicated with backend services in [JSKOS data format for Knowledge Organization Systems](https://gbv.github.io/jskos/) via [providers](#providers).

Core entities of JSKOS relevant to Cocoda are:

* **Concept Schemes** are classifications, thesauri, authority files or other kinds of knowledge organization systems (see [concept schemes](#concept-schemes) in the user manual).
* **Concepts** are conceptual entity in a concept scheme, for instance a class in a classification or a record in an authority file (see [concepts](#concepts) in the user manual).
* **Concept Mappings** are directed connections between concepts from two concept schemes (see [mappings](#mappings) in the user manual)
* **Concordances** are collections of mappings between two concepts schemes.
* **Concept Occurrences** give the number of times one or more concepts are used, for instance in a specific database.

