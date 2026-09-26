# Legacy database Git history cleanup

Cleanup date: 2026-09-25

Status: reachable local and GitHub history cleaned and verified; GitHub cached-view removal ticket created and awaiting completion

## Scope

The cleanup removed only `prisma/dev.db` from every reachable Git revision. Production Supabase data, application source files, branches, and deployment state were not changed by the rewrite.

The repository had one branch (`main`), no tags, and no affected pull-request refs. The final project tree before and after rewriting was identical.

## Recovery backup

Before rewriting, the complete repository history was stored in the ignored local bundle:

`.local-backups/git/kuri-ai-before-history-rewrite-2026-09-25.bundle`

| Verification | Result |
| --- | --- |
| Bundle contains complete history | Pass |
| Bundle restore into a new repository | Pass |
| Restored pre-rewrite `main` matches the original | Pass |
| Bundle integrity check | Pass |
| File permissions | Owner read/write only (`600`) |
| Git status | Ignored by `/.local-backups/` |
| SHA-256 | `dff9e2f83ff1b77521ce4632c2eed52a7c31e8bc958af5b772d640eaeaef6602` |

The bundle contains the removed sensitive history and must never be uploaded, shared, or committed.

## Rewrite and remote verification

The rewrite used `git-filter-repo` 2.47.0 in sensitive-data-removal mode inside a fresh isolated bare clone. It parsed 17 commits and rewrote 16 commits.

| Verification | Result |
| --- | --- |
| `prisma/dev.db` in rewritten reachable objects | 0 |
| `prisma/dev.db` in rewritten commit history | 0 |
| Unreachable-object findings in cleanup repository | 0 |
| Final tree before and after rewrite | Identical |
| Fresh rewritten checkout safety test | Pass |
| TypeScript check | Pass |
| Isolated production build without environment files | Pass |
| Force update protected by exact remote lease | Pass |
| Fresh clone from GitHub contains database files | 0 |
| Fresh clone from GitHub contains the legacy path in history | 0 |
| Local and GitHub `main` aligned | Pass |

## Remaining external action

The repository is public. After the force update, GitHub's API still returned the first obsolete commit when addressed by its exact identifier. The identifier is intentionally excluded from this committed report.

GitHub's cached-view Virtual Assistant accepted a removal request on 2026-09-25 and confirmed that a ticket was created. The request included:

- affected pull-request refs: 0;
- LFS orphaning: not applicable because LFS is not in use; and
- the first changed commit identifier is retained outside the cleaned repository for the Support request.

Until GitHub confirms the purge, do not treat the historical data as fully removed from GitHub. Unknown external clones or downloads cannot be recalled.

## Preventing recurrence

- `/prisma/dev.db` is ignored permanently.
- `npm run test:legacy-db-sanitized` fails if the path becomes tracked or an unsafe local copy appears.
- Environment files and local security backups remain ignored.
- Database artifacts must not be added to Git, even when believed to contain only test data.
