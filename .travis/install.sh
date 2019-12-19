#!/bin/bash

set -e -u -o pipefail
 
export PATH="$HOME/.local/bin:/tmp/texlive/bin/x86_64-linux:$PATH"

PANDOC_RELEASE=2.7.3/pandoc-2.7.3-1-amd64

# install Pandoc into ~/.local for document generation
if ! command -v pandoc > /dev/null; then
  echo "Installing Pandoc"
  curl -L https://github.com/jgm/pandoc/releases/download/$PANDOC_RELEASE.deb > pandoc.deb
  dpkg -x pandoc.deb pandoc
  mkdir -p $HOME/.local/bin
  cp pandoc/usr/bin/* $HOME/.local/bin
fi

# install XeTeX
if ! command -v pdflatex > /dev/null; then
   echo "Installing Texlive"
   wget http://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz
   tar -xzf install-tl-unx.tar.gz
   ./install-tl-*/install-tl --profile=.travis/texlive.profile
fi

# additional texlive package
tlmgr install letltxmacro footnotebackref csquotes pagecolor mdframed fancyhdr \
   zref needspace booktabs titling sourcesanspro sourcecodepro pdfjam
