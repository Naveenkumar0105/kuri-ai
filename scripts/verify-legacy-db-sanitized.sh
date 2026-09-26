#!/bin/sh

set -eu

database_path="${1:-prisma/dev.db}"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 is required to verify the legacy database" >&2
  exit 1
fi

if [ ! -f "$database_path" ]; then
  echo "Legacy database not found: $database_path" >&2
  exit 1
fi

integrity_result=$(sqlite3 -readonly "$database_path" "PRAGMA integrity_check;")
user_count=$(sqlite3 -readonly "$database_path" "SELECT COUNT(*) FROM User;")
task_count=$(sqlite3 -readonly "$database_path" "SELECT COUNT(*) FROM Task;")
foreign_key_findings=$(sqlite3 -readonly "$database_path" "PRAGMA foreign_key_check;" | wc -l | tr -d ' ')
freelist_pages=$(sqlite3 -readonly "$database_path" "PRAGMA freelist_count;")

if [ "$integrity_result" != "ok" ]; then
  echo "Legacy database integrity check failed" >&2
  exit 1
fi

if [ "$user_count" -ne 0 ] || [ "$task_count" -ne 0 ]; then
  echo "Legacy database still contains user or task records" >&2
  exit 1
fi

if [ "$foreign_key_findings" -ne 0 ]; then
  echo "Legacy database contains foreign-key violations" >&2
  exit 1
fi

if [ "$freelist_pages" -ne 0 ]; then
  echo "Legacy database still contains unallocated pages; compact it before committing" >&2
  exit 1
fi

echo "Legacy database sanitation verified: integrity=ok users=0 tasks=0 foreign_key_findings=0 freelist_pages=0"
