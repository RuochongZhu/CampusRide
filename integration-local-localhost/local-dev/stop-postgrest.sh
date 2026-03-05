#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT_DIR/local-dev/postgrest.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "PostgREST PID file not found."
  exit 0
fi

PID="$(cat "$PID_FILE")"
if kill -0 "$PID" >/dev/null 2>&1; then
  kill "$PID"
  echo "Stopped PostgREST (PID: $PID)"
else
  echo "PostgREST process not running."
fi

rm -f "$PID_FILE"
