#!/bin/bash
# Reçoit le JSON de l'outil via stdin
file=$(jq -r '.file_path // empty')
[ -z "$file" ] && exit 0

case "$file" in
  *.md)
    markdownlint-cli2 --fix "$file" 2>/dev/null
    ;;
  *.ts|*.tsx|*.js|*.jsx|*.json)
    prettier --write "$file" 2>/dev/null
    ;;
esac
