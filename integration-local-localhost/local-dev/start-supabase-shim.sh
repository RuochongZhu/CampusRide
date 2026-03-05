#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT_DIR/local-dev/supabase-shim.pid"
LOG_FILE="$ROOT_DIR/local-dev/supabase-shim.log"

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" >/dev/null 2>&1; then
    echo "supabase-shim already running (PID: $PID)"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

nohup node "$ROOT_DIR/local-dev/supabase-shim.mjs" > "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

sleep 1
if kill -0 "$NEW_PID" >/dev/null 2>&1; then
  echo "supabase-shim started on http://127.0.0.1:54322 (PID: $NEW_PID)"
else
  echo "supabase-shim failed to start. Check $LOG_FILE"
  exit 1
fi
