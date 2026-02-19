# AI Creator Route Fixes: Execution Report

Date: 2026-02-18  
Route: `/teacher/create/ai-creator`

## Scope
This report maps previously identified issues to implemented fixes, file-by-file.

## Fixed Issues (One-by-One)

1. Resume authorization/mutation ordering (P0)  
Files:
- `lib/sam/course-creation/checkpoint-manager.ts`
What was fixed:
- Course ownership/published checks now run before any plan mutation.
- Resume plan lookup is scoped by authenticated owner.
- Deadline auto-fail update occurs only after authorization passes.

2. Dedupe/idempotency hardening across instances (P0)  
Files:
- `app/api/sam/course-creation/orchestrate/route.ts`
What was fixed:
- Added DB-backed dedupe lock using unique `RateLimit` row inserts.
- Added lock release paths for success/error/early-return.
- Preserved in-memory lock for fast same-process suppression.

3. Subscription gate parity for approve+resume (P1)  
Files:
- `app/api/sam/course-creation/approve-and-resume/route.ts`
What was fixed:
- Added `withSubscriptionGate(user.id, { category: 'generation' })`.

4. Rate-limit parity on auxiliary routes (P1)  
Files:
- `app/api/sam/course-creation/approve/route.ts`
- `app/api/sam/course-creation/dismiss/route.ts`
- `app/api/sam/course-creation/progress/route.ts`
What was fixed:
- Added `withRateLimit(req, 'standard')` guards.

5. Error-message leakage reduction (P1/P3)  
Files:
- `app/api/sam/course-creation/orchestrate/route.ts`
- `app/api/sam/course-creation/regenerate-chapter/route.ts`
What was fixed:
- Replaced client-facing raw exception text with generic safe error responses.

6. Cancellation propagation into heavy generation path (P1)  
Files:
- `lib/sam/course-creation/course-state-machine.ts`
- `lib/sam/course-creation/pipeline-runner.ts`
- `lib/sam/course-creation/step-executor-phases.ts`
- `lib/sam/course-creation/chapter-generator.ts`
What was fixed:
- Threaded `abortSignal` deeper into pipeline and chapter generation callbacks.
- Added abort guards at stage boundaries and inside expensive generation loops.
- Abort is handled as controlled pipeline cancellation.

7. Template-required section guardrails (quality)  
Files:
- `lib/sam/course-creation/chapter-templates.ts`
- `lib/sam/course-creation/orchestrator.ts`
- `lib/sam/course-creation/checkpoint-manager.ts`
- `app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts`
What was fixed:
- Enforced minimum section count for required pedagogical roles.
- Prevented truncation of required template sections.
- Clamped effective section count in start/resume flows.

8. Duplicate shell/hydration risk on AI creator route (P2)  
Files:
- `app/(protected)/teacher/create/ai-creator/_components/AICreatorLayout.tsx`
What was fixed:
- Removed duplicated header/sidebar/session-gated shell behavior.
- Converted to a content wrapper to rely on parent authenticated layout.

9. Mobile bottom-nav overlap (P2)  
Files:
- `app/(protected)/teacher/create/_components/teacher-create-client.tsx`
What was fixed:
- Disabled global bottom bar for `/teacher/create/ai-creator` route.

10. Nested-scroll trap in modal (P2)  
Files:
- `components/sam/sequential-creation-modal.tsx`
What was fixed:
- Removed nested `ScrollArea` containers.
- Kept a single main modal scroll container to reduce touch-scroll contention.

11. Custom audience persistence gap (P2)  
Files:
- `app/(protected)/teacher/create/ai-creator/types/sam-creator.types.ts`
- `app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts`
- `app/(protected)/teacher/create/ai-creator/components/steps/target-audience-step.tsx`
- `app/(protected)/teacher/create/ai-creator/page.tsx`
What was fixed:
- Added `customAudience` to canonical form state.
- Added validation and payload mapping to send custom value in generation config.
- Persisted custom audience in SAM memory save path.

12. Autosave churn + stale cost estimate race (P2)  
Files:
- `app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts`
- `app/(protected)/teacher/create/ai-creator/components/steps/advanced-settings-step.tsx`
What was fixed:
- Reworked autosave interval to stable timer + refs.
- Added `AbortController` + request sequence guard for estimate API calls.

13. Escalation gate end-to-end wiring (from route audit)  
Files:
- `app/api/sam/course-creation/orchestrate/route.ts`
- `hooks/use-sam-sequential-creation/index.ts`
- `app/(protected)/teacher/create/ai-creator/page.tsx`
- `components/sam/sequential-creation-modal.tsx`
What was fixed:
- Request schema/payload carries `enableEscalationGate` + `fallbackPolicy`.
- Frontend invokes approve-and-resume decisions and displays explicit paused controls.

## Test/Verification Updates

Files updated for test drift:
- `lib/sam/course-creation/__tests__/checkpoint-manager.test.ts`
- `lib/sam/course-creation/__tests__/integration/pipeline-resume.test.ts`
- `lib/sam/course-creation/__tests__/integration/orchestration-e2e.test.ts`
- `lib/sam/course-creation/__tests__/integration/stage-schema-contract.test.ts`
- `lib/sam/course-creation/__tests__/integration/approve-and-resume-flow.test.ts`

Executed and passing:
- Full folder: `lib/sam/course-creation/__tests__`

Aggregate:
- 15 suites passed
- 285 tests passed

## Residual Hardening (Optional)

1. Dedupe lock lifecycle robustness  
Current lock uses `RateLimit` rows with window buckets and explicit cleanup.  
Optional improvement: migrate to a dedicated lock table with `expiresAt` and heartbeat to reduce stale-lock windows after process crashes.

2. Broader perf proof via browser trace  
Code-level issues were addressed, but route-level Web Vitals and JS task profiling should be validated with a production build trace on real device/network profiles.
