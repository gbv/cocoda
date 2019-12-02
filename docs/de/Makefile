NAME=user-manual-de

default: html

html: $(NAME).html
pdf: $(NAME).pdf

# combine PDF into printeable booklet
book: pdf
	pdfbook --twoside $(NAME).pdf

CURDIR=..
include ../Makefile
