.SUFFIXES: .md .html .pdf

# tested with Pandoc 2.2.1 and Pandoc 1.16 (on travis)
BUILD_INFO=$(CURDIR)/build-info.yaml
BUILD_INFO_JSON=$(CURDIR)/../build/build-info.json
OPTIONS=--toc --standalone $(BUILD_INFO)

all: $(BUILD_INFO)
	make -C en
	make -C de

# dirty hack to get YAML from JSON
$(BUILD_INFO): $(BUILD_INFO_JSON)
	echo '---' > $@
	awk 'NR>2 {print last} {last=$$0}' $< \
		| sed 's/,$$//;s/"//g;s/^ \+//;' >> $@
	perl -p -i -e 's/T\d\d[^Z]+Z//;' $@
	echo '...' >> $@

$(BUILD_INFO_JSON):
	npm run build-info

%.html: %.md
	pandoc $(OPTIONS) -o $@ config.yaml $< --template $(CURDIR)/templates/user-manual.html
	perl -p -i -e 's/<figure>/<figure class="figure">/' $@
	perl -p -i -e 's/<figcaption>/<figcaption class="figure-caption">/' $@

%.pdf: %.md
	pandoc $(OPTIONS) -o $@ config.yaml $< --template $(CURDIR)/templates/user-manual.tex
