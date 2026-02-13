# Agentic Bloom's Exam Builder System

Complete architecture documentation for the 5-stage agentic exam creation pipeline integrated with SAM (Smart AI Mentor).

---

## Overview

The Exam Builder is a full agentic pipeline that creates pedagogically-grounded exams aligned to **Bloom's Taxonomy**. Every generated question is a diagnostic tool that reveals **WHERE** and at **WHICH COGNITIVE LEVEL** a student's understanding breaks down.

The system follows the same 5-layer SAM agentic pattern as the AI Course Creator:
1. **Conversational Tool** - Collects 8 parameters step-by-step
2. **SSE Streaming API** - Streams real-time progress to the frontend
3. **5-Stage Orchestrator** - Topic Decomposition, Distribution, Generation, Assembly, Rubric
4. **SAM Goal/Plan Tracking** - Full lifecycle tracking via TaxomindContext
5. **Memory Persistence** - Background KnowledgeGraph + SessionContext writes

---

## System Architecture

```
User: "Create an exam about Neural Networks"
  |
  v
+--------------------------------------------------+
|  SAM Chat (exam-builder mode)                    |
|  Tool Planner auto-invokes exam-builder tool     |
+--------------------------------------------------+
  |
  v
+--------------------------------------------------+
|  Exam Builder Tool (8-step collection)           |
|  lib/sam/tools/exam-builder.ts                   |
|  Steps: topic -> subtopics -> studentLevel ->    |
|         examPurpose -> bloomsDistribution ->     |
|         questionCount -> timeLimit -> formats    |
+--------------------------------------------------+
  | triggerGeneration: true
  v
+--------------------------------------------------+
|  Frontend: POST /api/sam/exam-builder/orchestrate|
|  app/api/sam/exam-builder/orchestrate/route.ts   |
|  Sets up SSE ReadableStream                      |
+--------------------------------------------------+
  |
  v
+--------------------------------------------------+
|  Orchestrator (5-stage pipeline)                 |
|  lib/sam/exam-generation/orchestrator.ts         |
|                                                  |
|  Stage 1: Topic Decomposition       (5-15 concepts)
|  Stage 2: Bloom's Distribution      (plan questions)
|  Stage 3: Question Generation       (per-question + retry)
|  Stage 4: Assembly & Balancing      (7 validation checks)
|  Stage 5: Rubric & Cognitive Profile             |
+--------------------------------------------------+
  |                    |                    |
  v                    v                    v
+-----------+  +--------------+  +------------------+
| Database  |  | SAM Goal/Plan|  | Memory Stores    |
| Exam      |  | Controller   |  | (fire-and-forget)|
| Questions |  | Tracking     |  | KnowledgeGraph   |
| Profiles  |  |              |  | SessionContext   |
+-----------+  +--------------+  +------------------+
```

---

## File Map

### Core Pipeline (`lib/sam/exam-generation/`)

| File | Lines | Purpose |
|------|-------|---------|
| `agentic-types.ts` | 252 | All TypeScript types for the 5-stage pipeline |
| `bloom-system-prompt.ts` | 204 | Gold standard system prompt, level reasoning, anti-patterns |
| `helpers.ts` | 767 | Parsing, fallback generation, quality scoring, Bloom's configs |
| `prompts.ts` | 441 | Stage-specific prompt builders (Stages 1-5) |
| `orchestrator.ts` | 904 | Main 5-stage pipeline with SSE events and DB writes |
| `exam-creation-controller.ts` | 324 | SAM Goal/Plan lifecycle management |
| `exam-memory-persistence.ts` | 195 | Fire-and-forget KnowledgeGraph + SessionContext |

### Tool & Skill

| File | Lines | Purpose |
|------|-------|---------|
| `lib/sam/tools/exam-builder.ts` | 747 | 8-step conversational tool (SAM tool definition) |
| `lib/sam/skills/exam-builder.skill.md` | 41 | Skill descriptor (when to use, capabilities) |

### API Route

| File | Lines | Purpose |
|------|-------|---------|
| `app/api/sam/exam-builder/orchestrate/route.ts` | 180 | SSE streaming endpoint |

### Modified Files

| File | Change |
|------|--------|
| `lib/sam/agentic-tooling.ts` | Registered `createExamBuilderTool()` in standalone tools |
| `lib/sam/tool-planner.ts` | Mode affinity, auto-invoke patterns, topic extraction |

---

## Data Flow (Detailed)

### Phase 1: Conversational Collection

The **Exam Builder Tool** (`lib/sam/tools/exam-builder.ts`) collects 8 parameters:

| # | Step | Question | Options / Default |
|---|------|----------|-------------------|
| 1 | `topic` | "What topic should this exam cover?" | Free text |
| 2 | `subtopics` | "What specific subtopics?" | `auto` or comma-separated list |
| 3 | `studentLevel` | "What is the student level?" | novice / intermediate / advanced / research |
| 4 | `examPurpose` | "What is the purpose?" | diagnostic / mastery / placement / research-readiness |
| 5 | `bloomsDistribution` | "How should Bloom's levels be distributed?" | `auto` (recommended) or custom % |
| 6 | `questionCount` | "How many questions? (5-50)" | 10 / 15 / 25 / 40 |
| 7 | `timeLimit` | "Time limit in minutes?" | 30 / 60 / 90 / unlimited |
| 8 | `questionFormats` | "Question formats to include?" | MCQ, Short Answer, Long Answer, Design Problem, Code Challenge |

**State management**: In-memory `Map<conversationId, ExamCollectionState>` with 30-minute TTL cleanup. Stateless fallback via `currentStep` + `collected` params for serverless environments.

**Tool output modes**:
- **Conversational step**: `{ type: 'conversation', step, question, options, collected, progress }`
- **Generation trigger**: `{ type: 'generate_exam', triggerGeneration: true, params, apiEndpoint: '/api/sam/exam-builder/orchestrate' }`

### Phase 2: Auto-Invoke & Mode Affinity

In `lib/sam/tool-planner.ts`:

**MODE_TOOL_AFFINITY**:
```
'exam-builder' -> ['sam-exam-builder', 'sam-quiz-grader']
```

**Auto-invoke patterns** (regex-based):
```
/\b(create|build|make|generate|design)\b.*\b(exam|quiz|test|assessment)\b/i
/\bnew (exam|quiz|test)\b/i
/\b(exam|quiz|test)\b.*\b(creation|builder|generator)\b/i
/\b(assess|evaluate|diagnose)\b.*\b(student|understanding|knowledge|learning)\b/i
/\bbloom's?\b.*\b(exam|quiz|test|assessment)\b/i
```

**Topic extraction** (in `checkAutoInvoke()`):
- Extracts topic from messages like "Create an exam about Neural Networks"
- Passes extracted topic as `{ action: 'start', topic: 'Neural Networks' }` to skip step 1

### Phase 3: SSE Streaming API

`app/api/sam/exam-builder/orchestrate/route.ts`:

1. **Auth**: `currentUser()` check
2. **Subscription gate**: `withSubscriptionGate(userId, { category: 'generation' })`
3. **Validation**: Zod schema validates all params
4. **SSE stream**: Opens `ReadableStream` with `sendSSE(event, data)` helper
5. **Orchestration**: Calls `orchestrateExamCreation()` with SSE callbacks
6. **Response**: Text/event-stream with `X-Accel-Buffering: no`

**Request schema** (`OrchestrateExamSchema`):
```typescript
{
  topic: string           // min 2, max 200
  subtopics: string[] | 'auto'
  studentLevel: 'novice' | 'intermediate' | 'advanced' | 'research'
  examPurpose: 'diagnostic' | 'mastery' | 'placement' | 'research-readiness'
  bloomsDistribution: Record<BloomsLevel, number> | 'auto'
  questionCount: number   // 5-50
  timeLimit: number | null
  questionFormats: QuestionFormat[]
  sectionId?: string
  courseId?: string
  chapterId?: string
}
```

### Phase 4: 5-Stage Orchestration Pipeline

`lib/sam/exam-generation/orchestrator.ts`:

#### Stage 1: Topic Decomposition
- **Input**: Topic, subtopics, studentLevel, examPurpose
- **AI prompt**: `buildStage1Prompt()` - asks AI to break topic into 5-15 concepts
- **Output**: `DecomposedConcept[]` (name, description, prerequisites, misconceptions, importance)
- **Fallback**: `buildFallbackConcepts()` if AI parse fails
- **SSE events**: `stage_start`, `thinking`, `concept_map`, `stage_complete`
- **AI config**: capability `'course'`, maxTokens 3000, temperature 0.4
- **Memory**: `persistExamConceptsBackground()` writes to KnowledgeGraph

#### Stage 2: Bloom's Distribution Planning
- **Input**: Concepts, exam purpose profile, available formats
- **AI prompt**: `buildStage2Prompt()` - plans questions per concept x Bloom's level x format
- **Output**: `PlannedQuestion[]` (concept, bloomsLevel, format, difficulty, time, points)
- **Fallback**: `buildFallbackDistribution()` using `BLOOM_DISTRIBUTION_PROFILES`
- **SSE events**: `stage_start`, `thinking`, `bloom_distribution`, `stage_complete`
- **AI config**: capability `'course'`, maxTokens 3000, temperature 0.3

#### Stage 3: Question Generation (THE CORE)
- **Input**: PlannedQuestion, concept, all previously generated questions
- **AI prompt**: `buildStage3Prompt()` - generates ONE question with full metadata
- **Cross-referencing**: Last 5 questions passed to prevent answer leakage
- **Quality retry**: Score each question, retry if < 60/100 (max 3 attempts, keep best)
- **Temperature increase**: base 0.5 + attempt * 0.1 (more creative on retry)
- **Output**: `GeneratedQuestion` with reasoning trace, diagnostic notes, signal verbs
- **DB write**: Saves `ExamQuestion` + `EnhancedQuestion` immediately per question
- **SSE events**: `item_generating`, `item_complete` (per question), `progress`
- **AI config**: capability `'course'`, maxTokens 2000, temperature 0.5+
- **Memory**: `persistExamQualityBackground()` at end of stage

#### Stage 4: Exam Assembly & Balancing
- **Input**: All generated questions, concepts
- **AI prompt**: `buildStage4Prompt()` - validates 7 checks:
  1. **Concept Coverage** - Every core concept has at least 1 question
  2. **Bloom's Distribution Match** - Actual vs planned deviation
  3. **Difficulty Curve** - Progressive from accessible to challenging
  4. **Answer Independence** - No question leaks answers to another
  5. **Time Budget** - Total time fits exam duration
  6. **Format Variety** - Mix of question types
  7. **Cognitive Load Balance** - No 2+ CREATE/EVALUATE back-to-back
- **Output**: `AssemblyValidation` (per-check passed/failed with messages)
- **SSE events**: `stage_start`, `thinking`, `validation_result`, `stage_complete`
- **AI config**: capability `'analysis'`, maxTokens 2000, temperature 0.2

#### Stage 5: Rubric & Cognitive Profile
- **Input**: All questions, concepts
- **AI prompt**: `buildStage5Prompt()` - generates cognitive profile template
- **Output**: `CognitiveProfileTemplate`:
  - `bloomsLevelScoring`: Per level - question IDs and max points
  - `ceilingLevelThreshold`: Default 80% (proficiency threshold)
  - `growthEdgeLogic`: How to determine student's growth edge
  - `remediationMap`: Per-level remediation advice
- **DB write**: `ExamBloomsProfile` with target/actual distributions, difficulty matrix, coverage map
- **SSE events**: `stage_start`, `thinking`, `stage_complete`
- **AI config**: capability `'analysis'`, maxTokens 2000, temperature 0.3

---

## SSE Event Types

```
progress           { percentage: number, message: string, stage?: number }
stage_start        { stage: 1-5, stageName: string, message: string }
stage_complete     { stage: 1-5, message: string, itemCount?: number }
thinking           { stage: number, message: string }
concept_map        { concepts: Array<{ name, prerequisites, misconceptions, importance }> }
bloom_distribution { planned: Record<BloomsLevel, number>, purpose: string }
item_generating    { stage: 3, concept, bloomsLevel, questionNumber, message }
item_complete      { stage: 3, concept, bloomsLevel, questionId, qualityScore }
validation_result  { checks: Array<{ name, passed, message }>, overallPass: boolean }
complete           { examId, questionCount, bloomsProfile, cognitiveProfileTemplate, stats, goalId, planId }
error              { message: string, canRetry: boolean, examId?: string }
```

---

## Quality Scoring System

Each generated question is scored across 5 weighted dimensions:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| `bloomsAlignment` | 30% | Does the question target the declared Bloom's level? Signal verb match, reasoning trace present |
| `clarity` | 20% | Unambiguous stem, proper length, no double negatives |
| `distractorQuality` | 20% | MCQ distractors have diagnostic notes mapping to misconceptions |
| `diagnosticValue` | 15% | Reasoning trace, diagnostic notes, remediation suggestion present |
| `cognitiveRigor` | 15% | Difficulty matches plan, cognitive skills and related concepts present |

**Threshold**: 60/100. If quality < 60, retry up to 2 more times (3 total). Keep the best scoring attempt.

**Scoring logic** (from `helpers.ts:scoreQuestion()`):
- Bloom's alignment: +20 for level match, +10 per matching signal verb (max 30), +10 for reasoning trace > 50 chars
- Clarity: +15 for proper stem length, +10 for ending punctuation, +15 for no double negatives
- Distractor quality: 40 base + ratio of distractors with diagnostic notes * 40 + 20 for exactly 1 correct answer
- Diagnostic value: +25 for reasoning trace, +20 for diagnostic notes, +15 for remediation, +10 for explanation
- Cognitive rigor: +20 for difficulty match, +10 for points match, +10 for cognitive skills, +10 for related concepts

---

## Bloom's Taxonomy Configuration

### Distribution Profiles (by Exam Purpose)

```
diagnostic:         R:15%  U:20%  Ap:25%  An:20%  E:15%  C:5%
mastery:            R:5%   U:10%  Ap:20%  An:25%  E:25%  C:15%
placement:          R:20%  U:20%  Ap:20%  An:20%  E:10%  C:10%
research-readiness: R:5%   U:10%  Ap:15%  An:20%  E:25%  C:25%
```

### Question Type Matrix (Recommended Formats per Level)

```
REMEMBER:    mcq, short_answer
UNDERSTAND:  mcq, short_answer, long_answer
APPLY:       mcq, short_answer, code_challenge
ANALYZE:     mcq, long_answer, design_problem
EVALUATE:    long_answer, design_problem, mcq
CREATE:      design_problem, long_answer, code_challenge
```

### Level Configuration

| Level | Signal Verbs | Time | Points | Distractor Logic |
|-------|-------------|------|--------|------------------|
| REMEMBER | define, list, name, identify, recall | 30s | 1 | Confused terms, partial truths, adjacent categories |
| UNDERSTAND | explain, describe, compare, predict | 60s | 2 | Surface vs deeper meaning, reversed relationships |
| APPLY | apply, solve, implement, calculate | 90s | 3 | Wrong procedure, calculation errors, similar problems |
| ANALYZE | analyze, examine, differentiate, categorize | 120s | 4 | Surface patterns, wrong relationships, correlation/causation |
| EVALUATE | evaluate, judge, critique, justify | 150s | 5 | Single-criteria judgment, wrong criteria, opinion vs evidence |
| CREATE | create, design, propose, synthesize | 180s | 6 | Recombination without novelty, wrong problem, missing constraints |

---

## Gold Standard Prompts

### System Prompt (`bloom-system-prompt.ts`)

The `BLOOM_EXAM_SYSTEM_PROMPT` constant (79 lines) is injected into ALL 5 stages. It establishes:

1. **Persona**: Expert Bloom's Taxonomy Exam Architect
2. **Core Principles**: Every question targets a SPECIFIC level; wrong answers are diagnostic tools; reasoning traces are mandatory; self-validation is required
3. **Output Format**: Structured JSON with stem, options, reasoning trace, diagnostic notes, remediation
4. **Anti-Patterns** (10 rules): Level inflation, verb mismatch, trivial distractors, answer leakage, cognitive contamination, single-path, complex stems, missing context, double-barreled, cultural bias

### Level-Specific Reasoning (`BLOOM_LEVEL_REASONING`)

Each Bloom's level has a reasoning block injected into Stage 3 prompts:
- Starts with a `THINK:` directive for the level's cognitive operation
- Lists what types of questions to design
- Specifies signal verbs
- Defines distractor logic for that level

---

## SAM Goal/Plan Lifecycle

`lib/sam/exam-generation/exam-creation-controller.ts`:

### Initialization
```
initializeExamCreationGoal(userId, examTitle, examId)
  -> Creates SAM Goal (status: ACTIVE, context: { examId, type: 'exam-creation' })
  -> Creates 5-step ExecutionPlan:
       Step 1: Topic Decomposition (est. 2 min)
       Step 2: Bloom's Distribution Planning (est. 2 min)
       Step 3: Question Generation (est. 10 min)
       Step 4: Exam Assembly & Balancing (est. 2 min)
       Step 5: Rubric & Cognitive Profile (est. 2 min)
```

### Stage Tracking
```
advanceExamStage(planId, stepIds, stageNumber)
  -> Marks step as in_progress, updates overall progress %

completeExamStep(planId, stepIds, stageNumber, outputs)
  -> Marks step as completed with output summary
```

### Completion
```
completeExamCreation(goalId, planId, stats)
  -> Plan: overallProgress=100, status=COMPLETED
  -> Goal: status=COMPLETED

failExamCreation(goalId, planId, errorMessage)
  -> Preserves existing checkpoint data
  -> Plan: status=FAILED with failureReason
  -> Goal: status=PAUSED (can be resumed)
```

---

## Memory Persistence

`lib/sam/exam-generation/exam-memory-persistence.ts`:

All persistence is **fire-and-forget** (does not block exam generation). Errors are logged but swallowed.

### Concept Persistence (Stage 1)
```
persistExamConceptsBackground(userId, examId, concepts, stage)
  -> Creates KnowledgeGraph entities (type: 'exam-concept')
     - Properties: examId, userId, importance, misconceptions
  -> Creates 'prerequisite_for' edges between concepts
```

### Quality Persistence (Stage 3)
```
persistExamQualityBackground(userId, examId, scores, stage)
  -> Creates/updates SessionContext with quality insights
     - Tracks per-stage quality scores
     - Stores individual dimension scores
```

---

## Database Models

### Exam (container)
```prisma
model Exam {
  id               String   @id @default(uuid())
  title            String
  description      String?
  sectionId        String
  timeLimit        Int?
  passingScore     Float    @default(70)
  shuffleQuestions  Boolean  @default(false)
  isPublished      Boolean  @default(false)
  isActive         Boolean  @default(true)
  ExamQuestion     ExamQuestion[]
  enhancedQuestions EnhancedQuestion[]
  ExamBloomsProfile ExamBloomsProfile?
}
```

### ExamQuestion (legacy format - also populated for backward compatibility)
```prisma
model ExamQuestion {
  id            String             @id @default(uuid())
  examId        String
  question      String
  options       Json?
  correctAnswer Json
  explanation   String?
  points        Int                @default(1)
  order         Int                @default(0)
  questionType  QuestionType       @default(MULTIPLE_CHOICE)
  bloomsLevel   BloomsLevel?
  difficulty    QuestionDifficulty @default(MEDIUM)
}
```

### EnhancedQuestion (rich AI metadata)
```prisma
model EnhancedQuestion {
  id                    String   @id @default(cuid())
  examId                String?
  question              String
  questionType          QuestionType
  bloomsLevel           BloomsLevel?
  difficulty            QuestionDifficulty
  points                Int      @default(1)
  order                 Int      @default(0)
  estimatedTime         Int?
  options               Json?
  correctAnswer         String
  hint                  String?
  explanation           String?
  cognitiveSkills       String[] @default([])
  prerequisites         String[] @default([])
  relatedConcepts       String[] @default([])
  commonMisconceptions  Json?
  generationMode        QuestionGenerationMode @default(AI_GUIDED)
}
```

### ExamBloomsProfile (diagnostic metadata)
```prisma
model ExamBloomsProfile {
  id                  String @id @default(cuid())
  examId              String @unique
  targetDistribution  Json   // { REMEMBER: 15, UNDERSTAND: 20, ... }
  actualDistribution  Json   // { REMEMBER: 3, UNDERSTAND: 4, ... }
  difficultyMatrix    Json   // { REMEMBER: { 1: 2, 2: 1 }, ... }
  skillsAssessed      Json   // ["critical-thinking", "pattern-recognition"]
  coverageMap         Json   // { "Neural Networks": ["UNDERSTAND", "APPLY"] }
}
```

### Mapping: Agentic Types -> Prisma Types

| Agentic `QuestionFormat` | Prisma `QuestionType` |
|--------------------------|----------------------|
| `mcq` | `MULTIPLE_CHOICE` |
| `short_answer` | `SHORT_ANSWER` |
| `long_answer` | `ESSAY` |
| `design_problem` | `ESSAY` |
| `code_challenge` | `SHORT_ANSWER` |

| Agentic `difficulty` (1-5) | Prisma `QuestionDifficulty` |
|----------------------------|----------------------------|
| 1, 2 | `EASY` |
| 3 | `MEDIUM` |
| 4, 5 | `HARD` |

---

## Standalone Exam Support

When no `sectionId` is provided (user creates exam from SAM chat, not a course page), the orchestrator:

1. Finds or creates an "AI-Generated Exams" course for the user
2. Creates an "Exam Collection" chapter under it
3. Creates a new section per exam topic
4. Attaches the exam to that section

This ensures every exam has a valid `sectionId` (required by the `Exam` model).

---

## Type Definitions

### Collection Types
```typescript
type ExamCollectionStep = 'topic' | 'subtopics' | 'studentLevel' | 'examPurpose'
  | 'bloomsDistribution' | 'questionCount' | 'timeLimit' | 'questionFormats' | 'complete';

type StudentLevel = 'novice' | 'intermediate' | 'advanced' | 'research';
type ExamPurpose = 'diagnostic' | 'mastery' | 'placement' | 'research-readiness';
type QuestionFormat = 'mcq' | 'short_answer' | 'long_answer' | 'design_problem' | 'code_challenge';
```

### Pipeline Types
```typescript
interface DecomposedConcept {
  name: string;
  description: string;
  prerequisites: string[];
  commonMisconceptions: string[];
  importance: 'core' | 'supporting' | 'advanced';
}

interface PlannedQuestion {
  concept: string;
  bloomsLevel: BloomsLevel;
  questionFormat: QuestionFormat;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedTimeSeconds: number;
  points: number;
}

interface GeneratedQuestion {
  id: string;
  stem: string;
  bloomsLevel: BloomsLevel;
  concept: string;
  questionType: QuestionFormat;
  difficulty: 1 | 2 | 3 | 4 | 5;
  points: number;
  estimatedTimeSeconds: number;
  options?: Array<{ text: string; isCorrect: boolean; diagnosticNote: string }>;
  correctAnswer: string;
  reasoningTrace: string;
  diagnosticNotes: string;
  explanation: string;
  hint?: string;
  remediationSuggestion: string;
  cognitiveSkills: string[];
  relatedConcepts: string[];
  signalVerbs: string[];
}
```

### Quality & Validation Types
```typescript
interface ExamQualityScore {
  bloomsAlignment: number;   // 30% weight
  clarity: number;           // 20% weight
  distractorQuality: number; // 20% weight
  diagnosticValue: number;   // 15% weight
  cognitiveRigor: number;    // 15% weight
  overall: number;           // weighted average
}

interface AssemblyValidation {
  conceptCoverage: { passed: boolean; message: string };
  bloomsDistributionMatch: { passed: boolean; deviation: number; message: string };
  difficultyCurve: { passed: boolean; message: string };
  answerIndependence: { passed: boolean; leaks: string[]; message: string };
  timeBudget: { passed: boolean; totalMinutes: number; limitMinutes: number | null; message: string };
  formatVariety: { passed: boolean; message: string };
  cognitiveLoadBalance: { passed: boolean; message: string };
}

interface CognitiveProfileTemplate {
  bloomsLevelScoring: Record<BloomsLevel, { questionIds: string[]; maxPoints: number }>;
  ceilingLevelThreshold: number;  // default 80%
  growthEdgeLogic: string;
  remediationMap: Record<BloomsLevel, string>;
}
```

### Orchestration Types
```typescript
interface ExamOrchestrationConfig {
  params: ExamBuilderParams;
  userId: string;
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  onProgress?: (progress: { percentage: number; message: string }) => void;
  abortSignal?: AbortSignal;
}

interface ExamOrchestrationResult {
  success: boolean;
  examId?: string;
  questionCount?: number;
  bloomsProfile?: Record<BloomsLevel, number>;
  cognitiveProfileTemplate?: CognitiveProfileTemplate;
  stats?: {
    totalQuestions: number;
    totalPoints: number;
    estimatedDuration: number;
    averageQualityScore: number;
    conceptsCovered: number;
    bloomsLevelsCovered: number;
  };
  error?: string;
  goalId?: string;
  planId?: string;
}
```

---

## Resilience & Fallbacks

Every stage has a fallback when AI response parsing fails:

| Stage | Fallback |
|-------|----------|
| 1: Topic Decomposition | `buildFallbackConcepts()` - Creates basic concepts from subtopics |
| 2: Distribution Planning | `buildFallbackDistribution()` - Uses `BLOOM_DISTRIBUTION_PROFILES[purpose]` + `QUESTION_TYPE_MATRIX` |
| 3: Question Generation | `buildFallbackQuestion()` - Generates a simple question using signal verbs for the level |
| 4: Assembly Validation | `buildDefaultValidation()` - All checks pass with "Validation skipped" message |
| 5: Cognitive Profile | `buildDefaultCognitiveProfile()` - Empty profile with generic remediation |

### JSON Extraction

The `extractJsonFromResponse()` helper handles multiple AI response formats:
1. Direct JSON parse
2. Markdown code fence removal (`\`\`\`json ... \`\`\``)
3. Array extraction via regex
4. Object extraction via regex

### Abort Signal

The orchestrator checks `abortSignal?.aborted` before each stage AND between each question in Stage 3. If aborted:
- Current stage is abandoned
- Error flows to `failExamCreation()` which preserves checkpoint data
- SSE error event is sent to the client

---

## Integration Points

### AI Provider
All AI calls use `runSAMChatWithPreference()` from `lib/sam/ai-provider.ts`:
- Stages 1-3: capability `'course'`
- Stages 4-5: capability `'analysis'`
- Automatically handles user preferences, rate limiting, fallback, circuit breaker

### TaxomindContext Stores
- **Goal/Plan stores**: `getGoalStores()` -> `{ goal: GoalStore, plan: PlanStore }`
- **Memory stores**: `getMemoryStores()` -> `{ knowledgeGraph, sessionContext }`

### Backward Compatibility
- Existing `/api/sam/exam-builder/generate` route: **UNCHANGED** (quick generation from section page)
- Existing `/api/sam/exam-builder/evaluate` route: **UNCHANGED** (question validation)
- Existing `quiz-grader` tool: **UNCHANGED** (answer grading)
- New orchestrate route is **ADDITIVE** at `/api/sam/exam-builder/orchestrate`

---

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Max duration | 300 seconds (5 minutes) |
| Max questions | 50 |
| Max retries per question | 3 attempts |
| Quality threshold | 60/100 |
| State TTL | 30 minutes |
| Rate limit | 10 calls per hour per user |
| Memory persistence | Background (non-blocking) |
| Abort support | Yes (AbortSignal between stages + questions) |

### Estimated Times
| Questions | Approx. Duration |
|-----------|-----------------|
| 10 | ~1-2 minutes |
| 15 | ~2-3 minutes |
| 25 | ~3-4 minutes |
| 50 | ~4-5 minutes |

---

## End-to-End User Journey

```
1. User opens SAM chat in exam-builder mode
2. Types: "Create an exam about Machine Learning"

3. Tool Planner:
   - Matches auto-invoke pattern: /create.*exam/i
   - Extracts topic: "Machine Learning"
   - Invokes sam-exam-builder with { action: 'start', topic: 'Machine Learning' }

4. Exam Builder Tool:
   - Skips step 1 (topic already extracted)
   - Asks: "What specific subtopics of Machine Learning?"
   - User: "auto"
   - Asks: "What is the student level?"
   - User: "intermediate"
   - ... continues through all 8 steps ...
   - Returns: { triggerGeneration: true, params: {...}, apiEndpoint: '/api/sam/exam-builder/orchestrate' }

5. Frontend:
   - POST /api/sam/exam-builder/orchestrate with params
   - Opens EventSource for SSE
   - Displays real-time progress UI

6. Orchestrator:
   - Creates Exam record in DB
   - Creates SAM Goal + 5-step ExecutionPlan
   - Runs Stage 1: AI decomposes "Machine Learning" -> 10 concepts
   - Runs Stage 2: Plans 15 questions across Bloom's levels
   - Runs Stage 3: Generates 15 questions one-by-one with quality retry
   - Runs Stage 4: Validates 7 assembly checks
   - Runs Stage 5: Generates cognitive profile template
   - Marks Goal as COMPLETED

7. SSE complete event:
   {
     examId: "exam-abc123",
     questionCount: 15,
     bloomsProfile: { REMEMBER: 2, UNDERSTAND: 3, APPLY: 4, ANALYZE: 3, EVALUATE: 2, CREATE: 1 },
     stats: {
       totalPoints: 45,
       estimatedDuration: 28,
       averageQualityScore: 78,
       conceptsCovered: 8,
       bloomsLevelsCovered: 6
     }
   }

8. Frontend redirects to exam editor or preview
```

---

## Related Documentation

- **SAM Agentic Architecture**: `codebase-memory/architecture/SAM_AGENTIC_ARCHITECTURE.md`
- **SAM Skill/Tool Pattern**: `codebase-memory/architecture/SAM_SKILL_TOOL_PATTERN.md`
- **Course Creator (reference pattern)**: `lib/sam/course-creation/`
- **Prisma Schema**: `prisma/domains/03-learning.prisma`, `prisma/domains/01-enums.prisma`

---

*Last updated: February 2026*
*System version: 1.0.0*
