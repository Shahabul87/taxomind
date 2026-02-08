# SAM AI Agentic System — Comprehensive Gap Fix Plan

## Overview

This plan addresses all identified weaknesses and gaps across the SAM AI Agentic system,
organized by priority and grouped by subsystem. Each fix includes the exact files to modify,
what to change, and why.

---

## PHASE 1: CRITICAL — Engine Registration & Validation

### Fix 1.1: Register Educational Engines with Orchestrator

**Problem**: Only 6 engines are registered in `subsystem-init.ts:152-167` (context, blooms,
content, personalization, assessment, response), but 30 modes reference engine names like
`socratic`, `depth`, `exam`, `coaching`, `practice`, `memory`, `analytics`, `research`,
`competency`, `metacognition`, `knowledge-graph`, `market`, `predictive`, `collaboration`,
etc. The orchestrator silently filters unregistered engines — modes appear to work but
run with degraded pipelines.

**Files to modify**:
- `lib/sam/pipeline/subsystem-init.ts` — Add engine registrations (lines 152-167)

**What to do**:
1. Import educational engine factories from `@sam-ai/educational`:
   - `createSocraticTeachingEngine`
   - `createPracticeProblemsEngine`
   - `createAdaptiveContentEngine`
   - `createKnowledgeGraphEngine`
   - `createMicrolearningEngine`
   - `createMetacognitionEngine`
   - `createCompetencyEngine`
   - `createSkillBuildTrackEngine`
   - `createAdvancedExamEngine`
   - `createMemoryEngine`
2. Register each with `orchestrator.registerEngine()` after the existing 6
3. Map each engine's `name` property to match the string used in mode presets:
   - `socratic-tutor` mode uses `'socratic'` → engine name must be `'socratic'`
   - `exam-builder` mode uses `'exam'` → engine name must be `'exam'`
   - etc.
4. For engines that don't yet exist as implementations (e.g., `coaching`, `planning`,
   `trends`, `integrity`, `research`, `resources`, `market`, `predictive`,
   `collaboration`, `analytics`), create lightweight adapter engines that delegate to
   the response engine with mode-specific system prompts — this gives them functional
   behavior without full engine implementations

**Why**: Without registration, most specialized modes degrade to just `context + response`,
making mode selection cosmetic rather than functional.

---

### Fix 1.2: Add Startup Engine Validation

**Problem**: No validation checks that all mode-referenced engines are actually registered.
Silent failures are invisible to developers and users.

**Files to modify**:
- `lib/sam/pipeline/subsystem-init.ts` — Add validation after registration
- `lib/sam/modes/registry.ts` — Export engine name list

**What to do**:
1. After all engines are registered, collect all engine names from the mode registry:
   ```typescript
   const allModeEngines = new Set<string>();
   for (const mode of Object.values(MODES)) {
     mode.enginePreset.forEach(e => allModeEngines.add(e));
   }
   ```
2. Compare against `orchestrator.getRegisteredEngines()`
3. Log warnings for any unregistered engines referenced by modes
4. In development, throw an error to catch registration gaps early
5. In production, log warnings but continue (graceful degradation)

**Why**: Prevents silent engine resolution failures and catches misconfiguration at startup.

---

## PHASE 2: CRITICAL — Connect Chat to Streaming

### Fix 2.1: Wire Chat Component to Streaming Endpoint

**Problem**: The streaming infrastructure is fully built (`/api/sam/unified/stream/route.ts`
with 192 lines, `streaming-adapter.ts` with 580 lines, AI adapters with `chatStream()`),
but the main chat component (`sam-engine-powered-chat.tsx:189`) still POSTs to
`/api/sam/unified` and waits for the complete JSON response. Users experience 3-10 second
wait times with no feedback.

**Files to modify**:
- `components/sam/sam-engine-powered-chat.tsx` — Change `sendMessage()` to use streaming
  (lines 174-295)

**What to do**:
1. Replace the `fetch('/api/sam/unified')` call with a streaming fetch:
   ```typescript
   const response = await fetch('/api/sam/unified/stream', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(payload),
   });
   const reader = response.body?.getReader();
   const decoder = new TextDecoder();
   ```
2. Parse SSE events (`event:` and `data:` lines) as they arrive
3. Handle event types defined in `streaming-adapter.ts:30-34`:
   - `start` → show typing indicator with engine metadata
   - `content` → append text tokens to the message in real-time
   - `content-replace` → replace full response (safety override)
   - `insights` → update engine insights panel
   - `suggestions` → render suggestion chips
   - `actions` → render action buttons
   - `done` → finalize message, update metadata
   - `error` → show error with retry option
4. Add a `streamingContent` ref to accumulate tokens
5. Show a "streaming" indicator badge during token delivery
6. Keep the non-streaming endpoint as fallback (try streaming, catch → fall back to JSON)

**Why**: Users get immediate visual feedback as responses form, reducing perceived latency
from 3-10 seconds to <500ms for first token.

---

### Fix 2.2: Add Streaming State to Chat UI

**Problem**: No visual indication of streaming progress in the chat interface.

**Files to modify**:
- `components/sam/sam-engine-powered-chat.tsx` — Add streaming state management

**What to do**:
1. Add `isStreaming` state alongside existing `isLoading`
2. During streaming, show a pulsing cursor at the end of the accumulating message
3. Show which pipeline stages have completed (from SSE `done` events per stage)
4. Disable send button during streaming
5. Add "Stop generating" button that aborts the fetch via `AbortController`

---

## PHASE 3: CRITICAL — Spaced Repetition & Mastery Persistence

### Fix 3.1: Add Missing Schema Fields

**Problem**: SM-2 quality (0-5), priority, trend, confidence, and decay timestamps are
computed but never stored. Data is lost on process restart.

**Files to modify**:
- `prisma/domains/03-learning.prisma` — Add fields to existing models

**What to do**:
1. Add fields to `SpacedRepetitionSchedule` (line 1110):
   ```prisma
   quality              Int?           // 0-5 SM-2 quality score
   priority             String?        // urgent/high/medium/low
   bloomsLevel          BloomsLevel?   // For decay rate lookup
   lastDecayAppliedAt   DateTime?      // When decay was last calculated
   ```
2. Add fields to `CognitiveSkillProgress` (line 1074):
   ```prisma
   trend                String?        @default("stable")  // improving/stable/declining
   confidence           Float?         @default(0)         // 0-1 confidence in mastery
   lastDecayAppliedAt   DateTime?      // When decay was last calculated
   ```
3. All new fields MUST be optional or have defaults (Railway safety rule)
4. Run `npx prisma migrate dev --name add_memory_persistence_fields`

---

### Fix 3.2: Persist Computed Values in Pipeline

**Problem**: `orchestration-stage.ts:626-627` calls `mastery.processEvaluation()` and
`spacedRep.scheduleFromEvaluation()` but only updates in-memory stores. The returned
`masteryResult` and `scheduleResult` are logged but not written to the database.

**Files to modify**:
- `lib/sam/pipeline/orchestration-stage.ts` — Add DB writes after subsystem calls
  (after line 627)
- `lib/sam/stores/prisma-spaced-repetition-store.ts` — Update `scheduleReview()` to
  persist quality and priority (line 245-255)
- `packages/memory/src/student-profile-store.ts` — Update `updateMastery()` to persist
  trend and confidence (line 540-601)

**What to do**:
1. In `prisma-spaced-repetition-store.ts` `scheduleReview()`, add `quality` and `priority`
   to the Prisma `update`/`create` data object
2. In `student-profile-store.ts` `updateMastery()`, add `trend` and `confidence` to the
   Prisma `upsert` data object
3. In `orchestration-stage.ts`, after line 627, write the computed mastery result to the
   Prisma `CognitiveSkillProgress` table directly if the subsystem stores are in-memory:
   ```typescript
   // Persist to DB if subsystems use in-memory stores
   await db.cognitiveSkillProgress.upsert({
     where: { userId_conceptId: { userId: ctx.user.id, conceptId: ctx.pageContext.entityId } },
     update: {
       overallMastery: masteryResult.currentMastery.score,
       currentBloomsLevel: bloomsAnalysis.dominantLevel,
       trend: masteryResult.currentMastery.trend,
       confidence: masteryResult.currentMastery.confidence,
       totalAttempts: { increment: 1 },
       lastAttemptDate: new Date(),
     },
     create: { ... },
   });
   ```

---

### Fix 3.3: Create Mastery Decay Cron Job

**Problem**: Bloom's-weighted decay (`mastery-tracker.ts:310-359`) is fully implemented
with per-level decay rates (REMEMBER: 0.2%/day, CREATE: 0.7%/day) and sub-level modifiers,
but `applyDecay()` is never called automatically. Mastery scores remain artificially high.

**Files to create**:
- `app/api/cron/apply-mastery-decay/route.ts` — Cron endpoint

**What to do**:
1. Create a POST endpoint protected by `CRON_SECRET` header
2. Query all `CognitiveSkillProgress` records where
   `lastDecayAppliedAt < NOW() - 1 day` (or NULL)
3. For each record, calculate decay using the existing formula:
   ```typescript
   const daysSinceLastDecay = differenceInDays(now, record.lastDecayAppliedAt ?? record.updatedAt);
   const baseRate = BLOOMS_DECAY_RATES[record.currentBloomsLevel]; // 0.002 - 0.007
   const decayAmount = daysSinceLastDecay * baseRate * 100; // Convert to percentage
   const newScore = Math.max(0, record.overallMastery - decayAmount);
   ```
4. Batch update records with new scores and `lastDecayAppliedAt = now()`
5. Also apply decay to per-level mastery fields (rememberMastery, understandMastery, etc.)
6. Update the `trend` field based on score trajectory
7. Configure Railway cron or Vercel cron to run daily

---

### Fix 3.4: Ensure Prisma Stores Are Used (Not In-Memory)

**Problem**: `subsystem-init.ts:182-189` initializes mastery tracker and spaced rep
scheduler with stores from `getTaxomindContext()`. Need to verify these are Prisma-backed
stores, not in-memory.

**Files to verify/modify**:
- `lib/sam/pipeline/subsystem-init.ts` (lines 182-189)
- `lib/sam/taxomind-context.ts` — Store factory map

**What to do**:
1. Verify `getStudentProfileStore()` returns `PrismaStudentProfileStore` (not in-memory)
2. Verify `getReviewScheduleStore()` returns `PrismaReviewScheduleStore` (not in-memory)
3. If either returns in-memory implementations, update the factory map in
   `taxomind-context.ts` to use Prisma implementations
4. Add a startup log confirming which store implementations are active

---

## PHASE 4: HIGH — Course Creation Sequential Orchestrator

### Fix 4.1: Create Sequential Stage Orchestrator

**Problem**: Stages 1, 2, 3 are fully implemented individually but NO route chains them
together. The `SequentialCreationModal` expects progress data but no backend drives it.
The current `/api/sam/create-course-complete` does one-shot generation, not sequential.

**Files to create**:
- `app/api/sam/course-creation/orchestrate/route.ts` — SSE streaming orchestrator

**What to do**:
1. Create a POST endpoint that accepts full course creation params
2. Return a `ReadableStream` with SSE events for real-time progress
3. Orchestrate the sequential flow:
   ```
   For each chapter (1..N):
     Call Stage 1 → Generate chapter
     Emit SSE: { type: 'chapter', data: chapter, progress: X% }

     For each section (1..M) in this chapter:
       Call Stage 2 → Generate section (pass all previous context)
       Emit SSE: { type: 'section', data: section, progress: X% }

       Call Stage 3 → Generate section details
       Emit SSE: { type: 'details', data: details, progress: X% }

   Emit SSE: { type: 'complete', data: fullCourse }
   ```
4. Pass full context between stages (each stage receives ALL previous outputs)
5. Track quality scores per stage and emit them in SSE events
6. Include SAM thinking text in SSE events for the modal to display

---

### Fix 4.2: Enforce Quality Gates with Retry

**Problem**: Quality scores are calculated in each stage (stage-1:265-290, stage-2:324-354,
stage-3:291-328) but NOT used to fail or retry. Comment at stage-2:117 says
"Could implement retry logic here" but it's not implemented.

**Files to modify**:
- `app/api/sam/course-creation/stage-1/route.ts` — Add quality threshold + retry
- `app/api/sam/course-creation/stage-2/route.ts` — Add quality threshold + retry
- `app/api/sam/course-creation/stage-3/route.ts` — Add quality threshold + retry

**What to do**:
1. Define minimum quality threshold (e.g., 60/100)
2. After `calculateQualityScore()`, check if score < threshold
3. If below threshold, retry generation up to 2 times with targeted feedback:
   ```typescript
   const QUALITY_THRESHOLD = 60;
   const MAX_RETRIES = 2;

   for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
     const result = await generateChapter(prompt);
     const quality = calculateQualityScore(result);

     if (quality >= QUALITY_THRESHOLD) break;

     // Add quality feedback to prompt for next attempt
     prompt += `\n[QUALITY IMPROVEMENT: Score ${quality}/100. Issues: ${getIssues()}]`;
   }
   ```
4. For uniqueness failures in Stage 2, actually regenerate (currently just warns)
5. Use fallback generators (which already exist) only after all retries fail

---

### Fix 4.3: Connect SequentialCreationModal to Orchestrator

**Problem**: `SequentialCreationModal` (631 lines) has full UI for showing progress but
no backend endpoint streams progress data to it.

**Files to modify**:
- `components/sam/sequential-creation-modal.tsx` — Add SSE connection
- Component that opens the modal (find the parent that controls `isOpen`)

**What to do**:
1. When modal opens and creation starts, connect to the new orchestrate endpoint via fetch
   with streaming reader
2. Parse SSE events and update `CreationProgress` state:
   - `chapter` events → update `currentChapter`, add to completed list
   - `section` events → update `currentSection`
   - `details` events → update section details
   - `thinking` events → update SAM thinking display
   - `quality` events → update quality score displays
   - `complete` event → show success state
   - `error` event → show error with retry option
3. Track completion percentage based on total chapters/sections vs completed

---

## PHASE 5: MEDIUM — Background Stage Race Condition

### Fix 5.1: Fix stageErrors Array Race Condition

**Problem**: In `unified/route.ts:93-94` and `202-205`, concurrent background stages
mutate `ctx.stageErrors` via spread operator. Two concurrent failures could lose one error.

**Files to modify**:
- `app/api/sam/unified/route.ts` — Use atomic error collection (lines 185-250)

**What to do**:
1. Replace mutable `ctx.stageErrors` array with a `Map` or dedicated collector:
   ```typescript
   const bgErrors: Array<{ stage: string; error: string; timestamp: number }> = [];
   // Collect errors in the promise result, not in shared state
   ```
2. After `Promise.race`, merge collected errors into `ctx.stageErrors` in one operation
3. Each background stage should return its errors in the result object rather than
   mutating shared state

---

## PHASE 6: MEDIUM — Preset Scoring Calibration

### Fix 6.1: Add Per-User Preset Learning

**Problem**: Signal weights in `selectEnginePreset()` (orchestration-stage.ts:89-252) are
hardcoded. The effectiveness tie-breaker only applies on exact score ties.

**Files to modify**:
- `lib/sam/pipeline/orchestration-stage.ts` — Add user-specific weight adjustments
- `lib/sam/pipeline/preset-tracker.ts` — Extend tracking

**What to do**:
1. After response delivery, collect implicit feedback (message length of follow-up,
   whether user switched modes, whether user asked to retry)
2. Store per-user preset effectiveness scores in the database
3. Apply a small multiplier to preset scores based on historical user preference:
   ```typescript
   const userBoost = getUserPresetBoost(userId, preset); // 0.8 - 1.2 range
   scores[preset] *= userBoost;
   ```
4. Keep the Bayesian global scores as fallback for new users

---

## PHASE 7: MEDIUM — Intent Classifier Cost Control

### Fix 7.1: Add Tier 2 Budget Limit

**Problem**: When Tier 1 heuristic confidence < 0.6, the system calls Claude for
AI-powered classification. No limit on how often this triggers per session.

**Files to modify**:
- `lib/sam/modes/intent-classifier.ts` or `intent-classifier-async.ts`

**What to do**:
1. Add a per-session counter for Tier 2 calls (store in session context or memory)
2. After N Tier 2 calls per session (e.g., 5), fall back to Tier 1 result even if
   confidence is low
3. Log when budget is exhausted for monitoring
4. Consider caching Tier 2 results for similar messages (fuzzy match)

---

## PHASE 8: MEDIUM — Engine Maturity Gating

### Fix 8.1: Surface Engine Maturity to Users

**Problem**: `engineMaturityMap` is computed in `resolver.ts:121-124` and returned in
metadata, but never shown to users or used to gate mode availability.

**Files to modify**:
- `components/sam/chat/ChatHeader.tsx` — Add maturity indicators to mode dropdown
- `lib/sam/modes/registry.ts` — Add maturity metadata per mode

**What to do**:
1. In the mode dropdown, show a small indicator next to each mode:
   - `stable` → no indicator (default)
   - `beta` → "Beta" badge
   - `experimental` → "Experimental" badge with tooltip
2. In the mode greeting message, include maturity context if not stable
3. Consider hiding `experimental` modes behind a feature flag or "Advanced" toggle

---

## PHASE 9: LOW — Cross-Feature Data Flow

### Fix 9.1: Self-Assessment → Skill Building Integration

**Problem**: Self-assessment results update mastery but don't feed the skill building
decay model or roadmap adjustments.

**Files to modify**:
- `app/api/exams/evaluate/route.ts` — Add skill profile update after evaluation
- `lib/sam/agentic/learning-analytics-service.ts` — Add assessment result forwarding

**What to do**:
1. After exam evaluation completes, call the skill tracker to update relevant skill
   dimensions:
   ```typescript
   const skillUpdate = await skillTracker.recordAssessment({
     userId,
     skillId: exam.topicId,
     score: evaluationResult.score,
     bloomsLevel: evaluationResult.bloomsLevel,
     evidenceType: 'ASSESSMENT',
   });
   ```
2. Update the skill decay model's `lastReviewDate` to reset decay timer
3. If the assessment reveals mastery above threshold, suggest next skills in the roadmap

---

### Fix 9.2: Analytics → Proactive Interventions

**Problem**: Learning analytics track patterns but don't trigger proactive interventions.

**Files to modify**:
- `lib/sam/pipeline/intervention-stage.ts` — Add analytics-triggered interventions

**What to do**:
1. After analytics detect patterns (declining scores, missed sessions, stagnant skills),
   create intervention triggers:
   - 3+ days without study → "check-in" intervention
   - Declining mastery trend → "review recommended" nudge
   - Skill approaching decay threshold → "practice session" suggestion
2. These triggers feed into the existing intervention pipeline

---

## PHASE 10: LOW — Export & Sharing

### Fix 10.1: Add Analytics Export

**Problem**: No PDF/CSV export for analytics dashboards.

**Files to create**:
- `app/api/learning-analytics/export/route.ts` — Export endpoint

**What to do**:
1. Accept `format` param: `csv` or `json`
2. Query the same data as the personal analytics endpoint
3. For CSV: use a library like `papaparse` to serialize
4. For JSON: return structured analytics data
5. Set appropriate Content-Disposition headers for download

---

### Fix 10.2: Add Self-Assessment Result Export

**Problem**: No PDF/report generation for assessment attempts.

**Files to create**:
- `app/api/self-assessment/export/[attemptId]/route.ts` — Export single attempt

**What to do**:
1. Query the attempt with questions and answers
2. Generate a structured report with:
   - Overall score and pass/fail status
   - Bloom's distribution breakdown
   - Per-question performance
   - AI evaluation summary
   - Learning recommendations
3. Return as JSON (frontend can render to PDF using browser APIs)

---

## PHASE 11: LOW — Skill Building Enhancements

### Fix 11.1: Framework Mapping UI

**Problem**: 6 skill frameworks (SFIA, ONET, ESCO, NICE, DREYFUS, CUSTOM) are stored in
the database but no UI allows users to view or select frameworks.

**Files to create**:
- `components/sam/skill-tracking/FrameworkSelector.tsx` — Framework picker component

**What to do**:
1. Show available frameworks as tabs or dropdown in the skill profile page
2. Display the user's current proficiency mapped to each framework's levels
3. Allow users to set a target framework for their skill development

---

### Fix 11.2: 10,000-Hour Practice Tracking

**Problem**: References to `SkillMastery10K` and cumulative hour tracking exist in types
but the tracking mechanism isn't fully visible.

**Files to verify/modify**:
- `prisma/domains/23-practice-tracking.prisma` — Verify practice session model
- `packages/educational/src/engines/skill-build-track-engine.ts` — Wire to practice log

**What to do**:
1. Ensure practice sessions record duration in hours/minutes
2. Aggregate total practice hours per skill in the skill profile
3. Show progress toward 10,000 hours as a percentage/visualization
4. Calculate estimated time to next proficiency level based on current velocity

---

## PHASE 12: LOW — Self-Assessment Enhancements

### Fix 12.1: Wire CAT to Self-Assessment

**Problem**: Computer Adaptive Testing (CAT) exists separately but isn't available as an
option within self-assessment.

**Files to modify**:
- `components/sam/self-assessment-hub/SelfAssessmentHub.tsx` — Add CAT option
- Create an adapter that feeds CAT items into self-assessment flow

**What to do**:
1. Add a toggle in self-assessment creation: "Enable Adaptive Testing"
2. When enabled, use CAT algorithm to select next question based on estimated ability
3. Feed CAT results back into the standard evaluation pipeline

---

### Fix 12.2: Question Template Library

**Problem**: Users must create questions from scratch every time.

**Files to create**:
- `lib/sam/self-assessment/templates.ts` — Pre-built question templates
- UI component for template selection

**What to do**:
1. Create template collections per subject area (e.g., "Biology MCQ Set",
   "Math Problem Solving")
2. Each template includes: question format, Bloom's level, difficulty, sample questions
3. Users can select a template as a starting point and customize
4. AI can expand templates into full question sets

---

## Implementation Order

| Priority | Phase | Estimated Files | Impact |
|----------|-------|-----------------|--------|
| P0 | Phase 1 (Engine Registration) | 2-3 files | All 30 modes become functional |
| P0 | Phase 3 (Mastery Persistence) | 4-5 files + migration | Stop losing learning data |
| P1 | Phase 2 (Chat Streaming) | 1-2 files | Immediate UX improvement |
| P1 | Phase 4 (Course Creation) | 3-4 files | Complete course creation flow |
| P2 | Phase 5 (Race Condition) | 1 file | Prevent error data loss |
| P2 | Phase 7 (Intent Classifier) | 1 file | Cost control |
| P3 | Phase 6 (Preset Calibration) | 2 files | Better engine selection |
| P3 | Phase 8 (Maturity Gating) | 2 files | User transparency |
| P3 | Phase 9 (Cross-Feature) | 2-3 files | Feature synergy |
| P4 | Phase 10 (Export) | 2 files | Data portability |
| P4 | Phase 11 (Skills) | 2-3 files | Feature completeness |
| P4 | Phase 12 (Assessment) | 3-4 files | Feature completeness |

---

## Dependencies Between Phases

```
Phase 1 (Engine Registration)
  └─→ Phase 8 (Maturity Gating) — needs registered engines to show maturity

Phase 3 (Mastery Persistence)
  ├─→ Phase 9.1 (Self-Assessment → Skills) — needs persistent mastery data
  └─→ Phase 9.2 (Analytics → Interventions) — needs trend data

Phase 4 (Course Creation Orchestrator)
  └─→ Phase 4.3 (Modal Connection) — needs orchestrator endpoint first

Phase 2 (Chat Streaming) — independent, can start immediately
Phase 5 (Race Condition) — independent, can start immediately
Phase 7 (Intent Classifier) — independent, can start immediately
```

---

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|------------|
| Phase 1 | Engine factories may not all be exported | Check package exports first |
| Phase 2 | Streaming may break existing chat features | Keep JSON fallback |
| Phase 3 | Prisma migration on production data | All new fields optional/default |
| Phase 4 | Long-running SSE connection may timeout | Add keep-alive heartbeats |
| Phase 5 | Refactoring shared state may introduce bugs | Test with concurrent requests |

---

## Testing Strategy

### Per-Phase Testing
1. **Phase 1**: Log registered engines at startup, verify all 30 modes resolve to
   registered engines. Test each mode category with sample messages.
2. **Phase 2**: Test streaming with slow network simulation. Verify fallback to JSON.
   Test abort/cancel behavior.
3. **Phase 3**: Create migration, verify existing data preserved. Test decay calculation
   with known inputs. Verify SM-2 parameters round-trip through DB.
4. **Phase 4**: Generate a complete course with 3 chapters x 3 sections. Verify all 9
   stage calls complete. Test quality gate retry. Verify SSE events reach modal.
5. **Phase 5**: Simulate 3 concurrent background stage failures. Verify all 3 errors
   are captured in stageErrors.

---

*Generated: 2026-02-03*
*Status: Ready for implementation*
