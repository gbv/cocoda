NAME=cocoda-anleitung

all: $(NAME).html $(NAME).pdf

html: $(NAME).html
	mkdir -p ../../dist/
	cp $(NAME).html ../../dist/user-manual-de.html

pdf: $(NAME).pdf

CURDIR=..
include ../Makefile
