# Legacy development database purge verification

Purge date: 2026-09-25

Repository baseline: `5e766e7`

Status: approved legacy development data purged; schema preserved; backup recovery verified

## Exact scope

The purge applied only to the legacy SQLite development artifact at `prisma/dev.db`.

The production Supabase PostgreSQL database was not contacted and was not changed.

The protected pre-purge backup is documented in [database-backup.md](database-backup.md). Its checksum and recoverability were revalidated immediately before and after the purge.

## Approved operation

The following data was removed in one SQLite transaction:

| Table | Rows before | Rows after |
| --- | ---: | ---: |
| `Task` | 162 | 0 |
| `User` | 7 | 0 |

Tasks were deleted before users to preserve the foreign-key relationship. No tables, columns, indexes, constraints, or other schema objects were removed.

## Verification

| Check | Result |
| --- | --- |
| Sanitized `User` rows | 0 |
| Sanitized `Task` rows | 0 |
| SQLite integrity check | `ok` |
| Foreign-key check findings | 0 |
| Unallocated pages after secure compaction | 0 |
| Schema fingerprint unchanged | Pass |
| Protected backup checksum unchanged | Pass |
| Protected backup restored after purge | Pass |
| Restored backup `User` rows | 7 |
| Restored backup `Task` rows | 162 |
| Restored backup integrity check | `ok` |

Schema fingerprint before and after purge:

`521ead6df3c976d196062e09c5213f3e763bbdae5ddc9cbed76ee557b1622960`

Sanitized database SHA-256:

`950e52818d24493feb91ba93ec3d045db216287ce422fd567073c53bacdf3fda`

Sanitized database size after secure compaction: 24,576 bytes (6 pages). The database was rebuilt with secure deletion enabled so deleted records were not left in reusable pages.

Protected pre-purge backup SHA-256:

`9e1cf4d590eaa63bc0e013a0ee6b2b2d4ced286bb3a45b4ae40fa5cf39339c49`

## Regression check

Run this command from the repository root:

```sh
npm run test:legacy-db-sanitized
```

The check fails if the tracked legacy database contains any user or task rows, has an integrity problem, has a foreign-key violation, or retains unallocated pages after compaction. It never prints row contents.

## Recovery status

The pre-purge data remains recoverable from the local ignored backup. Recovery must target a new file and pass the checksum, integrity, schema, and aggregate-count checks in [database-backup.md](database-backup.md) before replacing any database.

## Remaining exposure

- The empty SQLite file is still tracked in the current working tree.
- Earlier Git revisions still contain the pre-purge database.
- The protected local backup still contains the original sensitive data and must remain ignored and permission-restricted.
- No Git history cleanup has been approved or performed.

## Explicitly not performed

- No production data was read, changed, or deleted.
- No database file, table, or schema object was deleted.
- The legacy database was not untracked.
- No Git history was rewritten.
- No deployment or GitHub push was performed.
