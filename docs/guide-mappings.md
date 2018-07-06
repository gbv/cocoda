The central part of the user interface shows multiple panes to create, modify, browse, and evaluate mappings. A **mapping** is a directed connection between one concepts and one or more concepts from another concept scheme (more complex mappings may be supported in a later release).

Mappings can be managed with:

* a **mapping editor** to create and modify individual mappings

* a **mapping browser** that lists existing mappings

* an **occurrences browser** that lists occurrences and co-occurrences of selected concepts as mapping recommendations

### Mapping Editor

To add a concept to the mapping, you first have to select the concept (by clicking on it in the tree view, detail view, or anywhere else) and then clicking the plus (+) button on the bottom of the mapping editor. You can also quickly add concepts from the tree view by clicking on the small plus button on the right of the concepts. In the middle of the mapping editor, you can choose the type of the mapping (exact match, close match, broader match, narrower match, related match, or mapping relation). As of now, it is not possible yet to save this mapping.

### Mapping Browser

The mapping browser shows exisiting mappings for selected concepts from source and target scheme. Right now, these mappings are loaded from a single database consisting all mappings from [here](http://coli-conc.gbv.de/concordances/), but in the future, multiple mapping providers as well as local storage for mappings will be supported. By default, it will show mappings to/from all schemes no matter which scheme is selected on the other side, but you can restrict this by changing the option in the bottom right from "Show All Mappings" to "Show Only Mappings to Selected Scheme". You can edit an existing mapping by clicking on the edit button at the far right of a row.

### Occurrences Browser

The occurrences browser shows both occurrences of the selected concepts and co-occurrences with other concepts from a library catalog. Right now, it takes the data from the [GVK](https://gso.gbv.de/), but in the future it will be possible to choose from several catalogs. For single concept occurrences, the concept is listed alone in a row, for co-occurrences two concepts whose notations are used together are listed together in one row. Clicking on the number of occurrences will open a link to the catalog. By clicking on the button at the far right of a row, you can convert a co-occurrence into a mapping to be shown in the mapping editor.
