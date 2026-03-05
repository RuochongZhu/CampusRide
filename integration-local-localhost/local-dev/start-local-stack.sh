#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

"$ROOT_DIR/local-dev/setup-local-db.sh"
"$ROOT_DIR/local-dev/start-postgrest.sh"
"$ROOT_DIR/local-dev/start-supabase-shim.sh"

echo "Local data stack is ready."
echo "PostgREST:   http://127.0.0.1:54321"
echo "Supabase URL: http://127.0.0.1:54322 (for backend .env)"
