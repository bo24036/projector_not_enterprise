#!/bin/bash
# Creates a clean deploy/ folder containing only what's needed to run Projector.
# Run from the project root: ./build.sh

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
DEPLOY="$ROOT/deploy"

echo "Cleaning deploy/..."
rm -rf "$DEPLOY"
mkdir -p "$DEPLOY"

echo "Copying app files..."
rsync -a \
  --include="src/***" \
  --include="styles/***" \
  --include="vendor/idb/***" \
  --include="vendor/lit-html/***" \
  --include="install/***" \
  --include="index.html" \
  --include="favicon.ico" \
  --include="manifest.json" \
  --include="INSTALL.md" \
  --exclude="*" \
  "$ROOT/" "$DEPLOY/"

echo "Removing test files..."
find "$DEPLOY/src" -name "*.test.js" -delete

echo "Done. Deploy output is in deploy/"
