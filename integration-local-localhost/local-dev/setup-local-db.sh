#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="campusride_local"
DB_USER="campusride_local"
DB_PASS="campusride_local_pw"
DB_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Please install PostgreSQL first."
  exit 1
fi

if command -v brew >/dev/null 2>&1; then
  brew services start postgresql@14 >/dev/null 2>&1 || true
fi

# Ensure role + database exist.
psql -d postgres -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
SQL

# Apply baseline schema and local compatibility patch.
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$ROOT_DIR/campusride-backend/src/database/schema.sql"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$ROOT_DIR/local-dev/compatibility_patch.sql"

# Seed local login accounts.
psql "$DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO users (
  email, student_id, password_hash, first_name, last_name,
  university, role, is_verified, verification_status, points
)
VALUES
  ('localadmin@cornell.edu', 'localadmin', '$2b$12$hn1eeFdV2ZTpLrXf5czKcuQxgNkZiiUNEs6xBrZawv6QzQVcxyPM.', 'Local', 'Admin', 'Cornell University', 'admin', true, 'verified', 100),
  ('localuser@cornell.edu', 'localuser', '$2b$12$hn1eeFdV2ZTpLrXf5czKcuQxgNkZiiUNEs6xBrZawv6QzQVcxyPM.', 'Local', 'User', 'Cornell University', 'user', true, 'verified', 50)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    verification_status = EXCLUDED.verification_status;
SQL

echo "Local database ready: $DB_URL"
echo "Seed accounts:"
echo "  - localadmin@cornell.edu / Test12345"
echo "  - localuser@cornell.edu / Test12345"
