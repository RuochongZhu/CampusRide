#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT_DIR/local-dev/supabase-shim.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "supabase-shim PID file not found."
  exit 0
fi

PID="$(cat "$PID_FILE")"
if kill -0 "$PID" >/dev/null 2>&1; then
  kill "$PID"
  echo "Stopped supabase-shim (PID: $PID)"
else
  echo "supabase-shim process not running."
fi

rm -f "$PID_FILE"
