#!/bin/bash

NAME=user-manual-en

./combine-user-manual.sh > $NAME.md

make $NAME.html
mkdir -p ../dist/
cp $NAME.html ../dist/

make $NAME.pdf

rm $NAME.md
