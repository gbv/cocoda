.SUFFIXES: .md .html .pdf

# tested with Pandoc 2.2.1

%.html: %.md
	pandoc -s --toc -o $@ config.yaml $< --template $(CURDIR)/templates/user-manual.html
	perl -p -i -e 's/<figure>/<figure class="figure">/' $@
	perl -p -i -e 's/<figcaption>/<figcaption class="figure-caption">/' $@

%.pdf: %.md
	pandoc -o $@ config.yaml $< --template $(CURDIR)/templates/user-manual.tex
