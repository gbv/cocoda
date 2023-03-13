## Einleitung

Dieses Handbuch gibt eine kurze Einführung in die wichtigsten Bestandteile von Cocoda. Die Webanwendung zur Erstellung und Verwaltung von Mappings zwischen Wissensorganisationssystemen (Klassifikationen, Normdaten, Thesauri...) wird als Teil des [Projektes coli-conc](https://coli-conc.gbv.de/) an der [Verbundzentrale des GBV (VZG)](https://www.gbv.de/) gepflegt. Die Anwendungsfälle von Cocoda reichen vom Mapping eigener Systematiken auf etabliertere Vokabulare über die Erstellung von Mappings zur Verbesserung des Retrieval in Katalogen und Discovery-Systemen bis hin zur Sammlung von Mappings in Wikidata als zentralem Normdaten-Hub.

Unter <https://coli-conc.gbv.de/cocoda/> sind mehrere Anleitungen, Screencasts sowie unterschiedlich konfigurierte Instanzen von Cocoda verlinkt, darunter:

* die aktuelle Release-Version: <https://coli-conc.gbv.de/cocoda/app/>
* die aktuelle Entwicklungsversion: <https://coli-conc.gbv.de/cocoda/dev/>

Je nach Konfiguration der Cocoda-Instanz können einige der hier beschriebenen Features nicht verfügbar sein.

## Benutzeroberfläche

Empfohlen wird als Browser Firefox oder Chromium und ein Bildschirm mit mindestens Full HD-Auflösung (1920×1080). Die Benutzeroberfläche lässt sich über die [Einstellungen] anpassen; unter Anderem kann die Sprache geändert werden.

Die **Menüleiste** enthält (je nach Konfiguration):

* Logo und Name der jeweiligen Cocoda-Instanz
* ![](img/icons/exchange.svg){height=1em} Links-Rechts-Pfeile zum Wechseln der Mapping-Richtung
* Links auf Impressum, Datenschutzerklärung, Anleitung und Feedback-Möglichkeit
* ![](img/icons/trash.svg){height=1em} Mülleimer zur Ansicht und zum Wiederherstellen der zuletzt gelöschten Mappings
* ![](img/icons/star.svg){height=1em} Schnellauswahl von gemerkten Konzepten
* ![](img/icons/user-solid.svg){height=1em} [Benutzeraccount](#benutzeraccounts) und -name. Nach erfolgreichem Login wird der Benutzername fett markiert und per Schnellauswahl lässt sich die Identität zur Speicherung von [Mappings] und [Bewertungen] wechseln
* ![](img/icons/gear-solid.svg){height=1em} [Einstellungen] mit Schnellauswahl der [Datenbank] in die Mappings und Bewertungen gespeichert werden

Der restliche Bildschirm ist in drei Bereiche mit mehreren **Komponenten** aufgeteilt:

* Komponenten zur Auswahl von [Vokabularen und Konzepten](#vokabulare-und-konzepte) Links und Rechts
* Komponenten zur Auswahl, Erstellung und Bearbeitung von [Mappings] in der Mitte

Beim Start von Cocoda sind zunächst nur die Komponenten zur [Vokabularauswahl] geöffnet während in der Mitte allgemeine Hinweise angezeigt werden. Die Größe einzelner Komponenten lässt sich mit den Punkten ![](img/icons/ellipsis-v.svg){height=1em} bzw. ![](img/icons/ellipsis-h.svg){height=1em} ändern, das Minimieren-Icon ![](img/icons/window-minimize.svg){height=1em} blendet eine Komponente aus. Darüber hinaus haben einige Komponenten rechts unten Icons zur:

* ![](img/icons/gear-solid.svg){height=1em} Einstellung des Verhaltens der Komponente
* ![](img/icons/code.svg){height=1em} Detailansicht der in einer Komponente angezeigten [Daten und Quellen](#export-und-import)

## Benutzeraccounts

Grundsätzlich verwaltet Cocoda keine eigenen Benutzeraccounts. Die [Einstellungen](#einstellungen) werden daher auch nur im Browser gespeichert. Zum Login können vorhandene Accounts bei externen Diensten verwendet werden:

* ORCID
* Wikimedia (Wikipedia, Wikidata...)
* GitHub
* StackExchange
* LDAP (nur VZG-intern)

Diese externen Accounts heißen in Cocoda **Identitäten**. Die jeweils ausgewählte Identität und der dazugehörige Nutzername werden nach erfolgreichem Login in der [Menüleiste](#benutzeroberfläche) angezeigt und können dort gewechselt werden. Weitere Details sind in den [Einstellungen](#einstellungen) unter "Account" einsehbar. Ob und mit welcher Identität Cocoda Nutzerbeiträge öffentlich einsehbar abspeichert, können Nutzer selber entscheiden:

* Ist die personenbezogene Zuordnung von Beiträgen nicht gewünscht, sollte die Standard-Identität ausgewählt werden. Hierbei wird ein Account-Identifier verwendet dessen Zuordnung zu Identitäten nur den Adminstratoren der Mapping-Datenbank bei der VZG einsehbar ist. Zusätzlich sollte ein Pseudonym als Name vergeben werden.
* Wird eine der anderen Identitäten ausgewählt, lässt sich der / die Nutzer(in) öffentlich über die Identitäts-URI identifizieren.

![](img/cocoda-login-select-identity-de.png){width=50% .border .border-dark}

<!--
Entwurf für Text zum Thema Löschen der Daten:
Die Accountdaten können auf der Account-Seite mit Klick auf "MyData" eingesehen werden. Mit Klick auf "Delete user account", werden diese Daten sofort und unwiderruflich aus unserer Datenbank gelöscht. Dies gilt **nicht** für Daten, die in Zusammenhang mit diesen Accountdaten stehen wie z.B. Mappings. 
-->

Sollen Mappings überhaupt nicht öffentlich einsehbar sein, können Mappings auch ohne Login lokal im eigenen Browser gespeichert werden. Diese Funktion ist der Übersichtlichkeit halber in einigen Cocoda-Instanzen allerdings abgestellt.

## Vokabulare und Konzepte

Cocoda bietet einen einheitlichen Zugang zu einer Vielzahl von **Vokabularen** wie Ontologien, Klassifikationen, Taxonomien und Terminologien aus verschiedenen [Datenquellen](#Datenquellen). Ein Vokabular ist eine organisierte Sammlung von Konzepten mit zusätzlichen Informationen über das Vokabular. Ein **Konzept** ist ein individuelles Objekt wie eine Person, einen Ort oder ein Thema. Die meisten Konzepte haben eine eindeutige Notation und Bezeichnung und eine einzigartige URI, um sie identifizieren zu können.
Cocoda empfiehlt alle Vokabulare, im [Basic Register of Thesauri, Ontologies & Classifications (BARTOC)](https://BARTOC.org) zu registrieren und dessen IDs zu verwenden, um eindeutig auf einzelne Vokabulare zu verweisen. Die Dewey-Dezimalklassifikation (DDC) ist beispielsweise ein Vokabular des Typs Universelle Bibliotheksklassifikation, das von OCLC veröffentlicht und in BARTOC mit der URI <http://bartoc.org/en/node/241> registriert wurde.

Die Anzeige von Vokabularen und Konzepten auf der linken bzw. rechten Seite besteht aus Komponenten für:

* [Auswahl von Quell- bzw. Zielvokabular](#vokabularauswahl)
* [Ansicht von Informationen über ein ausgewähltes Vokabular](#vokabulardetails)
* [Suche nach Konzepten im ausgewählten Vokabular](#suche-nach-konzepten)
* [Ansicht von Informationen über ein ausgewähltes Konzept](#konzeptdetails)
* [hierarchisches Browsing im ausgewählten Vokabular](#baumansicht) (falls vorhanden)
* [Ansicht von Konzeptlisten](#listenansicht) (falls vorhanden)

### Vokabularauswahl

Die Auswahl eines Vokabulars ist per Titelsuche und über die Vokabular-Liste möglich. Über das Filter-Icon ![](img/icons/filter.svg){height=1em} kann die Liste nach Quelle, Sprache, Vokabular-Typ, Favoriten und nur Vokabularen mit Konzepten eingeschränkt werden. Ist das Filter-Icon mit einem Punkt markiert, so ist ein Filter aktiv. Mit der Pflanze ![](img/icons/seedling-solid.svg){height=1em} lässt sich ein Vokabular als Favorit aus- bzw. abwählen. Die Favoriten werden immer zuerst angezeigt. Nach Auswahl eines Vokabulars erscheint ein Suchfeld und es werden Informationen über das Vokabular angezeigt. Mit dem Kreuz ![](img/icons/times-circle.svg){height=1em} hinter dem Vokabularnamen lässt sich das Vokabular abwählen. Zum schnellen Zugriff auf die Vokabularauswahl gibt es die Tastaturkürzel `Ctrl+Shift+f` (links) und `Ctrl+Shift+g` (rechts).

### Vokabulardetails

Diese Komponente zeigt Vokabular-Informationen wie Identifier, Erstellungsdatum, Lizenz, Herausgeber, Vokabulartypen und [Datenquelle](#datenquellen) an. Wenn die [Baumansicht](#baumansicht) minimiert ist, werden hier außerdem die Oberkonzepte angezeigt. Der Link auf ![](img/icons/external-link-square.svg){height=1em} vorhandene Mappings öffnet die [Mapping-Suche](#mapping-suche).

![](img/cocoda-classdet-de.png){width=50% .border .border-dark}

### Suche nach Konzepten

Im Suchfeld lassen sich Konzepte per Notationen oder Bezeichnung suchen. Die Komponente lässt sich so konfigurieren, dass bei Auswahl eines Konzepts auf der gegenüberliegenden Seite automatisch dessen Benennung im Suchfeld eingetragen wird. Einige Vokabulare bieten die Filterung nach Konzept-Typ an: neben dem Suchschlitz steht dann ein Filter-Icon ![](img/icons/filter.svg){height=1em}. Zum schnellen Zugriff auf die Konzeptsuche gibt es die Tastaturkürzel `Ctrl+f` (links) und `Ctrl+g` (rechts).

Es können auch Konzepte ausgewählt werden, auch wenn es im betreffenden Vokabular kein Konzept mit der eingegebenen Notation gibt. Dazu muss nach einer syntaktisch korrekten Notation gesucht werden. Solche unbekannten Konzepte werden mit einem roten Punkt (<span style="color: red;">•</span>) gekennzeichnet.

### Konzeptdetails

Nach Auswahl eines Konzepts werden statt [Vokabulardetails](#vokabulardetails) Informationen zum ausgewählten Konzept angezeigt. Neben Ober- und Unterklassen (falls vorhanden):

<!--nächster Absatz korrigieren nach erfolgter Neubenennung der Tabs
-->

* Info: Metadaten wie Identifier und Änderungsdatum
* Bezeichnungen: Vorzugs- und Alternativbenennungen
* Scope/Editorial: Verwendungshinweise und Beschreibungen
* Links: Links in andere Datenbanken (Wikipedia, K0plus...)

Der Stern ![](img/icons/star.svg){height=1em} fügt das Konzept zur Schnellauswahl-Liste hinzu bzw. entfernt es daraus.
Das Plus-Zeichen ![](img/icons/plus-circle.svg){height=1em} dient dazu das Konzept in den [Mapping-Editor] zu übernehmen.
Der Pfeil ![](img/icons/arrow-right.svg){height=1em} wählt das nächste Konzept in der [Baumansicht] oder aus der aktuell ausgewählten [Liste](#listenansicht) aus. Zum schnellen Wechsel gibt es für diese Aktion die Tatstaturkürzel `Alt+n` (links) und `Alt+m` (rechts).

![](img/cocoda-concdet-de.png){width=55% .border .border-dark .center}

### Baumansicht

Neben der Browsing-Möglichkeit über [Vokabulardetails](#vokabulardetails) und [Konzeptdetails](#konzeptdetails) wird bei monohierarchischen Vokabularen eine ![](img/icons/sitemap-solid.svg){height=1em} Baumdarstellung angeboten.

![](img/cocoda-conctree-de.png){width=50% .border .border-dark .center}

### Listenansicht

Statt der Baumansicht können über ein Popup ![](img/icons/angle-up-solid.svg){height=1em} die Liste von Schnellauswahl-Konzepten ![](img/icons/star.svg){height=1em} sowie je nach Konfiguration weitere Konzept-Listen ![](img/icons/list-solid.svg){height=1em} ausgewählt werden. Die Aktualisierung zusätzlicher Listen erfolgt erst durch Neu-Laden mit dem Aktualisieren-Icon ![](img/icons/sync-alt-solid.svg){height=1em}.

## Mappings

Die Hauptaufgabe von Cocoda liegt in der Erstellung, Bearbeitung, Suche und Bewertung von Mappings. Ein Mapping ist eine gerichtete Verbindung zwischen einem Konzept und einem oder mehreren Konzept(en) aus einem anderen Vokabular. Zur Auswahl, Erstellung und Bearbeitung von Mappings werden in der Mitte der Benutzeroberfläche zwei Komponenten angeboten:

* [Mapping-Editor](#mapping-editor) zum Erstellen und Bearbeiten von Mappings
* Mapping-Browser bestehend aus Bereichen für [Konkordanzen](#konkordanzen), [Suche](#mapping-suche) und [Navigator](#mapping-navigator) für Suche, Browsing und Bewertung von Mappings und Suche nach Mapping-Vorschlägen

Mappings können außerdem je nach Konfiguration mit [Bewertungen] versehen werden. Mappings und Bewertungen können in verschiedenen [Mapping-Datenbanken] gespeichert werden.

### Mapping-Editor

Der Mapping-Editor dient der detaillierten Bearbeitung eines Mappings. Dazu können Konzepte per Drag und Drop in den Mapping-Editor gezogen oder mit dem Plus-Icon ![](img/icons/plus-circle.svg){height=1em} von der linken oder rechten Seite übernommen werden. Zur Übernahme des jeweils ausgewählten Konzepts gibt es außerdem Tastaturkürzel (`Ctrl+a` bzw. `Ctrl+d`). Mit dem Kreuz ![](img/icons/times-circle.svg){height=1em} kann ein Konzept wieder entfernt werden.

In den Einstellungen des Editors ![](img/icons/gear-solid.svg){height=1em} kann festgelegt werden nur 1-zu-1 Mappings zu erlauben; ansonsten kann ein Konzept auch auf eine Kombination mehrerer Zielkonzepte gemappt werden (UND-Verknüpfung). Für mehrere alternative Zielkonzepte (ODER-Verknüpfung) sollten stattdessen mehrere Mappings angelegt werden. Darüber hinaus sind Null-Mappings möglich wenn ein Konzept keine Entsprechung im Ziel-Vokabular hat.

![](img/cocoda-mappingeditor1-de.png){.border .border-dark}

In der Mitte des Editors kann die Art des Mappings ausgewählt werden. Folgende **Mapping-Typen** stehen zur Auswahl:

* **=** exakte Übereinstimmung: gleiche Bedeutung
* **≈** hohe Übereinstimmung: in etwa gleiche Bedeutung
* **>** allgemeinere Bedeutung (z.B. Über- zu Unterordnung)
* **<** spezifischere Bedeutung (z.B. Teil-Ganzes-Beziehung)
* **~** verwandte, assoziative Verknüpfung
* **→** allgemeine Mapping-Relation mit unbekanntem Bedeutungszusammenhang

Rechts unten kann je nach Berechtigung eine Konkordanz ausgewählt werden, in die das Mapping gespeichert werden soll. Links unten wird angezeigt, ob und in welcher [Datenbank](#mapping-datenbanken) ein Mapping gespeichert wurde bzw. gespeichert werden soll. Am unteren Rand des Editors stehen folgende Aktionen bereit:

* **±0** Mapping bewerten
* ![](img/icons/exchange.svg){height=1em} Quell- und Zielkonzept des Mappings vertauschen
* ![](img/icons/save.svg){height=1em} Mapping speichern (Tastaturkürzel `Ctrl+s`)
* ![](img/icons/trash.svg){height=1em} Mapping löschen
* ![](img/icons/clone-solid.svg){height=1em} Mapping duplizieren um ein neues Mapping mit gleichem Inhalt zu erstellen
* ![](img/icons/ban.svg){height=1em} Mapping leeren, um ein neues Mapping zu erstellen (`Ctrl+Shift+c`)

Nach dem Speichern wird der Editor geleert, um ein Überschreiben des gespeicherten Mappings zu vermeiden; dieses Verhalten kann in den Einstellungen des Editors ![](img/icons/gear-solid.svg){height=1em} geändert werden.

Falls für die ausgewählte Kombinationen von Quell- und Zielvokabular Hinweise zum Mappingvorgang konfiguriert sind, werden diese über ein Hilfe-Info ![](img/icons/question-circle.svg){height=1em}
aufrufbar.

### Konkordanzen

Der erste Bereich der Mapping-Browser-Komponente listet Konkordanzen auf, in denen Mappings koordiniert gesammelt wurden.^[Siehe auch <http://coli-conc.gbv.de/concordances/> für eine Übersicht] Die Konkordanzen können nach Quell- und Zielvokabular und nach Herausgeber gefiltert werden. Das Link-Icon ![](img/icons/external-link-square.svg){height=1em} öffnet die [Mapping-Suche] mit Filter auf der jeweiligen Konkordanz. Je nach Berechtigung lassen sich neue Konkordanzen mit ![](img/icons/square-plus-solid.svg){height=1em} anlegen und mit ![](img/icons/pen-to-square-solid.svg){height=1em} bearbeiten. Über das Info-Icon ![](img/icons/info-circle.svg){height=1em} erhält man alle Informationen zur Konkordanz.

![](img/cocoda-mapping-browser-con-de.png){width=100% .border .border-dark}

<!--
Für jedes Mapping oder Mapping-Empfehlung gibt es auf der rechten Seite ein paar Aktionen, die geklickt werden können:

- Mapping-Details anzeigen: zeigt Mapping-Details an
- Bearbeiten: holt das Mapping in den Mapping-Editor
- Speichern: speichert das Mapping in die ausgewählte Datenbank
- Löschen löscht eigene Mappings

Eine Datenbank ist eine individuelle Datenquelle über Vokabulare, Konzepte, Mappings usw. Als Beispiel dient die öffentliche [Konkordanz-Datenbank](http://coli-conc.gbv.de/concordances/), mit allen Konkordanzen und Mappings, die im Laufe des coli-conc-Projektes gesammelt wurden. Datenbanken können über den Reiter [Mapping-Navigator](#datenbanken) konfiguriert werden. Der Technische Zugang zu diesen Datenbanken wird durch Provider sichergestellt.

Einige Datenbanken können im Mapping-Browser an- und ausgeschaltet  werden, um ihre Mappings zu verbergen.
-->


### Mapping-Suche

Die Mapping-Suche bietet eine Metasuche nach Mappings in vorhandene [Datenquellen]. In der ersten Zeile des Suchformulars können folgende Filter angegeben werden:

* Quell-Vokabular
* Quellnotation oder -URI
* Ziel-Vokabular
* Zielnotation oder -URI

Vokabulare und Konzepte lassen sich auch per Drag & Drop in die Suchfelder eintragen.

Mit dem Schloss-Icon ![](img/icons/lock-solid.svg){height=1em} bzw. ![](img/icons/lock-open-solid.svg){height=1em} kann festgelegt werden, dass immer automatisch das per [Vokabularauswahl] gewählte Quell- bzw. Zielvokabular verwendet werden soll. Über das Filter-Icon ![](img/icons/filter.svg){height=1em} werden weitere Suchmöglichkeiten angeboten:

* Autor/Autorin
* Mapping-Typ
* Bidirektionale Suche (Quell- und Ziel- auch vertauscht suchen)
* Kardinalität
* Bewertung
* Konkordanz
* [Mapping-Datenbanken] in denen gesucht werden soll

Sollte die Suche keine oder zu wenige Ergebnisse liefern kann es sein dass zu viele Filter gesetzt sind. Der Leeren-Button ![](img/icons/ban.svg){height=1em} setzt alle Filter zurück. Das Share-Icon ![](img/icons/share-alt-square-solid.svg){height=1em} beinhaltet die URL auf die aktuelle Suche um diese als Bookmark zu speichern oder weiterzugeben.

Die Ergebnisliste der Mapping-Suche ist nach Datenquellen unterteilt und entspricht der Ansicht im Mapping-Navigator. Die einzelnen Quellen können durch Klick auf ihren Namen ein- und ausgeblendet werden.

### Mapping-Navigator

Im Mapping-Navigator werden aus verschiedenen Datenquellen Mappings und Mapping-Vorschläge angezeigt die zu den links bzw. rechts ausgewählten Konzepten passen. Zu welchen Konzepten und Vokabularen Mappings im Navigator berücksichtigt werden sollen, kann in den Einstellungen festgelegt werden. Die einzelnen Datenquellen lassen sich durch Klick auf ihre Kürzel ein- und ausblenden. Datenquellen, in die geschrieben werden kann, sind mit einem Stift ![](img/icons/pencil-alt-solid.svg){height=1em} markiert. Zu jedem Mapping bzw. Mapping-Vorschlag werden angezeigt:

* Quellvokabular und -Konzept
* Mapping-Typ
* Zielvokabular und -Konzept
* Erstellt von wem und wann

Sowie je nach Einstellungen:

* [Bewertungen]
* ![](img/icons/edit.svg){height=1em} Mapping bearbeiten
* ![](img/icons/trash.svg){height=1em} Mapping löschen
* ![](img/icons/info-circle.svg){height=1em} Detailinformationen zum Mapping oder Vorschlag
* ![](img/icons/clone-solid.svg){height=1em} Vorschlag in den Mapping-Editor kopieren

### Bewertungen

Grundsätzlich sind zwei Arten von Bewertungen möglich, wobei es von der Konfiguration abhängt, wer welche Bewertungen abgeben kann:

* Bewertung durch Zustimmung ![](img/icons/thumbs-up.svg){height=1em} bzw. Widerspruch ![](img/icons/thumbs-down.svg){height=1em}
* Bewertung durch Bestätigung ![](img/icons/check.svg){height=1em} (in der Regel nur für ausgewählte Accounts)

Zustimmungen und Ablehnungen werden als `+1` bzw. `-1` gewertet und in ihrer Summe angezeigt. Bei Bestätigungen reicht *eine* Bewertung damit statt der Summe ein Haken ![](img/icons/check.svg){height=1em} angezeigt wird. Alle Bewertungen erfolgen benutzerbezogen. Es ist also einsehbar, wer wann welche Bewertung abgegeben hat. Eigene Bewertungen können wieder entfernt werden.

## Einstellungen

Ein Klick auf den Benutzernamen in der [Menüleiste] öffnet die Einstellungen. Darüber hinaus können einige Komponenten mit dem Icon ![](img/icons/gear-solid.svg){height=1em} konfiguriert werden. Da Cocoda keine [Benutzeraccounts] verwaltet, werden die Einstellungen nur lokal im Browser gespeichert. Die Einstellungen sind in verschiedene Bereiche unterteilt:

* Account: Identität zur Speicherung von [Mappings] und [Bewertungen]
* Datenquellen: Übersicht aller verfügbaren [Datenquellen]
* Oberfläche: Einstellungen zur [Benutzeroberfläche] wie die Sprache
* Tastaturkürzel: vorhandene Tastaturkürzel
* Meine Daten: Import und Export von Mappings

[Menüleiste]: #benutzeroberfläche

## Datenquellen

Cocoda greift als reine Webanwendung auf alle Informationen über Web-Schnittstellen (APIs) zu. Die Daten und API-Aufrufe sind jeweils über das Quelltext-Icon ![](img/icons/code.svg){height=1em} erreichbar. Die je nach Instanz konfigurierten Datenquellen sind in den Einstellungen einsehbar.

### Mapping-Datenbanken

[Datenbank]: #mapping-datenbanken

Mapping-Datenbanken dienen der Speicherung von [Mappings] und [Bewertungen]. Die jeweils ausgewählte Datenbank ist farblich hinterlegt und kann über die Einstellungen oder durch Klick auf den Namen der Datenbank im Mapping-Browser ausgewählt werden. Die meisten Instanzen enthalten diese Datenbanken:

* **L** Lokal: Mappings werden im Browser gespeichert
* **C** Konkordanz-Register: öffentliche Datenbank aller im Projekt coli-conc gesammelten Mappings und Bewertungen
* **W** Wikidata-Mappings: Lese- und Schreibzugriff auf Mappings in Wikidata

### Weitere Datenquellen

Vokabulare und Mapping-Vorschläge können per JSKOS-API, per Skosmos-API und per OpenRefine Reconciliation API in eine Cocoda-Instanz eingebunden werden. Das Hinzufügen weiterer Datenquellen über die Benutzeroberfläche ist bislang nicht möglich.

### Export und Import

[JSKOS]: https://gbv.github.io/jskos/jskos.html

Zum Export von Daten aus Cocoda verwenden Sie das Quelltext-Icon ![](img/icons/code.svg){height=1em}. Die [JSKOS]-Daten können in verschiedenen Formaten wie CSV und JSON heruntergeladen werden. Teilweise stehen auch API-Aufrufe zum Abruf der Daten bereit.

Zusätzliche Vokabulare, Mappings und Mapping-Vorschläge können durch entsprechende Konfiguration einer Cocoda-Instanz in die Anwendung eingebunden werden. Bitte setzen Sie sich bei Fragen dazu mit uns in Verbindung (<http://coli-conc.gbv.de/contact/>).

Der Massenimport von Mappings ist über die Weboberfläche bislang nur in der Datenbank **L** Lokal möglich.

<!--
ToDo (Uma): kurz coli-rich (inkl. Verlinkung) und das Redaktionsverfahren der eingetragenen Mappings im K10plus (inkl. Pflege von Updates) beschreiben.
- ein Absatz zum Workflow - von der Erstellung von Mappings bis zur Anreicherung via coli-rich; DA und dann die Redaktionsverfahren
- englisches Benutzerhandbuch nicht vergessen!
-->

## Weitere Informationen

Weitere Informationen, Anleitungen, Screencasts u.v.m. finden sich über die Projekthomepage <https://coli-conc.gbv.de/>. Für Fragen und Rückmeldungen zur Software benutzen Sie am Besten den [GitHub IssueTracker](https://github.com/gbv/cocoda/issues).

Die in Cocoda verwendeten Icons stammen von [fontawesome](https://fontawesome.com/) und sind unter [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) lizensiert.
