## Einleitung

Cococda ist eine freie Webanwendung, zur Erstellung und Verwaltung von **Mappings zwischen Wissensorganisationssystemen** (Klassifikationen, Normdaten, Thesauri...). Sie wird als ein Teil des [coli-conc-Projekts](https://coli-conc.gbv.de/) an der [Verbundzentrale des GBV (VZG)](https://www.gbv.de/) entwickelt und [als DFG-Projekt](http://Startbildschirmgepris.dfg.de/gepris/projekt/276843344) gefördert. Unter <https://coli-conc.gbv.de/cocoda/> sind mehrere Anleitungen, Screencasts sowie verschiedene Instanzen von Cocoda verlinkt, darunter:

* Die aktuelle Release-Version: <https://coli-conc.gbv.de/cocoda/app/>
* Die aktuelle Entwicklungsversion: <https://coli-conc.gbv.de/cocoda/dev/>
* Eine auf RVK-Mapping reduzierte Version: <https://coli-conc.gbv.de/cocoda/rvk/>
* Eine auf Wikidata-Mapping reduzierte Version: <https://coli-conc.gbv.de/cocoda/wikidata/>

Diese Anleitung gibt eine kurze Einführung in die wichtigsten Bestandteile von Cocoda. Für Fragen und Rückmeldungen zur Software benutzen Sie am Besten den [GitHub IssueTracker](https://github.com/gbv/cocoda/issues).

## Benutzeroberfläche

Cocoda sollte mit jedem modernen Webbrowser funktionieren (zumindest Firefox und Chromium). Der Bildschirm sollte mindestens HD-Auflösung (1366×768), besser Full HD (1920×1080) oder mehr haben. Die Benutzeroberfläche besteht aus einer [Menüleiste] und mehreren [Komponenten]. In den [Einstellungen] kann die Benutzeroberfläche angepasst werden; unter Anderem lässt sich die Sprache ändern.

### Menüleiste

Die Menüleiste enthält (von links nach rechts):

* Logo und Name der jeweiligen Cocoda-Instanz
* Links auf Impressum, Datenschutzerklärung, Anleitung und Feedback-Möglichkeit
* ![](img/icons/star.svg){height=1em} Schnellauswahl von gemerkten Konzepten
* Login-Status und Benutzername (siehe [Benutzeraccounts]) mit Zugriff auf [Einstellungen]:
    * Login/Logout
    * Auswahl der Identität zur Speicherung von [Mappings] und [Bewertungen](#mapping-bewertungen)
    * Schnellauswahl weiterer Einstellungen
    * Cocoda-Version und Link auf Code-Repository bei GitHub
* Icon der ausgewählten Registry, in die Mappings gespeichert werden (mit Auswahllliste)
 
Außerdem tauchen bei Bedarf folgende Icons auf: 

* ![](img/icons/trash.svg){height=1em} Mülleimer zur Ansicht und zum Wiederherstellen der zuletzt gelöschten Mappings
* ![](img/icons/exchange.svg){height=1em} Links-Rechts-Pfeile zum Wechseln der Mapping-Richtung

### Komponenten

Der gesamte Bildschirm ist in drei Bereiche aufgeteilt:

* auf der linken und rechte Seite sind Komponenten zur Auswahl von [Vokabularen und Konzepten](#vokabulare-und-konzepte)
* in der Mitte sind Komponenten zur Auswahl, Erstellung und Bearbeitung von [Mappings]

Beim Start von Cocoda sind zunächst nur die Komponenten zur [Vokabularauswahl] links und rechts geöffnet während in der Mitte allgemeine Hinweise angezeigt werden können.

Die Komponenten können je nach Bedarf angepasst werden: ihre Größe lässt sich mit den drei Punkten ![](img/icons/ellipsis-v.svg){height=1em} bzw. ![](img/icons/ellipsis-h.svg){height=1em} zwischen den Komponenten verändern, das Minimieren-Icon ![](img/icons/window-minimize.svg){height=1em} blendet eine Komponente aus. Das Verhalten einiger Komponenten ist über das Icon ![](img/icons/cog.svg){height=1em} in der unteren Rechten Ecke anpassbar. Das an verschiedenen Stellen auftauchende Quelltext-Icon ![](img/icons/code.svg){height=1em} öffnet jeweils eine Detailansicht der in der betreffenden Komponente dargestellten Daten und ihre [Quellen](#datenquellen).

## Benutzeraccounts

Grundätzlich verwaltet Cocoda keine eigenen Benutzeraccounts. Die [Einstellungen](#einstellungen) werden daher auch nur im Browser gespeichert. Zum Login können vorhandene Accounts bei folgenden Diensten verwendet werden:

* ORCID
* GitHub
* Wikimedia (Wikipedia, Wikidata...)
* StackExchange
* LDAP (nur VZG-intern)

Diese externen Benutzeraccounts heißen in Cocoda **Identitäten**. Die jeweils ausgewählte Identität und der dazugehörige Nutzername werden nach erfolgreichem Login in der [Menüleiste](#menüleiste) angezeigt und können dort gewechselt werden. Weitere Details sind in den [Einstellungen](#einstellungen) unter "Accounts" einsehbar. Ob und mit welcher Identität Cocoda Nutzerbeiträge öffentlich einsehbar abspeichert, können Nutzer selber entscheiden:

* Ist die personenbezogene Zuordnung von Beiträgen gewünscht, empfehlen wir ORCID- oder Wikimedia-Identitäten auszuwählen
* Andernfalls wird ein Account-Identifier verwendet dessen Zuordnung zu Identitäten nur den Adminstratoren der Mapping-Datenbank bei der VZG einsehbar ist

Ohne Login lassen sich Mappings nur lokal im eigenen Browser speichern. Diese Funktion ist der Übersichtlichkeit halber in einigen Cocoda-Instanzen allerdings abgestellt.


## Vokabulare und Konzepte

Cocoda ermöglicht den einheitlichen Zugriff auf eine Vielzahl von Vokabularen von unterschiedliche [Datenquellen](#datenquellen). Ein Vokabular besteht aus Konzepten und Informationen über das jeweilige Vokabular. Die Anzeige von Vokabularen und Konzepten auf der linken bzw. rechten Seite besteht aus Komponenten für:

* [Auswahl von Quell- bzw. Zielvokabular](#vokabularauswahl)
* [Ansicht von Informationen über ein ausgewähltes Vokabular](#vokabulardetails)
* [Suche nach Konzepten im ausgewählten Vokabular](#suche-nach-konzepten)
* [Ansicht von Informationen über ein ausgewähltes Konzept](#konzeptdetails)
* [hierarchisches Browsing im ausgewählten Vokabular](#baumansicht) (falls vorhanden)
* [Ansicht von Konzeptlisten](#listenansicht) (falls vorhanden)

<!--
Cocoda empfehlt, dass alle Vokabulare im [Basel Register of Thesauri, Ontologies & Classifications (BARTOC)](https://BARTOC.org) registriert werden und man diese Indentifier dann als Links benutzt um Vokabulare zu identifizieren. (Beispiel DDC: <http://bartoc.org/en/node/241>)
-->

### Vokabularauswahl

Die Auswahl eines Vokabular ist per Titelsuche und über die Vokabular-Liste möglich. Über das Filter-Icon ![](img/icons/filter.svg){height=1em} kann die Liste nach Quelle, Sprache, Vokabular-Typ und Favoriten eingeschränkt werden. Ist das Filter-Icon mit einem Punkt markiert so ist ein Filter aktiv. Mit dem Stern ![](img/icons/star.svg){height=1em} vor dem Namen lässt sich ein Vokabular als Favorit aus- bzw. abwählen. Die Favoriten werden immer zuerst angezeigt.  Nach Auswahl eines Vokabulars erscheint ein Suchfeld und es werden Informationen über das Vokabular angezeigt. Mit dem Kreuz ![](img/icons/times-circle.svg){height=1em} hinter dem Vokabularnamen lässt sich das Vokabular abwählen.  Zum schnellen Zugriff auf die Vokabularauswahl gibt es die Tastaturkürzel `Ctrl+Shift+f` (links) und `Ctrl+Shift+g` (rechts).

### Vokabulardetails

Diese Komponente zeigt Vokabular-Informationen wie Identifier, Erstellungsdatum, Lizenz, Herausgeber, Vokabulartypen und [Datenquelle](#datenquellen) an. Wenn die [Baumansicht](#baumansicht) minimiert ist, werden hier außerdem die Oberkonzepte angezeigt. Der Link auf ![](img/icons/external-link-square.svg){height=1em} vorhandene Mappings öffnet die [Mapping-Suche](#mapping-suche).
 
![](img/cocoda-classdet-de.png){width=50% .border .border-dark}

### Suche nach Konzepten

Im Suchfeld können Konzepte per Notationen oder Bezeichnung gesucht werden. Die Komponente lässt sich so einstellen, dass bei Auswahl eines Konzepts auf der gegenüberliegenden Seite autmatisch dessen Benennung im Suchfeld eingetragen wird. Einige Vokabulare bieten die Filterung nach Konzept-Typ an: in diesem Fall steht neben dem Suchschlitz ein Filter-Icon ![](img/icons/filter.svg){height=1em}. Zum schnellen Zugriff auf die Konzeptsuche gibt es die Tastaturkürzel `Ctrl+f` (links) und `Ctrl+g` (rechts).

### Konzeptdetails

Nach Auswahl eines Konzepts werden statt [Vokabulardetails](#vokabulardetails) Informationen zum ausgewählten Konzept angezeigt. Neben Ober- und Unterklassen (falls vorhanden) sind dies:

* Info: Metadaten wie Identifier und Änderungsdatum
* Bezeichnungen: Vorzungs- und Alternativbenennungen
* Scope/Editorial: Verwendungshinweise und Kommentare
* Suchlinks: konfigurierbare Links vom Konzept in andere Datenbanken (Wikipedia, K0plus...)

Der Stern ![](img/icons/star.svg){height=1em} fügt das Konzept zur eigenen Favoriten hinzu bzw. entfernt es aus der Favoriten-Liste.
Das Plus-Zeichen ![](img/icons/plus-circle.svg){height=1em} dient dazu das Konzept in den [Mapping-Editor](#mapping-editor) zu übernehmen.
Der Pfeil ![](img/icons/arrow-right.svg){height=1em} wählt das nächste Konzept in der [Baumansicht](#baumansicht) oder aus der aktuell ausgewählten [Liste](#listenansicht) aus. Zum schnellen Wechsel gibt es für diese Aktion die Tatstaturkürzel Alt+n (links) und Alt+m (rechts).

![](img/cocoda-concdet-de.png){width=55% .border .border-dark .center}

<!--

## Hintergrund

Ein Konzept ist ein eigenständiges Objekt, zum Beispiel eine Person, ein Ort oder ein Thema, die meisten Konzepte haben eine einzigartige Notation, Bezeichnung und URI, um sie identifizieren zu können.

-->

### Baumansicht

Neben der Browsing-Möglichkeit über [Vokabulardetails](#vokabulardetails) und [Konzeptdetails](#konzeptdetails) wird für monohierarchischen Vokabularen eine Baumdarstellung angeboten.

![](img/cocoda-conctree-de.png){width=50% .border .border-dark .center}

### Listenansicht

Neben der Baumansicht gibt es je nach Konfiguration verschiedene Listen von Konzepten. Dazu gehört die Liste von Konzepten die dem Stern ![](img/icons/star.svg){height=1em} als Favorit markiert wurden (siehe in der [Menüleiste](#menüleiste) oben rechts).

## Mappings

Die Hauptaufgabe von Cocoda liegt in der Erstellung, Bearbeitung, Suche und Bewertung von Mappings. Ein Mapping ist eine gerichtete Verbindung zwischen einem Konzept und einer Menge von Konzepten aus einem gemeinsamen Vokabular. Zur Auswahl, Erstellung und Bearbeitung von Mappings werden in der Mitte der Benutzeroberfläche zwei Komponenten angeboten:

* [Mapping-Editor](#mapping-editor) zum Erstellen und Bearbeiten von Mappings
* Mapping-Browser bestehend aus Bereichen für [Konkordanzen], [Suche](#mapping-suche) und [Navigator] für Suche, Browsing und Bewertung von Mappings und Mapping-Vorschlägen

Die Mappings können außerdem je nach konfiguration mit [Bewertungen](#mapping-bewertungen) versehen werden. Mappings und Bewertungen können in verschiedenen Datenbanken ([Mapping-Registries](#mapping-registries)) gespeichert werden.

### Mapping-Editor

Der Mapping-Editor dient der detaillierten Bearbeitung eines Mappings. Dazu können Konzepte per Drag und Drop in den Mapping-Editor gezogen oder mit dem Plus-Icon ![](img/icons/plus-circle.svg){height=1em} von der linken oder rechten Seite übernommen werden. Zum Übernahme des jeweils ausgewählten Konzepts gibt es außerdem Tastaturkürzel (`Ctrl+a` bzw. `Ctrl+d`). Mit dem Kreuz ![](img/icons/times-circle.svg){height=1em} kann ein Konzept wieder entfernt werden.

![](img/cocoda-mappingeditor1-de.png){.border .border-dark}

Der Editor zeigt an, ob und in welcher [Registry](#mapping-registries) ein Mapping bereits gespeichert wurde bzw. gespeichert wird. Die Leiste am Unteren Rand des Editors stellt folgende Aktionen bereit:

* ![](img/icons/exchange.svg){height=1em} Quell- und Zielkonzept des Mappings vertauschen
* ![](img/icons/save.svg){height=1em} Mapping speichern (Tastaturkürzel `Ctrl+s`)
* ![](img/icons/trash.svg){height=1em} Mapping löschen
* ![](img/icons/clone.svg){height=1em} Mapping duplizieren um ein neues Mapping mit gleichem Inhalt zu erstellen
* ![](img/icons/ban.svg){height=1em} Mapping leeren (Tastaturkürzel `Ctr+Shift+c`)

<!-- TODO: wofür Mapping leeren? -->

Außerdem wird angezeigt wer das Mapping erstellt hat bzw. bei neuen Mappings mit welchem Benutzernamen das Mapping gespeichert wird. In der Mitte des Editors kann die Art des Mappings ausgewählt werden. Folgende Mapping-Typen stehen zur Auswahl:

* **=** exakte Übereinstimmung: gleiche Bedeutung
* **≈** hohe Übereinstimmung: in etwa gleiche Bedeutung
* **>** allgemeinere Bedeutung (z.B. Über- zu Unterordnung)
* **<** spezifischere Bedeutung (z.B. Teil-Ganzes-Beziehung)
* **~** verwandte, assoziative Verknüpfung
* **→** allgemeine Mapping-Relation mit unbekanntem Bedeutungszusammenhang
  
Falls für die ausgewählte Kombinationen von Quell- und Zielvokabular Hinweise zum Mappingvorgang konfiguriert sind, werden diese über ein Hilfe-Info ![](img/icons/question-circle.svg){height=1em} 
aufrufbar.

### Konkordanzen

Der erste Bereich der Mapping-Browser-Komponente listet Konkordanzen auf, in denen Mappings koordiniert gesammelt wurden.^[Eine Übersicht aller im Projekt coli-conc erfassten Konkordanzen gibt es unter <http://coli-conc.gbv.de/concordances/>] Die Konkordanzen können nach Quell- und Zielvokabular und nach Herausgeber gefiltert werden. Das Link-Icon ![](img/icons/external-link-square.svg){height=1em} öffnet die [Mapping-Suche] mit Filter auf der jeweiligen Konkordanz.

![](img/cocoda-mapping-browser-con-de.png){width=100% .border .border-dark}

<!--
Für jedes Mapping oder Mapping-Empfehlung gibt es auf der rechten Seite ein paar Aktionen, die geklickt werden können:

- Mapping-Details anzeigen: zeigt Mapping-Details an
- Bearbeiten: holt das Mapping in den Mapping-Editor
- Speichern: speichert das Mapping in die ausgewählte Registry
- Löschen löscht eigene Mappings

Eine Registry ist eine individuelle Datenquelle über Vokabulare, Konzepte, Mappings usw. Als Beispiel dient das öffentliche [Konkordanz-Register](http://coli-conc.gbv.de/concordances/), mit allen Konkordanzen und Mappings, die im Laufe des coli-conc-Projektes gesammelt wurden. Registries können über den Reiter [Mapping-Navigator](#registries) konfiguriert werden. Der Technische Zugang zu diesen Registries wird durch Provider sichergestellt.
Einige Registries können im Mapping-Browser an- und ausgeschaltet  werden, um ihre Mappings zu verbergen.
-->


### Mapping-Suche

Die Mapping-Suche bietet eine Metasuche nach Mappings in vorhandene [Datenquellen]. In der Erste Zeile des Suchformulars können folgende Filter angegeben werden:

* Quell-Vokabular
* Quellnotation oder -URI
* Ziel-Vokabular
* Zielnotation oder -URI

Mit Dem Schloss-Icon ![](img/icons/lock-solid.svg){height=1em} bzw. ![](img/icons/lock-open-solid.svg){height=1em} kann festgelegt werden dass immer automatisch das per [Vokabularauswahl] gewählte Quell- bzw. Zielvokabular verwendet werden soll. Über das Filter-Icon ![](img/icons/filter.svg){height=1em} werden weitere Suchmöglichkeiten angeboten:

* Autor/Autorin
* Mapping-Typ
* Konkordanz
* Bidirektionale Suche (Quell- und Ziel- auch vertauscht suchen)
* [Mapping-Registries] in denen gesucht werden soll

*Achtung:* sollte die Suche keine oder zu wenige Ergebnisse liefern kann es sein dass zu viele Filter gesetzt sind. Der Leeren-Button ![](img/icons/ban.svg){height=1em} setzt alle Filter zurück. Das Share-Icon ![](img/icons/share-alt-square-solid.svg){height=1em} beinhaltet die URL auf die aktuelle Suche um diese als Bookmark zu speichern oder weiterzugeben.

Die Ergebnisliste der Mapping-Suche ist nach Datenquellen unterteilt. Datenquellen in die geschrieben werden kann sind durch einen Stift ![](img/icons/pencil-alt-solid.svg){height=1em} gekennzeichnet. Innerhalb einer Ergebnisliste werden je nach Konfiguration folgende Aktionen angeboten:

<!--
![Mapping-Suche Reiter im Mapping-Browser](img/cocoda-mapping-browser-sea-de.png){width=100% .border .border-dark}

Hier gibt es eine umfangreiche Auswahl von Suchschlitzen, mit denen man nach allem Suchen kann. Alternativ kann man mit einem Klick auch die [Registries](#registries) auswählen, in welchen nur gesucht werden soll.
-->

* [Bewertung](#mapping-bewertung)
* ![](img/icons/info-circle.svg){height=1em} Detailinformationen zum Mapping
* ![](img/icons/edit.svg){height=1em} Mapping bearbeiten
* ![](img/icons/clone.svg){height=1em} Mapping kopieren
* ![](img/icons/trash.svg){height=1em} Mapping löschen

### Navigator

Im Mapping-Navigator werden aus verschiedenen Datenquellen Mappings und Mapping-Vorschläge angezeigt die zu den links bzw. rechts ausgewählten Konzepten passen. Die Anzeige der einzelnen Mappings entspricht der [Mapping-Suche]. Die einzelnen Quellen können durch Klick ein- und ausgeblendet werden.

<!--
![Mapping-Navigator Reiter im Mapping-Browser](img/cocoda-mapping-browser-nav-de.png){width=100% .border .border-dark}
-->

### Mapping-Bewertungen

Diese Funktion befindet sich noch in Entwicklung. Je nach konfiguration ist es möglich Mappings durch Voting und/oder Markierung als bestätigt zu bewerten: 

* ![](img/icons/check.svg){height=1em} bestätigtes Mapping
* ![](img/icons/thumbs-up.svg){height=1em} positive Bewertung
* ![](img/icons/thumbs-down.svg){height=1em} negative Bewertung

### Mapping-Registries

Eine Mapping-Registry ist eine Datenbank in der Mappings und/oder Bewertungen gespeichert werden können. Die jeweils ausgewählte Registry ist gelb hinterlegt und kann über die [Menüleiste] oder durch Klick auf den Namen der Registry im Mapping-Browser ausgewählt werden.

<!--
![Registries im Mapping-Navigator Reiter](img/cocoda-mapping-browser-reg-de.png){width=100% .border .border-dark}

Mit einem Klick auf die Buttons können die Registries des [Mapping-Browsers](#mapping-browser) ausgeblendet werden.

**Registries:**
- L: Lokal, Mappings werden im Browser gespeichert
- C: Konkordanz-Register, öffentliche Datenbank des GBV
- W: Wikidata-Mappings, Wikidata-Mappings im [JSKOS-Format](https://gbv.github.io/jskos/jskos)
- CR: coli-conc-Vorschläge, Vorschläge auf Grundlage der Benennungen
- CC: ccmapper-Vorschläge, Verknüpfung mit pansofts [CCMapper](https://ccmapper-de.pansoft.de/)
- CO: Katalogvorschläge, Verknüpfung mit dem GVK welche sonstigen Notationen zum Gesuchten passen

-->

## Einstellungen

Ein Klick auf den Benutzernamen in der [Menüleiste] öffnet die Einstellungen. Darüber hinaus können einige Komponenten mit dem Icon ![](img/icons/cog.svg){height=1em} konfiguriert werden. Da Cocoda keine [Benutzeraccounts] verwaltet werden die Einstellungen nur lokal im Browser gespeichert. Die Einstellungen sind in Bereiche unterteilt:

* Account: Zur Auswahl der Identität unter der [Mappings] und [Bewertungen] gespeichert werden sollen

* Oberfläche: Einstellungen zur [Benutzeroberfläche] wie die Sprache

* Tastaturkürzel: zeigt vorhandene Tastaturkürzel an

* Datenquellen: enthält eine Übersicht aller verfügbaren [Datenquellen] und [Mapping-Registries]

* Lokale Mappings: ermöglicht den Import und Export von im Browser gespeicherten Mappings
  (falls in der Cocoda-Instanz vorhanden)

[Bewertungen]: #mapping-bewertungen

### Datenquellen

Cocoda greift als reine Webanwendung auf alle Informationen über Web-Schnittstellen (APIs) zu. Eine Übersicht aller pro Cocoda-Instanz konfigurierten Datenquellen ist in den Einstellungen einsehbar, darunter auch die [Mapping-Registries] zur Speicherung von [Mappings] und/oder [Bewertungen]. Zusätzliche Vokabulare, Mappings und Mapping-Vorschläge können durch entsprechende Konfiguration einer Cocoda-Instanz in die Anwendung eingebunden werden. Bitte setzen Sie sich bei Interesse und Fragen dazu mit uns in Verbindung (<http://coli-conc.gbv.de/contact/>).

## Weitere Informationen

Weitere Informationen, Anleitungen, Screencasts u.v.m. finden sich über die Projekthomepage <https://coli-conc.gbv.de/>.

Die in Cocoda verwendeten Icons stammen von [fontawesome](https://fontawesome.com/) und sind unter [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) lizensiert.
