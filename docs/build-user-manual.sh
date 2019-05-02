#!/bin/bash

echo "---"
echo title: 'Cocoda User Manual'
echo author: 
echo date: $(date +%F)
echo "..."

echo
echo 
echo "## Introduction"
cat guide.md

echo
echo 
echo "## User Interface"
cat guide-interface.md

echo
echo
echo "## Login"
cat guide-login.md

echo
echo "## Concept Schemes"
cat guide-concept-schemes.md

echo
echo
echo "## Concepts"
cat guide-concepts.md

echo
echo
echo "## Mappings"
cat guide-mappings.md

echo
echo
echo "## Registries"
cat registries.md

echo
echo
echo "## Settings"
cat guide-settings.md

