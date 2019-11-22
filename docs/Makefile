.SUFFIXES: .md .html .pdf

BUILD_INFO=$(CURDIR)/../build/build-info.json
BUILD_DATE=$(shell grep date $(BUILD_INFO) | grep -o 20..-..-..)
VERSION=$(shell grep version $(BUILD_INFO) | sed 's/[",]//g')

PANDOC=pandoc --standalone --metadata-file $(BUILD_INFO) -M date=$(BUILD_DATE) -M "subtitle=$(VERSION)" config.yaml
TEMPLATES=$(CURDIR)/templates/

all: $(BUILD_INFO)
	make -C en
	make -C de

pdfs: $(BUILD_INFO)
	make -C en pdf
	make -C de pdf

$(BUILD_INFO):
	npm run build-info

%.html: %.md
	$(PANDOC) $< -o $@ $(TEMPLATES)config-html.yaml --template $(TEMPLATES)user-manual.html

%.pdf: %.md
	$(PANDOC) $< -o $@ --pdf-engine=xelatex --toc --template $(TEMPLATES)user-manual.tex
