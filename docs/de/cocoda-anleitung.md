---
title: Cocoda-Anleitung
...

## Einführung

Cococda ist eine Webanwendung, zur Erstellung und Verwaltung Mappings zwischen Wissensorganisationssystemen. Dazu zählen beispielsweise: Klassifikationen, Normdaten, und Thesauri. Cocoda wird als ein Teil des [coli-conc-Projekts](https://coli-conc.gbv.de/) des [GBV](https://www.gbv.de/) entwickelt und von der [DFG](http://Startbildschirmgepris.dfg.de/gepris/projekt/276843344) gefördert.

Die aktuelle Version von Cocoda ist verfügbar unter <https://coli-conc.gbv.de/cocoda/app/>.
Die Entwicklungsversion ist unter <https://coli-conc.gbv.de/cocoda/dev/> zu finden.

Für Rückmeldungen zur Software benutzen Sie am besten den [GitHub IssueTracker](https://github.com/gbv/cocoda/issues). 

Cocoda sollte mit jedem modernen Webbrowser funktionieren Startbildschirm (auf jeden Fall mit Firefox und Chromium). Es wird mindestens eine HD-Auflösung (1366×768) benötigt, Full HD (1920×1080) oder mehr wird empfohlen, genauso wie den Browser im Vollbildmodus zu haben.

## Benutzeroberfläche

Die Benutzeroberfläche ist in mehrere Komponenten aufgeteilt, die frei nach Belieben vergrößert, verkleinert oder ausgeblendet werden können. Der Minimieren-Knopf oben rechts in den Komponenten blendet diese aus, die drei Punkte zwischen den Komponenten können mit der Maus gezogen werden, um die Komponenten zu vergrößern oder zu verkleinern.

- Die rechte und linke Komponente ermöglichen die Suche in Vokabularen um Konzepte darin zu untersuchen und auszuwählen.

- In der Mitte sind Komponenten um Mappings und Mapping-Vorschläge zu erstellen, bearbeiten, suchen und zu bewerten.

![Cocoda-Startbildschirm](img/cocoda-homepage-de.png){width=100%}

Oben rechts in der Menüleiste sind: der Mülleimer, der auch gelöschte Mappings wiederherstellen kann. Ein Stern, der auf die Favoriten-Konzepte-Schnellauswahl verweist, die Benutzereinstellungen und die Registry, in der die Mappings gespeichert werden. Alle vier Punkte können mit Maushovern aufgeklappt werden.

## Benutzeraccounts

Es muss kein klassischer Account erstellt werden, dann werden die Mappings allerdings nur im Browser gespeichert. Wenn sie sich aber mit bereits Bestehenden Accounts einloggen, haben sie den vollen Funktionsumfang von Cocoda zur Verfügung.

Zum einloggen klicken Sie einfach auf das "Einstellungen"-Feld in der Menüleiste.

![Account-Login](img/cocoda-login1-de.png){width=100%}

Auf dem Einstellungsfenster unter dem Reiter "Account" genügt nun ein Klick auf eins der verfügbaren Login-Felder (momentan GitHub, ORCID und VZG ELDAP). Danach müssen Sie den ausgewählten Dienst nur noch authentifizieren und bestätigen, dass Sie sich mit ihrem Konto bei Cocoda einloggen wollen.

![Account](img/cocoda-settings-account1-de.png)

Nach dem einloggen sollte Ihre Account-Seite ungefähr so aussehen:

![Account ausgefüllt](img/cocoda-settings-account2-de.png)

Sie können nun die Mapping-Registry umstellen von Lokal(speichert in Browser) zu Konkordanz-Registry(Datenbank der GBV), zudem können Sie ihren Anzeigenamen und ihre Identität ändern, welche in den Mappings, die Sie bearbeiten hinterlegt wird.

Mit einem Klick auf "Account-Seite", werden Sie zu einer seperaten Login-Seite weitergeleitet, auf dieser können Sie ihre angegebenen Informationen einsehen, verknüpfte Konten hinzufügen oder entfernen, sich ausloggen oder ihr gesamte Nutzerkonto löschen. 

![Login-Verwaltung](img/cocoda-loginserver-de.png)

Wenn Sie sich eingeloggt haben, finden sie neben ihrem Anzeigenamen in der Menüleiste ein grünes Icon, sowie eine Anzeige ihres ausgewählten Speicher-Repositorys.

![Startseite - Eingeloggt](img/cocoda-homepage2-de.png){width=100%}

## Vokabulare

Einzelne Wissensorganisationssysteme werden auch Vokabulare genannt, Beispiele für Vokabulare sind: Ontologien, (kontrollierte) Vokabulare, Taxonomien und Terminologien. Cocoda erlaubt den Zugriff auf verschiedene Vokabulare von verschiedenen Quellen.

Ein vokabular ist eine organisierte Ansammlung von Konzepten und zusätzlichen Informationen über das Vokabular. Cocoda empfehlt, dass alle Vokabulare im [Basel Register of Thesauri, Ontologies & Classifications (BARTOC)](https://BARTOC.org) registriert werden und man diese Indentifier dann als Links benutzt um Vokabulare zu identifizieren. (Beispiel DDC: <http://bartoc.org/en/node/241>)

### Vokabularauswahl
...

### Vokabulardetails

Die Details-Komponente zeigt detaillierte Informationen über ein Vokabular oder Konzept. Im Falle eines Vokabulars werden Notation, Bezeichnung, Lizenz, Publisher, und der identifier angezeigt. Wenn die Komponente "Oberkonzepte" minimiert ist, werden die Oberkonzepte in kürzerer Form ebenfalls angezeigt. Im Falle eines Konzepts werden die Ober- und Unterkonzepte von diesem, sowie Notation, Bezeichnung, Notizen, Registereinträge, zusätzliche Bezeichnungen, Identifier, und GND-Bezeichnungen angezeigt. Meistens ist für ein Konzept jedoch nicht alles vorhanden.

![Vokabulardetails](img/cocoda-classdet-de.png){width=100%}

## Konzepte

Ein Konzept ist ein eigenständiges Objekt, zum Beispiel eine Person, einen Ort oder ein Thema, die meisten Konzepte haben eine einzigartige Notation, Bezeichnung und URI, um sie identifizieren zu können.

Die rechte und linke Komponente ermöglichen die Suche in Vokabularen um Konzepte darin zu untersuchen und auszuwählen. Die Konzept-Browser links und rechts haben beide:

- ein aufklappbares Menü
- ein Suchfeld um Konzepte nach Notationen oder Bezeichnung zu suchen
- eine Unterkomponente, welche Details des Vokabulars oder der Konzepte (Vokabular-Details) anzeigt
- einen Baum, der alle Oberkonzepte eines Vokabulars anzeigt
- eine Liste mit Markierten Vokabularen wird gezeigt, wenn kein Vokabular ausgewählt ist

### Konzeptdetails

![Konzeptdetails](img/cocoda-concdet-de.png){width=100%}

### Hierarchische Ansicht

Wenn das ausgewählte Vokabular hierarchische Navigation unterstützt, zeigt der Oberkonzepte-Baum die Oberkonzepte. Ein Klick auf ein Konzept im Baum wählt das Konzept aus, die Informationen werden in der Detail-Unterkomponente gezeigt. Man kann Unterkonzepte untersuchen, indem man auf den Pfeil vor der Bezeichnung klickt. Ein Doppelklick auf ein Konzept wählt dieses aus und zeigt die Unterkonzepte, man kann auch die Detail-Unterkomponente benutzen, da dort auch eine Art Baumstruktur vorliegt, der richtige Baum wird jedoch empfohlen.

![Hierarchischer Baum](img/cocoda-conctree-de.png){width=100%}

### Listenansicht
...

## Mappings

Die Hauptaufgabe von Cocoda besteht in der Erstellung, Bearbeitung, Suche und Evaluation von Mappings. Ein Mapping ist eine gerichtete Verbindung zwischen einem Konzept und *n* Konzepten von einem anderen Vokabular.

Mapping können verwaltet werden mit:

- dem Mapping Editor (bearbeiten und erstellen)
- dem Mapping Browser (suchen, auflisten)

### Mapping-Editor

Um ein Konzept zu einem Mapping hinzuzufügen, muss als erstes das Konzept ausgewählt werden (Klick auf Konzept-Detail oder Konzept-Baum, danach muss man das kleine Plus bei dem ausgewälten Konzept oder im Mapping-Editor klicken, oder das Konzept per Drag&Drop in den Mapping Editor ziehen.
In der Mitte des Mapping Editors, kann die Art des Mappings ausgewählt werden.
Unten im Editor kann man verschiedene Aktionen durchführen: Quell- und Zielkonzepte tauschcen, Mappping speichern, Mapping löschen, Mapping duplizieren und Mapping Editor leeren.
Ist das Mapping nicht gespeichert färbt sich der Hintergrund rötlich, außerdem steht oben rechts "nicht gespeichert", bei einem gespeichertem Mapping, verfärbt sich der Hintergrund grün.

![Mapping Editor rot](img/cocoda-mappingeditor1-de.png)

![Mapping Editor grün](img/cocoda-mappingeditor2-de.png)

### Mapping-Browser

Der Mapping-Browser zeigt ncht nur existierende Mappings, sondern auch Mapping-Vorschläge für ausgewählte Konzepte der Vokabulare. Oben am Mapping Browser sind bunte Felder, auf diese kann man klicken und somit verschiedene Quelle zu- und abwählen. Die Katalogvorschläge (CO) basieren auf Vorkommen im [Gemeinsamen Verbundkatalog](https://gso.gbv.de/). Auf die blau markierte Nummer klicken initiiert eine Weiterleitung zum Katalog.
Für jedes Mapping oder Mapping-Empfehlung gibt es auf der rechten Seite ein paar Aktionen, die geklickt werden können:
- Mapping-Details anzeigen: zeigt Mapping-Details an
- Bearbeiten: holt das Mapping in den Mapping-Editor
- Speichern: speichert das Mapping in die ausgewählte Registry
- Löschen löscht eigene Mappings

Eine Registry ist eine individuelle Datenquelle über Vokabulare, Konzepte, Mappings usw. Als Beispiel dient die öffentliche [Konkordanz-Registry](http://coli-conc.gbv.de/concordances/), mit allen Konkordanzen und Mappings, die im Laufe des coli-conc-Projektes gesammelt wurden. Registries können über Einstellungen -> Registries konfiguriert werden. Der Technische Zugang zu diesen Registries wird durch Provider sichergestellt.
Einige Registries können im Mapping-Browser an- und ausgeschaltet  werden, um ihre Mappings zu verbergen.

#### Konkordanzen
![Konkordanzen](img/cocoda-mapping-browser-con.de.png){width=100%}

Hier finden sich alle Konkordanzen, die schon erstellt wurden und sich im Konkordanz-Register befinden.

#### Mapping-Suche
![Mapping-Suche](img/cocoda-mapping-browser-sea.de.png){width=100%}

Hier gibt es eine umfangreiche Auswahl von Suchschlitzen, mit denen man nach allem Suchen kann. Zeigt auch Empfehlungen an.

#### Mapping-Navigator
![Mapping-Navigator](img/cocoda-mapping-browser-nav.de.png){width=100%}

Hier kann man Mappings bearbeiten, evaluieren, speichern und löschen, sowie sich die Mapping-Details anzeigen lassen.

#### Registries
![Registries](../img/cocoda-mapping-browser-reg.de.png){width=100%}

Mit einem Klick auf die Buttons können die Registries ausgeblendet werden

- L: Lokal, Mappings werden im Browser gespeichert
- C: Konkordanz-Register, öffentliche Datenbank des GBV
- W: Wikidata-Mappings, Wikidata-Mappings im [JSKOS-Format](https://gbv.github.io/jskos/jskos)
- CR: coli-conc-Vorschläge, Vorschläge auf Grundlage der Benennungen
- CC: ccmapper-Vorschläge, Verknüpfung mit pansofts [CCMapper](https://ccmapper-de.pansoft.de/)
- CO: Katalogvorschläge, Verknüpfung mit dem GVK, welche sonstigen Notationen zum gesuchten passen

## Einstellungen

### Accounts
... Link nach oben

### Layout
In den Einstellungen unter dem Reiter "Layout" kann man die Sprache der Seite anpassen.

![Einstellungen - Layout](img/cocoda-settings-layout-de.png)

### Shortcuts
Unter dem Reiter "Tastatur-Shortcuts" kann man Tastenkürzel einsehen.

![Einstellungen - Tastatrukürzel](img/cocoda-settings-keysho-de.png)

### Datenquellen
Unter dem Reiter "Datenquellen" kann man eine Übersicht aller Quellen bekommen, die in Cocoda benutzt werden.

![Einstellungen - Datenquellen](img/cocoda-settings-datsor-de.png)

### Lokale Mappings
Unter dem Reiter "Lokale Mappings" kann man lokale Mappings hochladen, runterladen, löschen und den Ersteller des Mappings überschreiben.

![Einstellungen - Lokale Mappings](img/cocoda-settings-locmap-de.png)
