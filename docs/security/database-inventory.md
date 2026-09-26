# Database security inventory

Inventory date: 2026-09-25

Repository baseline: `9708b06`

Status: read-only inventory; no data was changed

## Scope and safeguards

This inventory covers:

1. the production Supabase PostgreSQL database configured by `DATABASE_URL`; and
2. the legacy SQLite database committed at `prisma/dev.db`.

The production database was queried inside a read-only transaction. Queries returned only table names, aggregate row counts, integrity counts, and boolean data-class indicators. No email addresses, names, task text, password hashes, OAuth tokens, connection details, or other row values were printed or copied into this report.

The SQLite database was opened in read-only mode. Its integrity and aggregate counts were inspected without printing record values.

The synthetic-data counts below are heuristic. They match obvious markers such as `test`, `demo`, `sample`, `localhost`, and reserved example domains. A record that matches one of those markers is not guaranteed to be harmless, and a record that does not match is not proven to represent a real user.

## Production: Supabase PostgreSQL

Environment classification: **production**, confirmed by the project owner.

### Schema inventory

The production database contains these application tables:

- `Account`
- `Category`
- `Session`
- `Task`
- `User`
- `VerificationToken`

There is no `_prisma_migrations` table. The repository also contains no Prisma migrations. The current deployment build uses `prisma db push --accept-data-loss`, so production schema changes are not migration-backed or auditable.

### Aggregate data inventory

| Data class | Count |
| --- | ---: |
| Users | 6 |
| Users with a password credential | 5 |
| Password credentials with a bcrypt-like format | 5 |
| Users with an `emailVerified` timestamp | 0 |
| Users matching obvious synthetic-email patterns | 1 |
| Users not matching obvious synthetic-email patterns | 5 |
| OAuth accounts | 1 |
| OAuth accounts with an access token | 1 |
| OAuth accounts with a refresh token | 1 |
| Users having both password and OAuth login methods | 0 |
| Tasks | 92 |
| Tasks with non-empty text | 92 |
| Tasks with descriptions | 0 |
| Tasks with due dates | 17 |
| Completed tasks | 28 |
| Subtasks | 20 |
| Categories | 1 |
| Database-backed sessions | 0 |
| Verification tokens | 0 |

### Integrity indicators

| Check | Result |
| --- | ---: |
| Tasks without an owning user | 0 |
| OAuth accounts without an owning user | 0 |
| Duplicate normalized-email groups | 0 |

### Production classification

- The five users that do not match obvious synthetic patterns must be treated as real or potentially real users unless the owner verifies otherwise.
- Task text is user content and must be treated as potentially personal, even when the related account looks synthetic.
- Password hashes, access tokens, and refresh tokens are security-sensitive data.
- No production rows are approved for deletion.
- Production is explicitly excluded from the backup and purge work intended for the legacy development database unless a separate production-safe backup plan is approved later.

## Legacy development artifact: SQLite

Path: `prisma/dev.db`

Runtime status: not used by the current PostgreSQL Prisma datasource

Git status: no longer tracked; ignored at `/prisma/dev.db`

Original file size: 53,248 bytes

Original SHA-256: `9e1cf4d590eaa63bc0e013a0ee6b2b2d4ced286bb3a45b4ae40fa5cf39339c49`

Current sanitized file size: 24,576 bytes

Current sanitized SHA-256: `950e52818d24493feb91ba93ec3d045db216287ce422fd567073c53bacdf3fda`

The SQLite schema is an older application schema. It contains `User` and `Task` tables but does not contain the current OAuth, session, category, or task-hierarchy structures.

### Original aggregate data inventory

These counts describe the pre-purge data preserved in the protected local backup. The tracked SQLite database now contains zero users and zero tasks. Purge evidence is recorded in [database-purge.md](database-purge.md).

| Data class | Count |
| --- | ---: |
| Users | 7 |
| Users with an email value | 7 |
| Users with a password credential | 7 |
| Password credentials with a bcrypt-like format | 7 |
| Users with a name value | 7 |
| Users matching obvious synthetic-email patterns | 5 |
| Users not matching obvious synthetic-email patterns | 2 |
| Tasks | 162 |
| Tasks with non-empty text | 162 |
| Tasks with descriptions | 0 |
| Tasks with due dates | 6 |
| Completed tasks | 5 |
| Tasks without an owning user | 0 |

SQLite's integrity check returned `ok`.

### Git exposure

Before remediation, `prisma/dev.db` appeared across four historical revisions. On 2026-09-25, the repository history was rewritten to remove that path from every reachable commit. The obsolete commit identifiers are intentionally omitted so this document does not provide pointers to sensitive cached objects. Verification is recorded in [git-history-cleanup.md](git-history-cleanup.md).

### Development-data classification

- Five accounts match obvious synthetic patterns.
- Two accounts do not match obvious synthetic patterns and therefore must be treated as potentially real.
- All 162 task texts must be treated as potentially personal because their content was intentionally not inspected.
- All seven password hashes must be treated as exposed security-sensitive data if the repository has been shared or made public.
- The original data is preserved in verified, ignored local backups. The working copy was purged, securely compacted, removed from active Git tracking, and ignored. Reachable local and GitHub history was subsequently rewritten and verified.

## Risk summary

1. **Cached historical exposure:** fresh clones and reachable Git history are clean, but GitHub's API still returns the first obsolete commit by its exact identifier. A GitHub Support purge is required to remove cached views and unreachable objects.
2. **External copies:** any unknown clone or download made before remediation cannot be revoked; affected legacy passwords must be treated as exposed if reused elsewhere.
3. **Potential credential reuse:** bcrypt hashes cannot be assumed harmless merely because they came from development.
4. **Production migration risk:** production has no Prisma migration history while the deployment build accepts data loss.
5. **Production token sensitivity:** the production database contains active OAuth access and refresh token fields.
6. **Email verification gap:** none of the production users has an `emailVerified` timestamp.

## Backup status

The exact legacy development artifact identified above was backed up locally, excluded from version control, restored to a temporary location, and verified for checksum, schema, integrity, and aggregate row counts. The working copy was subsequently purged without changing its schema, securely compacted, removed from active Git tracking, and ignored. Evidence is recorded in [database-backup.md](database-backup.md) and [database-purge.md](database-purge.md).

Production Supabase data was not part of the backup.

## Explicitly not performed

- No production rows were inserted, updated, or deleted.
- The approved legacy development rows were purged in the separately documented purge subtask.
- No production database was backed up, restored, migrated, purged, or removed.
- The approved Git history cleanup was performed separately and is documented in [git-history-cleanup.md](git-history-cleanup.md).
- No credentials or OAuth tokens were rotated.
- No dependency or application code was changed.
- No deployment or GitHub push was performed.
