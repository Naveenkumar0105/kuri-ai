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

Git status: tracked and not ignored

File size: 53,248 bytes

SHA-256: `9e1cf4d590eaa63bc0e013a0ee6b2b2d4ced286bb3a45b4ae40fa5cf39339c49`

The SQLite schema is an older application schema. It contains `User` and `Task` tables but does not contain the current OAuth, session, category, or task-hierarchy structures.

### Aggregate data inventory

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

`prisma/dev.db` appears in these four repository revisions:

- `9f006c6` — Refactor: Rename project to Kuri AI and fix priority updates
- `74489ec` — feat: PWA support, Auth enforcement, User Profile, and PostgreSQL migration
- `e89ea54` — feat: google calendar sync and updated readme
- `38071d6` — build: update build script and config for vercel

### Development-data classification

- Five accounts match obvious synthetic patterns.
- Two accounts do not match obvious synthetic patterns and therefore must be treated as potentially real.
- All 162 task texts must be treated as potentially personal because their content was intentionally not inspected.
- All seven password hashes must be treated as exposed security-sensitive data if the repository has been shared or made public.
- The file is a candidate for a verified development backup and later removal from active Git tracking, but no deletion, purge, history rewrite, or ignore-rule change is approved by this inventory.

## Risk summary

1. **Committed user data:** the repository contains a tracked database with user identifiers, password hashes, and task content.
2. **Historical exposure:** removing the file in a future commit would not remove it from the four existing Git revisions.
3. **Potential credential reuse:** bcrypt hashes cannot be assumed harmless merely because they came from development.
4. **Production migration risk:** production has no Prisma migration history while the deployment build accepts data loss.
5. **Production token sensitivity:** the production database contains active OAuth access and refresh token fields.
6. **Email verification gap:** none of the production users has an `emailVerified` timestamp.

## Approved next candidate

The next candidate subtask is to back up **only** the exact legacy development artifact `prisma/dev.db` identified by the size and SHA-256 above. The backup must be stored outside version control, verified by checksum, restored into a temporary location, and checked for matching schema and aggregate counts before any purge or tracking change is considered.

Production Supabase data is not part of that candidate subtask.

## Explicitly not performed

- No production or development rows were inserted, updated, or deleted.
- No database was backed up, restored, migrated, purged, or removed.
- No Git history was rewritten.
- No credentials or OAuth tokens were rotated.
- No dependency or application code was changed.
- No deployment or GitHub push was performed.
