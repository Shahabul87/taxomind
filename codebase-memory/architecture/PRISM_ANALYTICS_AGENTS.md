# PRISM Analytics Agents Architecture

> Two SAM agentic tools that transform raw LMS data into actionable learning insights using the PRISM framework (Profile, Reveal, Identify, Suggest, Monitor).

---

## Table of Contents

1. [Overview](#overview)
2. [Agent 1: PRISM-Student](#agent-1-prism-student)
3. [Agent 2: PRISM-Creator](#agent-2-prism-creator)
4. [Shared Architecture](#shared-architecture)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [File Reference Map](#file-reference-map)
7. [Database Models Used](#database-models-used)
8. [SSE Event Reference](#sse-event-reference)
9. [Caching Strategy](#caching-strategy)
10. [Adding or Modifying Analytics](#adding-or-modifying-analytics)

---

## Overview

Both agents follow the 5-layer SAM agentic pattern documented in `SAM_SKILL_TOOL_PATTERN.md`:

```
Layer 1: Tool Definition       lib/sam/tools/{student,creator}-analytics.ts
Layer 2: Registration          lib/sam/agentic-tooling.ts (standaloneTools array)
Layer 3: Auto-Invoke           lib/sam/tool-planner.ts (MODE_TOOL_AFFINITY + MODE_AUTO_INVOKE)
Layer 4: Skill Descriptor      lib/sam/skills/{student,creator}-analytics.skill.md
Layer 5: Goal/Plan + Memory    lib/sam/{student,creator}-analytics/analytics-controller.ts
                               lib/sam/{student,creator}-analytics/analytics-memory-persistence.ts
```

**Critical design principle**: Stages 1-2 in both pipelines are ALWAYS pure computation (no AI calls). This prevents AI from hallucinating metrics. AI only interprets pre-computed data in later stages.

---

## Agent 1: PRISM-Student

**Purpose**: Individual-level analytics. Answers "How am I doing?" and "What should I study next?"

### Pipeline (5 Stages)

```
User message
  --> Tool Planner auto-invokes sam-student-analytics
  --> 4-step conversational collection (analysisDepth, courseScope, timeRange, confirm)
  --> Frontend POST /api/sam/student-analytics/orchestrate (SSE)
  --> Stage 1: Data Collection         (NO AI -- 3 parallel Prisma query groups)
  --> Stage 2: Cognitive Mapping        (NO AI -- pure computation)
  --> Stage 3: Interpretive Analysis    (1 AI call via runSAMChatWithPreference)
  --> Stage 4: Prescriptions & Alerts   (1 AI call)
  --> Stage 5: Report Generation        (1 AI call)
  --> SSE: complete { report, cognitiveMap, prescriptions, interpretiveAnalysis }
```

**quick_snapshot mode**: Stops after Stage 2 (zero AI calls, ~2-5 seconds).

### Conversational Collection (4 Steps)

| # | Step | Default |
|---|------|---------|
| 1 | `analysisDepth` (quick_snapshot / standard / deep_analysis) | standard |
| 2 | `courseScope` (all_courses / specific_course / recent_activity) | all_courses |
| 3 | `timeRange` (last_7_days / last_30_days / last_90_days / all_time) | last_30_days |
| 4 | `confirm` (yes / adjust) | yes |

### Stage Details

**Stage 1: Data Collection** (no AI, ~2-3s)
- Group A: `CognitiveSkillProgress`, `BloomsPerformanceMetric`, `StudentBloomsProgress`
- Group B: `UserExamAttempt` + `AIEvaluationRecord` + `EnhancedAnswer` (DIAGNOSE data)
- Group C: `LearningSession`, `study_streaks`, `Enrollment`, `LearningActivityLog`
- Output: `PerformanceSnapshot`

**Stage 2: Bloom&apos;s Cognitive Mapping** (no AI, ~1-2s)
- Per-skill Bloom&apos;s scores from `CognitiveSkillProgress`
- Cognitive ceiling (highest level with >= 80%)
- Growth edge (next level to target)
- Bloom&apos;s velocity (levels gained per month)
- Reasoning path distribution from DIAGNOSE data
- Fragile knowledge detection (correct answers with shallow reasoning)
- Cognitive cluster classification
- Output: `BloomsCognitiveMap`

**Stage 3: AI Interpretive Analysis** (1 AI call)
- Explains WHY patterns exist
- Classifies cognitive cluster: fast_starter, slow_but_deep, inconsistent_engager, surface_skimmer, self_directed_expert
- Output: `InterpretiveAnalysis`

**Stage 4: Prescriptions & Alerts** (1 AI call)
- Max 3-5 alerts (no alert fatigue)
- Priority-ordered prescriptions with ARROW phase references
- Each prescription: what to do, why it works, effort level, expected impact
- Output: `PrescriptionOutput`

**Stage 5: Report Generation** (1 AI call)
- Student-friendly report, leads with wins before gaps
- Includes verification questions from DIAGNOSE data
- Output: `PRISMReport`

### Auto-Invoke Patterns

Triggered in `student-analytics` mode when the user message matches:

```
/\b(my|show|view)\b.*\b(analytics|insights|performance|progress)\b/i
/\b(how)\b.*\b(am i|doing|performing|progressing)\b/i
/\b(bloom|cognitive|learning)\b.*\b(profile|map|level|growth)\b/i
/\b(study|learning)\b.*\b(recommendation|suggestion|advice|next)\b/i
/\b(fragile|weak|gap|struggle|stuck)\b.*\b(knowledge|concept|skill|area)\b/i
```

---

## Agent 2: PRISM-Creator

**Purpose**: Cohort/Course-level analytics. Answers "How are my students doing?" and "What should I fix in my course?"

### Pipeline (6 Stages)

```
Creator message
  --> Tool Planner auto-invokes sam-creator-analytics
  --> 5-step conversational collection (courseSelection, timeRange, focusArea, analysisDepth, confirm)
  --> Frontend POST /api/sam/creator-analytics/orchestrate (SSE)
  --> Stage 1: Data Collection & Aggregation  (NO AI -- parallel Prisma queries)
  --> Stage 2: Cohort Cognitive Analysis       (NO AI -- pure computation)
  --> Stage 3: Content & Assessment Quality    (1 AI call, skippable)
  --> Stage 4: Root Cause & Risk Analysis      (1 AI call, skippable)
  --> Stage 5: Prescription Engine             (1 AI call)
  --> Stage 6: Report Generation               (1 AI call)
  --> SSE: complete { report, cohortAnalysis, prescriptions, rootCauseAnalysis }
```

### Conversational Collection (5 Steps)

| # | Step | Default |
|---|------|---------|
| 1 | `courseSelection` (course ID or name) | -- |
| 2 | `timeRange` (last_7_days / last_30_days / last_90_days / all_time) | last_30_days |
| 3 | `focusArea` (cognitive_health / engagement / content_quality / predictions / comprehensive) | comprehensive |
| 4 | `analysisDepth` (overview / standard / deep_dive) | standard |
| 5 | `confirm` (yes / adjust) | yes |

### Focus Area Shortcuts

Not all stages are required for every focus area. The orchestrator skips irrelevant AI stages to save time and tokens:

| Focus Area | Stage 3 (Content) | Stage 4 (Root Cause) | Stage 5 (Prescriptions) | Stage 6 (Report) |
|------------|-------------------|---------------------|------------------------|-------------------|
| cognitive_health | skip | skip | run | run |
| engagement | skip | run | run | run |
| content_quality | run | skip | run | run |
| predictions | skip | run | run | run |
| comprehensive | run | run | run | run |

Stages 1-2 always run. Stages 5-6 always run.

### Stage Details

**Stage 1: Data Collection & Aggregation** (no AI, ~3-5s)
- Enrollment counts + completion rates
- Cohort-level Bloom&apos;s `groupBy` aggregation from `CognitiveSkillProgress`
- Exam pass/fail distributions from `UserExamAttempt`
- Engagement patterns from `LearningSession`
- Content completion per chapter
- DIAGNOSE data aggregation (misconception frequencies)
- Output: `CreatorDataSnapshot`

**Stage 2: Cohort Cognitive Analysis** (no AI, ~2-3s)
- Bloom&apos;s distribution (% of students at each cognitive ceiling)
- Bimodal distribution detection (cohort splitting into haves/have-nots)
- Cohort velocity (average Bloom&apos;s advancement rate)
- Fragile Knowledge Alarm (% of cohort with >30% fragile correct answers)
- Engagement distribution (highly engaged / moderate / disengaging / inactive)
- Dropout risk scoring (7+ day inactivity, declining hours, zero velocity 2+ weeks)
- Output: `CohortCognitiveAnalysis`

**Stage 3: Content & Assessment Quality** (1 AI call)
- Module-by-module achievement rates
- Assessment item analytics (discrimination index, difficulty, Bloom&apos;s alignment)
- ARROW phase coverage analysis
- Output: `ContentQualityReport`

**Stage 4: Root Cause & Risk Analysis** (1 AI call)
- 5 root cause categories: CONTENT, PEDAGOGY, ASSESSMENT, STUDENT, SYSTEM
- Causal chain: symptom -> why -> why -> root -> prescribe at root
- Key principle: if 60%+ students fail at same point, it&apos;s CONTENT not STUDENT
- Dropout predictions with intervention windows
- Output: `RootCauseAnalysis`

**Stage 5: Prescription Engine** (1 AI call)
- Max 5 priority-ordered prescriptions
- ROI estimation: `(impact_score * reach_percentage) / effort_score`
- ARROW phase prescriptions for content fixes
- Assessment redesign suggestions
- Cohort splitting strategies for bimodal distributions
- Output: `CreatorPrescriptions`

**Stage 6: Report Generation** (1 AI call)
- Creator-friendly dashboard summary
- Leads with what&apos;s working before what&apos;s broken
- Quantifies everything: impact, effort, confidence, timelines
- Output: `CreatorPRISMReport`

### Auto-Invoke Patterns

Triggered in `creator-analytics` mode:

```
/\b(course|student|cohort|class)\b.*\b(analytics|insights|performance|health)\b/i
/\b(how)\b.*\b(students?|learners?|cohort|class)\b.*\b(doing|performing|progressing)\b/i
/\b(dropout|retention|engagement|completion)\b.*\b(rate|risk|analysis|report)\b/i
/\b(content|assessment|module)\b.*\b(effectiveness|quality|improvement)\b/i
/\b(who|which)\b.*\b(struggling|failing|behind|at risk)\b/i
/\b(course)\b.*\b(creator|instructor|teacher)\b.*\b(dashboard|report|overview)\b/i
```

---

## Shared Architecture

### AI Call Pattern

All AI calls use the unified provider system. Never call AI directly.

```typescript
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';

const raw = await runSAMChatWithPreference({
  userId,
  capability: 'analysis',
  messages: [{ role: 'user', content: prompt.userPrompt }],
  systemPrompt: prompt.systemPrompt,
  maxTokens: prompt.maxTokens,
  temperature: prompt.temperature,
});
```

This automatically handles: user preference resolution, rate limiting, circuit breaker, fallback provider, usage tracking.

### SAM Goal/Plan Tracking

Both agents create a SAM Goal + ExecutionPlan at the start:

```
initializeAnalyticsGoal(userId, ...)
  --> Creates Goal (status: ACTIVE)
  --> Creates Plan with N steps (one per stage)
  --> Returns { goalId, planId, stepIds }

Per stage:
  advanceStage(planId, stepIds, stageNumber)   -- marks step as in_progress
  completeStep(planId, stepIds, stageNumber)    -- marks step as completed

On success:
  completeAnalytics(goalId, planId, stats)      -- marks Goal + Plan as COMPLETED

On failure:
  failAnalytics(goalId, planId, errorMessage)   -- marks Plan as FAILED, Goal as PAUSED
```

Uses `getGoalStores()` from TaxomindContext (never direct store creation).

### Memory Persistence (Fire-and-Forget)

Both agents persist results asynchronously without blocking the response:

**Student agent**:
- `persistAnalyticsInsightsBackground()` -> `SAMSessionContext` (cache)
- `persistCognitiveProfileBackground()` -> `SAMKnowledgeGraphNode` (knowledge graph)

**Creator agent**:
- `persistCreatorInsightsBackground()` -> `TeacherInsights` (insights table)
- `persistPredictionsBackground()` -> `PredictiveLearningAnalysis` (predictions)
- `persistAnalyticsCacheBackground()` -> `SAMSessionContext` (cache)

All persistence functions catch and log errors silently (fire-and-forget pattern).

### SSE Streaming Pattern

Both API routes follow the same structure:

```typescript
export async function POST(request: NextRequest) {
  // 1. Auth via currentUser()
  // 2. Subscription gate via withSubscriptionGate()
  // 3. Zod validation
  // 4. ReadableStream with sendSSE helper
  // 5. Call orchestrator with onSSEEvent + onProgress callbacks
  // 6. Send 'complete' or 'error' event
  // 7. Close controller
}
```

### Conversational Tool Pattern

Both tools use in-memory state with TTL cleanup:

```typescript
const conversationStates = new Map<string, CollectionState>();
const STATE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of conversationStates) {
    if (now - state.createdAt > STATE_TTL_MS) {
      conversationStates.delete(key);
    }
  }
}, 5 * 60 * 1000);
```

Tools support three paths:
- **Path A (Direct)**: All params provided upfront -> trigger immediately
- **Path B (Start)**: Begin conversational collection -> ask first question
- **Path C (Continue)**: Parse user response -> advance or complete

---

## Data Flow Diagrams

### Student Analytics Flow

```
SAM Chat UI
    |
    v
[Tool Planner] -- auto-invoke match --> [sam-student-analytics Tool]
    |                                            |
    | (4 conversational steps)                   |
    v                                            v
[Frontend] --> POST /api/sam/student-analytics/orchestrate
                            |
                            v
              +---------------------------+
              |  orchestrateStudentAnalytics |
              +---------------------------+
                            |
    +------+-------+--------+--------+--------+
    v      v       v        v        v        v
  Goal  Stage1   Stage2   Stage3   Stage4   Stage5
  Init  (Data)   (Map)    (AI)     (AI)     (AI)
           |        |        |        |        |
           v        v        v        v        v
         Prisma  Compute  Interpret Prescribe Report
         Queries  Bloom's  Analysis  & Alert  Gen
                            |        |        |
                            v        v        v
                      [SSE events streamed to client]
                            |
                            v
              [Memory persistence: SessionContext, KnowledgeGraph]
```

### Creator Analytics Flow

```
SAM Chat UI (Creator context)
    |
    v
[Tool Planner] -- auto-invoke match --> [sam-creator-analytics Tool]
    |                                            |
    | (5 conversational steps)                   |
    v                                            v
[Frontend] --> POST /api/sam/creator-analytics/orchestrate
                            |
                            v
              +-----------------------------+
              | orchestrateCreatorAnalytics  |
              +-----------------------------+
                            |
    +------+-------+--------+--------+--------+--------+
    v      v       v        v        v        v        v
  Goal  Stage1   Stage2   Stage3   Stage4   Stage5   Stage6
  Init  (Data)   (Cohort) (AI*)    (AI*)    (AI)     (AI)
           |        |        |        |        |        |
           v        v        v        v        v        v
         Prisma  Compute  Content  RootCause Prescribe Report
         Queries  Bloom's  Quality  Analysis  Engine   Gen
                  Bimodal
                  Risk
                            * = skippable via focusArea
                            |
                            v
              [SSE events streamed to client]
                            |
                            v
              [Memory: TeacherInsights, PredictiveLearningAnalysis, SessionContext]
```

---

## File Reference Map

### Student Analytics (10 files)

| File | Purpose | Key Exports |
|------|---------|-------------|
| `lib/sam/student-analytics/agentic-types.ts` | All TypeScript types | `PerformanceSnapshot`, `BloomsCognitiveMap`, `PRISMReport`, etc. |
| `lib/sam/student-analytics/prism-system-prompt.ts` | System prompts for AI stages | `PRISM_STUDENT_SYSTEM_PROMPT`, `ALERT_TEMPLATES`, `COGNITIVE_CLUSTER_DESCRIPTIONS` |
| `lib/sam/student-analytics/helpers.ts` | Data collection + computation | `collectPerformanceData()`, `computeBloomsCognitiveMap()` |
| `lib/sam/student-analytics/prompts.ts` | AI prompt builders | `buildStage3Prompt()`, `buildStage4Prompt()`, `buildStage5Prompt()` |
| `lib/sam/student-analytics/analytics-controller.ts` | SAM Goal/Plan lifecycle | `initializeAnalyticsGoal()`, `advanceAnalyticsStage()`, etc. |
| `lib/sam/student-analytics/analytics-memory-persistence.ts` | Fire-and-forget persistence | `persistAnalyticsInsightsBackground()`, `persistCognitiveProfileBackground()` |
| `lib/sam/student-analytics/orchestrator.ts` | 5-stage pipeline | `orchestrateStudentAnalytics()` |
| `lib/sam/tools/student-analytics.ts` | Tool definition + handler | `createStudentAnalyticsTool()` (id: `sam-student-analytics`) |
| `lib/sam/skills/student-analytics.skill.md` | Skill descriptor | -- |
| `app/api/sam/student-analytics/orchestrate/route.ts` | SSE API route | `POST` handler |

### Creator Analytics (10 files)

| File | Purpose | Key Exports |
|------|---------|-------------|
| `lib/sam/creator-analytics/agentic-types.ts` | All TypeScript types | `CreatorDataSnapshot`, `CohortCognitiveAnalysis`, `CreatorPRISMReport`, etc. |
| `lib/sam/creator-analytics/prism-system-prompt.ts` | System prompts for AI stages | `PRISM_CREATOR_SYSTEM_PROMPT`, `ROI_FORMULA`, `ROOT_CAUSE_TEMPLATES` |
| `lib/sam/creator-analytics/helpers.ts` | Data collection + computation | `collectCreatorData()`, `computeCohortCognitiveAnalysis()` |
| `lib/sam/creator-analytics/prompts.ts` | AI prompt builders | `buildStage3Prompt()` through `buildStage6Prompt()` |
| `lib/sam/creator-analytics/analytics-controller.ts` | SAM Goal/Plan lifecycle | `initializeCreatorAnalyticsGoal()`, `advanceCreatorAnalyticsStage()`, etc. |
| `lib/sam/creator-analytics/analytics-memory-persistence.ts` | Fire-and-forget persistence | `persistCreatorInsightsBackground()`, `persistPredictionsBackground()` |
| `lib/sam/creator-analytics/orchestrator.ts` | 6-stage pipeline | `orchestrateCreatorAnalytics()` |
| `lib/sam/tools/creator-analytics.ts` | Tool definition + handler | `createCreatorAnalyticsTool()` (id: `sam-creator-analytics`) |
| `lib/sam/skills/creator-analytics.skill.md` | Skill descriptor | -- |
| `app/api/sam/creator-analytics/orchestrate/route.ts` | SSE API route | `POST` handler |

### Shared / Modified Files (3 files)

| File | Change |
|------|--------|
| `lib/sam/agentic-tooling.ts` | Import + register both tools in `standaloneTools` array |
| `lib/sam/tool-planner.ts` | `MODE_TOOL_AFFINITY` + `MODE_AUTO_INVOKE` entries for both tools |

---

## Database Models Used

### Student Agent Reads

| Model | Domain Schema | Data |
|-------|--------------|------|
| `CognitiveSkillProgress` | 03-learning | Per-skill Bloom&apos;s level scores |
| `BloomsPerformanceMetric` | 03-learning | Historical Bloom&apos;s performance |
| `StudentBloomsProgress` | 03-learning | Per-course Bloom&apos;s progression |
| `AIEvaluationRecord` | 03-learning | DIAGNOSE 7-layer results |
| `EnhancedAnswer` | 03-learning | Student answers with evaluation data |
| `UserExamAttempt` | 03-learning | Exam attempt history + scores |
| `LearningSession` | 03-learning | Session duration, patterns |
| `study_streaks` | 06-analytics | Consistency metrics |
| `Enrollment` | 03-learning | Course enrollment status + progress |
| `LearningActivityLog` | 03-learning | Activity timestamps + types |

### Student Agent Writes

| Model | Domain Schema | Data |
|-------|--------------|------|
| `SAMSessionContext` | 17-sam-agentic | Cache analytics snapshots |
| `SAMKnowledgeGraphNode` | 17-sam-agentic | Cognitive profile nodes |

### Creator Agent Reads

| Model | Domain Schema | Data |
|-------|--------------|------|
| `Enrollment` | 03-learning | All enrolled students, progress, status |
| `CognitiveSkillProgress` | 03-learning | Per-student Bloom&apos;s levels (aggregated) |
| `AIEvaluationRecord` | 03-learning | DIAGNOSE results across all students |
| `UserExamAttempt` | 03-learning | Exam scores, pass/fail distributions |
| `LearningSession` | 03-learning | Engagement metrics |
| `Chapter` + `Section` | 03-learning | Content structure + completion rates |

### Creator Agent Writes

| Model | Domain Schema | Data |
|-------|--------------|------|
| `TeacherInsights` | 06-analytics | Persist creator analytics results |
| `PredictiveLearningAnalysis` | 06-analytics | Persist predictions + risk scores |
| `SAMSessionContext` | 17-sam-agentic | Cache analytics snapshots |

---

## SSE Event Reference

### Student Analytics Events

| Event | When | Payload |
|-------|------|---------|
| `progress` | Throughout | `{ percentage, message }` |
| `stage_start` | Stage begins | `{ stage, title }` |
| `stage_complete` | Stage ends | `{ stage, title, ...stageData }` |
| `thinking` | Before processing | `{ message }` |
| `cognitive_map_computed` | After Stage 2 | Bloom&apos;s map data |
| `blooms_profile` | After Stage 2 | Per-level mastery |
| `fragile_knowledge_alert` | If detected | `{ percentage, items }` |
| `interpretive_insight` | After Stage 3 | AI interpretation |
| `alert_generated` | During Stage 4 | Alert object |
| `prescription_generated` | During Stage 4 | Prescription object |
| `report_section` | During Stage 5 | Report section |
| `complete` | Pipeline done | Full result object |
| `error` | On failure | `{ message, canRetry }` |

### Creator Analytics Events

| Event | When | Payload |
|-------|------|---------|
| `progress` | Throughout | `{ percentage, message }` |
| `stage_start` | Stage begins | `{ stage, title }` |
| `stage_complete` | Stage ends | `{ stage, title }` |
| `thinking` | Before processing | `{ message }` |
| `cohort_distribution` | After Stage 2 | `{ bloomsDistribution, isBimodal }` |
| `dropout_risk_analysis` | After Stage 2 | `{ highRisk, mediumRisk, totalAtRisk }` |
| `fragile_knowledge_alarm` | If alarming | `{ percentage, affectedStudents }` |
| `content_effectiveness` | After Stage 3 | `{ overallAlignment, moduleCount }` |
| `root_cause_identified` | During Stage 4 | `{ category, rootCause, confidence }` |
| `prescription_generated` | During Stage 5 | Prescription object |
| `report_section` | During Stage 6 | Report section |
| `complete` | Pipeline done | Full result object |
| `error` | On failure | `{ message, canRetry }` |

---

## Caching Strategy

### Student Analytics

| Depth | TTL | Cache Key Pattern |
|-------|-----|-------------------|
| quick_snapshot | 15 minutes | `student-analytics:{userId}:{scope}:{timeRange}` |
| standard | 1 hour | same |
| deep_analysis | 2 hours | same |

### Creator Analytics

| Depth | TTL | Cache Key Pattern |
|-------|-----|-------------------|
| overview | 15 minutes | `creator-analytics:{userId}:{courseId}:{timeRange}` |
| standard | 1 hour | same |
| deep_dive | 2 hours | same |

Both agents use an in-memory `Map` with periodic cleanup (every 10 minutes). Cached results are returned immediately with a `fromCache: true` flag in the SSE complete event.

---

## Adding or Modifying Analytics

### Adding a New Stage to an Existing Agent

1. Define the stage&apos;s output type in `agentic-types.ts`
2. Create the prompt builder in `prompts.ts` (if AI-powered)
3. Add the stage logic in `orchestrator.ts`
4. Add a step entry in `analytics-controller.ts` (in the ExecutionPlan)
5. Update the SSE route if new event types are needed
6. Update this document

### Adding a New Data Source

1. Verify the Prisma model exists in the schema
2. Add the query to `helpers.ts` in the appropriate query group
3. Add the data to the snapshot type in `agentic-types.ts`
4. Reference the data in the relevant prompt builder
5. Update the Database Models section of this document

### Creating a New Analytics Agent

Follow the 5-layer SAM pattern (see `SAM_SKILL_TOOL_PATTERN.md`):

1. Create `lib/sam/<name>/agentic-types.ts`
2. Create `lib/sam/<name>/prism-system-prompt.ts`
3. Create `lib/sam/<name>/helpers.ts`
4. Create `lib/sam/<name>/prompts.ts`
5. Create `lib/sam/<name>/analytics-controller.ts`
6. Create `lib/sam/<name>/analytics-memory-persistence.ts`
7. Create `lib/sam/<name>/orchestrator.ts`
8. Create `lib/sam/tools/<name>.ts`
9. Create `lib/sam/skills/<name>.skill.md`
10. Create `app/api/sam/<name>/orchestrate/route.ts`
11. Register in `agentic-tooling.ts` + `tool-planner.ts`
12. Run `npm run typecheck:parallel:force && npm run lint && npm run build`

### Key Rules

- **Never hallucinate metrics**: Stages 1-2 must always be pure computation
- **Never call AI directly**: Always use `runSAMChatWithPreference()` from `@/lib/sam/ai-provider`
- **Never create stores directly**: Always use `getGoalStores()` / `getMemoryStores()` from TaxomindContext
- **Fire-and-forget persistence**: Memory writes must never block the response
- **Fallback builders**: Every AI stage must have a fallback that returns valid data if JSON parsing fails
- **Abort handling**: Check `abortSignal` before every stage to support client disconnection

---

*Last updated: February 2026*
