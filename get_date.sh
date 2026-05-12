#!/bin/bash

# Get the current date in DD.MM.YYYY format
current_date=$(date "+%d.%m.%Y")

# Path to your index.qmd file
file_path="index.qmd"

# Use sed to find and replace the line containing "Last updated on"
# Note the use of different delimiters ('|') and proper handling of double quotes
sed -i '' "s|^Last updated on.*|Last updated on $current_date | Site made with <a href=\"https://quarto.org/docs/websites/\" target=\"_blank\">Quarto</a>|" "$file_path"