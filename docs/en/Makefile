NAME=user-manual-en

default: html

html: $(NAME).html
pdf: $(NAME).pdf

book: pdf
	pdfbook --twoside $(NAME).pdf

CURDIR=..
include ../Makefile
