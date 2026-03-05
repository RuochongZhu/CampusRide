#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONF_FILE="$ROOT_DIR/local-dev/postgrest.conf"
PID_FILE="$ROOT_DIR/local-dev/postgrest.pid"
LOG_FILE="$ROOT_DIR/local-dev/postgrest.log"

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" >/dev/null 2>&1; then
    echo "PostgREST already running (PID: $PID)"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

POSTGREST_BIN="$(command -v postgrest)"
if [[ -z "$POSTGREST_BIN" ]]; then
  echo "postgrest not found. Install with: brew install postgrest"
  exit 1
fi

nohup "$POSTGREST_BIN" "$CONF_FILE" > "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

sleep 1
if kill -0 "$NEW_PID" >/dev/null 2>&1; then
  echo "PostgREST started on http://127.0.0.1:54321 (PID: $NEW_PID)"
else
  echo "PostgREST failed to start. Check $LOG_FILE"
  exit 1
fi
