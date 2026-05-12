#!/bin/bash

quarto render
echo "dbraccia.com" > docs/CNAME
git add docs
git commit -m "published on: $(date)"
git push -u origin main