NAME=user-manual-en

default: html

all: html pdf

$(NAME).md: ../*.md
	./combine-user-manual.sh > $@

html: $(NAME).html
pdf: $(NAME).pdf

CURDIR=..
include ../Makefile
