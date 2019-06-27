#!/bin/bash

./combine-user-manual.sh > user-manual.md

# tested with Pandoc 2.2.1
pandoc -s -o user-manual.html user-manual.md
pandoc -o user-manual.pdf user-manual.md --template template.tex

rm user-manual.md
