NAME=user-manual-de

default: html

html: $(NAME).html
pdf: $(NAME).pdf

book: pdf
	pdfbook --twoside $(NAME).pdf

CURDIR=..
include ../Makefile
