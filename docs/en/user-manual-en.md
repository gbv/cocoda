<!-- Note: Remember to transfer changes related to the actual content of the manual to the German version as well. -->

## Introduction

This manual gives a brief introduction to the main components of Cocoda. The web application for creating and managing mappings between knowledge organization systems (classifications, authorities, thesauri...) is maintained as part of the [coli-conc project](https://coli-conc.gbv.de/) at the [Head Office of the GBV Common Library Network (VZG)](https://en.gbv.de/). Cocoda use cases range from mapping own classifications to more established vocabularies, to creating mappings to improve retrieval in catalogs and discovery systems, to collecting mappings in Wikidata as a central hub for authorities.

Several tutorials, screencasts, and variously configured instances of Cocoda are linked at <https://coli-conc.gbv.de/cocoda/>, including:

* the current release version: <https://coli-conc.gbv.de/cocoda/app/>
* the current development version: <https://coli-conc.gbv.de/cocoda/dev/>

Depending on the configuration of the Cocoda instance, some of the features described here may not be available.

## User Interface

It is recommended to use Firefox or Chromium (Google Chrome, Microsoft Edge, or similar) as the browser and a screen with at least full HD resolution (1920×1080). The user interface can be customized via the [settings](#settings); among other things, the language can be changed.

The **menu bar** contains (depending on the configuration):

* Logo and name of the respective Cocoda instance
* ![](img/icons/exchange.svg){height=1em} Left-right arrows to change the mapping direction
* Links to imprint, privacy policy, manual and feedback option
* ![](img/icons/trash.svg){height=1em} Trash to view and restore last deleted mappings
* ![](img/icons/star.svg){height=1em} Quick selection of remembered concepts
* ![](img/icons/user-solid.svg){height=1em} [User account](#user-accounts) and name. After successful login, the username is highlighted in bold and quick selection can be used to change identity for saving [mappings](#mappings) and [ratings](#ratings)
* ![](img/icons/gear-solid.svg){height=1em} [Settings](#settings) with quick selection of the [database](#mapping-databases) into which mappings and ratings are saved

The rest of the screen is divided into three areas with several **components**:

* Components for selecting [concept schemes and concepts](#concept-schemes-and-concepts) left and right.
* Components for selecting, creating, and editing [mappings](#mappings) in the middle.

When Cocoda is started, initially only the components for [scheme selection](#scheme-selection) are open while general notes are displayed in the center. The size of individual components can be changed with the dots ![](img/icons/ellipsis-v.svg){height=1em} or ![](img/icons/ellipsis-h.svg){height=1em}; the minimize icon ![](img/icons/window-minimize.svg){height=1em} hides a component. In addition, some components have icons in the lower right corner:

* ![](img/icons/gear-solid.svg){height=1em} Setting the behavior of the component
* ![](img/icons/code.svg){height=1em} Detailed view of the [data and sources](#export-and-import) displayed in a component

## User Accounts

In principle, Cocoda does not manage its own user accounts. The [settings](#settings) are therefore only stored in the browser. Existing accounts with external services can be used for login:

* ORCID
* Wikimedia (Wikipedia, Wikidata...)
* GitHub
* StackExchange
* LDAP (only VZG internal)

These external accounts are called **Identities** in Cocoda. The selected identity and corresponding username are displayed in the [menu bar](#user-interface) after successful login and can be changed there. Further details can be viewed in the [settings](#settings) under "Account". Users can decide for themselves whether and with which identity Cocoda stores user contributions for public viewing:

* If the personal assignment of contributions is not desired, the default identity should be selected. In this case, an account identifier is used whose assignment to identities is only visible to the administrators of the mapping database at VZG. In addition, a pseudonym should be assigned as a name.
* If one of the other identities is selected, the user can be publicly identified by the identity URI.

![](img/cocoda-login-select-identity-en.png){width=50% .border .border-dark}

The stored account data can be viewed on the account page at the bottom under "My Data". With "Delete User Account", this data can be irrevocably deleted from our database. This does **not** apply to data related to this account data (mappings, ratings, etc.).

If mappings should not be publicly viewable at all, mappings can also be saved locally in the own browser without login. However, this feature is disabled in some Cocoda instances for the sake of clarity.

## Concept Schemes and Concepts

Cocoda provides unified access to a variety of **concept schemes** (or just **schemes**) like ontologies, (controlled) vocabularies, taxonomies, and terminologies from different [data sources](#data-sources). A concept scheme is an organized collection of concepts with additional information about the concept scheme. A **concept** is an individual object such as a person, a place, or a topic. Most concepts have at least a unique preferred label, a unique notation, and a globally unique URI.

Cocoda recommends all concept schemes to be registered in the [Basic Register of Thesauri, Ontologies & Classifications (BARTOC)](https://BARTOC.org) and to use its identifiers to uniquely refer to indivial concept schemes. For instance, the Dewey Decimal Classification (DDC) is a concept scheme of type universal library classification, published by OCLC and registered in BARTOC with URI <http://bartoc.org/en/node/241>.

The display of concept schemes and concepts on the left and right side respectively consists of components for:

* [Selection of source or target scheme](#scheme-selection)
* [View information about a selected scheme](#scheme-details)
* [Search for concepts in the selected scheme](#search-for-concepts)
* [View information about a selected concept](#concept-details)
* [Hierarchical browsing in selected scheme](#tree-view) (if available)
* [View concept lists](#list-view) (if available).

### Scheme Selection

The selection of a scheme is possible via title search and via the vocabulary list. The filter icon ![](img/icons/filter.svg){height=1em} can be used to limit the list by source, language, vocabulary type, favorites and only vocabularies with concepts. If the filter icon is marked with a dot, a filter is active. With the plant icon ![](img/icons/seedling-solid.svg){height=1em}, a vocabulary can be selected or deselected as a favorite. Favorites are always displayed first. After selecting a vocabulary, a search field appears and information about the vocabulary is displayed. With the cross ![](img/icons/times-circle.svg){height=1em} behind the scheme name, the scheme can be deselected. For quick access to the scheme selection there are keyboard shortcuts `Ctrl+Shift+f` (left) and `Ctrl+Shift+g` (right).

### Scheme Details

This component displays scheme information like identifier, creation date, license, publisher, scheme types and [data source](#data-sources). If the [tree view](#tree-view) is minimized, the top concepts are also displayed here. The link to ![](img/icons/external-link-square.svg){height=1em} existing mappings opens the [mapping search](#mapping-search).

![](img/cocoda-classdet-en.png){width=50% .border .border-dark}

### Search For Concepts

In the search field concepts can be searched by notations or by label. It is possible to configure this component to fill in the label of the selected concept in the search field on the opposite site automatically. Some schemes offer the option to filter concepts by type: in such a case a special icon ![](img/icons/filter.svg){height=1em} is displayed in the search field. There are shortcuts to activate the search for concepts quickly: `Ctrl+f` (left scheme) und `Ctrl+g` (right scheme).

It is also possible to select concepts even if there is no concept with the given notation in this scheme. This can be done by searching with a syntactically correct notation. These concepts are marked with a red dot (<span style="color: red;">•</span>).

### Concept Details

After selecting a concept, information about the selected concept is displayed instead of [scheme details](#scheme-details). Besides ancestor and narrower concepts, the following tabs with data about the concept are shown (if available):

* Concept: Preferred and alternative labels, register terms, usage notes, descriptions, etc. (in the selected vocabulary language as well as English, if applicable)
* Translations: Information from "Concept" in other languages, if available
* Meta: Metadata such as URI, identifier, and modified date
* Links: Links to other databases (Wikipedia, K0plus...)

The star ![](img/icons/star.svg){height=1em} adds or removes the concept from the quick selection list.
The plus sign ![](img/icons/plus-circle.svg){height=1em} is used to add the concept to the [Mapping Editor](#mapping-editor).
The arrow ![](img/icons/arrow-right.svg){height=1em} selects the next concept in the [tree view](#tree-view) or from the currently selected [list](#list-view). For quick switching there are keyboard shortcuts `Alt+n` (left) and `Alt+m` (right) for this action.

![](img/cocoda-concdet-de.png){width=55% .border .border-dark .center}

### Tree View

In addition to browsing via [scheme details](#scheme-details) and [concept details](#concept-details), a hierarchical tree view ![](img/icons/sitemap-solid.svg){height=1em} is provided for monohierarchical schemes.

![](img/cocoda-conctree-de.png){width=50% .border .border-dark .center}

### List View

Instead of the tree view, a popup ![](img/icons/angle-up-solid.svg){height=1em} can be used to select the list of quick selection concepts ![](img/icons/star.svg){height=1em} and, depending on the configuration, additional concept lists ![](img/icons/list-solid.svg){height=1em}. Additional lists are updated only by reloading them with the refresh icon ![](img/icons/sync-alt-solid.svg){height=1em}.

## Mappings

The main task of Cocoda is to create, edit, search, and evaluate mappings. A mapping is a directed connection between a concept from one scheme and one or more concepts from another scheme. To select, create, and edit mappings, two components are provided in the center of the user interface:

* [Mapping Editor](#mapping-editor) for creating and editing mappings.
* Mapping Browser consisting of areas for [Concordances](#concordances), [Search](#mapping-search) and [Navigator](#mapping-navigator) for searching, browsing, and rating mappings and showing mapping suggestions.

Mappings can also be assigned [ratings](#ratings) depending on the configuration. Mappings and ratings can be stored in different [mapping databases](#mapping-databases).

### Mapping Editor

The Mapping Editor is used for detailed editing of a mapping. For this purpose, concepts can be dragged and dropped into the Mapping Editor or taken over from the left or right side with the plus icon ![](img/icons/plus-circle.svg){height=1em}. There are also keyboard shortcuts (`Ctrl+a` or `Ctrl+d`) for taking over the respective selected concept. With the cross ![](img/icons/times-circle.svg){height=1em}, a concept can be removed from the Mapping Editor.

In the editor settings ![](img/icons/gear-solid.svg){height=1em}, you can specify that only 1-to-1 mappings are allowed; otherwise a concept can also be mapped to a combination of several target concepts (AND operation). For multiple alternative target concepts (OR-link), multiple mappings should be created instead. Furthermore, null mappings are possible if a concept has no equivalent in the target vocabulary.

In the middle of the editor, the relation of mapping can be selected. The following **mapping relations** are available for selection:

* **=** exact match: same meaning.
* **≈** close match: same general idea but not fully identical meaning
* **>** more general meaning (e.g. ancestor to narrower).
* **<** more specific meaning (e.g. part-whole relationship).
* **~** related, associative link
* **→** general mapping relation with unknown context

On the bottom right, depending on the authorization, a concordance can be selected into which the mapping should be saved. At the bottom left, it is shown if and in which [database](#mapping-databases) a mapping has been saved or will be saved. At the bottom of the editor the following actions are available:

* **±0** Evaluate mapping
* ![](img/icons/exchange.svg){height=1em} Swap source and target of mapping
* ![](img/icons/save.svg){height=1em} Save mapping (keyboard shortcut `Ctrl+s`)
* ![](img/icons/trash.svg){height=1em} Delete mapping
* ![](img/icons/clone-solid.svg){height=1em} Duplicate mapping to create a new mapping with the same content
* ![](img/icons/ban.svg){height=1em} Empty/clear Mapping Editor to create a new mapping (`Ctrl+Shift+c`)

After saving, the editor will be emptied to avoid overwriting the saved mapping; this behavior can be changed in the editor settings ![](img/icons/gear-solid.svg){height=1em}.

If mapping hints are configured for the selected source and target vocabulary combinations, they will be accessible via a help info ![](img/icons/question-circle.svg){height=1em}.

### Concordances

The first pane of the Mapping Browser component lists concordances where mappings have been collected in a coordinated fashion.^[See also <http://coli-conc.gbv.de/concordances/> for an overview] The concordances can be filtered by source and target vocabulary and by publisher. The link icon ![](img/icons/external-link-square.svg){height=1em} opens the [Mapping Search] with a filter on the respective concordance. Depending on the permission, new concordances can be created with ![](img/icons/square-plus-solid.svg){height=1em} and edited with ![](img/icons/pen-to-square-solid.svg){height=1em}. With the info icon ![](img/icons/info-circle.svg){height=1em}, you get all information about the concordance.

![](img/cocoda-mapping-browser-con-en.png){width=100% .border .border-dark}

### Mapping Search

The Mapping Search provides a meta search for mappings in existing [data sources](#data-sources). The following filters can be specified in the first line of the search form:

* Source vocabulary
* Source notation or URI
* Target vocabulary
* Target notation or URI

Vocabularies and concepts can also be dragged and dropped into the search fields.

The lock icon ![](img/icons/lock-solid.svg){height=1em} or ![](img/icons/lock-open-solid.svg){height=1em} can be used to specify that the source or target vocabulary selected via [scheme selection](#scheme-selection) should always be used automatically. The filter icon ![](img/icons/filter.svg){height=1em} offers further search options:

* Author
* Mapping relation
* Bidirectional search
* Cardinality
* Rating
* Concordance
* [Mapping databases](#mapping-databases) to be searched in

If the search returns no or too few results, it may be that too many filters are set. The Clear button ![](img/icons/ban.svg){height=1em} resets all filters. The share icon ![](img/icons/share-alt-square-solid.svg){height=1em} contains the URL to the current search to bookmark or share it.

The results list is divided by data source and corresponds to the view in the Mapping Navigator. The individual sources can be shown or hidden by clicking on their name.

### Mapping Navigator

In the Mapping Navigator, mappings and mapping suggestions from various data sources are displayed that match the concepts selected on the left or right side. For which concepts and vocabularies mappings should be considered in the navigator can be defined in the settings. The individual data sources can be shown or hidden by clicking on their abbreviations. Data sources that can be written to are marked with a pen ![](img/icons/pencil-alt-solid.svg){height=1em}. For each mapping or mapping suggestion are displayed:

* Source vocabulary and concept
* Mapping relation
* Target vocabulary and concept
* Created by whom and when

As well as depending on the settings:

* [Ratings](#ratings)
* ![](img/icons/edit.svg){height=1em} Edit mapping
* ![](img/icons/trash.svg){height=1em} Delete mapping
* ![](img/icons/info-circle.svg){height=1em} Detailed information about the mapping or suggestion
* ![](img/icons/clone-solid.svg){height=1em} Copy suggestion to mapping editor

For each mapping or mapping recommendation, there are some actions that can be performed on the right side:

- Show Mapping Details
- Edit: opens the mapping in the mapping editor
- Save: saves the mapping into the selected database
- Delete: deletes a mapping

A database is an individual data source about vocabularies, concepts, mappings, etc. As an example, the public [Concordance Database](http://coli-conc.gbv.de/concordances/) contains all concordances and mappings collected within the coli-conc project. Databases can be configured through the [Mapping Navigator](#databases) tab. Technical access to these databases is handled by providers.

Some databases can be turned on and off in the Mapping Browser to hide their mappings.

### Ratings

Basically two types of ratings are possible, whereby it depends on the configuration who can give which ratings:

* Rating by approval ![](img/icons/thumbs-up.svg){height=1em} or disagreement ![](img/icons/thumbs-down.svg){height=1em}
* Evaluation by confirmation ![](img/icons/check.svg){height=1em} (usually only for selected accounts)

Approvals and rejections are rated as `+1` and `-1` respectively, and their sum is displayed. For approvals *one* rating is enough for a checkmark ![](img/icons/check.svg){height=1em} to be displayed instead of the sum. All ratings are user related. So it is visible who has given which rating and when. Own evaluations can be removed again.

## Settings

A click on the user name in the [menu bar](#user-interface) opens the settings. In addition, some components can be configured with the icon ![](img/icons/gear-solid.svg){height=1em}. Since Cocoda does not manage [user accounts](#user-accounts), the settings are only stored locally in the browser. The settings are divided into different sections:

* Account: Identity for storing [mappings](#mappings) and [ratings](#ratings)
* Data Sources: Overview of all available [data sources](#data-sources)
* Interface: Settings for the [user interface](#user-interface) like the language
* Keyboard shortcuts: Available keyboard shortcuts
* My Data: Import and export mappings

[menu bar]: #user-interface

## Data Sources

Cocoda, as a pure web application, accesses all information via web interfaces (APIs). The data and API calls are each accessible via the source code icon ![](img/icons/code.svg){height=1em}. The data sources configured per instance can be viewed in the settings.

### Mapping Databases

[database]: #mapping-databases

Mapping databases are used to store [mappings](#mappings) and [ratings](#ratings). The database selected in each case is highlighted and can be selected via the settings or by clicking on the name of the database in the mapping browser. Most instances contain these databases:

* **L** Local: Mappings are stored in the browser.
* **C** Concordance Register: public database of all mappings and assessments collected in the coli-conc project.
* **W** Wikidata mappings: read and write access to mappings in Wikidata.

### Other Data Sources

Vocabularies and mapping suggestions can be included in a Cocoda instance via JSKOS API, via Skosmos API, and via OpenRefine Reconciliation API. Adding additional data sources via the user interface is not possible yet.

### Export and Import

[JSKOS]: https://gbv.github.io/jskos/jskos.html

To export data from Cocoda, use the source icon ![](img/icons/code.svg){height=1em}. The [JSKOS] data can be downloaded in various formats such as CSV and JSON. Partial API calls are also available to retrieve the data.

Additional vocabularies, mappings and mapping suggestions can be included in the application by configuring a Cocoda instance accordingly. Please contact us if you have any questions about this (<http://coli-conc.gbv.de/contact/>).

Mass import of mappings via the web interface is so far only possible in the **L** Local database.

<!--coli-rich-->

## Further information

More information, tutorials, screencasts, and more can be found via the project homepage <https://coli-conc.gbv.de/>. For questions and feedback about the software, it is best to use the [GitHub issue tracker](https://github.com/gbv/cocoda/issues).

The icons used in Cocoda are from [fontawesome](https://fontawesome.com/) and are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
