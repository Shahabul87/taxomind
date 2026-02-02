# SAM AI Agentic System — 8-Weakness Fix Implementation

**Date**: February 2026
**Status**: Complete (all 5 phases implemented)

## Summary

Comprehensive fix addressing 8 identified weaknesses in the SAM AI Agentic system, implemented across 5 phases.

---

## Phase 1: Vector Search Infrastructure (pgvector)

**Weakness**: In-memory O(n*d) vector search with no native database support.

### What Changed
- **`prisma/domains/17-sam-agentic.prisma`** — Added `embedding_vector Unsupported("vector(1536)")?` columns to `SAMVectorEmbedding`, `SAMLongTermMemory`, `SAMKnowledgeNode`
- **`prisma/migrations/20260202000000_add_pgvector_search/migration.sql`** — Creates pgvector extension, adds vector columns, creates IVFFlat index
- **`lib/sam/stores/pgvector-adapter.ts`** (new) — `PgvectorVectorAdapter` using `$queryRawUnsafe` for native cosine similarity search. Feature-flagged via `USE_PGVECTOR` env var with graceful fallback
- **`lib/sam/stores/prisma-memory-stores.ts`** — `searchByVector()` now delegates to pgvector adapter when available; `upsert()` writes both JSON and native vector columns
- **`scripts/backfill-pgvector.ts`** (new) — Idempotent batch migration of JSON embeddings to native pgvector format

### Key Design Decisions
- Dual-column approach (JSON + native) for zero-downtime migration
- Feature flag `USE_PGVECTOR=true` for Railway compatibility
- IVFFlat index with 100 lists for balanced speed/recall

---

## Phase 2: Algorithmic Engine Enhancements

**Weakness**: Key engines relied on AI API calls for work that could be done algorithmically.

### What Changed
- **`packages/educational/src/engines/memory-engine.ts`**
  - Replaced binary word matching with BM25 scoring (k1=1.2, b=0.75)
  - Added `buildCorpusStats()` for IDF pre-computation with 10-minute TTL
  - Wired SM-2 spaced repetition: `getOptimalReviewItems()`, `updateReviewResult()`

- **`packages/educational/src/engines/blooms-engine.ts`**
  - Added bigram matching alongside unigrams in `analyzeKeywords()`
  - Context-window scoring: check 5 surrounding words for confirmation signals
  - Position-weighted scoring: 1.5x for questions/objectives vs body text

- **`packages/educational/src/engines/knowledge-graph-engine.ts`**
  - `findPrerequisiteChain()` — BFS traversal on `SAMKnowledgeEdge` with cycle detection
  - `findRelatedConcepts()` — Bounded DFS (max depth 10) with visited tracking
  - `calculateConceptCentrality()` — Degree centrality based on in/out edges

### Key Design Decisions
- BM25 parameters are industry-standard defaults
- Corpus stats cached with TTL to avoid recomputation on every query
- Graph traversal bounded to prevent runaway on large/disconnected graphs

---

## Phase 3: Pipeline Resilience & Observability

**Weakness**: Background pipeline stages had no health tracking, retry logic, or graceful shutdown.

### What Changed
- **`lib/sam/pipeline/stage-health-tracker.ts`** (new) — Singleton tracking per-stage metrics (success/failure/timeout rates, avg duration) with circular buffer of 1000 runs per stage

- **`app/api/sam/unified/route.ts`**
  - Wrapped background stages with health tracking (`recordSuccess`/`recordFailure`/`recordTimeout`)
  - Added `CRITICAL_BG_STAGES = ['memory-persistence', 'intervention']` with single retry on failure (3s timeout, fire-and-forget)

- **`app/api/health/route.ts`** — Added `sam_pipeline` section with per-stage success rates and overall health status (healthy/degraded/critical thresholds at 95%/80%)

- **`lib/sam/taxomind-context.ts`**
  - `shutdownTaxomindContext()` — Clears store proxy cache, vector cache, tool registry
  - `warmupTaxomindContext(storeNames)` — Pre-initializes specified stores at startup
  - Registered `process.on('SIGTERM', shutdownTaxomindContext)` for Railway graceful shutdown

### Key Design Decisions
- Circular buffer prevents unbounded memory growth
- Only 2 critical stages are retried (memory-persistence, intervention)
- Health endpoint thresholds align with standard SRE practices

---

## Phase 4: UX — Engine Transparency & Mode Differentiation

**Weakness**: Users couldn't see why SAM chose specific engines. 24 of 30 modes lacked unique configuration.

### What Changed
- **`components/sam/chat/panels/EngineTransparencyPanel.tsx`** (new) — Collapsible panel showing engines run, preset used, timing, Bloom's distribution, quality score. Collapsed by default, user opt-in via settings toggle

- **`components/sam/chat/MessageBubble.tsx`** — Renders `<EngineTransparencyPanel>` after assistant message content when `engineInsights` data exists

- **`components/sam/chat/ChatWindow.tsx`** — Added `showEngineDetails` state persisted to localStorage (`sam-show-engine-details`), builds `engineInsightsData` memo from response metadata, attaches insights to last assistant message

- **`components/sam/chat/ChatHeader.tsx`** — Added engine details toggle button (Cpu icon), mode differentiation indicator (green=deep, blue=configured, gray=prompt-only) using `getModeDifferentiation()` helper

- **`lib/sam/modes/registry.ts`** — Added `engineConfig` to all 24 modes that previously lacked it (now all 30 modes have unique configs)

- **`lib/sam/modes/resolver.ts`** — `resolveModeEnginesWithMetadata()` returns `engineConfig`, new `resolveModeContext()` function

- **`lib/sam/pipeline/orchestration-stage.ts`** — Builds `engineSelection` metadata with preset, reason, signals, and alternative presets for Smart Auto mode

- **`lib/sam/pipeline/response-builder-stage.ts`** — Includes `engineSelection` in response insights

- **`lib/sam/pipeline/types.ts`** — Extended `modeAnalytics` with `engineConfig` and `engineSelection` fields

### Key Design Decisions
- Engine transparency off by default to avoid visual noise
- Mode differentiation computed from engine preset + engineConfig presence
- Alternative presets derived from score ranking for Smart Auto transparency

---

## Phase 5: Tool Expansion & Multi-User Foundation

**Weakness**: Limited tool set. No teacher-student SAM context sharing.

### New Tools (5)
| Tool | File | Category | Description |
|------|------|----------|-------------|
| Flashcard Generator | `lib/sam/tools/flashcard-generator.ts` | CONTENT | Bloom's-aligned flashcards from topic/difficulty |
| Quiz Grader | `lib/sam/tools/quiz-grader.ts` | ASSESSMENT | Algorithmic grading with partial credit and missed concept detection |
| Progress Exporter | `lib/sam/tools/progress-exporter.ts` | ANALYTICS | JSON/CSV progress reports from session and mastery data |
| Diagram Generator | `lib/sam/tools/diagram-generator.ts` | CONTENT | Mermaid.js syntax for mindmap/flowchart/timeline |
| Study Timer | `lib/sam/tools/study-timer.ts` | SYSTEM | Tracked study sessions with 10,000-hour mastery tracking |

### Tool Registration
- **`lib/sam/agentic-tooling.ts`** — All 5 tools registered as standalone tools in `doRegisterMentorTools()` using existing DB upsert + cache pattern

### Teacher Session Monitoring (Multi-User Foundation)
- **`lib/sam/stores/prisma-session-stores.ts`** (new) — `getStudentSessions()` with cursor pagination joining sessions to enrollments/courses, `getSessionMessages()`, `isTeacherOfStudent()` authorization
- **`app/api/sam/sessions/route.ts`** (new) — GET: List student SAM sessions (teacher/admin only)
- **`app/api/sam/sessions/[sessionId]/messages/route.ts`** (new) — GET: Read-only student conversation access with course-scoped authorization
- **`lib/sam/pipeline/types.ts`** — Added `teacherContext` field to PipelineContext

### Key Design Decisions
- All tools use Zod schemas for input/output validation
- Tools that don't need AI (flashcards, quiz grader, progress, study timer) are pure algorithmic
- Teacher access is read-only, course-scoped, with explicit authorization check
- Cursor-based pagination for scalable session listing

---

## File Inventory

### New Files Created (14)
| File | Phase | Lines |
|------|-------|-------|
| `prisma/migrations/20260202000000_add_pgvector_search/migration.sql` | 1 | ~40 |
| `lib/sam/stores/pgvector-adapter.ts` | 1 | 265 |
| `scripts/backfill-pgvector.ts` | 1 | 117 |
| `lib/sam/pipeline/stage-health-tracker.ts` | 3 | 251 |
| `components/sam/chat/panels/EngineTransparencyPanel.tsx` | 4 | 208 |
| `lib/sam/tools/flashcard-generator.ts` | 5 | 202 |
| `lib/sam/tools/quiz-grader.ts` | 5 | 235 |
| `lib/sam/tools/progress-exporter.ts` | 5 | 258 |
| `lib/sam/tools/diagram-generator.ts` | 5 | 220 |
| `lib/sam/tools/study-timer.ts` | 5 | 163 |
| `app/api/sam/sessions/route.ts` | 5 | 61 |
| `app/api/sam/sessions/[sessionId]/messages/route.ts` | 5 | 82 |
| `lib/sam/stores/prisma-session-stores.ts` | 5 | 215 |

### Modified Files (16+)
| File | Phase |
|------|-------|
| `prisma/domains/17-sam-agentic.prisma` | 1 |
| `lib/sam/stores/prisma-memory-stores.ts` | 1 |
| `packages/educational/src/engines/memory-engine.ts` | 2 |
| `packages/educational/src/engines/blooms-engine.ts` | 2 |
| `packages/educational/src/engines/knowledge-graph-engine.ts` | 2 |
| `app/api/sam/unified/route.ts` | 3 |
| `app/api/health/route.ts` | 3 |
| `lib/sam/taxomind-context.ts` | 3 |
| `lib/sam/pipeline/orchestration-stage.ts` | 4 |
| `lib/sam/pipeline/response-builder-stage.ts` | 4 |
| `lib/sam/modes/registry.ts` | 4 |
| `lib/sam/modes/resolver.ts` | 4 |
| `lib/sam/modes/index.ts` | 4 |
| `components/sam/chat/MessageBubble.tsx` | 4 |
| `components/sam/chat/ChatWindow.tsx` | 4 |
| `components/sam/chat/ChatHeader.tsx` | 4 |
| `lib/sam/agentic-tooling.ts` | 5 |
| `lib/sam/pipeline/types.ts` | 4, 5 |

---

## Verification Checklist

- [x] `npm run build` — Passes
- [x] `npm run lint` — Zero errors on all changed files
- [x] `npm run typecheck:parallel` — Only pre-existing react package declaration warnings
- [x] All 14 new files created
- [x] All 16+ files modified with correct changes
- [x] All 8 weaknesses addressed
