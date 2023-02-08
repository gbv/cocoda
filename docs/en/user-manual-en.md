---
date: 2023-02-08
...

## Manual is beeing reviewed currently

<!--
ToDos:
- kurz coli-rich (inkl. Verlinkung) und das Redaktionsverfahren der eingetragenen Mappings im K10plus (inkl. Pflege von Updates) beschreiben: ein Absatz zum Workflow - von der Erstellung von Mappings bis zur Anreicherung via coli-rich; DA und dann die Redaktionsverfahren
- Alte Screenshots löschen: 
  - ![](img/cocoda-login1-en.png)
  - ![](img/cocoda-settings-account1-en.png)
  - ![](img/cocoda-settings-account2-en.png)
  - ![](img/cocoda-loginserver-en.png)
  - ![](img/cocoda-homepage2-en.png)
  - ![](img/cocoda-classdet-en.png)
  - ![](img/cocoda-concdet-en.png)
  - ![](img/cocoda-conctree-en.png)
-->

## Introduction

This manual gives a brief introduction to the main components of Cocoda. The web application for creating and managing mappings between knowledge organization systems (classifications, standards data, thesauri...) is maintained as part of the [coli-conc project](https://coli-conc.gbv.de/) at the [Head Office of the GBV Common Library Network (VZG)](https://en.gbv.de/). Cocoda use cases range from mapping own classifications to more established vocabularies, to creating mappings to improve retrieval in catalogs and discovery systems, to collecting mappings in Wikidata as a central hub for standards data.

Several tutorials, screencasts, and variously configured instances of Cocoda are linked at <https://coli-conc.gbv.de/cocoda/>, including:

* the current release version: <https://coli-conc.gbv.de/cocoda/app/>
* the current development version: <https://coli-conc.gbv.de/cocoda/dev/>

Depending on the configuration of the Cocoda instance, some of the features described here may not be available.

## User Interface
Firefox or Chromium is recommended as the browser and a screen with at least Full HD resolution (1920×1080). The user interface can be customized via the [settings](#settings); among other things, the language can be changed.

The **menu bar** contains (depending on the configuration):

* Logo and name of the respective Cocoda instance
* ![](img/icons/exchange.svg){height=1em} Left-right arrows to change the mapping direction
* Links to imprint, privacy policy, manual and feedback option
* ![](img/icons/trash.svg){height=1em} Trash can to view and restore last deleted mappings
* ![](img/icons/star.svg){height=1em} Quick selection of remembered concepts
* ![](img/icons/user-solid.svg){height=1em} [User account](#user-accounts) and name. After successful login, the username is highlighted in bold and quick selection can be used to change identity for saving [mappings](#) and [ratings](#)
* ![](img/icons/gear-solid.svg){height=1em} [Settings](#) with quick selection of the [database](#) into which mappings and ratings are saved

The rest of the screen is divided into three areas with several **components**:

* Components for selecting [vocabularies and concepts](#) Left and Right.
* Components for selecting, creating, and editing [mappings](#) in the middle.

When Cocoda is started, initially only the components for [vocabulary selection](#vocabularies-selection) are open while general notes are displayed in the center. The size of individual components can be changed with the dots or, the minimize icon hides a component. In addition, some components have icons in the lower right corner:

* Setting the behavior of the component
* Detailed view of the data and sources displayed in a component

## User accounts

In principle, Cocoda does not manage its own user accounts. The [settings](#settings) are therefore also only stored in the browser. Existing accounts with external services can be used for login:

* ORCID
* Wikimedia (Wikipedia, Wikidata...)
* GitHub
* StackExchange
* LDAP (only VZG internal)

These external accounts are called **Identities** in Cocoda. The identity selected in each case and the corresponding username are displayed in the [menu bar](#user interface) after successful login and can be changed there. Further details can be viewed in the [settings](#preferences) under "Account". Users can decide for themselves whether and with which identity Cocoda stores user contributions for public viewing:

* If the personal assignment of contributions is not desired, the default identity should be selected. In this case, an account identifier is used whose assignment to identities is only visible to the administrators of the mapping database at VZG. In addition, a pseudonym should be assigned as a name.
* If one of the other identities is selected, the user can be publicly identified by the identity URI.

![](img/cocoda-login-select-identity-en.png){width=50% .border .border-dark}

If mappings should not be publicly viewable at all, mappings can also be saved locally in your own browser without login. However, this feature is disabled in some Cocoda instances for the sake of clarity.

<!--
Evtl. kurz eräutern, was beim Löschen des Accounts passiert: welche Daten bleiben, welche werden geölscht.
-->

## Concept schemes and concepts

Cocoda provides unified access to a variety of **concept schemes** (or just **schemes**) like ontologies, (controlled) vocabularies, taxonomies, and terminologies from different [data sources](#data-sources). A concept scheme is an organized collection of concepts with additional information about the concept scheme. A **concept** is an individual object such as a person, a place, or a topic. Most concepts have at least a unique preferred label, a unique notation, and a globally unique URI.
Cocoda recommends all concept schemes to be registered in the [Basic Register of Thesauri, Ontologies & Classifications (BARTOC)](https://BARTOC.org) and to use its identifiers to uniquely refer to indivial concept schemes. For instance, the Dewey Decimal Classification (DDC) is a concept scheme of type universal library classification, published by OCLC and registered in BARTOC with URI <http://bartoc.org/en/node/241>.

The display of concept schemes and concepts on the left and right side respectively consists of components for:

* [selection of source or target scheme](#scheme-selection)
* [view information about a selected scheme](#scheme-details)
* [Search for concepts in the selected scheme](#search-for-concepts)
* [view information about a selected concept](#concept-details)
* [hierarchical browsing in selected scheme](#treeview) (if available)
* [view concept lists](#listview) (if available).

### Scheme selection

The selection of a scheme is possible via title search and via the vocabulary list. The filter icon ![](img/icons/filter.svg){height=1em} can be used to limit the list by source, language, vocabulary type, favorites and only vocabularies with concepts. If the filter icon is marked with a dot, a filter is active. With the plant ![](img/icons/seedling-solid.svg){height=1em} a vocabulary can be selected or deselected as a favorite. Favorites are always displayed first. After selecting a vocabulary, a search field appears and information about the vocabulary is displayed. With the cross ![](img/icons/times-circle.svg){height=1em} behind the scheme name the scheme can be deselected. For quick access to the scheme selection there are keyboard shortcuts `Ctrl+Shift+f` (left) and `Ctrl+Shift+g` (right).

### Scheme details

This component displays scheme information like identifier, creation date, license, publisher, scheme types and [data source](#data-sources). If the [treeview](#treeview) is minimized, the top concepts are also displayed here. The link to ![](img/icons/external-link-square.svg){height=1em} existing mappings opens the [mapping search](#mapping-search).

![](img/cocoda-classdet-en.png){width=50% .border .border-dark}

### Search for concepts

In the search field concepts can be searched for by notations or by label. It is possible to configure this component to fill in the label of the selected concept in the search field on the opposite site automatically. Some schemes offer the option to filter concepts by type: in such a case a special icon ![](img/icons/filter.svg){height=1em} is displayed in the search field. There are shortcuts to activate the search for concepts briefly: `Ctrl+f` (left scheme) und `Ctrl+g` (right scheme).

It is also possible to select concepts although there is no concept with the given notation in this scheme. This can be done by searching with a syntactically correct notation. These concepts are marked with a red dot (<span style="color: red;">•</span>).

### Concept details

After selecting a concept, information about the selected concept is displayed instead of [vocabulary details](#vocabularydetails). Besides superclasses and subclasses (if available):

<!--rewrite next section after changing tab labels
-->

* Info: metadata like identifier and modification date.
* Designations: Preferred and alternative designations.
* Scope/Editorial: usage notes and descriptions
* Links: Links in other databases (Wikipedia, K0plus...).

The star ![](img/icons/star.svg){height=1em} adds or removes the concept from the quick selection list.
The plus sign ![](img/icons/plus-circle.svg){height=1em} is used to add the concept to the [Mapping Editor](#).
The arrow ![](img/icons/arrow-right.svg){height=1em} selects the next concept in the [tree view](#treeview) or from the currently selected [list](#listview). For quick switching there are keyboard shortcuts `Alt+n` (left) and `Alt+m` (right) for this action.

![](img/cocoda-concdet-de.png){width=55% .border .border-dark .center}

### Treeview

In addition to browsing via [scheme details](#scheme-details) and [concept details](#concept-details) tree view ![](img/icons/sitemap-solid.svg){height=1em} is provided for monohierarchical schemes.

![](img/cocoda-conctree-de.png){width=50% .border .border-dark .center}

### Listview

Instead of the tree view, a popup ![](img/icons/angle-up-solid.svg){height=1em} can be used to select the list of quick selection concepts ![](img/icons/star.svg){height=1em} and, depending on the configuration, additional concept lists ![](img/icons/list-solid.svg){height=1em}. Additional lists are updated only by reloading them with the refresh icon ![](img/icons/sync-alt-solid.svg){height=1em}.

## Mappings
The central part of the user interface shows multiple cards to create, modify, browse, and evaluate mappings. A **mapping** is a directed connection between one concepts and one or more concepts from another concept scheme (more complex mappings may be supported in a later release).

Mappings can be managed with:

* a **mapping editor** to create and modify individual mappings

* a **mapping browser** that lists existing mappings (from local storage or a mapping provider) as well as mapping recommendations (currently occurrences and co-occurrences of selected concepts)

### Mapping Editor

To add a concept to the mapping, you first have to select the concept (by clicking on it in the tree view, detail view, or anywhere else) and then clicking the plus (+) button on the bottom of the mapping editor (alternatively you can click the (+) button next to the concept in the detail card). You can also quickly add concepts from the tree view by clicking on the small plus button on the right of the concepts. Additionally, you can just drag and drop concepts into the Mapping Editor. In the middle of the mapping editor, you can choose the type of the mapping (exact match, close match, broader match, narrower match, related match, or mapping relation). At the bottom of the card, there are different action buttons for saving a mapping, deleting a mapping, clearing the editor, and exporting the mapping (in that order). The faint background of the card depicts whether the current mapping is saved (green) or not yet saved (red). As of now, you can only save a mapping locally in your browser. In the future, you will be able to authenticate and contribute mappings to a database.

![](img/cocoda-mappingeditor-en.png)

### Mapping Browser

The mapping browser shows existing mappings as well as mapping recommendations for selected concepts from the source and target schemes. At the top of the card, it is possible to select and deselect different sources. Currently available are:

- Local: mappings saved in local storage.
- Registry: the Coli-conc registry which contains all mappings listed [here](http://coli-conc.gbv.de/concordances/).
- Occurrences: mapping recommendations based on occurrences and co-occurrences of the selected concepts with other concepts from a library catalog. Right now, it takes the data from the [GVK](https://gso.gbv.de/), but in the future it will be possible to choose from several catalogs. Clicking on the number of occurrences will open a link to the catalog.

<!--By default, it will show mappings to/from all schemes no matter which scheme is selected on the other side, but you can restrict this by changing the option in the bottom right from "Show All Mappings" to "Show Only Mappings to Selected Scheme". -->

For each mapping or mapping recommendation, there are some available actions on the right of each row:
- Edit: saves the mapping or recommendation to local storage and loads it into MappingEditor for editing.
- Save: saves the mapping or recommendation to local storage (not available for local mappings or if it's already in local storage).
- Delete: deletes a mapping (currently only available for local mappings).


## Registries
A **registry** is an individual source of data about [concept schemes](#concept-schemes), [concepts](#concepts), [mappings](#mappings) etc. An example is the public [concordance registry](http://coli-conc.gbv.de/concordances/) with concordances and mappings collected in project coli-conc.

Registries can be configured via the `registries` field in the [configuration](#configuration). The technical access to data from a registry is implemented via [providers](#providers).

Configured mapping registries can be enabled and disabled in the mapping browser to show or hide their mappings.


## Settings
In the settings at the tab 'Layout' you can change the handling of the site or the language.

![](img/cocoda-settings-layout-en.png)

At the tab 'Keyboard Shortcuts' you can check out keyboard-shortcuts 

![](img/cocoda-settings-keysho-en.png)

At the tab 'Data Sources' you can get an overview of all sources of the cocoda-data

![](img/cocoda-settings-datsor-en.png)

At the tab 'Local Mappings' you can upload, download delete and rewrite the creator of the local mappings (Local Mappings are only saved in your browser).

![](img/cocoda-settings-locmap-en.png)
