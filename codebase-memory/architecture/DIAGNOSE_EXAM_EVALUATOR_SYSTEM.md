# DIAGNOSE Exam Evaluator Agentic System

Complete architecture documentation for the 5-stage agentic DIAGNOSE exam evaluation pipeline integrated with SAM (Smart AI Mentor).

---

## Overview

The Exam Evaluator is a full agentic pipeline that performs **deep cognitive diagnostic evaluation** of student exam attempts using the 7-layer DIAGNOSE framework. It does NOT simply grade answers right or wrong — it reverse-engineers the student's **THINKING PROCESS**, diagnoses cognitive gaps at specific Bloom's Taxonomy levels, and generates actionable improvement pathways.

The system follows the same 5-layer SAM agentic pattern as the Exam Builder:
1. **Conversational Tool** - Collects 4 parameters step-by-step
2. **SSE Streaming API** - Streams real-time progress to the frontend
3. **5-Stage Orchestrator** - Load, DIAGNOSE, Echo-Back, Cognitive Profile, Roadmap
4. **SAM Goal/Plan Tracking** - Full lifecycle tracking via TaxomindContext
5. **Memory Persistence** - Background KnowledgeGraph + SessionContext writes

### Relationship to Exam Builder

The Exam Builder **creates** exams (questions, structure, bloom's profiles). The Exam Evaluator **evaluates** completed attempts on those exams. They are complementary:

```
Exam Builder (creation)  --->  Student takes exam  --->  Exam Evaluator (diagnosis)
```

The evaluator is **additive** — the existing basic evaluation at `/api/exams/evaluate` is unchanged.

---

## The DIAGNOSE Framework

7 cognitive layers applied to EACH student answer:

| Layer | Name | What It Does |
|-------|------|-------------|
| **D** | Detect Bloom's Level | Compares target vs demonstrated cognitive level. Calculates bloom's gap. |
| **I** | Identify Reasoning Path | Classifies HOW the student arrived at their answer (expert/fragile/partial/wrong_model/guessing) |
| **A** | Assess Triple Accuracy | Evaluates factual, logical, AND structural accuracy independently |
| **G** | Gap-Map Breakdown | Pinpoints WHERE understanding broke down and traces contaminated steps |
| **N** | Name Misconception | Tags specific misconceptions from a 19-entry taxonomy across 4 categories |
| **O** | Outline Improvement | Prescribes learning pathway with ARROW phase actions and verification questions |
| **S** | Score Multidimensional | 5-dimension weighted scoring (factual 20%, logical 25%, bloom's 25%, depth 20%, communication 10%) |
| **+E** | Echo-Back Teaching | For top 3 most impactful answers: 6-step reflective teaching sequence |

---

## System Architecture

```
User: "Evaluate my exam on Neural Networks"
  |
  v
+--------------------------------------------------+
|  SAM Chat (auto-detect)                          |
|  Tool Planner auto-invokes exam-evaluator tool   |
+--------------------------------------------------+
  |
  v
+--------------------------------------------------+
|  Exam Evaluator Tool (4-step collection)         |
|  lib/sam/tools/exam-evaluator.ts                 |
|  Steps: attemptId -> evaluationMode ->           |
|         options -> confirm                       |
+--------------------------------------------------+
  | triggerEvaluation: true
  v
+--------------------------------------------------+
|  Frontend: POST /api/sam/exam-evaluator/orchestrate
|  app/api/sam/exam-evaluator/orchestrate/route.ts |
|  Sets up SSE ReadableStream                      |
+--------------------------------------------------+
  |
  v
+--------------------------------------------------+
|  Orchestrator (5-stage pipeline)                 |
|  lib/sam/exam-evaluation/orchestrator.ts         |
|                                                  |
|  Stage 1: Load & Prepare      (fetch all data)   |
|  Stage 2: Per-Answer DIAGNOSE  (7 layers each)   |
|  Stage 3: Echo-Back Teaching   (top 3 answers)    |
|  Stage 4: Cognitive Profile    (aggregate)        |
|  Stage 5: Improvement Roadmap  (prescriptions)    |
+--------------------------------------------------+
  |                    |                    |
  v                    v                    v
+-----------+  +--------------+  +------------------+
| Database  |  | SAM Goal/Plan|  | Memory Stores    |
| AIEvalRec |  | Controller   |  | (fire-and-forget)|
| Answers   |  | Tracking     |  | KnowledgeGraph   |
| Attempt   |  |              |  | SessionContext   |
| CogSkills |  |              |  |                  |
+-----------+  +--------------+  +------------------+
  |
  v
+--------------------------------------------------+
|  Cross-Feature Bridges (fire-and-forget)         |
|  bridgeAssessmentToSkillTrack()                  |
|  bridgeAssessmentToBehaviorMonitor()             |
+--------------------------------------------------+
```

---

## File Map

### Core Pipeline (`lib/sam/exam-evaluation/`)

| File | Lines | Purpose |
|------|-------|---------|
| `agentic-types.ts` | 336 | All TypeScript types for the DIAGNOSE pipeline |
| `diagnose-system-prompt.ts` | 484 | System prompt, misconception taxonomy, rubrics, ARROW phases |
| `helpers.ts` | 736 | Parsing, fallback generation, scoring, aggregation |
| `prompts.ts` | 418 | Stage-specific prompt builders (Stages 2-5) |
| `orchestrator.ts` | 950 | Main 5-stage pipeline with SSE events and DB writes |
| `evaluation-controller.ts` | 312 | SAM Goal/Plan lifecycle management |
| `evaluation-memory-persistence.ts` | 202 | Fire-and-forget KnowledgeGraph + SessionContext |

### Tool & Skill

| File | Lines | Purpose |
|------|-------|---------|
| `lib/sam/tools/exam-evaluator.ts` | 581 | 4-step conversational tool (SAM tool definition) |
| `lib/sam/skills/exam-evaluator.skill.md` | 40 | Skill descriptor (when to use, capabilities) |

### API Route

| File | Lines | Purpose |
|------|-------|---------|
| `app/api/sam/exam-evaluator/orchestrate/route.ts` | 163 | SSE streaming endpoint |

### Modified Files

| File | Change |
|------|--------|
| `lib/sam/agentic-tooling.ts` | Registered `createExamEvaluatorTool()` in standalone tools |
| `lib/sam/tool-planner.ts` | Mode affinity, auto-invoke patterns, attempt ID extraction |

**Total**: ~4,222 lines across 10 new files + 2 modifications.

---

## Data Flow (Detailed)

### Phase 1: Conversational Collection

The **Exam Evaluator Tool** (`lib/sam/tools/exam-evaluator.ts`) collects 4 parameters:

| # | Step | Question | Options / Default |
|---|------|----------|-------------------|
| 1 | `attemptId` | "Which exam attempt should I evaluate?" | List of recent SUBMITTED attempts / free text ID |
| 2 | `evaluationMode` | "How deep should the evaluation be?" | quick_grade / standard / deep_diagnostic (default) |
| 3 | `options` | "Any specific focus areas?" | gap_mapping + echo_back + misconception_id (all enabled by default) |
| 4 | `confirm` | Summary + "Ready to evaluate?" | yes / adjust |

**State management**: In-memory `Map<conversationId, EvalCollectionState>` with 30-minute TTL cleanup. Stateless fallback via `currentStep` + `collected` params for serverless environments.

**Tool output modes**:
- **Conversational step**: `{ type: 'conversation', step, question, options, collected, progress }`
- **Evaluation trigger**: `{ type: 'evaluate_exam', triggerEvaluation: true, params, apiEndpoint: '/api/sam/exam-evaluator/orchestrate' }`

### Phase 2: Auto-Invoke & Mode Affinity

In `lib/sam/tool-planner.ts`:

**MODE_TOOL_AFFINITY**:
```
'exam-builder' -> ['sam-exam-builder', 'sam-quiz-grader', 'sam-exam-evaluator']
```

**Auto-invoke patterns** (regex-based):
```
/\b(evaluate|grade|assess|diagnose|review)\b.*\b(exam|quiz|test|attempt|answers?)\b/i
/\b(exam|quiz|test)\b.*\b(evaluation|grading|feedback|results?|diagnosis)\b/i
/\b(check|analyze)\b.*\b(my|student)\b.*\b(answers?|performance|results?)\b/i
/\bdiagnose\b.*\b(gaps?|understanding|knowledge|thinking|learning)\b/i
/\bcognitive\b.*\b(profile|map|diagnosis|assessment)\b/i
/\bhow\s+did\s+I\s+(do|perform)\b.*\b(exam|quiz|test)\b/i
```

**Attempt ID extraction** (in `checkAutoInvoke()`):
- Extracts attempt ID from messages like "Evaluate attempt abc-123"
- Passes extracted ID as `{ action: 'start', attemptId: 'abc-123' }` to skip step 1

### Phase 3: SSE Streaming API

`app/api/sam/exam-evaluator/orchestrate/route.ts`:

1. **Auth**: `currentUser()` check
2. **Subscription gate**: `withSubscriptionGate(userId, { category: 'generation' })` — requires STARTER+
3. **Validation**: Zod schema validates all params
4. **SSE stream**: Opens `ReadableStream` with `sendSSE(event, data)` helper
5. **Orchestration**: Calls `orchestrateExamEvaluation()` with SSE callbacks
6. **Response**: Text/event-stream with `X-Accel-Buffering: no`

**Request schema** (`OrchestrateEvalSchema`):
```typescript
{
  attemptId: string            // min 1 char
  evaluationMode: 'quick_grade' | 'standard' | 'deep_diagnostic'  // default: deep_diagnostic
  enableGapMapping: boolean    // default: true
  enableEchoBack: boolean      // default: true
  enableMisconceptionId: boolean  // default: true
  examId?: string
  courseId?: string
}
```

### Phase 4: 5-Stage Orchestration Pipeline

`lib/sam/exam-evaluation/orchestrator.ts`:

#### Stage 1: Load & Prepare
- **Input**: attemptId, userId
- **DB queries**: Fetches `UserExamAttempt` with all `EnhancedAnswer` records, `EnhancedQuestion` records, `Exam` metadata, and `ExamBloomsProfile`
- **Validation**: Attempt belongs to user, status is SUBMITTED (not already GRADED)
- **Output**: Structured evaluation context per question-answer pair
- **SSE events**: `stage_start`, `thinking`, `stage_complete`
- **SAM**: Initializes Goal + 5-step ExecutionPlan

#### Stage 2: Per-Answer DIAGNOSE Evaluation (THE CORE)
- **Input**: Each question-answer pair with exam metadata
- **AI prompt**: `buildStage2Prompt()` — runs all 7 DIAGNOSE layers in one call per answer
- **Cross-referencing**: Previous diagnoses passed to track patterns across answers
- **Quality retry**: Score each diagnosis via `scoreDiagnosisQuality()`, retry if < 50/100 (max 2 retries, keep best)
- **Output**: `AnswerDiagnosis` per answer with all 7 layers populated
- **DB writes** (per answer):
  - `AIEvaluationRecord` — enriched with DIAGNOSE data in JSON columns
  - `EnhancedAnswer` — updated with score, evaluationType = AI_EVALUATED
- **SSE events**: `answer_evaluating`, `answer_diagnosed` (per answer), `progress`
- **AI config**: capability `'analysis'`, maxTokens 3000, temperature 0.3

#### Stage 3: Echo-Back Teaching
- **Input**: Top 3 most impactful answers selected by `selectEchoBackTargets()`
- **Selection criteria**: Largest bloom's gap, fragile reasoning paths, most misconceptions
- **AI prompt**: `buildStage3Prompt()` — generates 6-step echo-back per answer
- **Output**: `EchoBack` per selected answer
- **SSE events**: `echo_back_generated` (per answer)
- **AI config**: capability `'analysis'`, maxTokens 2000, temperature 0.4
- **Skipped** for `quick_grade` mode

#### Stage 4: Cognitive Profile Generation
- **Input**: All diagnoses aggregated
- **AI prompt**: `buildStage4Prompt()` — generates nuanced cognitive profile
- **Fallback**: `buildFallbackCognitiveProfile()` from aggregation helpers if AI parse fails
- **Output**: `CognitiveProfile` with Bloom's map, ceiling, growth edge, reasoning distribution, strength/vulnerability maps
- **DB writes**: `CognitiveSkillProgress` — updated per-Bloom's level with mastery scores
- **SSE events**: `cognitive_profile`
- **AI config**: capability `'analysis'`, maxTokens 3000, temperature 0.4

#### Stage 5: Improvement Roadmap
- **Input**: Cognitive profile + all diagnoses
- **AI prompt**: `buildStage5Prompt()` — generates priority-ordered interventions
- **Output**: `ImprovementRoadmap` with ARROW phase prescriptions and verification questions
- **SSE events**: `improvement_roadmap`
- **AI config**: capability `'analysis'`, maxTokens 2500, temperature 0.4
- **Skipped** for `quick_grade` mode

#### Post-Pipeline
- Update `UserExamAttempt` status to GRADED with scores
- Fire-and-forget: `persistDiagnosticInsightsBackground()` (SessionContext)
- Fire-and-forget: `persistMisconceptionsBackground()` (KnowledgeGraph)
- Fire-and-forget: `bridgeAssessmentToSkillTrack()`, `bridgeAssessmentToBehaviorMonitor()`
- Complete SAM Goal
- SSE: `complete` event with full results

---

## SSE Event Types

```
stage_start          { stage: 1-5, stageName: string, message: string }
stage_complete       { stage: 1-5, message: string, itemCount?: number }
answer_evaluating    { stage: 2, questionId, questionNumber, totalQuestions, message }
answer_diagnosed     { stage: 2, questionId, bloomsGap, reasoningPath, tripleAccuracy, score }
echo_back_generated  { stage: 3, questionId, echoBack: { 6 steps } }
cognitive_profile    { stage: 4, bloomsMap, ceiling, growthEdge, reasoningDistribution }
improvement_roadmap  { stage: 5, priorities: Array<{priority, intervention, arrowPhase}> }
thinking             { stage: number, message: string }
progress             { percentage: number, message: string, stage?: number }
complete             { attemptId, cognitiveProfile, improvementRoadmap, echoBackCount, stats, goalId, planId }
error                { message: string, canRetry: boolean, attemptId?: string }
```

---

## Per-Answer DIAGNOSE Output

Each answer produces an `AnswerDiagnosis` object with all 7 layers:

### Layer D: Detect Bloom's Level
```typescript
{
  targetBloomsLevel: BloomsLevel;      // What the question intended
  demonstratedLevel: BloomsLevel;       // What the student actually showed
  bloomsGap: number;                    // target - demonstrated (0 = met, positive = gap, negative = exceeded)
  gapSeverity: 'met' | 'close' | 'struggling' | 'fundamental' | 'exceeded';
  bloomsEvidence: string;               // Evidence for classification
}
```

### Layer I: Identify Reasoning Path
```typescript
{
  reasoningPath: 'expert' | 'valid_alternative' | 'fragile' | 'partial' | 'wrong_model' | 'guessing';
  reasoningPathEvidence: string;
  forkPoint?: string;                   // Where reasoning diverged (for partial/wrong_model)
}
```

**Reasoning path signals** (from `diagnose-system-prompt.ts`):
| Path | Indicators |
|------|-----------|
| `expert` | Systematic structure, domain conventions, correct signal verbs |
| `valid_alternative` | Non-standard but valid approach, different framework |
| `fragile` | Correct answer but shaky foundation, memorized without understanding |
| `partial` | Correct start, diverges at identifiable fork point |
| `wrong_model` | Internally consistent but based on incorrect mental model |
| `guessing` | Random, contradictory, or no reasoning evident |

### Layer A: Assess Triple Accuracy
```typescript
{
  factualAccuracy: boolean;
  logicalAccuracy: boolean;
  structuralAccuracy: boolean;
  tripleAccuracyDiagnosis: TripleAccuracyDiagnosis;
  accuracyDetails: string;
}
```

**Triple accuracy matrix** (8 combinations):

| Factual | Logical | Structural | Diagnosis |
|---------|---------|------------|-----------|
| T | T | T | `MASTERY` — Full understanding across all dimensions |
| T | T | F | `LEVEL_MISMATCH` — Knows and reasons but can't organize at target level |
| T | F | T | `REASONING_GAP` — Facts and structure right, logic wrong |
| T | F | F | `KNOWLEDGE_GAP` — Has facts, but can't reason or structure |
| F | T | T | `MEMORIZER` — Logic and structure good, but facts wrong |
| F | T | F | `INTUITIVE_THINKER` — Good instincts but facts and structure weak |
| F | F | T | `SHAPE_WITHOUT_SUBSTANCE` — Right structure, wrong content |
| F | F | F | `STARTING_POINT` — Everything needs work |

### Layer G: Gap-Map Breakdown
```typescript
{
  breakdownPoint?: string;              // Exact point where understanding failed
  solidFoundation: string[];            // What student got RIGHT before breakdown
  breakdownType?: BreakdownType;        // Category of the breakdown
  contaminatedSteps: string[];          // Steps after breakdown that are invalid
}
```

**Breakdown types**: `MISSING_KNOWLEDGE`, `WRONG_CONNECTION`, `OVER_SIMPLIFICATION`, `OVER_COMPLICATION`, `PROCEDURAL_ERROR`, `TRANSFER_FAILURE`

### Layer N: Name Misconception
```typescript
{
  misconceptions: MisconceptionEntry[]; // Named misconceptions from taxonomy
}
```

**Misconception taxonomy** (19 entries across 4 categories):

| Category | ID | Name | Description |
|----------|-----|------|-------------|
| **Factual** | A1 | DEFINITION_DRIFT | Using a term with a subtly wrong meaning |
| | A2 | CONCEPT_SWAP | Confusing two related but distinct concepts |
| | A3 | OUTDATED_KNOWLEDGE | Applying outdated facts or superseded theories |
| | A4 | FABRICATED_FACT | Stating something plausible but made up |
| **Reasoning** | B1 | CORRELATION_CAUSATION | Treating correlation as proof of causation |
| | B2 | SINGLE_CAUSE_THINKING | Attributing complex phenomena to one factor |
| | B3 | BLACK_OR_WHITE | Binary thinking on a spectrum topic |
| | B4 | SURVIVORSHIP_BIAS | Only considering successful cases |
| | B5 | AUTHORITY_ANCHORING | Citing authority without understanding |
| **Structural** | C1 | PROCEDURE_WITHOUT_UNDERSTANDING | Can do the steps, can't explain why |
| | C2 | UNDERSTAND_WITHOUT_TRANSFER | Gets concept in context A, fails in B |
| | C3 | ANALYSIS_WITHOUT_EVALUATION | Can take apart but can't judge quality |
| | C4 | EVALUATION_WITHOUT_CREATION | Can critique but can't build solutions |
| | C5 | LOCAL_UNDERSTANDING | Gets parts but misses system relationships |
| **Meta-cognitive** | D1 | ILLUSION_OF_UNDERSTANDING | Thinks they understand, actually don't |
| | D2 | EXPERTISE_BLIND_SPOT | Skips "obvious" steps that aren't obvious |
| | D3 | COMPLEXITY_WORSHIP | Over-complicating simple concepts |
| | D4 | SIMPLICITY_TRAP | Over-simplifying complex concepts |
| | D5 | CONFIRMATION_SEEKING | Only seeing evidence that confirms beliefs |

### Layer O: Outline Improvement
```typescript
{
  currentState: string;
  targetState: string;
  interventionSteps: Array<{
    step: number;
    action: string;
    arrowPhase?: string;          // ARROW learning phase
    successCriteria: string;
  }>;
  verificationQuestion: string;   // Question that would PROVE the gap is closed
}
```

**ARROW Learning Phases** (prescriptions by gap type):

| Gap Type | Prescribed ARROW Phases |
|----------|------------------------|
| `met` / `exceeded` | Widen (extend mastery to new contexts) |
| `close` (gap 1) | Reinforce, Reflect |
| `struggling` (gap 2-3) | Acquire, Reinforce, Reflect |
| `fundamental` (gap 4+) | Acquire, Reinforce, Reflect, Optimize |
| Fragile correct | Reflect, Optimize (address hidden weakness) |

### Layer S: Score Multidimensional
```typescript
{
  scores: {
    factualAccuracyScore: number;      // /10
    logicalCoherenceScore: number;     // /10
    bloomsLevelMatchScore: number;     // /10
    depthScore: number;                // /10
    communicationScore: number;        // /10
    composite: number;                 // weighted average /10
  }
}
```

**Scoring weights**:
| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| Factual Accuracy | 20% | Are the facts correct? |
| Logical Coherence | 25% | Is the reasoning sound and consistent? |
| Bloom's Level Match | 25% | Does the answer operate at the required cognitive level? |
| Depth | 20% | How deep is the understanding demonstrated? |
| Communication | 10% | How well is the answer structured and expressed? |

---

## Echo-Back Teaching (Stage 3)

Applied to the **top 3 most impactful** answers, selected by:
1. Largest Bloom's gap (weighted 3x)
2. Fragile reasoning paths (weighted 2x)
3. Most misconceptions (weighted 1x per)
4. Wrong model reasoning paths (weighted 2x)

Each echo-back follows a 6-step reflective teaching structure:

```typescript
interface EchoBack {
  questionId: string;
  hereIsWhatYouDid: string;       // Step 1: Mirror the student's approach
  hereIsWhereItBroke: string;     // Step 2: Pinpoint the breakdown
  hereIsHowExpertThinks: string;  // Step 3: Expert reasoning walkthrough
  keyInsight: string;             // Step 4: The critical aha-moment
  patternRecognition: string;     // Step 5: Connect to broader pattern
  practiceQuestion: string;       // Step 6: Verification question
}
```

---

## Cognitive Profile Report (Stage 4)

Aggregate view across all answers:

```typescript
interface CognitiveProfile {
  bloomsCognitiveMap: Record<BloomsLevel, {
    score: number;                    // 0-100
    status: 'mastery' | 'solid' | 'developing' | 'emerging' | 'gap';
    keyFinding: string;
  }>;
  cognitiveCeiling: BloomsLevel;      // Highest level with >= 80%
  growthEdge: BloomsLevel;            // Next level to target
  criticalGap?: BloomsLevel;          // Lowest performing level
  thinkingPatternAnalysis: {
    dominantStyle: string;
    description: string;
    limitations: string[];
  };
  reasoningPathDistribution: Record<ReasoningPath, number>;  // percentages
  strengthMap: string[];
  vulnerabilityMap: string[];
  misconceptionSummary: Array<{ id: string; name: string; frequency: number }>;
}
```

**Mastery status thresholds**:
| Score | Status |
|-------|--------|
| >= 80 | `mastery` |
| >= 65 | `solid` |
| >= 45 | `developing` |
| >= 25 | `emerging` |
| < 25 | `gap` |

---

## Improvement Roadmap (Stage 5)

Priority-ordered interventions linked to ARROW learning phases:

```typescript
interface ImprovementRoadmap {
  priorities: Array<{
    priority: number;
    title: string;
    arrowPhases: string[];        // e.g., ['Acquire', 'Reinforce', 'Reflect']
    actions: string[];
    successMetric: string;
  }>;
  verificationQuestions: Array<{
    forGap: string;
    question: string;
  }>;
  estimatedTimeToNextLevel: string;
}
```

---

## Quality Scoring System

### Diagnosis Quality (not answer quality)

Each `AnswerDiagnosis` is scored for completeness across all 7 DIAGNOSE layers (from `helpers.ts:scoreDiagnosisQuality()`):

| Check | Points | What It Verifies |
|-------|--------|-----------------|
| Bloom's evidence present | 15 | Layer D populated with evidence |
| Reasoning path + evidence | 15 | Layer I has both path and evidence |
| Triple accuracy populated | 15 | Layer A has all 3 booleans + diagnosis |
| Gap-map breakdown | 10 | Layer G has breakdown point |
| Solid foundation items | 5 | Layer G has at least 1 foundation item |
| Misconception named | 15 | Layer N has at least 1 misconception |
| Improvement pathway | 10 | Layer O has intervention steps |
| Verification question | 5 | Layer O has a verification question |
| All 5 scores present | 10 | Layer S has non-zero scores |

**Threshold**: 50/100. If quality < 50, retry up to 2 more times (3 total). Keep the best scoring attempt.

---

## Bloom's-Specific Rubrics

Each Bloom's level has a detailed scoring rubric (from `diagnose-system-prompt.ts:BLOOMS_RUBRICS`):

| Level | Excellent (9-10) | Good (7-8) | Adequate (5-6) | Below (3-4) | Poor (1-2) |
|-------|-----------------|-----------|--------------|------------|-----------|
| REMEMBER | Precise recall with correct terminology | Mostly correct with minor omissions | Partially correct, some confusion | Significant errors in recall | Cannot recall or fabricates |
| UNDERSTAND | Clear explanation showing deep comprehension | Good explanation with minor gaps | Basic understanding, surface level | Misinterprets key concepts | No understanding demonstrated |
| APPLY | Expert application to novel situations | Correct application with minor errors | Applies in familiar contexts only | Struggles to apply concepts | Cannot apply knowledge |
| ANALYZE | Identifies all components and relationships | Good analysis with minor oversights | Partial analysis, misses connections | Surface-level analysis only | Cannot break down concepts |
| EVALUATE | Rigorous criteria-based judgment with evidence | Sound evaluation with minor gaps | Basic evaluation, limited criteria | Opinion without evidence or criteria | Cannot evaluate or judges randomly |
| CREATE | Novel, well-integrated synthesis | Good synthesis with minor issues | Partial synthesis, limited novelty | Reassembles without creating new | Cannot synthesize or create |

---

## SAM Goal/Plan Lifecycle

`lib/sam/exam-evaluation/evaluation-controller.ts`:

### Initialization
```
initializeEvaluationGoal(userId, examTitle, attemptId)
  -> Creates SAM Goal (status: ACTIVE, context: { attemptId, type: 'exam-evaluation' })
  -> Creates 5-step ExecutionPlan:
       Step 1: Load & Prepare      (est. 1 min)
       Step 2: DIAGNOSE Evaluation (est. 5 min)
       Step 3: Echo-Back Teaching  (est. 2 min)
       Step 4: Cognitive Profile   (est. 2 min)
       Step 5: Improvement Roadmap (est. 1 min)
```

### Stage Tracking
```
advanceEvaluationStage(planId, stepIds, stageNumber)
  -> Marks step as in_progress, updates overall progress %

completeEvaluationStep(planId, stepIds, stageNumber, outputs)
  -> Marks step as completed with output summary
```

### Completion
```
completeEvaluation(goalId, planId, stats)
  -> Plan: overallProgress=100, status=COMPLETED
  -> Goal: status=COMPLETED

failEvaluation(goalId, planId, errorMessage)
  -> Preserves existing checkpoint data
  -> Plan: status=FAILED with failureReason
  -> Goal: status=PAUSED (can be resumed)
```

---

## Memory Persistence

`lib/sam/exam-evaluation/evaluation-memory-persistence.ts`:

All persistence is **fire-and-forget** (does not block evaluation). Errors are logged but swallowed.

### Diagnostic Insights (SessionContext)
```
persistDiagnosticInsightsBackground(userId, attemptId, diagnoses, profile)
  -> Creates/updates SessionContext with:
     - Full cognitive profile summary
     - Per-Bloom's level scores and statuses
     - Reasoning path distribution percentages
     - Average composite score and bloom's gap
     - Top misconception IDs
     - Metadata: attemptId, evaluationTimestamp
```

### Misconception Tracking (KnowledgeGraph)
```
persistMisconceptionsBackground(userId, attemptId, misconceptions)
  -> Creates KnowledgeGraph entities (type: 'misconception') per unique misconception
     - Properties: misconceptionId, name, category, description, attemptId, userId
  -> Creates 'has_misconception' relationships
     - Edge weight: frequency count (higher = more common across evaluations)
```

---

## Database Models Used

### AIEvaluationRecord (stores DIAGNOSE results)
```prisma
model AIEvaluationRecord {
  id                    String      @id @default(cuid())
  answerId              String
  score                 Float?
  maxScore              Float?
  targetBloomsLevel     BloomsLevel?
  demonstratedLevel     BloomsLevel?
  bloomsEvidence        String?     // Layer D evidence
  accuracy              Float?
  completeness          Float?
  relevance             Float?
  depth                 Float?
  conceptsUnderstood    Json?       // Layer G solid foundation
  misconceptions        Json?       // Layer N misconceptions
  knowledgeGaps         Json?       // Layer G gap-map data
  feedback              String?
  strengths             Json?       // Strength map items
  improvements          Json?       // Layer O improvement pathway
  nextSteps             Json?       // Verification questions
  evaluationModel       String?
  confidence            Float?      // Diagnosis quality score
  flaggedForReview      Boolean     @default(false)
}
```

### EnhancedAnswer (updated with evaluation)
```prisma
model EnhancedAnswer {
  id              String   @id @default(cuid())
  questionId      String
  userAttemptId   String
  selectedAnswer  String?
  textAnswer      String?
  pointsEarned    Float    @default(0)    // Updated by evaluator
  evaluationType  AnswerEvaluationType    // Set to AI_EVALUATED
}
```

### UserExamAttempt (status updated)
```prisma
model UserExamAttempt {
  id              String   @id @default(cuid())
  examId          String
  userId          String
  status          AttemptStatus           // SUBMITTED -> GRADED
  scorePercentage Float?                  // Calculated from diagnoses
  isPassed        Boolean  @default(false)
}
```

### CognitiveSkillProgress (per-Bloom's mastery)
```prisma
model CognitiveSkillProgress {
  id          String      @id @default(cuid())
  userId      String
  bloomsLevel BloomsLevel
  masteryScore Float      @default(0)     // Updated per evaluation
  questionsAttempted Int  @default(0)
  questionsCorrect   Int  @default(0)
}
```

---

## Gold Standard Prompts

### DIAGNOSE System Prompt (`diagnose-system-prompt.ts`)

The `DIAGNOSE_SYSTEM_PROMPT` constant (~100 lines) is injected into Stages 2-5. It establishes:

1. **Persona**: Cognitive diagnostic evaluator (NOT a simple grader)
2. **Framework**: All 7 DIAGNOSE layers with detailed instructions per layer
3. **Output Format**: Structured JSON with all layer fields
4. **Quality Standards**: Every answer is a diagnostic window into cognitive structure

### Supporting Constants

| Constant | Purpose |
|----------|---------|
| `MISCONCEPTION_TAXONOMY` | 19 entries across 4 categories with IDs, names, descriptions |
| `REASONING_PATH_SIGNALS` | Detection signals for each reasoning path type |
| `TRIPLE_ACCURACY_MATRIX` | 8 diagnosis types with descriptions and boolean combinations |
| `BLOOMS_RUBRICS` | Per-level scoring criteria from Excellent to Poor |
| `GAP_TO_ARROW_PHASES` | Gap severity -> recommended ARROW learning phases |
| `EVALUATION_ANTI_PATTERNS` | 10 things the evaluator NEVER does |

### Anti-Patterns (from gold standard)

The evaluator is explicitly instructed to NEVER:
1. Grade without diagnosing
2. Say "wrong" without explaining the misconception
3. Skip the Bloom's gap analysis
4. Ignore correct answers (check for fragile reasoning)
5. Use generic feedback
6. Conflate confidence with correctness
7. Score without weighting
8. Skip the reasoning path classification
9. Generate improvement plans without specific ARROW phases
10. Miss the echo-back for high-impact answers

---

## Resilience & Fallbacks

Every stage has a fallback when AI response parsing fails:

| Stage | Fallback |
|-------|----------|
| 1: Load & Prepare | Returns error if data not found (no AI involved) |
| 2: DIAGNOSE Evaluation | `buildFallbackDiagnosis()` - Sets gap to 0, scores to 5/10, generic feedback |
| 3: Echo-Back Teaching | `buildFallbackEchoBack()` - Generic 6-step template with placeholder text |
| 4: Cognitive Profile | `buildFallbackCognitiveProfile()` - Aggregates from diagnosis data directly |
| 5: Improvement Roadmap | `buildFallbackRoadmap()` - Generic recommendations based on profile |

### JSON Extraction

The `extractJsonFromResponse()` helper handles multiple AI response formats:
1. Direct JSON parse
2. Markdown code fence removal (`` ```json ... ``` ``)
3. Array extraction via regex
4. Object extraction via regex

### Abort Signal

The orchestrator checks `abortSignal?.aborted` before each stage AND between each answer in Stage 2. If aborted:
- Current stage is abandoned
- Error flows to `failEvaluation()` which preserves checkpoint data
- SSE error event is sent to the client

---

## Integration Points

### AI Provider
All AI calls use `runSAMChatWithPreference()` from `lib/sam/ai-provider.ts`:
- All stages use capability `'analysis'`
- Automatically handles user preferences, rate limiting, fallback, circuit breaker

### TaxomindContext Stores
- **Goal/Plan stores**: `getGoalStores()` -> `{ goal: GoalStore, plan: PlanStore }`
- **Memory stores**: `getMemoryStores()` -> `{ knowledgeGraph, sessionContext }`

### Cross-Feature Bridges
- `bridgeAssessmentToSkillTrack()` — Updates skill tracking with evaluation results
- `bridgeAssessmentToBehaviorMonitor()` — Feeds learning behavior patterns

### Backward Compatibility
- **Existing `/api/exams/evaluate`**: UNCHANGED — still works for basic evaluation from exam-taking page
- **Existing `quiz-grader` tool**: UNCHANGED — still works for simple algorithmic grading
- **Existing `/api/sam/exam-builder/orchestrate`**: UNCHANGED — exam builder is separate
- **New evaluator**: ADDITIVE at `/api/sam/exam-evaluator/orchestrate`

---

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Max duration | 300 seconds (5 minutes) |
| Max retries per answer | 3 attempts (2 retries) |
| Quality threshold | 50/100 (diagnosis quality) |
| State TTL | 30 minutes (conversational tool) |
| Rate limit | 10 calls per hour per user |
| Memory persistence | Background (non-blocking) |
| Abort support | Yes (AbortSignal between stages + answers) |

### Estimated Times by Evaluation Mode
| Mode | Approx. Duration (10 questions) |
|------|-------------------------------|
| `quick_grade` | ~1-2 minutes (skips echo-back + roadmap) |
| `standard` | ~2-3 minutes |
| `deep_diagnostic` | ~3-5 minutes |

---

## Type Definitions

### Collection Types
```typescript
type EvalCollectionStep = 'attemptId' | 'evaluationMode' | 'options' | 'confirm' | 'complete';
type EvaluationMode = 'quick_grade' | 'standard' | 'deep_diagnostic';

interface ExamEvaluatorParams {
  attemptId: string;
  evaluationMode: EvaluationMode;
  enableGapMapping: boolean;
  enableEchoBack: boolean;
  enableMisconceptionId: boolean;
  examId?: string;
  courseId?: string;
}
```

### DIAGNOSE Types
```typescript
type ReasoningPath = 'expert' | 'valid_alternative' | 'fragile' | 'partial' | 'wrong_model' | 'guessing';

type TripleAccuracyDiagnosis =
  | 'MASTERY' | 'LEVEL_MISMATCH' | 'REASONING_GAP' | 'KNOWLEDGE_GAP'
  | 'MEMORIZER' | 'INTUITIVE_THINKER' | 'SHAPE_WITHOUT_SUBSTANCE' | 'STARTING_POINT';

type BreakdownType =
  | 'MISSING_KNOWLEDGE' | 'WRONG_CONNECTION' | 'OVER_SIMPLIFICATION'
  | 'OVER_COMPLICATION' | 'PROCEDURAL_ERROR' | 'TRANSFER_FAILURE';

type MisconceptionCategory = 'factual' | 'reasoning' | 'structural' | 'meta_cognitive';
type GapSeverity = 'met' | 'close' | 'struggling' | 'fundamental' | 'exceeded';
type BloomsMasteryStatus = 'mastery' | 'solid' | 'developing' | 'emerging' | 'gap';
```

### Orchestration Types
```typescript
interface EvalOrchestrationConfig {
  params: ExamEvaluatorParams;
  userId: string;
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  onProgress?: (progress: { percentage: number; message: string }) => void;
  abortSignal?: AbortSignal;
}

interface EvalOrchestrationResult {
  success: boolean;
  attemptId?: string;
  cognitiveProfile?: CognitiveProfile;
  improvementRoadmap?: ImprovementRoadmap;
  echoBackCount?: number;
  stats?: {
    totalAnswers: number;
    averageComposite: number;
    bloomsGapAverage: number;
    misconceptionsFound: number;
    fragileCorrectCount: number;
  };
  error?: string;
  goalId?: string;
  planId?: string;
}
```

---

## End-to-End User Journey

```
1. User opens SAM chat
2. Types: "Evaluate my exam on Machine Learning"

3. Tool Planner:
   - Matches auto-invoke pattern: /evaluate.*exam/i
   - Invokes sam-exam-evaluator with { action: 'start' }

4. Exam Evaluator Tool:
   - Step 1: Lists 3 recent SUBMITTED attempts
     - "Neural Networks Exam (submitted 2 hours ago)"
     - "ML Fundamentals Midterm (submitted yesterday)"
     - "Data Structures Quiz (submitted 3 days ago)"
   - User selects: "Neural Networks Exam"
   - Step 2: "How deep should the evaluation be?"
   - User: "deep diagnostic"
   - Step 3: Shows options (all enabled by default)
   - User: "all"
   - Step 4: Summary + "Ready to evaluate?"
   - User: "yes"
   - Returns: { triggerEvaluation: true, params: {...},
     apiEndpoint: '/api/sam/exam-evaluator/orchestrate' }

5. Frontend:
   - POST /api/sam/exam-evaluator/orchestrate with params
   - Opens EventSource for SSE
   - Displays real-time progress UI with per-answer status

6. Orchestrator:
   - Creates SAM Goal + 5-step ExecutionPlan
   - Stage 1: Loads attempt with 15 answers
   - Stage 2: DIAGNOSE evaluates each answer through 7 layers
     - Answer 1: expert path, MASTERY, composite 8.5/10
     - Answer 2: fragile path, LEVEL_MISMATCH, gap 2, composite 5.2/10
     - ... continues for all 15 answers ...
   - Stage 3: Echo-back for top 3 (answers #2, #7, #11)
   - Stage 4: Cognitive profile
     - Ceiling: APPLY, Growth edge: ANALYZE
     - Reasoning: 40% expert, 20% fragile, 25% partial, 15% other
   - Stage 5: Improvement roadmap with 4 priority interventions
   - Marks Goal COMPLETED

7. SSE complete event:
   {
     attemptId: "attempt-abc123",
     cognitiveProfile: {
       cognitiveCeiling: "APPLY",
       growthEdge: "ANALYZE",
       reasoningPathDistribution: { expert: 40, fragile: 20, partial: 25, ... }
     },
     improvementRoadmap: {
       priorities: [
         { priority: 1, title: "Strengthen ANALYZE level", arrowPhases: ["Acquire", "Reinforce"] },
         { priority: 2, title: "Address fragile reasoning", arrowPhases: ["Reflect", "Optimize"] },
         ...
       ]
     },
     echoBackCount: 3,
     stats: {
       totalAnswers: 15,
       averageComposite: 6.8,
       bloomsGapAverage: 1.2,
       misconceptionsFound: 5,
       fragileCorrectCount: 3
     }
   }

8. Frontend displays cognitive profile dashboard + improvement roadmap
```

---

## Related Documentation

- **Exam Builder (creation)**: `codebase-memory/architecture/EXAM_BUILDER_AGENTIC_SYSTEM.md`
- **SAM Agentic Architecture**: `codebase-memory/architecture/SAM_AGENTIC_ARCHITECTURE.md`
- **SAM Skill/Tool Pattern**: `codebase-memory/architecture/SAM_SKILL_TOOL_PATTERN.md`
- **Prisma Schema**: `prisma/domains/03-learning.prisma`, `prisma/domains/01-enums.prisma`
- **Cross-Feature Bridge**: `lib/sam/cross-feature-bridge.ts`

---

*Last updated: February 2026*
*System version: 1.0.0*
