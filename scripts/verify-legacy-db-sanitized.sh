#!/bin/sh

set -eu

database_path="${1:-prisma/dev.db}"

if git ls-files --error-unmatch "$database_path" >/dev/null 2>&1; then
  echo "Legacy database is still tracked by Git: $database_path" >&2
  exit 1
fi

if ! git check-ignore -q "$database_path"; then
  echo "Legacy database is not protected by a Git ignore rule: $database_path" >&2
  exit 1
fi

if [ ! -e "$database_path" ]; then
  echo "Legacy database safety verified: tracked=no ignored=yes local_file=absent"
  exit 0
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 is required to verify the legacy database" >&2
  exit 1
fi

if [ ! -f "$database_path" ]; then
  echo "Legacy database path is not a regular file: $database_path" >&2
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

echo "Legacy database safety verified: tracked=no ignored=yes local_file=sanitized integrity=ok users=0 tasks=0 foreign_key_findings=0 freelist_pages=0"
