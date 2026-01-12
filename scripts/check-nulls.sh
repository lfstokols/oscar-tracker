#!/usr/bin/env bash
set -euo pipefail

DB_PATH=${DB_PATH:-"var/database/db.sqlite"}

# Require sqlite3
command -v sqlite3 >/dev/null 2>&1 || {
  echo "error: sqlite3 not found in PATH" >&2
  exit 127
}

# Usage: pipe logs into this script
# It looks for lines like:
# INFO  [alembic.autogenerate.compare] Detected NOT NULL on column 'foo.bar'
#
# For each match, it runs:
#   SELECT * FROM foo WHERE bar IS NULL;
#
# and alerts if any output is produced.

# declare -A seen=()

while IFS= read -r line; do
  # Fast filter
  [[ "$line" == *"Detected NOT NULL on column '"*"'"* ]] || continue

  # Extract the inside of the single quotes: foo.bar
  # (Greedy-safe because we take first '...' occurrence.)
  colref="${line#*Detected NOT NULL on column \'}"
  colref="${colref%%\'*}"

  # Expect exactly one dot: table.column
  if [[ "$colref" != *.* ]]; then
    echo "warn: could not parse table.column from: $line" >&2
    continue
  fi

  table="${colref%%.*}"
  column="${colref#*.}"

  # Skip duplicates
#   key="$table.$column"
#   if [[ -n "${seen[$key]+x}" ]]; then
#     continue
#   fi
#   seen["$key"]=1

  # Basic identifier safety: only allow [A-Za-z0-9_]
  # (Adjust if you truly have quoted identifiers / weird names.)
  if [[ ! "$table" =~ ^[A-Za-z0-9_]+$ ]] || [[ ! "$column" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "warn: refusing suspicious identifier: '$table.$column' (from: $line)" >&2
    continue
  fi

  sql="SELECT * FROM \"$table\" WHERE \"$column\" IS NULL;"

  # Run query; if output is non-empty => alert
  out="$(sqlite3 -batch -noheader "$DB_PATH" "$sql" || true)"
  if [[ -n "$out" ]]; then
    {
      echo "🚨 NOT NULL violation candidates found for $table.$column"
      echo "    db: $DB_PATH"
      echo "    sql: $sql"
      echo "---- rows ----"
      printf '%s\n' "$out"
      echo "--------------"
    } >&2
  fi
done
