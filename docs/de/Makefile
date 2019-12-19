NAME=user-manual-de

default: html

html: $(NAME).html
pdf: $(NAME).pdf

# combine PDF into printeable booklet
book: pdf
	pdfbook2 --paper=a4 $(NAME).pdf

CURDIR=..
include ../Makefile
