NAME=cocoda-anleitung

all: $(NAME).html $(NAME).pdf

html: $(NAME).html
pdf: $(NAME).pdf

# tested with Pandoc 2.2.1

$(NAME).html: $(NAME).md
	pandoc -s -o $@ $<

$(NAME).pdf: $(NAME).md
	pandoc -o $@ $< --template ../template.tex
