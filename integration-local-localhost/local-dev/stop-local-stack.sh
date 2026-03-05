#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

"$ROOT_DIR/local-dev/stop-supabase-shim.sh" || true
"$ROOT_DIR/local-dev/stop-postgrest.sh" || true

echo "Local data stack stopped."
