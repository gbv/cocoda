The central part of the user interface shows multiple panes to create, modify, browse, and evaluate mappings. A **mapping** is a directed connection between one concepts and one or more concepts from another concept scheme (more complex mappings may be supported in a later release).

Mappings can be managed with:

* a **mapping editor** to create and modify individual mappings

* a **mapping browser** that lists existing mappings (from local storage or a mapping provider) as well as mapping recommendations (currently occurrences and co-occurrences of selected concepts)

### Mapping Editor

To add a concept to the mapping, you first have to select the concept (by clicking on it in the tree view, detail view, or anywhere else) and then clicking the plus (+) button on the bottom of the mapping editor (alternatively you can click the (+) button next to the concept in the detail pane). You can also quickly add concepts from the tree view by clicking on the small plus button on the right of the concepts. Additionally, you can just drag and drop concepts into the Mapping Editor. In the middle of the mapping editor, you can choose the type of the mapping (exact match, close match, broader match, narrower match, related match, or mapping relation). At the bottom of the pane, there are different action buttons for saving a mapping, deleting a mapping, clearing the editor, and exporting the mapping (in that order). The faint background of the pane depicts whether the current mapping is saved (green) or not yet saved (red). As of now, you can only save a mapping locally in your browser. In the future, you will be able to authenticate and contribute mappings to a database.

### Mapping Browser

The mapping browser shows existing mappings as well as mapping recommendations for selected concepts from the source and target schemes. At the top of the pane, it is possible to select and deselect different sources. Currently available are:

- Local: mappings saved in local storage.
- Registry: the Coli-conc registry which contains all mappings listed [here](http://coli-conc.gbv.de/concordances/).
- Occurrences: mapping recommendations based on occurrences and co-occurrences of the selected concepts with other concepts from a library catalog. Right now, it takes the data from the [GVK](https://gso.gbv.de/), but in the future it will be possible to choose from several catalogs. Clicking on the number of occurrences will open a link to the catalog.

<!--By default, it will show mappings to/from all schemes no matter which scheme is selected on the other side, but you can restrict this by changing the option in the bottom right from "Show All Mappings" to "Show Only Mappings to Selected Scheme". -->

For each mapping or mapping recommendation, there are some available actions on the right of each row:
- Edit: saves the mapping or recommendation to local storage and loads it into MappingEditor for editing.
- Save: saves the mapping or recommendation to local storage (not available for local mappings or if it's already in local storage).
- Delete: deletes a mapping (currently only available for local mappings).
