#!/bin/bash
# Wrapper script to run backend tests from the repository root

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

"$PROJECT_ROOT/backend/scripts/test.sh" "$@"
