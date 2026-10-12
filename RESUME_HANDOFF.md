# Kuri AI — Project Analysis and Resume Handoff

## Executive summary

Kuri AI is a full-stack task-management product that turns natural-language input into structured, actionable work. The app combines Gemini-powered task organization, date extraction, task decomposition, dynamic categorization, Google Calendar integration, authenticated persistence, responsive UI, PWA support, and an in-progress shared-workspace/desktop experience.

The repository shows a working individual productivity product plus a substantial uncommitted collaboration expansion. The safest resume framing is to describe the individual task-management, AI, authentication, calendar, responsive UI, PWA, and security work as completed, while labeling shared spaces, activity feeds, task claiming, voice transcription API, the Kuri companion, and Tauri packaging as current/in-progress work until they are committed and fully tested.

## Product problem and solution

Kuri AI addresses the friction between thinking of a task and organizing it. A user can enter a plain-language request such as “finish the report by Friday at 5,” and the product can:

- identify task intent;
- assign or create a category;
- extract a scheduled time or deadline;
- preserve the user's timezone offset;
- split broad goals into smaller tasks;
- let the user review AI changes based on a saved preference;
- persist the result in PostgreSQL;
- optionally create a Google Calendar event.

The UI also supports ordinary task management without AI, including quick add, editing, completion, deletion, priority sorting, category filtering, parent/subtask relationships, dark mode, and responsive layouts.

## Implemented and committed work

### AI-assisted task organization

- Integrated Google Gemini 2.5 Flash through a server route for natural-language task parsing.
- Implemented task categorization with standard categories and dynamic one-word categories when needed.
- Added decomposition of broad goals into 3–10 actionable subtasks.
- Extracted due dates and scheduled times from free-form text.
- Distinguished deadlines (`due`) from scheduled events (`scheduled`).
- Added a non-AI fallback path so task creation still works when the model or API key is unavailable.
- Added a review modal that lets users edit AI-generated task text and categories, accept a breakdown, or retain the original task.
- Added user-selectable AI confirmation behavior: confirm every change, confirm task splits only, or apply changes automatically.

### Timezone and date reliability

- Fixed production timezone errors by passing the user's raw local date/time context to the model.
- Required generated dates to include an explicit ISO 8601 timezone offset rather than assuming the server's UTC timezone.
- Addressed an observed eight-hour production date shift through prompt and parsing changes.

### Task-management experience

- Built authenticated task CRUD backed by Prisma and PostgreSQL.
- Added optimistic task creation for a faster interface.
- Implemented task completion, editing, deletion, priority, descriptions, due dates, and scheduled dates.
- Added hierarchical parent/subtask relationships and completion progress.
- Added category creation, renaming, deletion, filtering, and dynamic category counts.
- Added priority sorting and persistent task organization.
- Added undo affordances for applicable UI actions.
- Added responsive desktop/mobile layouts, animated interactions, theme switching, and accessible labels on key controls.

### Authentication and user data

- Implemented Google OAuth and email/password authentication with NextAuth.
- Used bcrypt for password hashing and verification.
- Added Prisma-backed account/session persistence and JWT sessions.
- Requested only the Google Calendar event scope needed to create calendar events.
- Added a custom account-linking adapter path to sanitize provider fields before database writes.
- Added route-level session checks and user-scoped database queries.

### Google Calendar integration

- Connected authenticated Google accounts to the Calendar API.
- Created one-hour calendar events from dated tasks.
- Supported manual calendar sync and automatic sync when a new task contains a date.
- Implemented OAuth token refresh handling and persistence of refreshed credentials.
- Added a public privacy policy explaining Google data usage and calendar permissions.

### Product delivery and platform work

- Migrated persistence to PostgreSQL with Prisma.
- Added PWA metadata, installable icons, and service-worker assets.
- Added a public landing page and privacy page for Google OAuth verification.
- Added Google site-verification metadata.
- Updated Next.js and build configuration to address a security advisory and deployment/build compatibility issues.
- Added deployment-oriented environment configuration documentation.

### Security and data hygiene

- Removed a legacy development database from source tracking.
- Purged legacy development records and documented the cleanup.
- Added a repeatable verification script checking that the legacy database is ignored, sanitized, structurally valid, and contains no user/task records.
- Documented database inventory, backup, purge, and Git-history cleanup work.

## Current uncommitted/in-progress work

These features are present in the working tree but should not be claimed as fully shipped until the branch is committed and end-to-end testing is completed.

### Shared workspaces

- Create named shared spaces with generated invite codes.
- Join a space using an invite code.
- Track owners and members with role-aware membership records.
- Scope task visibility to personal tasks or spaces the user belongs to.
- Display member counts and unread activity counts.

### Collaborative task ownership

- Claim and release shared tasks.
- Prevent claiming completed tasks.
- Use an atomic conditional update to reduce double-claim race conditions.
- Auto-claim an unclaimed shared task when a user completes it.
- Restrict shared-task deletion to the task creator or space owner.

### Activity feed

- Record space creation, member joins, task creation, updates, claims, releases, completion, reopening, and deletion.
- Display a relative-time activity panel.
- Track last-viewed activity per membership and calculate unread counts.
- Poll activity and shared-space state for near-real-time UI updates.

### Capture and companion experience

- Added browser speech recognition to fill the main task input.
- Added a Gemini-backed audio transcription API as a second voice-processing path.
- Added a floating “Kuri” quick-capture companion with keyboard shortcut support, animated states, space selection, success/error feedback, and an attention badge for unclaimed shared tasks.
- Added a dedicated companion page.

### Desktop packaging

- Added a Tauri 2 wrapper and desktop build configuration.
- Added platform icons and permissions/capability configuration.
- Configured the desktop shell to launch the Next.js application in a native window.

## Architecture and technical decisions

- **Frontend:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide icons, and `next-themes`.
- **Backend:** Next.js route handlers with session-aware authorization.
- **Data:** PostgreSQL, Prisma ORM, relational models for users, accounts, sessions, tasks, categories, shared spaces, memberships, and task activity.
- **AI:** Gemini 2.5 Flash for classification, decomposition, date extraction, and audio transcription.
- **Integrations:** Google OAuth and Google Calendar API.
- **Distribution:** Web app, PWA assets, Vercel-oriented build configuration, and an in-progress Tauri desktop wrapper.

Important implementation choices:

- The task API limits reads to a user's personal tasks and shared spaces in which they are a member.
- Shared-space mutations verify membership before creating tasks or exposing activity.
- Parent-task creation checks that the parent is accessible and belongs to the same task scope.
- The claim endpoint uses `updateMany` with `claimedById: null` and `completed: false` to make concurrent claims safer.
- AI failures degrade to a simple local split/fallback response instead of blocking task entry.
- Dates carry the user's offset to avoid deployment-region timezone bugs.

## Evidence and validation status

Checked on October 2, 2026:

- TypeScript validation: **passes** (`tsc --noEmit`).
- Next.js production compilation: **passes** when run directly without the database-mutation wrapper.
- Legacy database safety check: **passes**; tracked=no, ignored=yes, sanitized=yes, users=0, tasks=0, database integrity=ok.
- ESLint: **does not pass**; 11 errors and 123 warnings remain. Most warnings come from generated service-worker/workbox assets, while source issues include unused values, explicit `any`, unescaped text, and effect-related warnings.
- Google Calendar live test: **not verified in this environment** because access to Google's OAuth endpoint was unavailable. The integration code and OAuth flow are present, but a successful live event creation should be confirmed separately.
- Automated application tests: limited. The repository contains small scripts rather than a full unit/integration/end-to-end suite.
- Working tree: substantial uncommitted changes exist, especially for collaboration, voice, companion, and desktop features.

## Honest project metrics

- 19 commits in the visible repository history.
- Approximately 5,646 added and 703 deleted lines across 60 historically touched files, excluding the package lockfile.
- Current tracked working-tree changes add roughly 1,021 lines and remove roughly 311 lines, plus several new untracked feature files.
- The metrics describe implementation scope, not user adoption or business impact; no analytics, user-count, retention, or performance benchmark evidence is present in the repository.

## Resume-ready bullets

Choose 3–5 bullets that best match the target role. Do not use every bullet on one resume.

### Strong general software-engineering version

- Built Kuri AI, a full-stack task-management application using Next.js 16, React 19, TypeScript, PostgreSQL, and Prisma, supporting authenticated task CRUD, priorities, categories, due dates, and hierarchical subtasks.
- Integrated Gemini 2.5 Flash to convert natural-language requests into categorized tasks, extract deadlines, and decompose complex goals into 3–10 editable action items with graceful fallback behavior.
- Implemented Google OAuth and Calendar integration with refresh-token persistence, enabling users to create calendar events from scheduled tasks while enforcing session-based data access.
- Diagnosed and fixed an eight-hour production scheduling error by preserving the user's timezone offset through the AI date-extraction and event-creation flow.
- Delivered responsive, theme-aware web and PWA experiences with optimistic updates, animated interactions, mobile layouts, and accessible control labels.

### AI/product-focused version

- Designed an AI-assisted task workflow that classifies free-form input, creates dynamic categories, distinguishes deadlines from scheduled events, and turns broad goals into editable subtasks.
- Added configurable human-in-the-loop controls that let users review every AI change, review task decomposition only, or apply results automatically with undo support.
- Improved AI reliability in production by supplying raw user-local time context, requiring offset-aware ISO 8601 output, and providing deterministic fallback behavior when Gemini is unavailable.
- Combined AI-generated task metadata with PostgreSQL persistence and Google Calendar event creation to move users from natural-language capture to scheduled action in one flow.

### Backend/full-stack version

- Developed session-protected Next.js API routes and Prisma data models for users, OAuth accounts, tasks, categories, parent/subtask relationships, preferences, and calendar-backed scheduling.
- Enforced user-scoped authorization across task reads and mutations and sanitized OAuth provider data before account persistence.
- Implemented OAuth token refresh storage and Google Calendar event creation for dated tasks, including manual and automatic synchronization paths.
- Strengthened data hygiene by removing a legacy database from version control, purging development records, and adding an automated sanitization/integrity verification script.

### Collaboration features — use only after the current work is shipped

- Extended Kuri AI with invite-based shared workspaces, role-aware membership, collaborative task visibility, and per-space activity tracking.
- Implemented atomic task claiming/releasing to reduce race conditions, plus creator/owner authorization for shared-task deletion.
- Built an unread activity system covering member joins and task lifecycle events, with relative-time updates and near-real-time polling.
- Added a keyboard-accessible quick-capture companion and voice input paths for creating personal or shared tasks with minimal interruption.

## Suggested project entry

**Kuri AI — AI-Powered Task Manager**  
Next.js, React, TypeScript, PostgreSQL, Prisma, Gemini API, NextAuth, Google Calendar API, Tailwind CSS

- Built a full-stack task manager that converts natural language into structured tasks, categories, deadlines, and editable subtasks using Gemini 2.5 Flash.
- Implemented secure Google/email authentication, user-scoped persistence, and Google Calendar synchronization with OAuth token refresh handling.
- Resolved production timezone drift by preserving client offsets across AI parsing and calendar event creation, eliminating an observed eight-hour scheduling error.
- Delivered an installable, responsive PWA with optimistic updates, task hierarchies, priority sorting, dark mode, and AI confirmation controls.

## Guidance for the next chat

Ask the next chat to tailor the bullets to a specific job description and desired seniority. It should preserve the distinction between committed features and current working-tree features, avoid unsupported claims about users or performance, and select only the most relevant 3–5 bullets. Strongest evidence-backed themes are full-stack ownership, applied AI integration, timezone debugging, OAuth/calendar integration, security/data cleanup, and product-focused UX.
