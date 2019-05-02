#!/bin/bash

# exit on failure, run in docs/ directory
set -e
cd $(dirname "${BASH_SOURCE[0]}")

PANDOC_MAJOR_VERSION=$(pandoc --version | head -1 | awk '{print int($2)}')
if [ "$PANDOC_MAJOR_VERSION" -lt 2 ]; then
    PANDOC_ARGS="--latex-engine=xelatex"
else
    PANDOC_ARGS="--pdf-engine=xelatex"
fi

./build-user-manual.sh > user-manual.md

pandoc $PANDOC_ARGS -s -o user-manual.html user-manual.md
pandoc $PANDOC_ARGS -o user-manual.pdf user-manual.md

rm user-manual.md
