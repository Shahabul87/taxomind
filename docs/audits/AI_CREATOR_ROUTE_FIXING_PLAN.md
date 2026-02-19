# AI Creator Route Fixing Plan

Date: 2026-02-18  
Route: `/teacher/create/ai-creator`

## Scope
This plan is derived from direct inspection of:
- `app/(protected)/teacher/create/ai-creator/*`
- `app/(protected)/teacher/create/layout.tsx`
- `app/(protected)/teacher/create/_components/teacher-create-client.tsx`
- `app/api/sam/course-creation/*/route.ts`
- `lib/sam/course-creation/*`
- `prisma/schema.prisma`
- `components/sam/sequential-creation-modal.tsx`

And current tests:
- PASS: `sse-contract`, `approve-flow`, `pipeline-resume`, `approve-and-resume-flow` (103 tests)
- PASS: `sanitization` (21 tests)
- FAIL: `orchestration-e2e` (2), `stage-schema-contract` (2)

---

## Priority 0 (security + correctness)

### 1) Fix resume authorization/mutation order
Files:
- `lib/sam/course-creation/checkpoint-manager.ts:200`
- `lib/sam/course-creation/checkpoint-manager.ts:224`
- `lib/sam/course-creation/checkpoint-manager.ts:343`

What to fix:
- Stop mutating `SAMExecutionPlan` (`status: FAILED`) before ownership verification.

How to fix:
1. Resolve course first by `resumeCourseId`, verify `course.userId === userId` before any plan mutation.
2. Constrain plan lookup by owner in query:
   - `where: { goal: { userId }, ... }`
3. Keep deadline expiry handling after authorization is confirmed.

Validation:
- Add test: cross-user `resumeCourseId` cannot mutate target plan.
- Add test: unauthorized expired resume returns 403/unauthorized with zero plan updates.

### 2) Make dedupe DB-atomic across instances
Files:
- `prisma/schema.prisma:8334`
- `app/api/sam/course-creation/orchestrate/route.ts:35`
- `lib/sam/course-creation/course-initializer.ts`

What to fix:
- Current dedupe keys live in JSON `metadata`; no DB unique constraints enforce idempotency atomically.

How to fix:
1. Add scalar fields on `SAMExecutionPlan`:
   - `requestId String?`
   - `requestFingerprint String?`
2. Add unique/index constraints scoped by user:
   - `@@unique([userId, requestId])`
   - `@@unique([userId, requestFingerprint])`
3. Populate fields in creation path.
4. On unique conflict, return existing plan/course response (`ALREADY_RUNNING` or `ALREADY_COMPLETE`).

Validation:
- Concurrency test: same requestId/fingerprint from parallel callers creates one active plan.

### 3) Apply subscription gate on approve+resume
File:
- `app/api/sam/course-creation/approve-and-resume/route.ts:82`

What to fix:
- Endpoint resumes AI generation but does not apply `withSubscriptionGate`.

How to fix:
1. Import and call `withSubscriptionGate(user.id, { category: 'generation' })` after auth.
2. Return gate response on denied access.

Validation:
- Test downgraded user cannot resume via approve+resume.

---

## Priority 1 (reliability + operational safety)

### 4) Propagate cancellation deeply through generation phases
Files:
- `app/api/sam/course-creation/orchestrate/route.ts:349`
- `lib/sam/course-creation/orchestrator.ts:512`
- `lib/sam/course-creation/pipeline-runner.ts:45`
- `lib/sam/course-creation/step-executor-phases.ts:203`
- `lib/sam/course-creation/chapter-generator.ts`

What to fix:
- Abort signal is threaded at top level but not checked in expensive inner generation paths.

How to fix:
1. Add `abortSignal` to step executor and chapter generator function signatures.
2. Add `if (abortSignal?.aborted) throw new AbortError(...)` checks:
   - before stage start
   - before each AI call
   - between retries/critique loops
3. Ensure abort is mapped to controlled `cancelled` completion, not generic failure.

Validation:
- Integration test: cancel during stage 1/2/3 quickly stops further AI calls and DB writes.

### 5) Standardize rate-limit parity
Files:
- `app/api/sam/course-creation/approve/route.ts`
- `app/api/sam/course-creation/dismiss/route.ts`
- `app/api/sam/course-creation/progress/route.ts`

What to fix:
- These routes currently skip `withRateLimit`.

How to fix:
1. Add `withRateLimit` near top of handler:
   - `approve`: `ai` or `standard` based on expected abuse cost
   - `dismiss`: `standard`
   - `progress`: `standard`

Validation:
- Verify 429 behavior and headers for request bursts.

### 6) Restore test-suite stability
Files:
- `lib/sam/course-creation/__tests__/integration/orchestration-e2e.test.ts`
- `lib/sam/course-creation/__tests__/integration/stage-schema-contract.test.ts`

What to fix:
- `orchestration-e2e` asserts function identity (`toBe`) but code wraps callback (`trackingOnSSEEvent`).
- `stage-schema-contract` fixtures/assertions are out of sync with current Stage 3 schema/content behavior.

How to fix:
1. Update orchestration assertions to behavioral checks (event forwarding observed), not callback identity.
2. Update Stage 3 fixture to satisfy strict schema, and adjust brittle literal substring expectations.

Validation:
- Both suites pass consistently in CI.

---

## Priority 2 (frontend performance + smoothness)

### 7) Remove duplicate shell rendering
Files:
- `app/(protected)/teacher/create/layout.tsx:19`
- `app/(protected)/teacher/create/_components/teacher-create-client.tsx:44`
- `app/(protected)/teacher/create/ai-creator/_components/AICreatorLayout.tsx:79`

What to fix:
- Parent layout already renders header/sidebar; AI route adds another header/sidebar stack.

How to fix:
1. Keep one canonical shell (recommended: parent `teacher/create` layout).
2. Refactor `AICreatorLayout` to content-only wrapper (spacing/theme), remove duplicated header/sidebar logic.
3. Remove `useSession` gating in `AICreatorLayout`; rely on parent server-auth layout.

Validation:
- DOM has single header/single sidebar.
- No layout pop-in on initial render.

### 8) Eliminate mobile nav overlap and extra gesture workload
Files:
- `app/(protected)/teacher/create/_components/teacher-create-client.tsx:40`
- `app/(protected)/teacher/create/ai-creator/page.tsx:656`
- `app/(protected)/teacher/create/ai-creator/components/navigation/MobileStepNav.tsx:38`

What to fix:
- Current approach overlays custom nav over global bottom bar instead of disabling global bottom bar on this route.

How to fix:
1. Add route-aware flag to `TeacherCreateClient`:
   - disable `enableBottomBar` for `/teacher/create/ai-creator`
2. Keep only `MobileStepNav` for this route.

Validation:
- Mobile has one bottom nav layer.
- Touch targets remain responsive with no hidden overlapped controls.

### 9) Flatten modal scroll hierarchy
File:
- `components/sam/sequential-creation-modal.tsx`

What to fix:
- Outer scroll container plus inner `ScrollArea` sections can create nested-scroll traps.

How to fix:
1. Keep one vertical scroll container for modal body.
2. Convert inner `ScrollArea` blocks to static content on mobile breakpoints, or only one active scroll area.
3. Verify focus/keyboard scroll remains correct.

Validation:
- Mobile/tablet manual test: smooth scroll, no trapped scroll area, no body-lock conflicts.

### 10) Persist custom audience into payload
Files:
- `app/(protected)/teacher/create/ai-creator/components/steps/target-audience-step.tsx:36`
- `app/(protected)/teacher/create/ai-creator/page.tsx:267`

What to fix:
- `customAudience` is local-only and not included in orchestration config.

How to fix:
1. Add `customAudience` to wizard form state type and initial state.
2. Bind textarea directly to `formData.customAudience`.
3. In config builder, map target audience as:
   - if `targetAudience === 'Custom (describe below)'`, send detailed custom string.

Validation:
- Network payload for orchestrate includes custom audience text.

---

## Priority 3 (hardening + maintainability)

### 11) Avoid leaking internal error messages
Files:
- `app/api/sam/course-creation/orchestrate/route.ts:419`
- `app/api/sam/course-creation/regenerate-chapter/route.ts:115`

What to fix:
- Raw server exception messages are returned to clients.

How to fix:
1. Return generic client-safe error message.
2. Keep detailed message in structured logs with request/run IDs.

Validation:
- 500 responses no longer include internals; logs still provide diagnosis.

### 12) Improve autosave + estimate request stability
Files:
- `app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts:113`
- `app/(protected)/teacher/create/ai-creator/components/steps/advanced-settings-step.tsx:53`

What to fix:
- Autosave interval is recreated on each form/step change.
- Cost estimate fetch does not abort stale requests.

How to fix:
1. Use stable interval with refs for latest state snapshot.
2. Add `AbortController` and request sequence guards for estimate fetch.

Validation:
- No stale estimate overwrite during rapid edits.
- Lower timer churn in performance profiler.

---

## Verification checklist after implementation
1. Security
- Unauthorized resume attempts cannot modify plan state.
- `approve-and-resume` enforces subscription + rate limits.
- 500 responses are sanitized.

2. Reliability
- Duplicate start requests collapse to one canonical run.
- Cancellation stops generation promptly.
- Course-creation integration suite passes.

3. Performance and smoothness
- Single app shell on route.
- No mobile bottom-nav overlap.
- No nested-scroll traps in creation modal.
- Custom audience is preserved in generated course context.

