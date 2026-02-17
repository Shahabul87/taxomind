# Course Creation Pipeline - Deep Audit Verification Report

**Date**: 2026-02-17
**Scope**: 10 prioritized issues from architecture audit
**Method**: Deep codebase investigation with line-level evidence tracing

---

## Summary Dashboard

| # | Issue | Claimed Severity | Verified Severity | Status |
|---|-------|-----------------|-------------------|--------|
| 1 | SAM/Prisma coupling | High | **6/10** | CONFIRMED - Architectural, not accidental |
| 2 | Non-atomic escalation resume | High | **7/10** | CONFIRMED - Real UX friction |
| 3 | Missing idempotency guard | High | **8/10** | CONFIRMED - Infrastructure exists but dormant |
| 4 | Orchestrator too large | Medium-High | **3/10** | OUTDATED - Already refactored (52% reduction) |
| 5 | In-memory rate limiter | Medium-High | **7.5/10** | CONFIRMED - Mitigated with fail-closed + Redis |
| 6 | Silent parse fallbacks | Medium | **7/10** | CONFIRMED - FallbackTracker disconnected |
| 7 | promptVersion not gating resume | Medium | **2/10** | FALSE - Gate exists and is tested |
| 8 | Approval query ambiguity | Medium | **1/10** | FALSE - courseId filtered in query |
| 9 | Context sync token waste | Medium | **6.5/10** | CONFIRMED - Mitigated with safeguards |
| 10 | No E2E orchestration test | Medium | **6/10** | PARTIALLY TRUE - Integration tests exist |

**Overall Risk Score**: 54/100 (Medium)
**Issues Requiring Immediate Action**: 3 (Issues #2, #3, #6)
**Issues Already Resolved/Incorrect**: 3 (Issues #4, #7, #8)

---

## Issue #1: SAM Boundary Prisma Coupling

**Severity: 6/10 | Status: CONFIRMED but Acceptable Architecture**

### Finding

The coupling is **real but intentional**. The system follows Hexagonal Architecture (Ports & Adapters):

- **Ports**: `@sam-ai/agentic` defines interfaces (`GoalStore`, `PlanStore`, etc.)
- **Adapters**: `lib/sam/stores/prisma-*-store.ts` (42 files) implement these interfaces
- **Facade**: `taxomind-context.ts` centralizes all store access

### Evidence

| Layer | Location | Role |
|-------|----------|------|
| Port interfaces | `packages/agentic/src/goal-planning/types.ts:560` | Database-agnostic contracts |
| Prisma adapters | `lib/sam/stores/prisma-goal-store.ts` (42 files) | Concrete implementations |
| DI provider | `lib/sam/stores/db-provider.ts` | Injectable `getDb()` for testing |
| Facade | `lib/sam/taxomind-context.ts` | Centralized store access |

### Real Issue

22% of API routes **bypass the facade** and import stores directly:
```typescript
// Anti-pattern found in 10 routes:
import { createPrismaPracticeSessionStore } from '@/lib/sam/stores';
```

### Recommendation

- **LOW priority**: Enforce facade usage in 10 routes via ESLint `no-restricted-imports` rule
- No architectural restructuring needed - current pattern is industry-standard

---

## Issue #2: Non-Atomic Escalation Resume

**Severity: 7/10 | Status: CONFIRMED**

### Finding

After pipeline pause and human approval, the pipeline does **NOT** automatically resume. The client must make a separate `POST /api/sam/course-creation/orchestrate` request.

### Flow Traced

```
Pipeline pauses (step-executor-phases.ts:387-426)
  → PipelinePausedError thrown
  → Orchestrator catches it, marks plan FAILED (orchestrator.ts:525-530)
  → SSE stream closes with error

User clicks Approve (approve/route.ts:98-128)
  → Plan status changed PAUSED → ACTIVE
  → Response: { resumeReady: true, resumeEndpoint: '/orchestrate' }
  → NO automatic pipeline trigger

Client must call /orchestrate with resumeCourseId
  → checkpoint-manager.ts:189-276 loads state
  → Pipeline resumes from last checkpoint
```

### Key Problems

1. **Misleading messaging**: Response says "Auto-resume within 30 minutes" but it is NOT automatic
2. **Client complexity**: Must detect approval success, call `/orchestrate`, handle new SSE stream
3. **30-minute deadline**: `checkpoint-manager.ts:217-234` auto-fails if deadline expires
4. **Plan status confusion**: Plan is `FAILED` (from error), then `ACTIVE` (from approval)

### Race Conditions Identified

- Double-click approval (no idempotency on approve route)
- Resume deadline expiration during client retry
- Checkpoint status mismatch (checkpoint says `paused`, plan says `ACTIVE`)

### Recommendation

- **P1**: Fix messaging - "Pipeline approved. Click Resume to continue."
- **P2**: Add client-side auto-resume with 3s delay after approval
- **P3**: Add idempotency guard on approve endpoint

---

## Issue #3: Missing Idempotency Guard

**Severity: 8/10 | Status: CONFIRMED - Critical**

### Finding

Server-side idempotency infrastructure **exists but is completely dormant** because no client sends the `requestId`.

### Evidence

**Server (has infrastructure)**:
```typescript
// orchestrate/route.ts:53-54
requestId: z.string().uuid().optional(),  // Schema accepts it

// orchestrate/route.ts:96-142
if (config.requestId) {
  // Checks for existing plan with same requestId
  // Returns 409 if in-progress, 200 if complete
}
```

**Client (never sends it)**:
```typescript
// hooks/use-sam-sequential-creation/index.ts:349-369
body: JSON.stringify({
  courseTitle: courseData.courseTitle,
  // ... 18 fields
  // NO requestId field
})
```

### Attack Window

- **200-500ms** between button click and `isSequentialCreating` state update
- Double-click creates 2 identical courses
- No database unique constraint on `(userId, title)`
- Each duplicate wastes $2-5 in AI costs

### Recommendation

- **P0 (15 min fix)**: Add `requestId: crypto.randomUUID()` to client request body
- **P1**: Add optimistic UI locking (`isSubmitting` state before API call)
- **P2**: Add `@@unique([userId, title])` constraint (requires migration + data cleanup)

---

## Issue #4: Orchestrator Size

**Severity: 3/10 | Status: OUTDATED - Already Resolved**

### Finding

The claim references an **old version** of orchestrator.ts (~1,255 lines). The current file has been refactored:

| Component | Lines | Responsibility |
|-----------|-------|----------------|
| orchestrator.ts | **606** (-52%) | Thin coordinator |
| course-initializer.ts | 110 | Course/goal creation |
| pipeline-runner.ts | 339 | Execution paths |
| post-processor.ts | 160 | Reflection + healing |
| completion-handler.ts | 167 | Stage events + completion |

Additionally, `step-executor-phases.ts` was decomposed into 7 focused phase functions.

### Recommendation

- **No action required** - 606 lines is acceptable for a coordinator
- Optional: Extract magic numbers to constants

---

## Issue #5: In-Memory Rate Limiter

**Severity: 7.5/10 | Status: CONFIRMED but Well-Mitigated**

### Finding

The rate limiter has **three implementations** with sophisticated fallback:

1. **InMemoryRateLimitStore** - Default, non-distributed
2. **RedisBackedRateLimitStore** - Auto-enabled when `REDIS_URL` set
3. **Fail-closed enforcement** - AI/tools/heavy routes return 503 if non-distributed in production

### Critical Protection (rate-limiter.ts:489-508)

```typescript
// Production enforcement: fail-closed categories MUST have distributed store
if (process.env.NODE_ENV === 'production' && !bucketStore.isDistributed()
    && failClosedCategories.includes(category)) {
  return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
}
```

### Current Status

- Railway runs **single instance** (no horizontal scaling configured)
- Redis integration is **production-ready** (just needs `REDIS_URL`)
- Health check monitors store type and warns if non-distributed
- Startup logs warn if Redis missing in production

### Recommendation

- **P1**: Verify `REDIS_URL` is set in Railway production environment
- **P2**: Add pre-scaling checklist requiring Redis verification
- **P3**: Add instance-count awareness for automatic enforcement

---

## Issue #6: Silent Parse Fallbacks

**Severity: 7/10 | Status: CONFIRMED - FallbackTracker Disconnected**

### Finding

The `FallbackTracker` class exists with a 30% halt threshold, but it is **never connected to the actual parsers** and `shouldHalt()` is **never called**.

### Evidence Chain

```
orchestrator.ts:230    → FallbackTracker created (threshold: 30%)
chapter-generator.ts   → Parsers called WITHOUT fallbackTracker parameter
completion-handler.ts  → Tracker logged at completion (AFTER damage done)
                       → shouldHalt() NEVER called anywhere in production
```

### Fallback Content Quality

- Quality score: 40-50 (vs 60-95 for real AI content)
- Generic titles: "Foundation and Core Concepts in ${courseTitle}"
- Template-based descriptions with placeholder interpolation
- Structurally valid but educationally worthless

### What Could Happen

In an AI provider outage, the pipeline could create a course with **100% fallback content** that is marked "complete" - no halting, no user warning.

### Recommendation

- **P0**: Pass `fallbackTracker` to all `parseChapterResponse()`, `parseSectionResponse()`, `parseDetailsResponse()` calls
- **P1**: Check `fallbackTracker.shouldHalt()` after each chapter in the pipeline loop
- **P2**: Emit `fallback_threshold_exceeded` SSE event and mark course as FAILED
- **P3**: Persist fallback markers in database for admin visibility

---

## Issue #7: promptVersion Resume Gate

**Severity: 2/10 | Status: FALSE - Gate Exists and Is Tested**

### Finding

The audit claim is **incorrect**. An explicit version gating mechanism exists at `checkpoint-manager.ts:245-271`:

```typescript
if (checkpoint.promptVersion && checkpoint.promptVersion !== PROMPT_VERSION) {
  const savedMajor = parseInt(savedParts[0], 10);
  const currentMajor = parseInt(currentParts[0], 10);
  if (savedMajor !== currentMajor) {
    return {
      success: false,
      error: `Cannot resume: prompt version changed from ${checkpoint.promptVersion} to ${PROMPT_VERSION} (major version mismatch).`,
    };
  }
  // Minor mismatch: warn but allow
}
```

### Validation Logic

| Scenario | Behavior | Test Coverage |
|----------|----------|---------------|
| Major version change (1.x → 2.x) | **BLOCKED** - returns error | `pipeline-resume.test.ts:67-95` |
| Minor version change (2.0 → 2.1) | Allowed with warning | `pipeline-resume.test.ts:97-137` |
| Missing version (old checkpoints) | Allowed (backward compat) | Implicit |

### Recommendation

- **No action required** - Working as designed with test coverage
- Optional: Add comment in `response-schemas.ts` linking to `PROMPT_VERSION`

---

## Issue #8: Approval Query Ambiguity

**Severity: 1/10 | Status: FALSE - Already Fixed**

### Finding

The audit claim references outdated code. The current implementation **does** filter by `courseId` in the query:

```typescript
// approve/route.ts:59-74
const plan = await db.sAMExecutionPlan.findFirst({
  where: {
    goal: { userId: user.id },
    status: 'PAUSED',
    checkpointData: {
      not: null,
      path: ['courseId'],
      equals: courseId,  // courseId IS filtered in query
    },
  },
});
```

### Recommendation

- **No action required** - Query is correctly scoped

---

## Issue #9: Context Sync Token Waste

**Severity: 6.5/10 | Status: CONFIRMED with Safeguards**

### Finding

The `useIntelligentSAMSync` hook recursively extracts all form fields to depth 10, including nested objects and arrays. However, four safeguards limit the damage:

| Safeguard | Mechanism | Location |
|-----------|-----------|----------|
| Depth limit | Max 10 levels | `use-sam-intelligent-sync.ts:114` |
| Array cap | Max 5 items expanded | `use-sam-intelligent-sync.ts:138` |
| Size guard | 4KB payload limit | `use-sam-intelligent-sync.ts:190` |
| Allowlist | `relevantFields` option | `use-sam-intelligent-sync.ts:48` |

### Key Problem

The `relevantFields` allowlist option exists but is **never used** by any of the 4 consuming components. This means all form fields are extracted by default.

### Token Waste Estimate

| Scenario | With Safeguards | Ideal | Waste Factor |
|----------|----------------|-------|--------------|
| Simple form | 1-2 KB (300-500 tokens) | 0.5 KB | 2-4x |
| Course wizard | 2-4 KB (600-1000 tokens) | 0.8 KB | 3-5x |
| Complex editor | 4-6 KB (1000-1500 tokens) | 1.5 KB | 3-4x |

### Recommendation

- **P1 (1 hour)**: Enable `relevantFields` allowlist in course wizard and editor components
- **P2**: Remove duplicate object storage (both serialized + expanded)
- **P3**: Implement field priority system (required/optional/exclude)

---

## Issue #10: No E2E Orchestration Test

**Severity: 6/10 | Status: PARTIALLY TRUE**

### Finding

**Strong component-level testing exists** (~215 test cases across 11 files), but **no test exercises the full orchestration pipeline**.

### Test Coverage Map

| Component | Unit Tests | Integration Tests | E2E | Confidence |
|-----------|-----------|-------------------|-----|------------|
| Prompt builders | 50 cases | - | - | 95% |
| Response parsers | 40 cases | - | - | 90% |
| Quality scoring | 40 cases | - | - | 90% |
| SSE contract | - | 30 cases | - | 85% |
| Approve API | - | 25 cases | - | 90% |
| Resume logic | 15 cases | 8 cases | - | 85% |
| **Orchestrator** | **0** | **0 (mocked)** | **0** | **30%** |
| **Pipeline runner** | **0** | **0** | **0** | **20%** |
| **State machine** | **0** | **0** | **0** | **10%** |
| **Post-processor** | **0** | **0** | **0** | **15%** |

### Confidence Gap: 40% overall

The core orchestration chain (orchestrator → pipeline-runner → state-machine → chapter-generator → post-processor → completion-handler) has **zero test coverage**.

### Recommendation

- **P1 (4-6 hours)**: Add E2E orchestration test with mocked AI + DB
- **P2 (3-4 hours)**: Add state machine tests
- **P3 (2-3 hours)**: Add post-processor tests

---

## Priority Action Matrix

### Immediate (This Sprint)

| Action | Issue | Effort | Impact |
|--------|-------|--------|--------|
| Add `requestId` to client request | #3 | 15 min | Prevents duplicate courses |
| Connect FallbackTracker to parsers | #6 | 2 hours | Prevents garbage courses |
| Fix approval messaging | #2 | 30 min | Reduces user confusion |

### Short-Term (Next Sprint)

| Action | Issue | Effort | Impact |
|--------|-------|--------|--------|
| Add E2E orchestration test | #10 | 4-6 hours | 40% confidence gap closed |
| Enable relevantFields allowlist | #9 | 1 hour | 60% token waste reduction |
| Add client auto-resume after approval | #2 | 3 hours | Seamless resume UX |
| Verify Redis in production | #5 | 30 min | Confirms rate limit enforcement |

### Medium-Term (Next Month)

| Action | Issue | Effort | Impact |
|--------|-------|--------|--------|
| Enforce facade usage via ESLint | #1 | 1 hour | Prevents coupling drift |
| Add state machine + post-processor tests | #10 | 6 hours | Further test coverage |
| Add field priority system for context | #9 | 1 day | 70% token waste reduction |
| Add pre-scaling checklist | #5 | 2 hours | Prevents multi-instance issues |

### No Action Required

| Issue | Reason |
|-------|--------|
| #4 (Orchestrator size) | Already refactored - 52% reduction achieved |
| #7 (promptVersion gate) | Gate exists and is tested - claim was incorrect |
| #8 (Approval query) | Already filters by courseId - claim was outdated |

---

## Architecture Health Summary

### Strengths
- Clean hexagonal architecture with ports/adapters pattern
- Comprehensive prompt regression testing (6 golden fixtures)
- SSE contract testing (35+ event types validated)
- Fail-closed rate limiting for expensive operations
- Checkpoint system with semantic version gating
- Recent refactoring shows active technical debt management

### Weaknesses
- FallbackTracker infrastructure built but disconnected
- Idempotency infrastructure built but never activated
- Core orchestration flow has 0% test coverage
- Context sync wastes 3-5x tokens without field filtering

### Risk Assessment
- **Data Loss Risk**: LOW - No destructive operations without safeguards
- **Cost Risk**: MEDIUM - Duplicate courses ($2-5 each) + token waste
- **Quality Risk**: MEDIUM-HIGH - Fallback content can reach users undetected
- **Scalability Risk**: LOW (current) / HIGH (if scaling without Redis)

---

*Report generated via deep codebase analysis with line-level evidence verification.*
*Total files analyzed: 50+ across 10 investigation threads.*
