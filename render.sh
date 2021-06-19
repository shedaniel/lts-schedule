#! /bin/bash
npx tsc bin/lts.ts
node bin/lts.js -d $1 -s $3 -e $4 -h output.html --picWidth $5 --picHeight $6 --marginLeft $7 -m true
google-chrome-stable --headless --hide-scrollbars --disable-gpu --screenshot=$2 --window-size=$5,$6 --default-background-color=0 output.html
