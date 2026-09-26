# Legacy development database backup verification

Backup date: 2026-09-25

Repository baseline: `7e4c12f`

Status: backup created and independently restored; source was later purged in an approved separate subtask

## Scope

This backup covers only the legacy SQLite development artifact at `prisma/dev.db`. The production Supabase PostgreSQL database was not contacted and is not included in this backup.

Source classification and aggregate data details are recorded in [database-inventory.md](database-inventory.md).

## Backup artifact

| Property | Verified value |
| --- | --- |
| Source | `prisma/dev.db` |
| Local backup | `.local-backups/prisma/dev.db.2026-09-25.9e1cf4d5.backup` |
| File size | 53,248 bytes |
| SHA-256 | `9e1cf4d590eaa63bc0e013a0ee6b2b2d4ced286bb3a45b4ae40fa5cf39339c49` |
| File permissions | Owner read/write only (`600`) |
| Git status | Ignored by `/.local-backups/` |

The source and backup were byte-for-byte identical when verified.

The backup file is intentionally excluded from Git because it contains password hashes, user identifiers, and task content. Only this sanitized verification record is committed.

## Restore verification

The backup was copied to a newly created temporary directory and opened as a separate SQLite database. The original source was not used during the restore checks except for checksum and schema comparison.

| Verification | Result |
| --- | --- |
| Restored SHA-256 matches the source | Pass |
| Restored file size matches the source | Pass |
| Restored schema fingerprint matches the source | Pass |
| SQLite integrity check | `ok` |
| Restored `User` rows | 7 |
| Restored `Task` rows | 162 |
| Restored orphan tasks | 0 |
| Foreign-key check findings | 0 |
| Source checksum unchanged after verification | Pass |

Schema fingerprint used for comparison:

`521ead6df3c976d196062e09c5213f3e763bbdae5ddc9cbed76ee557b1622960`

## Safe recovery procedure

Recovery must always target a new file first. Do not overwrite `prisma/dev.db` during verification.

1. Copy the ignored backup to a new temporary path with owner-only permissions.
2. Confirm the restored file SHA-256 matches the value above.
3. Open the restored file with SQLite in read-only mode.
4. Run `PRAGMA integrity_check` and verify the aggregate row counts above.
5. Replace another database only after identifying that exact target and obtaining explicit approval.

## Post-backup status

- No production Supabase connection or backup was attempted.
- The source SQLite database was not overwritten, moved, or untracked during backup creation.
- The source's development rows were later purged in a separate approved subtask documented in [database-purge.md](database-purge.md).
- Git history was not changed during backup creation; it was later rewritten in the separately approved cleanup documented in [git-history-cleanup.md](git-history-cleanup.md).
- The sensitive backup file was not staged or committed.
- No deployment or GitHub push was performed.

## Next safety gate

The development-data purge, untracking, and approved Git history cleanup have been completed. A GitHub cached-view removal ticket has been created for the obsolete commit that remained available through GitHub's API; confirmation is pending.
