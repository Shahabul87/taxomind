# SAM-Native Course Creation Pipeline - Integration Plan

> **Status**: ACTIVE
> **Created**: 2026-02-14
> **Goal**: Route course creation through SAM agentic system properly

---

## Problem Statement

The AI course creation pipeline (`lib/sam/course-creation/`) operates **parallel** to SAM rather than **through** SAM. It bypasses the unified AI provider, reimplements quality scoring, and underutilizes SAM packages (`@sam-ai/quality`, `@sam-ai/pedagogy`, `@sam-ai/educational`).

## What We KEEP (Already Excellent)

| Component | File | Reason |
|-----------|------|--------|
| ARROW Framework | `prompts.ts` | Unique pedagogical philosophy |
| Chapter DNA Templates | `chapter-templates.ts` | Difficulty-specific section structures |
| Category Enhancers | `category-prompts/` | 16 domain-specific prompt blocks |
| ConceptTracker | `orchestrator.ts` | Cross-chapter concept coherence |
| Depth-first pipeline | `orchestrator.ts` | Correct architecture for consistent generation |
| Checkpoint/Resume | `orchestrator.ts` | Production-hardened, handles Railway timeouts |
| SSE + auto-reconnect | `route.ts` | Solves real-world timeout issues |
| Custom quality dimensions | `helpers.ts` | uniqueness, specificity are course-creation-specific |
| Position-aware Bloom's | `prompts.ts` | Monotonic progression is correct pedagogical pattern |

---

## Phase 1: Unified AI Provider (Low Risk, High Impact)

### Goal
Route all AI calls through `runSAMChatWithPreference()` / `runSAMChatStream()` instead of `createUserScopedAdapter()` + `aiAdapter.chat()`.

### What This Gives Us (Free)
- Rate limiting by subscription tier
- Usage tracking + cost estimation
- Circuit breaker (5 failures = open, 30s reset)
- Automatic fallback to secondary provider
- 3-tier caching (platform 5min, user 60s, adapters 10min)
- Proper audit trail

### Files Modified

| File | Change |
|------|--------|
| `lib/sam/course-creation/orchestrator.ts` | Remove `createUserScopedAdapter` import. Replace `aiAdapter.chat(chatParams).content` with `runSAMChatWithPreference({userId, capability: 'course', ...})`. Remove `aiAdapter` variable. Pass `userId` through pipeline instead of `aiAdapter`. |
| `lib/sam/course-creation/streaming-accumulator.ts` | Replace `aiAdapter.chatStream()` with `runSAMChatStream()`. Change interface to accept `userId` + `capability` instead of `aiAdapter`. |

### Key Constraint
- `runSAMChatWithPreference()` returns `string` (content only)
- `runSAMChatStream()` returns `AsyncGenerator<AIChatStreamChunk>`
- Both match what the orchestrator already expects after extracting `.content`

---

## Phase 2: SAM Quality Gates + Pedagogy Validation (Medium Risk, High Impact)

### Goal
Add `@sam-ai/quality` QualityGatePipeline and `@sam-ai/pedagogy` PedagogicalPipeline as **additive** validation layers alongside existing custom scoring.

### Architecture
```
AI generates content
       |
       v
EXISTING: Custom quality score (uniqueness, specificity, Bloom's, completeness, depth)
       |
       v
NEW: @sam-ai/pedagogy PedagogicalPipeline (Stage 1 - chapters)
  - BloomsAligner: Verify Bloom's level assignment accuracy
  - ScaffoldingEvaluator: Check progressive complexity across chapters
       |
       v
NEW: @sam-ai/quality QualityGatePipeline (Stage 3 - details)
  - CompletenessGate: word count, sections, objective coverage
  - DepthGate: cognitive depth
  - StructureGate: markdown quality
  - DifficultyMatchGate: level alignment
       |
       v
Combined score -> retry if below threshold
```

### Files Created/Modified

| File | Change |
|------|--------|
| `lib/sam/course-creation/quality-integration.ts` | **NEW** - Wraps `@sam-ai/quality` + `@sam-ai/pedagogy` for course creation context |
| `lib/sam/course-creation/orchestrator.ts` | Import and call quality integration after Stage 1 and Stage 3 generation |

### Key Decision
- SAM quality gates are **additive** - they log results and contribute to combined score
- They do NOT replace existing custom scoring (which handles course-specific dimensions like uniqueness)
- Combined score = `0.6 * customScore + 0.4 * samScore`

---

## Phase 3: SubGoal Decomposition (Medium Risk, Medium Impact)

### Goal
Replace flat Goal + 3-step Plan with proper SubGoal decomposition per chapter.

### Current Structure
```
Goal: "Create Course: TypeScript"
  Plan (3 steps):
    Step 1: "Generate chapters"     <- all chapters in one step
    Step 2: "Generate sections"     <- all sections in one step
    Step 3: "Generate details"      <- all details in one step
```

### Proposed Structure
```
Goal: "Create Course: TypeScript"
  SubGoal 1: "Chapter 1 - Introduction to Types"
    Plan: Generate -> Validate -> Save
  SubGoal 2: "Chapter 2 - Advanced Types"
    Plan: Generate -> Validate -> Save
  ...
  SubGoal N: "Chapter N"
    Plan: Generate -> Validate -> Save
```

### Files Modified

| File | Change |
|------|--------|
| `lib/sam/course-creation/course-creation-controller.ts` | Add `initializeChapterSubGoal()`, `completeChapterSubGoal()`. Use `SubGoalStore` from TaxomindContext. |
| `lib/sam/course-creation/orchestrator.ts` | Create SubGoal at start of each chapter loop, complete at end. |

---

## Phase 4: Post-Creation Enrichment (Low Risk, High Impact)

### Goal
After course creation completes, run SAM educational engines to enrich the course in the background.

### Enrichment Steps
1. `KnowledgeGraphEngine.analyzeCourse()` - Extract concepts, build prerequisite graph
2. `BloomsAnalysisEngine.analyzeContent()` - Full course cognitive profile

### Files Created/Modified

| File | Change |
|------|--------|
| `lib/sam/course-creation/post-creation-enrichment.ts` | **NEW** - Background enrichment pipeline |
| `lib/sam/course-creation/orchestrator.ts` | Call enrichment after `complete` event (fire-and-forget) |

---

## Implementation Order

| Priority | Phase | Impact | Effort | Risk |
|----------|-------|--------|--------|------|
| 1 (NOW) | Phase 1: AI Provider | High | Small | Low |
| 2 (NEXT) | Phase 2: Quality Gates | High | Medium | Medium |
| 3 (LATER) | Phase 3: SubGoals | Medium | Medium | Medium |
| 4 (BONUS) | Phase 4: Enrichment | High | Small | Low |

---

## Verification Checklist

After each phase:
- [ ] `npm run lint` - 0 errors
- [ ] `npm run typecheck:parallel` - 0 errors
- [ ] No `createUserScopedAdapter` direct imports in orchestrator (Phase 1)
- [ ] All AI calls go through `runSAMChatWithPreference` (Phase 1)
- [ ] Quality gates produce validation results (Phase 2)
- [ ] SubGoals appear in SAM Goals dashboard (Phase 3)
- [ ] KnowledgeGraph populated after course creation (Phase 4)
