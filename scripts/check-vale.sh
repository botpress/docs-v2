#!/bin/sh
# Vale pre-commit wrapper.
# Runs vale if installed, otherwise prints a skip notice and exits successfully.

if ! command -v vale >/dev/null 2>&1; then
  echo "[check-vale] Vale CLI not installed — skipping writing checks. Install with: brew install vale"
  exit 0
fi

# Only lint markdown/mdx files, ignore changelog entries since there are too many
# integration names that are flagged as spelling errors
vale --glob='*.{md,mdx},!**/changelog-entries/**' "$@"
