# SAM Context Gathering Engine - Architecture

> How SAM automatically knows what page you're on, what forms are visible,
> what content is displayed, and what actions it can help with.

**Version**: 1.1.0
**Last Updated**: February 2026
**Status**: ACTIVE

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Architecture Overview](#architecture-overview)
3. [Data Flow](#data-flow)
4. [Core Types](#core-types)
5. [Client-Side Collection](#client-side-collection)
6. [Auto-Sync Mechanism](#auto-sync-mechanism)
7. [API Endpoint](#api-endpoint)
8. [Context Gathering Engine](#context-gathering-engine)
9. [Memory Hydration](#memory-hydration)
10. [Prisma Store & Schema](#prisma-store--schema)
11. [Integration Layer](#integration-layer)
12. [Consuming Context in Routes](#consuming-context-in-routes)
13. [Confidence Scoring](#confidence-scoring)
14. [Page Intent & Action Mapping](#page-intent--action-mapping)
15. [Stack Management](#stack-management)
16. [Response Engine Prompt Injection](#response-engine-prompt-injection)
17. [File Reference Map](#file-reference-map)
18. [Sequence Diagram](#sequence-diagram)

---

## Problem Statement

Before the Context Gathering Engine, SAM's page awareness was fragmented:

- `useSAMPageContext` detected page type but missed form metadata
- `useSAMFormAutoDetect` scanned forms but had no validation rules
- `useSAMPageLinks` collected navigation but was disconnected from other context
- Entity data wasn't pre-loaded before user asked questions
- No unified snapshot was taken on page navigation
- Multiple competing context sources with no single pipeline

**Result**: When a user asked "fill this form" or "analyze this with Bloom's", SAM often
lacked the context to provide a useful answer.

---

## Architecture Overview

```
CLIENT (Browser)                              SERVER (Next.js API)
+------------------------------+              +-------------------------------+
|                              |    POST      |                               |
| useContextGathering()        |---snapshot-->| /api/sam/context              |
|  - DOM inspection            |   (2s delay) |   - Zod validation            |
|  - Form field scanning       |              |   - Auth check                |
|  - Heading/content extraction|              |   - processContextSnapshot()  |
|  - Link categorization       |              +----------|--------------------+
|  - Scroll/focus tracking     |                         |
|  - MutationObserver (SPA)    |                         v
|  - Custom providers          |              +-------------------------------+
+--------|---------------------+              | fetchEntityContext()           |
         |                                    |   - Course data from Prisma   |
         |                                    |   - Chapter/Section data      |
         v                                    |   - User profile data         |
+------------------------------+              +----------|--------------------+
| useContextMemorySync()       |                         |
|  - Debounce 2 seconds        |                         v
|  - contentHash dedup         |              +-------------------------------+
|  - POST to /api/sam/context  |              | ContextGatheringEngine        |
|  - Silent failure            |              |  (extends BaseEngine)         |
+------------------------------+              |                               |
                                              |  1. Enrich snapshot           |
                                              |  2. Build summaries           |
                                              |  3. Infer page intent         |
                                              |  4. Determine actions         |
                                              |  5. Calculate confidence      |
                                              |  6. Produce memory directives |
                                              +----------|--------------------+
                                                         |
                                                         v
                                              +-------------------------------+
                                              | ContextMemoryHydrator         |
                                              |  - Diff vs previous snapshot  |
                                              |  - Store in Prisma            |
                                              |  - Vector ingestion (future)  |
                                              |  - Session context update     |
                                              |  - Knowledge graph (future)   |
                                              +-------------------------------+
                                                         |
                                                         v
                                              +-------------------------------+
                                              | SAMPageContextSnapshot (DB)   |
                                              |  - Full JSON snapshot         |
                                              |  - pageSummary text           |
                                              |  - confidence score           |
                                              |  - Indexed by user + path     |
                                              +-------------------------------+
```

---

## Data Flow

The system operates as a continuous pipeline that fires automatically on every page navigation:

```
1. User navigates to /courses/abc123
                    |
2. useContextGathering() fires (500ms debounce)
   - Scans DOM: forms, headings, links, content, scroll position
   - Produces PageContextSnapshot with contentHash
                    |
3. useContextMemorySync() detects new contentHash (2s debounce)
   - Compares against last synced hash
   - If different: POST /api/sam/context { snapshot }
                    |
4. API route validates with Zod, authenticates user
                    |
5. processContextSnapshot() orchestrates:
   a. fetchEntityContext() - loads course/chapter/section from DB
   b. engine.execute() - runs ContextGatheringEngine
   c. hydrator.hydrate() - stores snapshot + computes diff
   d. store.updateSummaryAndConfidence() - saves enriched summary
                    |
6. Response: { contextId, pageIntent, confidence, availableActions }
                    |
7. Later: user sends message to SAM
   - Unified route calls getContextSummaryForRoute(userId)
   - Retrieves latest stored snapshot
   - Injects pageSummary + formSummary into AI prompt
   - SAM responds with full page awareness
```

---

## Core Types

All types live in `packages/core/src/types/context-snapshot.ts` (portable, no Prisma imports).

### PageContextSnapshot (Root Type)

```typescript
interface PageContextSnapshot {
  version: string;          // "1.0.0" - schema version for migrations
  timestamp: number;        // Date.now() when snapshot was taken
  contentHash: string;      // Hash for change detection (dedup)

  page: PageSnapshot;       // URL, title, entityId, page state
  forms: FormSnapshot[];    // ALL forms with full field metadata
  content: ContentSnapshot; // Headings, tables, code blocks, text
  navigation: NavigationSnapshot;  // Links, tabs, sidebar, pagination
  interaction: InteractionSnapshot; // Scroll, focus, selection, time
  custom: Record<string, unknown>; // From custom providers
}
```

### Key Sub-Types

| Type | Purpose | Key Fields |
|------|---------|------------|
| `PageSnapshot` | Page identity + state | `type`, `path`, `entityId`, `state.isEditing`, `breadcrumb` |
| `FormSnapshot` | Complete form metadata | `purpose`, `fields[]`, `state.completionPercent`, `validation` |
| `FormFieldSnapshot` | Individual field data | `name`, `type`, `value`, `label`, `required`, `validationState`, `options` |
| `ContentSnapshot` | Visible page content | `headings[]`, `tables[]`, `codeBlocks[]`, `textSummary`, `wordCount` |
| `NavigationSnapshot` | Available navigation | `links[]` (categorized), `tabs[]`, `sidebar[]`, `pagination` |
| `InteractionSnapshot` | User interaction state | `scrollPosition`, `focusedElement`, `selectedText`, `timeOnPage` |

### Engine I/O Types

| Type | Purpose |
|------|---------|
| `ContextGatheringInput` | Raw snapshot + optional enrichment data |
| `ContextGatheringOutput` | Enriched snapshot + summaries + intent + actions + directives |
| `MemoryDirectives` | What to store: content chunks, entities, session updates |
| `ContextDiff` | What changed: sections, fields, values, content |
| `HydrationResult` | What was stored: sections updated, vectors queued, etc. |

---

## Client-Side Collection

**File**: `packages/react/src/hooks/useContextGathering.ts`
**Package**: `@sam-ai/react`

### What It Scans

The hook performs a comprehensive DOM scan when the page loads or changes:

```
useContextGathering()
  |
  +-- detectPageContext()
  |     - window.location.pathname
  |     - document.title
  |     - data-page-type, data-entity-id attributes
  |     - <meta> tags and LD+JSON
  |     - Page state: isEditing, isDraft, hasUnsavedChanges
  |     - Breadcrumb from data-breadcrumb or nav elements
  |
  +-- scanForms()
  |     - All <form> elements (up to maxForms, default 5)
  |     - Every <input>, <select>, <textarea> with:
  |       - Resolved label (via <label>, aria-label, aria-describedby, parent)
  |       - Current value, placeholder, helpText
  |       - Validation: required, disabled, readOnly, hidden
  |       - Options for select/radio/checkbox
  |       - Constraints: min, max, minLength, maxLength, pattern, step
  |       - data-* attributes
  |       - Validation state and error messages
  |     - Form state: isDirty, isValid, completionPercent
  |     - Field groups from <fieldset> or data-group
  |     - Inferred purpose: create, edit, search, filter, settings
  |
  +-- extractContent()
  |     - Headings h1-h6 with text and id (excludes SAM widget)
  |     - Tables with headers and row count (excludes SAM widget)
  |     - Code blocks with language detection (excludes SAM widget)
  |     - Images with alt text (excludes SAM widget)
  |     - Visible text (first 5000 chars via TreeWalker on <main>)
  |     - Word count and reading time estimate
  |     - EXCLUSIONS: [data-sam-theme], nav.sidebar, aside, [role="navigation"]
  |
  +-- analyzeNavigation()
  |     - All <a> links categorized:
  |       navigation, action, external, resource, breadcrumb, pagination
  |     - Active tabs
  |     - Sidebar items with depth
  |     - Pagination state
  |
  +-- captureInteraction()
  |     - Scroll position (% scrolled)
  |     - Viewport height
  |     - Focused element selector
  |     - Selected text
  |     - Time on page (seconds)
  |
  +-- computeContentHash()
        - Hash of: path + title + pageType + form fields + values
        - Used for deduplication (skip if hash unchanged)
```

### Change Detection

The hook uses three mechanisms to detect changes:

1. **MutationObserver** on `document.body` - catches SPA DOM mutations
2. **popstate + pushstate** listeners - catches SPA URL navigation
3. **input/change** event listeners - catches form field changes

All triggers are debounced at 500ms (configurable via `debounceMs`).

### Hook API

```typescript
function useContextGathering(options?: UseContextGatheringOptions): {
  snapshot: PageContextSnapshot | null;  // Latest snapshot
  isGathering: boolean;                   // Currently scanning
  lastUpdated: Date | null;              // When last snapshot was produced
  refresh: () => void;                    // Force re-scan
  registerProvider: (provider: ContextProvider) => void; // Add custom data
}
```

### Custom Providers

Host apps can register domain-specific data collectors:

```typescript
const { registerProvider } = useContextGathering();

registerProvider({
  name: 'bloom-level',
  gather: () => ({
    currentLevel: 'analyze',
    targetLevel: 'evaluate',
  }),
});
// Data appears in snapshot.custom['bloom-level']
```

---

## Auto-Sync Mechanism

**File**: `packages/react/src/hooks/useContextMemorySync.ts`
**Package**: `@sam-ai/react`

This hook bridges `useContextGathering` with the server API:

```
useContextMemorySync()
  |
  +-- Calls useContextGathering() internally
  |
  +-- On snapshot change:
  |     1. Check if contentHash differs from last synced hash
  |     2. If same hash: skip (no changes)
  |     3. If different: wait 2 seconds (debounce)
  |     4. POST to /api/sam/context with snapshot
  |     5. On success: update lastSyncedHash
  |     6. On failure: silently ignore (non-blocking)
  |
  +-- Returns: { snapshot, isGathering, lastSynced, syncCount, refresh }
```

### Deduplication Strategy

Two layers prevent redundant API calls:

| Layer | Mechanism | Where |
|-------|-----------|-------|
| Client-side | `contentHash` comparison in `useContextMemorySync` | Before HTTP request |
| Server-side | `contentHash` comparison in `ContextMemoryHydrator` | Before DB write |

### Integration with ChatWindow

The hook is wired into `components/sam/chat/ChatWindow.tsx`:

```typescript
// ChatWindow.tsx
const { snapshot } = useContextMemorySync({ enabled: isChatOpen });
// Snapshots auto-sync whenever the chat is open and page changes
```

---

## API Endpoint

**File**: `app/api/sam/context/route.ts`
**Method**: `POST /api/sam/context`

### Request/Response

```
Request:
  POST /api/sam/context
  Body: {
    snapshot: PageContextSnapshot   // Full Zod-validated snapshot
  }

Response (200):
  {
    success: true,
    data: {
      contextId: string,          // contentHash
      pageIntent: string,         // "Viewing course overview..."
      confidence: number,         // 0.0 - 1.0
      availableActions: string[], // ["explain-course", "suggest-study-plan", ...]
    }
  }
```

### Validation

The route validates the entire `PageContextSnapshot` structure with a comprehensive
Zod schema (168 lines) covering every nested field, type, and constraint. Invalid
snapshots return 400 with flattened error details.

### Auth

Uses `currentUserOrAdmin()` - requires authenticated session.

---

## Context Gathering Engine

**File**: `packages/core/src/engines/context-gathering.ts`
**Package**: `@sam-ai/core`
**Extends**: `BaseEngine<ContextGatheringInput, ContextGatheringOutput>`

### Characteristics

| Property | Value | Why |
|----------|-------|-----|
| Dependencies | `[]` (none) | Runs first, no other engines needed |
| Cache | Disabled | Context must always be fresh |
| AI calls | None | Purely computational, no LLM usage |
| Portability | Full | No Prisma, no Taxomind imports |

### Processing Pipeline

```
process(input) {
  1. enrichSnapshot(snapshot, enrichmentData)
     - Merge client snapshot with server-side entity data
     - Fill in missing entityId, title from DB lookup

  2. buildPageSummary(page, entityContext)
     - "Page: Options 101"
     - "Type: course-detail"
     - "Entity: Options 101 (course)"
     - "Description: Learn options trading..."

  3. buildFormSummary(forms)
     - "2 form(s) on page:"
     - "Form: course-settings (purpose: edit)"
     - "  Status: 60% complete, 1 error(s)"
     - "  - Title (text): "Options 101" [required]"

  4. buildContentSummary(content)
     - "Headings: # Options 101, ## Chapter 1..."
     - "Content: 1234 words (~5 min read)"
     - "Tables: 2, Code blocks: 3"

  5. buildNavigationSummary(navigation)
     - "Tabs: Overview, Chapters, Reviews (active: Overview)"
     - "Sidebar: 5 items, active: Introduction"

  6. inferPageIntent(snapshot, enrichment)
     - Maps page type to human-readable intent
     - Refines with form presence and entity data
     - Example: "Viewing course overview — 'Options 101'"

  7. determineAvailableActions(snapshot)
     - Combines page-type actions + form actions + content actions
     - Example: ["explain-course", "suggest-study-plan", "fill-form"]

  8. calculateConfidence(snapshot, enrichment)
     - Weighted score: page type, title, entityId, entity context, etc.
     - Range: 0.0 to 1.0

  9. produceMemoryDirectives(snapshot, enrichment)
     - shouldIngestContent: true if wordCount > 50
     - sessionContextUpdates: current page + form info
     - entitiesForGraph: from enrichment data
}
```

---

## Memory Hydration

**File**: `packages/core/src/memory/context-memory.ts`
**Package**: `@sam-ai/core`

### ContextMemoryHydrator

Computes diffs and persists snapshots through adapter interfaces:

```
hydrate(userId, snapshot, directives) {
  1. Get previous snapshot from adapter
  2. computeContextDiff(previous, current)
     - Compare: page, forms, content, navigation, interaction
     - Track: new fields, changed values, new/removed content
  3. If no changes AND same contentHash: skip hydration
  4. Store new snapshot via adapter.storeSnapshot()
  5. If shouldIngestContent: queue vectors (future)
  6. If shouldUpdateSessionContext: update session (future)
  7. If shouldUpdateKnowledgeGraph: add entities (future)
  8. Return HydrationResult
}
```

### Diff Detection

The diff engine compares each section:

| Section | What It Compares |
|---------|-----------------|
| `page` | Path change, type change |
| `forms` | New forms, new fields, changed field values |
| `content` | Text summary changes |
| `navigation` | Link count changes |
| `interaction` | Scroll > 10% change, focus element change |

### Adapter Interface (Portable)

```typescript
interface ContextMemoryAdapter {
  storeSnapshot(userId: string, snapshot: PageContextSnapshot): Promise<string>;
  getLatestSnapshot(userId: string): Promise<PageContextSnapshot | null>;
  getSnapshotHistory(userId: string, limit?: number): Promise<PageContextSnapshot[]>;
}
```

The `InMemoryContextMemoryAdapter` is provided for testing.
The `PrismaContextSnapshotStore` implements this for production.

---

## Prisma Store & Schema

### Schema

**File**: `prisma/domains/17-sam-agentic.prisma`
**Table**: `sam_page_context_snapshots`

```prisma
model SAMPageContextSnapshot {
  id          String   @id @default(cuid())
  userId      String
  pageType    String
  pagePath    String
  contentHash String
  snapshot    Json                          // Full PageContextSnapshot
  summary     String   @default("")        // Engine-generated pageSummary
  confidence  Float    @default(0)         // 0.0 - 1.0 confidence score
  createdAt   DateTime @default(now())

  user        User     @relation(...)

  @@index([userId, createdAt(sort: Desc)])  // Latest snapshot query
  @@index([userId, pagePath])               // Path-specific lookup
  @@index([contentHash])                    // Dedup check
  @@map("sam_page_context_snapshots")
}
```

### Store Implementation

**File**: `lib/sam/stores/context-snapshot-store.ts`

```
PrismaContextSnapshotStore implements ContextMemoryAdapter
  |
  +-- storeSnapshot(userId, snapshot) -> creates DB record, returns ID
  +-- getLatestSnapshot(userId) -> most recent by createdAt DESC
  +-- getSnapshotHistory(userId, limit) -> last N snapshots
  +-- getLatestSnapshotForPath(userId, path) -> latest for specific URL
  +-- updateSummaryAndConfidence(id, summary, confidence) -> post-engine update
  +-- cleanupOldSnapshots(userId, keepLast) -> prune old records
```

---

## Integration Layer

**File**: `lib/sam/context-gathering-integration.ts`

This is the Taxomind-specific wiring that connects portable components to Prisma:

### processContextSnapshot()

The main orchestration function called by the API route:

```
processContextSnapshot(clientSnapshot, { samConfig, userId, userRole })
  |
  1. fetchEntityContext(pageType, entityId)
  |    - If page type includes "section": fetchSectionContext(entityId)
  |    - If page type includes "chapter": fetchChapterContext(entityId)
  |    - If page type includes "course": fetchCourseContext(entityId)
  |    - Returns EntityContextData with title, description, metadata
  |
  2. createContextGatheringEngine(samConfig).execute(input)
  |    - Runs the portable engine with snapshot + enrichment
  |    - Returns ContextGatheringOutput
  |
  3. createContextMemoryHydrator({ adapter: store }).hydrate(...)
  |    - Stores snapshot, computes diff
  |    - Returns HydrationResult with snapshotId
  |
  4. store.updateSummaryAndConfidence(snapshotId, summary, confidence)
  |    - Writes engine-generated summary back to DB record
  |
  5. Return ContextGatheringOutput
```

### getContextSummaryForRoute()

Rich function that rebuilds structured summaries from the stored snapshot for the unified chat route. Returns **four** separate summary dimensions:

```typescript
// Called by /api/sam/unified/ and /api/sam/unified/stream when user sends a message
const context = await getContextSummaryForRoute(userId);
// Returns: { pageSummary, formSummary, contentSummary, navigationSummary }
// All four strings are forwarded to the Response Engine as metadata
```

The four summaries:

| Summary | Content |
|---------|---------|
| `pageSummary` | Page title, type, entityId, breadcrumb, state flags (editing/draft/published) |
| `contentSummary` | Headings hierarchy, table structure, visible text (from snapshot), word count |
| `formSummary` | Form names, purposes, completion %, errors, per-field values with labels and flags |
| `navigationSummary` | Active tabs, action links, navigation links |

### getLatestContextSnapshot()

Returns the raw `PageContextSnapshot` JSON from the latest stored record:

```typescript
const snapshot = await getLatestContextSnapshot(userId);
// Returns: PageContextSnapshot | null
```

### Stack Cleanup (LIFO)

After each snapshot is stored, `processContextSnapshot` non-blockingly prunes old snapshots:

```typescript
// Keep only the last 20 snapshots per user (newest on top, oldest pruned)
store.cleanupOldSnapshots(userId, 20).catch(() => {
  // Non-blocking — cleanup failure does not affect the main flow
});
```

---

## Consuming Context in Routes

When a user sends a message to SAM, both routes (`/api/sam/unified/route.ts` and `/api/sam/unified/stream/route.ts`) retrieve stored context and forward it to the Response Engine:

```
User sends message
  |
  v
/api/sam/unified/route.ts  (or /stream/route.ts)
  |
  +-- getContextSummaryForRoute(userId)
  |     - Loads latest SAMPageContextSnapshot from DB
  |     - Rebuilds 4 summary dimensions from stored JSON
  |     - Returns: { pageSummary, formSummary, contentSummary, navigationSummary }
  |
  +-- Forward as metadata to Response Engine:
  |     contextSnapshotPageSummary: summary.pageSummary,
  |     contextSnapshotFormSummary: summary.formSummary,
  |     contextSnapshotContentSummary: summary.contentSummary,
  |     contextSnapshotNavigationSummary: summary.navigationSummary,
  |
  +-- ResponseEngine.buildSystemPrompt() injects into LLM prompt:
  |     "## PAGE CONTEXT -- VERIFIED DATA"
  |     "### Current Page Info" (from pageSummary)
  |     "### Visible Page Content" (from contentSummary)
  |     "### Available Navigation" (from navigationSummary)
  |     Form fields rendered inline (from formSummary or snapshot forms)
  |
  v
AI response with full page awareness
```

This means SAM always knows:
- What page the user is viewing (title, type, path, breadcrumb)
- What course/chapter/section they're studying (entity data from DB)
- What forms are on the page and their current field values, labels, errors
- What content is visible (headings, tables, text up to 5000 chars)
- What navigation is available (tabs, action links, sidebar)
- What actions SAM can help with (dynamically derived from context)

---

## Confidence Scoring

The engine calculates a weighted confidence score (0.0 to 1.0):

| Signal | Weight | Example |
|--------|--------|---------|
| Page type recognized | 0.20 | `course-detail` vs `unknown` |
| Entity context from DB | 0.20 | Course title, description loaded |
| Entity ID present | 0.15 | URL contains entity identifier |
| Page title present | 0.10 | `document.title` is non-empty |
| Forms detected | 0.10 | At least one form on page |
| Content detected | 0.10 | `wordCount > 0` |
| Breadcrumb present | 0.05 | Navigation breadcrumb exists |
| Capabilities detected | 0.05 | Page capabilities identified |
| User profile available | 0.05 | User role, preferences loaded |

**Typical scores**:
- Course detail page with DB enrichment: **0.85 - 0.95**
- Unknown page with no entity: **0.10 - 0.20**
- Teacher edit page with form: **0.70 - 0.80**

---

## Page Intent & Action Mapping

### Intent Mapping (14 page types)

| Page Type | Inferred Intent |
|-----------|----------------|
| `course-detail` | Viewing course overview to understand structure and enroll |
| `chapter-detail` | Studying chapter content and reviewing material |
| `section-detail` | Actively learning section content in depth |
| `courses-list` | Browsing available courses and comparing options |
| `teacher-courses` | Managing courses as an instructor |
| `teacher-course-edit` | Editing course content and settings |
| `teacher-chapter-edit` | Editing chapter structure or content |
| `teacher-section-edit` | Creating or editing section learning material |
| `exam-detail` | Taking or reviewing an examination |
| `exam-edit` | Creating or editing exam questions |
| `assignment-detail` | Working on or reviewing an assignment |
| `dashboard` | Reviewing overall learning progress |
| `study-plan` | Reviewing study plan and scheduled tasks |
| `settings` | Managing account or application settings |

### Action Mapping (per page type)

Actions are dynamically composed from page type + form presence + content:

```
course-detail:
  - explain-course, suggest-study-plan, preview-chapters, analyze-difficulty

section-detail:
  - explain-section, analyze-bloom-level, generate-practice, simplify-content

teacher-section-edit:
  - fill-form, suggest-content, analyze-bloom-level, check-alignment

+ If forms present:
  - fill-form, validate-form, explain-form-fields
  - fix-form-errors (if errors > 0)
  - suggest-missing-fields (if completion < 100%)

+ If content > 100 words:
  - summarize-content, analyze-content

+ If code blocks present:
  - explain-code, review-code
```

---

## Stack Management

The system maintains a bounded LIFO stack of snapshots per user. This prevents unbounded DB growth while preserving recent context history.

### Pruning Rules

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max snapshots per user | 20 | Enough for cross-page context, bounded growth |
| Pruning trigger | After every `processContextSnapshot` call | Automatic, no cron required |
| Pruning strategy | Delete oldest beyond limit (LIFO) | Newest snapshots are most relevant |
| Failure mode | Non-blocking `.catch()` | Pruning failure never blocks context processing |

### Store Method

```
PrismaContextSnapshotStore.cleanupOldSnapshots(userId, keepLast = 20)
  |
  1. Find all snapshots for user ordered by createdAt DESC
  2. Skip the first `keepLast` records
  3. Delete the rest (oldest records beyond the retention window)
  4. Return count of deleted records
```

---

## Response Engine Prompt Injection

**File**: `packages/core/src/engines/response.ts`
**Method**: `ResponseEngine.buildSystemPrompt()`

The Response Engine is where snapshot context enters the LLM. It reads four metadata keys from the page context and injects them into structured sections of the system prompt.

### Prompt Structure

```
You are SAM, an intelligent AI tutor assistant...

## PAGE CONTEXT -- VERIFIED DATA
You are currently on: teacher-course-edit page
Path: /teacher/courses/abc123
User role: TEACHER

### Database-Verified Information          <-- from entity enrichment
Course: Python Programming Fundamentals
Status: Draft, Unpublished
Chapters: 3, Difficulty: Intermediate

### Current Page Info                      <-- from contextSnapshotPageSummary
Page: Python Programming Fundamentals (teacher-course-edit)
Entity ID: abc123
Breadcrumb: Dashboard > Courses > Python Programming Fundamentals
State: editing, draft

### Visible Page Content                   <-- from contextSnapshotContentSummary
Headings on page:
  # Course Title
  ## Description
  ## Chapters
Visible text on page:
  Python Programming Fundamentals...
Word count: 342

### Available Navigation                   <-- from contextSnapshotNavigationSummary
Tabs: Basic Info, Chapters, Resources (active: Basic Info)
Action links: Add Chapter, Preview, Publish

### Form Fields (Current Page)             <-- from contextSnapshotFormSummary or inline
- Course Title (text): "Python Programming Fundamentals" [required]
- Description (textarea): "Learn Python from scratch..." [required]
- Price (number): "0" [required]
```

### Key Implementation Details

```typescript
// response.ts:183-187 — Extract snapshot metadata
const snapshotPageSummary = metadata.contextSnapshotPageSummary as string | undefined;
const snapshotContentSummary = metadata.contextSnapshotContentSummary as string | undefined;
const snapshotFormSummary = metadata.contextSnapshotFormSummary as string | undefined;
const snapshotNavigationSummary = metadata.contextSnapshotNavigationSummary as string | undefined;

// Only inject if contentSummary has real data (not "No visible content captured.")
const hasSnapshotContext = !!(snapshotContentSummary
  && snapshotContentSummary !== 'No visible content captured.'
  && snapshotContentSummary.length > 0);
```

### Observable Logging

The engine logs what the LLM receives for diagnostics:

```typescript
this.logger.info('[ResponseEngine] System prompt built:', {
  totalLength: systemPrompt.length,
  hasEntityContext: systemPrompt.includes('Database-Verified Information'),
  hasSnapshotContext: systemPrompt.includes('Visible Page Content'),
  pageType: context.page.type,
});
```

---

## File Reference Map

### New Files (8)

| # | File | Package | Purpose |
|---|------|---------|---------|
| 1 | `packages/core/src/types/context-snapshot.ts` | @sam-ai/core | 350+ lines of snapshot types, engine I/O, memory types |
| 2 | `packages/core/src/engines/context-gathering.ts` | @sam-ai/core | Portable engine (523 lines) — summaries, intent, actions, confidence |
| 3 | `packages/core/src/memory/context-memory.ts` | @sam-ai/core | Hydrator + diff + adapter interfaces + in-memory adapter |
| 4 | `packages/react/src/hooks/useContextGathering.ts` | @sam-ai/react | DOM collector hook — forms, content, navigation, interaction |
| 5 | `packages/react/src/hooks/useContextMemorySync.ts` | @sam-ai/react | Auto-sync hook — debounced POST to API |
| 6 | `lib/sam/context-gathering-integration.ts` | Taxomind | Orchestration — entity enrichment + engine + hydrator |
| 7 | `lib/sam/stores/context-snapshot-store.ts` | Taxomind | Prisma adapter for SAMPageContextSnapshot |
| 8 | `app/api/sam/context/route.ts` | Taxomind | POST endpoint with Zod validation |

### Modified Files (11)

| # | File | Change |
|---|------|--------|
| 1 | `packages/core/src/types/index.ts` | Export all context-snapshot types |
| 2 | `packages/core/src/engines/index.ts` | Export ContextGatheringEngine + factory |
| 3 | `packages/core/src/engines/response.ts` | **Inject snapshot context into AI system prompt** (buildSystemPrompt) |
| 4 | `packages/core/src/index.ts` | Export memory/context-memory |
| 5 | `packages/react/src/hooks/index.ts` | Export new hooks |
| 6 | `packages/react/src/hooks/useSAMPageContext.ts` | Import PageContextSnapshot from core |
| 7 | `lib/sam/entity-context.ts` | Existing entity fetch functions |
| 8 | `app/api/sam/unified/route.ts` | Forward 4 snapshot summaries as metadata to Response Engine |
| 9 | `app/api/sam/unified/stream/route.ts` | Forward 4 snapshot summaries as metadata to Response Engine |
| 10 | `prisma/domains/17-sam-agentic.prisma` | Add SAMPageContextSnapshot model |
| 11 | `components/sam/chat/ChatWindow.tsx` | Wire useContextMemorySync |

---

## Sequence Diagram

### Page Navigation (Auto-Sync)

```
User          Browser Hook        API Route          Integration         Database
 |                |                   |                   |                  |
 |--navigate----->|                   |                   |                  |
 |                |                   |                   |                  |
 |                |--scan DOM-------->|                   |                  |
 |                |  (500ms debounce) |                   |                  |
 |                |                   |                   |                  |
 |                |--compute hash---->|                   |                  |
 |                |                   |                   |                  |
 |                |  hash changed?    |                   |                  |
 |                |--yes, wait 2s---->|                   |                  |
 |                |                   |                   |                  |
 |                |     POST /api/sam/context             |                  |
 |                |------------------>|                   |                  |
 |                |                   |--validate (Zod)-->|                  |
 |                |                   |--auth check------>|                  |
 |                |                   |                   |                  |
 |                |                   |    processContextSnapshot()          |
 |                |                   |------------------>|                  |
 |                |                   |                   |                  |
 |                |                   |                   |--fetchEntity---->|
 |                |                   |                   |<--course data----|
 |                |                   |                   |                  |
 |                |                   |                   |--run engine----->|
 |                |                   |                   |  (no AI calls)   |
 |                |                   |                   |                  |
 |                |                   |                   |--hydrate-------->|
 |                |                   |                   |                  |--store snapshot
 |                |                   |                   |                  |--compute diff
 |                |                   |                   |<--snapshotId-----|
 |                |                   |                   |                  |
 |                |                   |                   |--update summary->|
 |                |                   |                   |                  |
 |                |                   |<--output----------|                  |
 |                |<--200 OK----------|                   |                  |
 |                |  {contextId,      |                   |                  |
 |                |   pageIntent,     |                   |                  |
 |                |   confidence,     |                   |                  |
 |                |   actions}        |                   |                  |
```

### Chat Message (Context Retrieval + Prompt Injection)

```
User          ChatWindow        Unified Route       Integration         Response Engine
 |                |                   |                   |                  |
 |--send msg----->|                   |                   |                  |
 |                |                   |                   |                  |
 |                |   POST /api/sam/unified/stream        |                  |
 |                |------------------>|                   |                  |
 |                |                   |                   |                  |
 |                |                   |  getContextSummaryForRoute(userId)   |
 |                |                   |------------------>|                  |
 |                |                   |                   |--latest snap from DB
 |                |                   |                   |--rebuild 4 summaries
 |                |                   |<--{pageSummary,---|                  |
 |                |                   |   contentSummary, |                  |
 |                |                   |   formSummary,    |                  |
 |                |                   |   navSummary}     |                  |
 |                |                   |                   |                  |
 |                |                   |--forward metadata to Response Engine |
 |                |                   |--------------------------------------->|
 |                |                   |                   |                  |
 |                |                   |  buildSystemPrompt() injects:        |
 |                |                   |  - "### Current Page Info"           |
 |                |                   |  - "### Visible Page Content"        |
 |                |                   |  - "### Available Navigation"        |
 |                |                   |  - Form fields inline                |
 |                |                   |                   |                  |
 |                |                   |  LLM receives rich page context      |
 |                |                   |<--AI response with page awareness----|
 |                |<--SSE stream------|                   |                  |
 |<--display------|                   |                   |                  |
```

---

## Design Decisions

### Why Portable Engine?

The `ContextGatheringEngine` lives in `@sam-ai/core` with zero Prisma/Taxomind imports.
This means:
- Other apps using `@sam-ai/core` get context gathering for free
- Unit tests run without database setup
- The engine can be used server-side or in a worker

### Why Two Debounce Layers?

- **500ms** in `useContextGathering`: batches rapid DOM mutations (typing, scrolling)
- **2000ms** in `useContextMemorySync`: batches rapid page changes (SPA navigation)

This prevents flooding the API while still capturing meaningful changes.

### Why Content Hash Dedup?

Without hash comparison, every scroll event or focus change would trigger an API call.
The content hash captures the structural identity of the page (URL + title + forms + values)
while ignoring transient interaction state.

### Why No AI Calls in the Engine?

The engine is purely computational. Adding AI calls would:
- Add latency to every page navigation
- Consume API tokens on background operations
- Create failure modes for a non-user-facing operation

The AI sees the context later when the user actually sends a message.

### Why Silent Failure in Sync?

`useContextMemorySync` silently ignores sync failures because:
- Context sync is a background optimization, not user-facing
- A failed sync doesn't break the chat experience
- The next page navigation will retry automatically
- Users shouldn't see errors for background operations
