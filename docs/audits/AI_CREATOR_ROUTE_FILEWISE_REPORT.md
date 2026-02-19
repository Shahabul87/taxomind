# AI Creator Route File-Wise Audit Report

Date: 2026-02-18  
Route target: `/teacher/create/ai-creator`

## 1) Verification method (no guessing)
This report is based on direct inspection of route/UI files, API handlers, orchestration internals, schema, and route manifests in this workspace.

Inspected areas:
- UI route: `app/(protected)/teacher/create/ai-creator/*`
- Parent shell affecting this route: `app/(protected)/teacher/create/layout.tsx`, `app/(protected)/teacher/create/_components/teacher-create-client.tsx`
- APIs: `app/api/sam/course-creation/*/route.ts`
- Orchestration internals: `lib/sam/course-creation/*`
- DB model: `prisma/schema.prisma`
- Modal UX path: `components/sam/sequential-creation-modal.tsx`
- Build/runtime manifests used for bundle hotspot evidence:
  - `.next/dev/server/app/(protected)/teacher/create/ai-creator/page/build-manifest.json`
  - `.next/dev/server/app/(protected)/teacher/create/ai-creator/page/react-loadable-manifest.json`

Executed tests (current workspace state):
- PASS (103):
  - `lib/sam/course-creation/__tests__/integration/sse-contract.test.ts`
  - `lib/sam/course-creation/__tests__/integration/approve-flow.test.ts`
  - `lib/sam/course-creation/__tests__/integration/pipeline-resume.test.ts`
  - `lib/sam/course-creation/__tests__/integration/approve-and-resume-flow.test.ts`
- PASS (21):
  - `lib/sam/course-creation/__tests__/sanitization.test.ts`
- FAIL:
  - `lib/sam/course-creation/__tests__/integration/orchestration-e2e.test.ts` (2 assertions)
  - `lib/sam/course-creation/__tests__/integration/stage-schema-contract.test.ts` (2 assertions)

Runtime limitation:
- Direct HTTP probing of `http://localhost:3000/teacher/create/ai-creator` was not reachable from this sandbox (`curl` connection refused), so load/TTFB metrics could not be measured from this environment.

---

## 2) Direct answers to your 3 core questions

### Q1. Is this AI generation enterprise-level reliable?
Short answer: **Not yet**.

Why:
- Critical resume-authorization flaw can mutate plan state before ownership check:
  - `lib/sam/course-creation/checkpoint-manager.ts:200`
  - `lib/sam/course-creation/checkpoint-manager.ts:224`
  - ownership check later at `lib/sam/course-creation/checkpoint-manager.ts:343`
- Idempotency dedupe is not DB-atomic as implemented (metadata JSON lookup, no unique scalar fields):
  - claim comment: `app/api/sam/course-creation/orchestrate/route.ts:35`
  - model has only `metadata Json?`, no unique `requestId/requestFingerprint` fields: `prisma/schema.prisma:8360`
- Reliability tests are not fully green (`orchestration-e2e`, `stage-schema-contract` failing currently).

What is strong:
- Auth + schema validation + rate limit present in core expensive endpoints (`orchestrate`, `regenerate-chapter`, `approve-and-resume`, `estimate-cost`).
- Prompt/input sanitization and output HTML sanitization are implemented and tested:
  - `lib/sam/course-creation/helpers.ts:34`
  - `lib/sam/course-creation/helpers.ts:99`

### Q2. Is generation performance implementation good?
Short answer: **Partially good, but has high-impact gaps**.

Good parts:
- SSE streaming + resume architecture is mature.
- Dynamic step splitting in UI reduces first-route client work:
  - `app/(protected)/teacher/create/ai-creator/page.tsx:47`
  - `app/(protected)/teacher/create/ai-creator/page.tsx:51`
  - `app/(protected)/teacher/create/ai-creator/page.tsx:55`

Gaps:
- Abort signal is passed into orchestrator, but not enforced inside expensive generation phases:
  - passed: `app/api/sam/course-creation/orchestrate/route.ts:349`
  - in options: `lib/sam/course-creation/orchestrator.ts:80`
  - phase generate has no abort guard before/within `generateSingleChapter`: `lib/sam/course-creation/step-executor-phases.ts:203`
- UI shell duplication adds render/hydration work:
  - parent shell: `app/(protected)/teacher/create/layout.tsx:19`, `app/(protected)/teacher/create/_components/teacher-create-client.tsx:44`
  - route shell again: `app/(protected)/teacher/create/ai-creator/_components/AICreatorLayout.tsx:79`, `app/(protected)/teacher/create/ai-creator/_components/AICreatorLayout.tsx:89`

### Q3. Security concerns in this route?
Short answer: **Yes, real concerns exist**.

Highest concern:
- Cross-user plan mutation risk in resume deadline expiry path (status update before owner verification):
  - `lib/sam/course-creation/checkpoint-manager.ts:224`

Additional concerns:
- Error detail leakage in response bodies (raw `error.message` paths):
  - `app/api/sam/course-creation/orchestrate/route.ts:419`
  - `app/api/sam/course-creation/regenerate-chapter/route.ts:115`
- Subscription-gate parity missing for approve+resume AI-generation path:
  - `app/api/sam/course-creation/approve-and-resume/route.ts:82` has rate limit, but no `withSubscriptionGate` call.

---

## 3) File-wise findings

### P0 (critical)

1. Resume path can mutate plan before authorization
- File: `lib/sam/course-creation/checkpoint-manager.ts`
- Evidence:
  - plan fetched by step metadata `courseId`: `:200`
  - expired deadline updates plan status to `FAILED`: `:224`
  - course ownership check occurs after: `:343`
- Risk:
  - plan state mutation can happen before user ownership is verified.

2. DB-level dedupe is not truly enforced
- Files:
  - `app/api/sam/course-creation/orchestrate/route.ts:35`
  - `prisma/schema.prisma:8334`
  - `lib/sam/course-creation/course-initializer.ts` (stores dedupe keys in JSON metadata)
- Risk:
  - race windows across instances/processes can allow duplicate orchestration runs.

### P1 (high)

3. Subscription gate inconsistency for resume generation
- File: `app/api/sam/course-creation/approve-and-resume/route.ts`
- Evidence:
  - has `withRateLimit`: `:82`
  - missing `withSubscriptionGate` call.

4. Cancellation propagation gap inside heavy generation
- Files:
  - `app/api/sam/course-creation/orchestrate/route.ts:349`
  - `lib/sam/course-creation/orchestrator.ts:512`
  - `lib/sam/course-creation/step-executor-phases.ts:203`
- Evidence:
  - abort signal flows into orchestrator/pipeline options, but stage execution path shown at `phaseGenerate` does not check abort before/inside expensive AI call.

5. Test reliability drift exists now
- Files:
  - `lib/sam/course-creation/__tests__/integration/orchestration-e2e.test.ts`
  - `lib/sam/course-creation/__tests__/integration/stage-schema-contract.test.ts`
- Evidence:
  - currently failing assertions in this workspace.

### P2 (medium)

6. Duplicate dashboard shells increase render/hydration complexity
- Files:
  - `app/(protected)/teacher/create/layout.tsx:19`
  - `app/(protected)/teacher/create/_components/teacher-create-client.tsx:44`
  - `app/(protected)/teacher/create/ai-creator/_components/AICreatorLayout.tsx:79`

7. Mobile bottom bar overlap pattern keeps extra nav machinery mounted
- Files:
  - `app/(protected)/teacher/create/_components/teacher-create-client.tsx:40`
  - `app/(protected)/teacher/create/ai-creator/page.tsx:656`
  - `app/(protected)/teacher/create/ai-creator/components/navigation/MobileStepNav.tsx:38`

8. Nested-scroll modal can create touch scroll traps/jank
- File: `components/sam/sequential-creation-modal.tsx`
- Evidence:
  - nested `ScrollArea` sections: `:373`, `:492`
  - outer scrolling content container: `:661`
  - modal content container with bounded height: `:606`

9. Custom audience field is not persisted into generation payload
- Files:
  - local state only: `app/(protected)/teacher/create/ai-creator/components/steps/target-audience-step.tsx:36`
  - custom textarea bind: `app/(protected)/teacher/create/ai-creator/components/steps/target-audience-step.tsx:115`
  - payload uses `formData.targetAudience` only: `app/(protected)/teacher/create/ai-creator/page.tsx:267`

10. Autosave and estimate request handling can be made more stable
- Files:
  - `app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts:113`
  - `app/(protected)/teacher/create/ai-creator/components/steps/advanced-settings-step.tsx:53`
- Evidence:
  - autosave interval recreated on every `formData`/`step` change.
  - estimate fetch has debounce but no explicit abort controller/request sequence guard.

### P3 (lower)

11. Error message exposure from internal exceptions
- Files:
  - `app/api/sam/course-creation/orchestrate/route.ts:419`
  - `app/api/sam/course-creation/regenerate-chapter/route.ts:115`

---

## 4) Overall performance and smoothness assessment (file-authenticated)

### Load time / bundle hotspots
Evidence from route manifests (dev artifacts):
- Route root main chunk set sum: ~3.48 MB (dev) from `build-manifest.json`.
- Dynamic-entry hotspot totals from `react-loadable-manifest.json`:
  - `components/sam/SAMAssistant.tsx`: ~7.92 MB potential dynamic bundle group
  - `components/dashboard/unified-header/index.ts`: ~3.69 MB potential dynamic bundle group
  - `components/sam/sequential-creation-modal.tsx`: ~0.38 MB
  - Route step entries (`target-audience`, `course-structure`, `advanced-settings`) are smaller individually.

Interpretation:
- Route-level code splitting exists, but parent/shared dynamic groups are heavy and should be audited for route isolation.

### Hydration risks
- `AICreatorLayout` uses `useSession` and returns bare children before session resolves:
  - `app/(protected)/teacher/create/ai-creator/_components/AICreatorLayout.tsx:52`
  - `app/(protected)/teacher/create/ai-creator/_components/AICreatorLayout.tsx:57`
- Parent server layout already authenticates and provides user shell, increasing chance of layout swap/duplication.

### Main-thread / re-render concerns
- Good: many callbacks/memoizations in page and hooks.
- Remaining concerns:
  - duplicated shell components
  - nested scrolling containers in modal
  - autosave interval churn and un-aborted async estimate requests.

### Images/fonts
- No route-local `next/image` usage found in audited route files.
- No route-local custom font loading in these files; font impact likely from app-level layout and should be measured in full browser profiling.

### Mobile/tablet smoothness
- Potential issues:
  - global bottom bar remains enabled while route overlays its own fixed mobile nav.
  - nested modal scroll containers can produce touch scroll competition.
- These are implementation-level risks visible in code paths above.

---

## 5) Final verdict

- Enterprise reliability: **No (not yet)** due to P0 authorization/plan-mutation and dedupe atomicity issues plus current failing integration tests.
- Generation performance implementation: **Mixed** (good architecture, but cancellation propagation and UI shell/scroll complexity need fixes).
- Security on this route: **Has meaningful concerns** (P0 resume mutation ordering, gate parity, raw error leakage).

---

## 6) Detailed fix plan file
Detailed file-wise remediation plan is provided in:
- `docs/audits/AI_CREATOR_ROUTE_FIXING_PLAN.md`

