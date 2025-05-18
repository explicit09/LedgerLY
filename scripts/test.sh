#!/bin/bash
# Forward test commands to backend test runner and run root tests first
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$DIR/.."

# Run root unit tests
npx jest --config "$ROOT/jest.config.js" --runInBand

# Run backend tests
if [ -f "$ROOT/backend/scripts/test.sh" ]; then
  (cd "$ROOT/backend" && ./scripts/test.sh "$@")
else
  echo "Backend test script not found" >&2
  exit 1
fi
