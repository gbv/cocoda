NAME=user-manual-en

all: html pdf

$(NAME).md: ../*.md
	./combine-user-manual.sh > $@

html: $(NAME).html
	mkdir -p ../../dist/
	cp $(NAME).html ../../dist/

pdf: $(NAME).pdf

CURDIR=..
include ../Makefile
