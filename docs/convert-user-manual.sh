#!/bin/bash

./build-user-manual.sh > user-manual.md

pandoc -s -o user-manual.html user-manual.md
pandoc -o user-manual.pdf user-manual.md
