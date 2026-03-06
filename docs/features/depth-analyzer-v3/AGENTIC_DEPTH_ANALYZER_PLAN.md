# Agentic Course Depth Analyzer V3 - Comprehensive Implementation Plan

> **Goal**: Transform the Course Depth Analyzer from a prompt-engineered pipeline into a fully agentic system modeled after the AI Course Creation pipeline, leveraging the complete SAM agentic architecture.

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Target Architecture](#2-target-architecture)
3. [The 5-Layer SAM Integration](#3-the-5-layer-sam-integration)
4. [Phase 1: Foundation - Tool + Registration + Skill](#phase-1-foundation---tool--registration--skill)
5. [Phase 2: Agentic Orchestrator + State Machine](#phase-2-agentic-orchestrator--state-machine)
6. [Phase 3: Goal/Plan Tracking + Checkpoint/Resume](#phase-3-goalplan-tracking--checkpointresume)
7. [Phase 4: Memory Persistence + Cross-Analysis Learning](#phase-4-memory-persistence--cross-analysis-learning)
8. [Phase 5: Quality Gates + Multi-Framework Integration](#phase-5-quality-gates--multi-framework-integration)
9. [Phase 6: Agentic Decision-Making + Healing](#phase-6-agentic-decision-making--healing)
10. [Phase 7: Unified System + Legacy Cleanup](#phase-7-unified-system--legacy-cleanup)
11. [Phase 8: UI Upgrades + SAM Chat Integration](#phase-8-ui-upgrades--sam-chat-integration)
12. [Database Schema Changes](#database-schema-changes)
13. [File Map](#file-map)
14. [Migration Strategy](#migration-strategy)
15. [Risk Assessment](#risk-assessment)

---

## 1. Current State Assessment

### What Exists Today

**System A (Standalone Page V2)** at `/teacher/depth-analyzer`:
- Real AI via `runSAMChatWithPreference` with `capability: 'analysis'`
- 3-stage pipeline: overview -> per-chapter deep -> cross-chapter analysis
- SSE streaming with 9 event types
- Per-issue CRUD with status workflow (OPEN -> RESOLVED -> WONT_FIX)
- Content hash caching (SHA-256 dedup)
- 11-step rule-based fallback engine
- Stored in `CourseDepthAnalysisV2` + `DepthAnalysisIssue` tables

**System B (Course-Embedded)** at `/teacher/courses/[courseId]`:
- Uses `@sam-ai/educational` package with `enableAIEnhancements: false` (rule-based)
- Multi-framework support (5 taxonomies) but not AI-powered
- QM/OLC compliance checking
- Stored in `CourseBloomsAnalysis` table

### What's Missing (Gap Analysis vs Course Creation Pipeline)

| Capability | Course Creation | Depth Analyzer | Gap |
|---|---|---|---|
| SAM Tool (Layer 1) | `sam-course-creator` in `tools/course-creator.ts` | None | **MISSING** |
| Tool Registration (Layer 2) | Registered in `agentic-tooling.ts` | None | **MISSING** |
| Auto-Invoke (Layer 3) | Regex patterns in `tool-planner.ts` | None | **MISSING** |
| Skill Descriptor (Layer 4) | `course-creator.skill.md` | None | **MISSING** |
| Goal/Plan Tracking (Layer 5) | Full 3-tier: Goal -> Plan -> SubGoals | None | **MISSING** |
| AgentStateMachine | Per-chapter state machine with auto-checkpoint | None - simple for-loop | **MISSING** |
| Memory Persistence | KnowledgeGraph + SessionContext (fire-and-forget) | None | **MISSING** |
| Checkpoint/Resume | Full resume from any chapter failure | None - restart from scratch | **MISSING** |
| Quality Gates | `@sam-ai/quality` + `@sam-ai/pedagogy` pipelines | None - custom scoring only | **MISSING** |
| Agentic Decisions | evaluateChapterOutcome -> heal/replan/skip/pause | None - linear pipeline | **MISSING** |
| Healing Loop | Re-analyze flagged chapters with feedback | None | **MISSING** |
| Cross-Analysis Memory | Concepts recalled from prior courses | None - each analysis is isolated | **MISSING** |
| Idempotency | In-memory + DB-backed dual lock | Content hash only | **PARTIAL** |
| Blueprint/Pre-check | Coherence preflight before generation | None | **MISSING** |
| Post-Processing | Course reflection + healing loop | None | **MISSING** |
| Budget Tracking | PipelineBudgetTracker (tokens + cost) | None | **MISSING** |
| A/B Experiments | Experiment resolution + outcome recording | None | **MISSING** |
| Issue Identity | N/A (creates content, not issues) | nanoid() per run - no semantic dedup | **WEAK** |

---

## 2. Target Architecture

### High-Level Architecture

```
User Action: "Analyze my React course for quality"
  |
  v
[Layer 3] tool-planner.ts::checkAutoInvoke('blooms-analyzer', message)
  -> regex match -> { toolId: 'sam-depth-analyzer', input: { courseId, action: 'start' } }
  |
  v
[Layer 1] tools/depth-analyzer.ts::handler (conversational or direct)
  -> Collects: courseId, analysisMode, frameworks, focusAreas
  -> Returns: { triggerGeneration: true, apiEndpoint: '/api/sam/depth-analysis/orchestrate' }
  |
  v
[Route] POST /api/sam/depth-analysis/orchestrate (SSE)
  -> Rate limit -> Auth -> Subscription gate -> Idempotency (dual lock)
  -> ReadableStream with heartbeat
  |
  v
[Orchestrator] lib/sam/depth-analysis/orchestrator.ts
  -> resolveAIModelInfo({ capability: 'analysis' })
  -> recallAnalysisMemory(userId, courseId) -- prior findings
  -> planAnalysisStrategy(courseId, courseData) -- AI-planned analysis order
  -> initializeAnalysisGoal(userId, courseId) -- Goal + 5-step Plan
  |
  v
[State Machine] lib/sam/depth-analysis/analysis-state-machine.ts
  -> AgentStateMachine with one PlanStep per chapter
  -> autoSaveInterval: 15000 (checkpoint every 15s)
  |
  v
For each chapter (via step executor):
  [Phase 0] Skip check (already analyzed with same content hash?)
  [Phase 1] Lifecycle: create chapter SubGoal, build AnalysisStepContext
  [Phase 2] Analyze: run 5-stage deep analysis pipeline
    |
    +-> Stage 1: Structural Analysis (empty sections, missing content, format)
    +-> Stage 2: Bloom's + Multi-Framework Cognitive Depth
    +-> Stage 3: Pedagogical Quality (Gagne, Constructive Alignment, ZPD)
    +-> Stage 4: Content Flow + Prerequisites + Knowledge Mapping
    +-> Stage 5: Assessment Alignment + Accessibility + Readability
    |
  [Phase 3] Lifecycle: complete chapter SubGoal
  [Phase 4] Memory: persist findings to KnowledgeGraph + SessionContext
  [Phase 5] Decisions: evaluateChapterOutcome -> heal/deep-dive/flag/continue
  [Phase 6] Healing: re-analyze flagged sections with targeted prompts
  [Phase 7] Checkpoint: save full state for resume
  |
  v
[Cross-Chapter Analysis] (after all chapters)
  -> Knowledge flow validation across chapters
  -> Bloom's progression analysis
  -> Consistency scoring (style, difficulty curve, terminology)
  -> Gap analysis (missing topics, orphaned concepts)
  |
  v
[Post-Processing]
  -> Semantic issue deduplication (merge similar issues across chapters)
  -> Issue prioritization (weighted by impact + frequency)
  -> Fix generation with evidence chains
  -> Analysis reflection (AI evaluates its own analysis quality)
  -> Store reflection in Goal.metadata
  |
  v
[Finalization]
  -> Save CourseDepthAnalysisV3 + DepthAnalysisIssue (with semantic IDs)
  -> Complete Goal + Plan (100%)
  -> Persist quality patterns to KnowledgeGraph
  -> Record SLO metrics
  -> Emit SSE 'complete' event
```

### Key Design Principles

1. **Same 5-layer pattern** as course creation - no architectural divergence
2. **AgentStateMachine** drives per-chapter analysis - enables checkpoint/resume
3. **Non-blocking goal tracking** - controller functions catch errors, never crash analysis
4. **Fire-and-forget memory** - persistence never awaited
5. **Semantic issue identity** - issues tracked by content fingerprint, not random IDs
6. **Agentic decisions** - AI evaluates each chapter's analysis and decides next action
7. **Unified system** - merge System A and System B into one agentic system

---

## 3. The 5-Layer SAM Integration

### Layer 1: Tool Definition

**File**: `lib/sam/tools/depth-analyzer.ts`

```typescript
// Tool: sam-depth-analyzer
// Type: Direct (courseId from context) + Conversational (for framework/focus selection)
// Steps: courseId -> analysisMode -> frameworks -> focusAreas -> complete

type AnalysisCollectionStep =
  | 'courseSelection'    // Which course to analyze
  | 'analysisMode'      // 'quick' | 'standard' | 'deep' | 'comprehensive'
  | 'frameworks'        // Which frameworks to evaluate against
  | 'focusAreas'        // Specific areas of concern
  | 'complete';

// Modes:
// - quick: Structure + Bloom's only (2 stages, ~30s)
// - standard: Structure + Bloom's + Pedagogy (3 stages, ~2min)
// - deep: All 5 stages per chapter (~5min)
// - comprehensive: All 5 stages + cross-chapter + healing (~10min)
```

### Layer 2: Registration

**File**: `lib/sam/agentic-tooling.ts` (modify)

```typescript
import { createDepthAnalyzerTool } from '@/lib/sam/tools/depth-analyzer';
// Add to doRegisterStandaloneTools():
standaloneTools.push(createDepthAnalyzerTool());
```

### Layer 3: Auto-Invoke + Mode Affinity

**File**: `lib/sam/tool-planner.ts` (modify)

```typescript
// MODE_TOOL_AFFINITY
'blooms-analyzer': [
  'sam-depth-analyzer',
  'sam-quality-evaluator',
  'sam-course-healer',
  'sam-memory-recall',
],

// MODE_AUTO_INVOKE
'blooms-analyzer': {
  toolId: 'sam-depth-analyzer',
  intentPatterns: [
    /\b(analyze|evaluate|assess|audit|check|review)\b.*\b(course|content|quality|depth|bloom)/i,
    /\b(course|content)\b.*\b(quality|analysis|depth|review|audit)\b/i,
    /\bbloom.?s?\b.*\b(analysis|taxonomy|level|distribution)\b/i,
    /\b(how|what).*(deep|quality|good|effective)\b.*\b(course|content|material)\b/i,
    /\bdepth\s*analyz/i,
    /\bcourse\s*quality\b/i,
  ],
  defaultInput: { action: 'start' },
},
```

### Layer 4: Skill Descriptor

**File**: `lib/sam/skills/depth-analyzer.skill.md`

```markdown
# Course Depth Analyzer

## What It Does
Performs comprehensive multi-framework quality analysis of course content,
identifying issues in cognitive depth, pedagogical alignment, content flow,
and accessibility. Produces actionable fix recommendations with evidence.

## When to Use
- Teacher wants to evaluate course quality before publishing
- Teacher asks about Bloom's taxonomy distribution
- Teacher wants to find content gaps or quality issues
- Teacher asks "how good is my course"
- After course creation (auto-triggered)

## Capabilities
- 5-framework cognitive analysis (Bloom's, Webb's DOK, SOLO, Fink, Marzano)
- Pedagogical quality assessment (Gagne's 9 Events, Constructive Alignment)
- Content flow and prerequisite validation
- Assessment-objective alignment checking
- Accessibility and readability scoring
- Issue tracking with fix workflow (OPEN -> IN_PROGRESS -> RESOLVED)
- Cross-analysis learning (recalls patterns from prior analyses)
- Resume from checkpoint on failure

## Required Information
1. Course ID - which course to analyze
2. Analysis mode - quick/standard/deep/comprehensive (default: standard)
3. Framework focus - which frameworks to prioritize (default: all)

## Output
- Overall quality score (0-100) with sub-scores
- Per-chapter analysis with Bloom's distribution
- Prioritized issue list with evidence and fixes
- Knowledge flow map across chapters
- Stored in CourseDepthAnalysisV3 table
```

### Layer 5: Goal/Plan + Memory

Detailed in Phases 3 and 4 below.

---

## Phase 1: Foundation - Tool + Registration + Skill

### Deliverables

| # | File | Action | Description |
|---|------|--------|-------------|
| 1.1 | `lib/sam/tools/depth-analyzer.ts` | CREATE | SAM tool definition with conversational collection |
| 1.2 | `lib/sam/agentic-tooling.ts` | MODIFY | Register `createDepthAnalyzerTool()` |
| 1.3 | `lib/sam/tool-planner.ts` | MODIFY | Add auto-invoke patterns + mode affinity |
| 1.4 | `lib/sam/skills/depth-analyzer.skill.md` | CREATE | Skill descriptor for SAM context injection |

### Tool Handler Design

```typescript
// lib/sam/tools/depth-analyzer.ts

export function createDepthAnalyzerTool(): ToolDefinition {
  return {
    id: 'sam-depth-analyzer',
    name: 'Course Depth Analyzer',
    description: 'Analyzes course content quality using multi-framework cognitive depth evaluation',
    category: ToolCategory.ANALYSIS,
    handler: createDepthAnalyzerHandler(),
    inputSchema: DepthAnalyzerInputSchema,
    requiredPermissions: [PermissionLevel.READ, PermissionLevel.EXECUTE],
    confirmationType: ConfirmationType.IMPLICIT,
    enabled: true,
    timeoutMs: 300000, // 5 min (analysis can be long)
    maxRetries: 1,
    rateLimit: { maxCalls: 5, windowMs: 3600000, scope: 'user' },
    tags: ['analysis', 'blooms', 'quality', 'depth', 'course-evaluation'],
  };
}

// Handler supports two modes:
// 1. Direct: { courseId: 'xxx', mode: 'deep' } -> immediate trigger
// 2. Conversational: { action: 'start' } -> step-by-step collection
//    Step 1: courseSelection (shows teacher's courses)
//    Step 2: analysisMode (quick/standard/deep/comprehensive)
//    Step 3: frameworks (multi-select: blooms, dok, solo, fink, marzano)
//    Step 4: focusAreas (optional: specific chapters or concern areas)
//    -> Returns: { triggerGeneration: true, apiEndpoint: '/api/sam/depth-analysis/orchestrate' }
```

### Dependencies
- None (foundation layer)

### Verification
- [ ] SAM chat in `blooms-analyzer` mode responds to "analyze my course"
- [ ] Tool appears in Prisma Studio `AgentTool` table
- [ ] Auto-invoke triggers with 0.95 confidence
- [ ] Conversational flow walks through all 4 steps

---

## Phase 2: Agentic Orchestrator + State Machine

### Deliverables

| # | File | Action | Description |
|---|------|--------|-------------|
| 2.1 | `app/api/sam/depth-analysis/orchestrate/route.ts` | CREATE | SSE gateway route with full security |
| 2.2 | `lib/sam/depth-analysis/orchestrator.ts` | CREATE | Core coordinator (mirrors course-creation orchestrator) |
| 2.3 | `lib/sam/depth-analysis/analysis-state-machine.ts` | CREATE | AgentStateMachine wrapper for per-chapter analysis |
| 2.4 | `lib/sam/depth-analysis/step-executor-phases.ts` | CREATE | 8-phase step executor (mirrors course creation) |
| 2.5 | `lib/sam/depth-analysis/pipeline-runner.ts` | CREATE | State machine launcher |
| 2.6 | `lib/sam/depth-analysis/chapter-analyzer.ts` | CREATE | Single chapter analysis engine (5-stage pipeline) |
| 2.7 | `lib/sam/depth-analysis/cross-chapter-analyzer.ts` | CREATE | Cross-chapter analysis engine |
| 2.8 | `lib/sam/depth-analysis/types.ts` | CREATE | All type definitions |
| 2.9 | `lib/sam/depth-analysis/index.ts` | CREATE | Public exports |

### SSE Route Design

```typescript
// app/api/sam/depth-analysis/orchestrate/route.ts
// Mirrors: app/api/sam/course-creation/orchestrate/route.ts

export async function POST(request: NextRequest) {
  // 1. Rate limit: withRateLimit(request, 'heavy')
  // 2. Auth: currentUser()
  // 3. Subscription gate: withSubscriptionGate(user.id, { category: 'analysis' })
  // 4. Zod validation: OrchestrateAnalysisRequestSchema
  // 5. Idempotency: in-memory + DB dual lock
  // 6. Content hash check: skip if same content already analyzed (unless force)
  // 7. SSE stream: ReadableStream with heartbeat
  // 8. Call orchestrateDepthAnalysis() or resumeDepthAnalysis()
}
```

### SSE Event Types

```typescript
type DepthAnalysisSSEEvent =
  | 'analysis_start'        // Analysis initialized, goal created
  | 'strategy_planned'      // AI decided analysis order and focus
  | 'stage_start'           // Pipeline stage beginning
  | 'chapter_analyzing'     // Currently analyzing chapter N
  | 'framework_result'      // Individual framework result for a chapter
  | 'issue_found'           // Real-time issue discovery
  | 'thinking'              // AI reasoning transparency
  | 'chapter_complete'      // Chapter analysis done (with scores)
  | 'cross_chapter_start'   // Cross-chapter analysis beginning
  | 'flow_issue_found'      // Cross-chapter flow problem
  | 'healing_start'         // Re-analyzing flagged section
  | 'healing_complete'      // Healing result
  | 'decision_made'         // Agentic decision (deep-dive, skip, flag)
  | 'progress'              // Percentage + message
  | 'state_change'          // State machine transition
  | 'post_processing'       // Dedup, prioritization, reflection
  | 'complete'              // Final results
  | 'error'                 // Error with canResume flag
  | 'resume_hydrate'        // Batch hydrate on reconnect
  | 'budget_warning';       // Token/cost threshold
```

### Orchestrator Flow

```typescript
// lib/sam/depth-analysis/orchestrator.ts

export async function orchestrateDepthAnalysis(options: AnalysisOptions): Promise<void> {
  const { userId, courseId, mode, frameworks, emitSSE, resumeState } = options;

  // 1. Resolve AI model info
  const modelInfo = await resolveAIModelInfo({ userId, capability: 'analysis' });

  // 2. Fetch course data (deep: sections + content + objectives + assessments)
  const courseData = await fetchCourseDataForAnalysis(courseId);

  // 3. Recall prior analysis memory
  const priorInsights = await recallAnalysisMemory(userId, courseId);

  // 4. Plan analysis strategy (AI-planned: which chapters need deep analysis?)
  const strategy = await planAnalysisStrategy(userId, courseData, priorInsights, mode);
  emitSSE('strategy_planned', { chapterOrder: strategy.order, focusChapters: strategy.focus });

  // 5. Initialize DB record + Goal/Plan (or resume)
  let goalId, planId, stepIds, analysisId;
  if (resumeState) {
    ({ goalId, planId, stepIds, analysisId } = resumeState);
    await reactivateAnalysis(goalId, planId);
    emitSSE('resume_hydrate', { completedChapters: resumeState.completedChapters });
  } else {
    const init = await initializeAnalysisRecord(userId, courseId, courseData, mode, frameworks);
    ({ goalId, planId, stepIds, analysisId } = init);
  }

  // 6. Initialize trackers
  const budgetTracker = new PipelineBudgetTracker(mode);
  const fallbackTracker = new FallbackTracker();

  // 7. Run state machine pipeline
  await runAnalysisPipeline({
    userId, courseId, analysisId, courseData, strategy,
    goalId, planId, stepIds,
    modelInfo, budgetTracker, fallbackTracker,
    emitSSE, resumeState,
  });

  // 8. Run cross-chapter analysis
  await advanceAnalysisStage(planId, stepIds, 4); // "Cross-Chapter Analysis" step
  const crossResults = await runCrossChapterAnalysis(userId, courseData, chapterResults, emitSSE);

  // 9. Post-processing
  await advanceAnalysisStage(planId, stepIds, 5); // "Finalization" step
  await runPostProcessing(analysisId, chapterResults, crossResults, emitSSE);

  // 10. Finalize
  await finalizeAnalysis(analysisId, goalId, planId, stats, emitSSE);
}
```

### State Machine Design

```typescript
// lib/sam/depth-analysis/analysis-state-machine.ts

export class AnalysisStateMachine {
  private machine: AgentStateMachine;

  constructor(options: AnalysisStateMachineOptions) {
    // One PlanStep per chapter: 'analyze-chapter-N'
    // autoSaveInterval: 15000 (checkpoint every 15s)
    // Step executor: 8 phases (same pattern as course creation)
  }

  // Step executor phases:
  // [Phase 0] skipCheck - skip if chapter content hash matches prior analysis
  // [Phase 1] lifecycleSetup - create SubGoal, build AnalysisStepContext
  // [Phase 2] analyze - run 5-stage deep analysis for this chapter
  // [Phase 3] lifecycleComplete - complete SubGoal
  // [Phase 4] memory - persist findings to KnowledgeGraph + SessionContext
  // [Phase 5] decisions - evaluate chapter outcome -> deep-dive/flag/continue
  // [Phase 6] healing - re-analyze flagged sections with targeted prompts
  // [Phase 7] checkpoint - save full state for resume
}
```

### 5-Stage Per-Chapter Analysis

```typescript
// lib/sam/depth-analysis/chapter-analyzer.ts

export async function analyzeSingleChapter(
  userId: string,
  context: AnalysisStepContext,
  callbacks: AnalysisCallbacks
): Promise<ChapterAnalysisResult> {

  // Stage 1: STRUCTURAL ANALYSIS (rule-based, fast)
  // - Empty/thin sections (< 100 chars)
  // - Missing content types (no examples, no exercises)
  // - Section count validation
  // - Format consistency (headings, code blocks, images)
  // Emit: framework_result { framework: 'structural', scores }

  // Stage 2: COGNITIVE DEPTH (AI-powered)
  // - Bloom's Revised Taxonomy classification per section
  // - Webb's DOK mapping
  // - SOLO Taxonomy level detection
  // - Fink's Significant Learning evaluation
  // - Marzano's New Taxonomy alignment
  // Uses: runSAMChatWithPreference({ capability: 'analysis' })
  // Emit: framework_result { framework: 'cognitive', bloomsDistribution, dokLevels, ... }

  // Stage 3: PEDAGOGICAL QUALITY (AI-powered)
  // - Gagne's 9 Events of Instruction check (per section)
  // - Constructive Alignment (objectives <-> content <-> assessment)
  // - ZPD alignment (difficulty appropriate for target audience?)
  // - Scaffolding quality (graduated complexity?)
  // - Cognitive Load Theory (information density per section)
  // Uses: @sam-ai/pedagogy pipeline for validation
  // Emit: framework_result { framework: 'pedagogical', gagneEvents, alignment, zpd }

  // Stage 4: CONTENT FLOW + PREREQUISITES (AI-powered)
  // - Prerequisite concept mapping (SATISFIED/MISSING/ASSUMED)
  // - Knowledge dependency graph for this chapter
  // - Concept introduction order validation
  // - Bridge content quality (transitions between sections)
  // - Time estimation validation (10-20 min per section)
  // Emit: framework_result { framework: 'flow', prerequisites, dependencies }

  // Stage 5: ASSESSMENT + ACCESSIBILITY (AI + rule-based)
  // - Assessment-objective alignment (Bloom's level match)
  // - Question quality analysis (if assessments exist)
  // - WCAG readability (Flesch-Kincaid, sentence complexity)
  // - Inclusive language check
  // - Alt text presence for images
  // Uses: @sam-ai/quality gates for assessment validation
  // Emit: framework_result { framework: 'assessment', alignmentScore, readability }
}
```

### Analysis Modes

| Mode | Stages | Chapters | AI Calls/Chapter | Est. Time |
|------|--------|----------|-------------------|-----------|
| `quick` | 1-2 only | All | 1 | ~30s |
| `standard` | 1-3 | All | 2 | ~2min |
| `deep` | 1-5 | All | 3-4 | ~5min |
| `comprehensive` | 1-5 + healing | All + cross-chapter | 4-6 | ~10min |

### Dependencies
- Phase 1 (tool must be registered)
- `@sam-ai/agentic` (AgentStateMachine)

### Verification
- [ ] SSE stream delivers events in correct order
- [ ] Each chapter produces 5-stage results
- [ ] State machine transitions are correct
- [ ] Cross-chapter analysis produces flow issues
- [ ] Error in one chapter doesn't crash entire analysis

---

## Phase 3: Goal/Plan Tracking + Checkpoint/Resume

### Deliverables

| # | File | Action | Description |
|---|------|--------|-------------|
| 3.1 | `lib/sam/depth-analysis/analysis-controller.ts` | CREATE | Goal/Plan lifecycle controller |
| 3.2 | `lib/sam/depth-analysis/checkpoint-manager.ts` | CREATE | Checkpoint save/resume logic |
| 3.3 | `lib/sam/depth-analysis/analysis-initializer.ts` | CREATE | DB record + Goal + Plan creation |

### Goal/Plan Structure

```
SAMGoal: "Analyze course: {courseTitle}"
  |
  +-> SAMExecutionPlan (5 steps):
  |     Step 0: "Initialize & Plan Strategy" (5%)
  |     Step 1: "Structural Analysis" (10%)
  |     Step 2: "Per-Chapter Deep Analysis" (60%)
  |     Step 3: "Cross-Chapter Analysis" (15%)
  |     Step 4: "Post-Processing & Finalization" (10%)
  |
  +-> SubGoals (one per chapter):
        SubGoal 1: "Analyze Chapter: {chapterTitle}" (type: EVALUATE)
        SubGoal 2: "Analyze Chapter: {chapterTitle}" (type: EVALUATE)
        ...
```

### Controller Functions

```typescript
// lib/sam/depth-analysis/analysis-controller.ts

// All functions are non-blocking (catch errors, log warnings)

export async function initializeAnalysisGoal(
  userId: string, courseTitle: string, courseId: string, analysisId: string
): Promise<{ goalId: string; planId: string; stepIds: string[] }>;

export async function advanceAnalysisStage(
  planId: string, stepIds: string[], stageNumber: number
): Promise<void>;

export async function completeAnalysisStage(
  planId: string, stepIds: string[], stageNumber: number, outputs: string[]
): Promise<void>;

export async function initializeChapterSubGoal(
  goalId: string, chapterNumber: number, chapterTitle: string
): Promise<string>; // returns subGoalId

export async function completeChapterSubGoal(subGoalId: string): Promise<void>;

export async function completeAnalysis(
  goalId: string, planId: string, stats: AnalysisStats
): Promise<void>;

export async function failAnalysis(
  goalId: string, planId: string, errorMessage: string
): Promise<void>;

export async function reactivateAnalysis(
  goalId: string, planId: string
): Promise<void>;

export async function storeDecisionInPlan(
  planId: string, decision: AgenticDecision
): Promise<void>;

export async function storeReflectionInGoal(
  goalId: string, reflection: AnalysisReflection
): Promise<void>;
```

### Checkpoint Schema

```typescript
interface AnalysisCheckpointData {
  courseId: string;
  analysisId: string;
  goalId: string;
  planId: string;
  stepIds: string[];
  mode: AnalysisMode;
  frameworks: string[];

  // Progress
  completedChapters: CompletedChapterAnalysis[];
  currentChapterIndex: number;
  totalChapters: number;

  // Results accumulated so far
  chapterResults: Map<number, ChapterAnalysisResult>; // serialized as entries
  issuesFound: AnalysisIssue[];
  bloomsAggregation: BloomsDistribution;
  frameworkScores: Record<string, number>;

  // State
  contentHashes: Record<string, string>; // chapterId -> hash (for skip detection)
  agenticDecisions: AgenticDecision[];
  healingQueue: string[]; // chapterIds that need re-analysis
  strategyState: AdaptiveStrategyState;

  // Budget
  tokensUsed: number;
  estimatedCost: number;
}
```

### Resume Flow

```
POST /api/sam/depth-analysis/orchestrate { courseId, resumeFromAnalysis: analysisId }
  |
  v
1. Fetch SAMExecutionPlan by analysisId (matching checkpointData.analysisId)
2. Deserialize CheckpointData
3. Detect partial chapter (started but not completed)
4. Reconstruct ResumeState:
   - completedChapters (skip these)
   - currentChapterIndex (start here)
   - chapterResults (accumulated)
   - issuesFound (accumulated)
   - strategyState (restored)
5. Emit 'resume_hydrate' with completed data
6. Continue from currentChapterIndex
```

### Dependencies
- Phase 2 (orchestrator must exist)
- `@sam-ai/agentic` (GoalStatus, PlanStatus, SubGoalType)
- `lib/sam/taxomind-context.ts` (getGoalStores)

### Verification
- [ ] Goal + Plan created in DB at analysis start
- [ ] SubGoals created per chapter
- [ ] Checkpoint saves every 15s
- [ ] Resume after simulated failure works correctly
- [ ] Goal marked COMPLETE on success, PAUSED on failure

---

## Phase 4: Memory Persistence + Cross-Analysis Learning

### Deliverables

| # | File | Action | Description |
|---|------|--------|-------------|
| 4.1 | `lib/sam/depth-analysis/memory-persistence.ts` | CREATE | Fire-and-forget memory writes |
| 4.2 | `lib/sam/depth-analysis/memory-recall.ts` | CREATE | Prior analysis recall for context |

### What Gets Persisted

```typescript
// lib/sam/depth-analysis/memory-persistence.ts

// 1. Quality Patterns -> KnowledgeGraph
//    Entity type: 'quality-pattern'
//    Properties: { pattern, frequency, severity, courseCategory }
//    Example: "Courses in Programming category consistently lack Evaluation-level content"

// 2. Issue Patterns -> KnowledgeGraph
//    Entity type: 'issue-pattern'
//    Properties: { issueType, commonCause, effectiveFix, courseCategory }
//    Relationships: 'commonly_occurs_with' (issue co-occurrence)

// 3. Framework Scores -> SessionContext
//    Per-course score history: { bloomsScore, dokScore, soloScore, gagneScore }
//    Enables: "Your Bloom's distribution improved 15% since last analysis"

// 4. Teaching Style Profile -> KnowledgeGraph
//    Entity type: 'teaching-style'
//    Properties: { preferredBloomsLevels, averageContentDepth, commonGaps }
//    Per-teacher aggregate learned over multiple analyses
```

### What Gets Recalled

```typescript
// lib/sam/depth-analysis/memory-recall.ts

export async function recallAnalysisMemory(
  userId: string, courseId: string
): Promise<AnalysisMemoryContext> {
  const { knowledgeGraph, sessionContext } = getMemoryStores();

  return {
    // Prior analysis for this course (if re-analyzing)
    priorIssues: await getPriorIssues(courseId),
    priorScores: await getPriorScores(courseId),

    // Teacher's quality patterns (from all their courses)
    teachingStyle: await getTeachingStyleProfile(userId),
    commonGaps: await getCommonQualityGaps(userId),

    // Category-specific patterns (e.g., "Programming courses tend to...")
    categoryPatterns: await getCategoryQualityPatterns(courseCategory),
  };
}

// This context is injected into AI prompts:
// "This teacher's courses typically lack Evaluation-level content (pattern from 5 prior analyses).
//  The previous analysis of this course found 3 CRITICAL flow issues in Chapters 4-6.
//  Programming courses in general tend to over-index on Apply (40%) and under-index on Create (5%)."
```

### Dependencies
- Phase 2 (orchestrator to call persistence)
- Phase 3 (checkpoint to include memory state)
- `lib/sam/taxomind-context.ts` (getMemoryStores)

### Verification
- [ ] KnowledgeGraph entities created after each chapter analysis
- [ ] SessionContext updated with score history
- [ ] Second analysis of same course recalls prior findings
- [ ] Teaching style profile aggregates across courses
- [ ] Memory recall included in AI prompts

---

## Phase 5: Quality Gates + Multi-Framework Integration

### Deliverables

| # | File | Action | Description |
|---|------|--------|-------------|
| 5.1 | `lib/sam/depth-analysis/quality-integration.ts` | CREATE | Quality gate pipeline integration |
| 5.2 | `lib/sam/depth-analysis/framework-evaluators.ts` | CREATE | Multi-framework cognitive evaluation |
| 5.3 | `lib/sam/depth-analysis/prompts/` | CREATE | Analysis prompt templates |

### Quality Gate Integration

```typescript
// lib/sam/depth-analysis/quality-integration.ts
// Uses the same SAM quality infrastructure as course creation

import { createQualityGatePipeline } from '@sam-ai/quality';
import { createPedagogicalPipeline } from '@sam-ai/pedagogy';

// Quality gates validate the ANALYSIS RESULTS, not the course content
// (course content quality is what we're measuring; analysis quality is the meta-check)

export async function validateAnalysisQuality(
  chapterResult: ChapterAnalysisResult,
  courseContext: CourseContext
): Promise<QualityValidation> {
  // 1. Completeness: Did we analyze all sections?
  // 2. Evidence: Does every issue have supporting evidence?
  // 3. Consistency: Are scores consistent across frameworks?
  // 4. Actionability: Does every issue have a concrete fix?
  // 5. Calibration: Are scores reasonable for this course type?

  const qualityScore = await runQualityGates(chapterResult);
  const pedagogyScore = await runPedagogicalValidation(chapterResult);

  return {
    overallQuality: 0.6 * qualityScore + 0.4 * pedagogyScore,
    needsReanalysis: qualityScore < 0.6,
    weakAreas: identifyWeakAnalysisAreas(chapterResult),
  };
}
```

### Multi-Framework Evaluator

```typescript
// lib/sam/depth-analysis/framework-evaluators.ts

// Unifies the rule-based @sam-ai/educational evaluators
// WITH AI-powered deep analysis

export async function evaluateMultiFramework(
  userId: string,
  sectionContent: string,
  sectionObjectives: string[],
  frameworks: FrameworkSelection
): Promise<MultiFrameworkResult> {
  // Phase A: Rule-based (fast, deterministic) - from @sam-ai/educational
  const ruleResults = {
    blooms: bloomsClassifier.classify(sectionContent),      // keyword matching
    dok: dokAnalyzer.analyze(sectionContent),                // complexity heuristics
    qm: qmEvaluator.evaluate(sectionContent, objectives),   // QM rubric
    olc: olcEvaluator.evaluate(sectionContent),              // OLC scorecard
  };

  // Phase B: AI-enhanced (deep, nuanced) - from runSAMChatWithPreference
  const aiResults = await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    messages: [{ role: 'user', content: buildMultiFrameworkPrompt(sectionContent, objectives) }],
    systemPrompt: MULTI_FRAMEWORK_SYSTEM_PROMPT,
    maxTokens: 2000,
  });

  // Phase C: Blend rule-based + AI (trust AI more, use rules as validation)
  return blendFrameworkResults(ruleResults, aiResults, {
    weights: { ai: 0.7, rules: 0.3 },
    conflictResolution: 'flag-for-review',
  });
}
```

### Prompt Architecture

```
lib/sam/depth-analysis/prompts/
  system-prompt.ts          -- Expert persona + analysis methodology
  stage-1-structural.ts     -- Structural analysis prompt
  stage-2-cognitive.ts      -- Multi-framework cognitive depth prompt
  stage-3-pedagogical.ts    -- Pedagogical quality prompt
  stage-4-flow.ts           -- Content flow + prerequisites prompt
  stage-5-assessment.ts     -- Assessment alignment + accessibility prompt
  cross-chapter.ts          -- Cross-chapter analysis prompt
  healing.ts                -- Targeted re-analysis prompt
  reflection.ts             -- Self-evaluation prompt
  strategy-planning.ts      -- Analysis strategy planning prompt
```

### Dependencies
- Phase 2 (chapter-analyzer calls evaluators)
- `@sam-ai/educational` (rule-based evaluators)
- `@sam-ai/quality` (quality gate pipeline)
- `@sam-ai/pedagogy` (pedagogical pipeline)

### Verification
- [ ] Rule-based and AI results blend correctly
- [ ] Quality gates catch low-quality analysis results
- [ ] All 5 frameworks produce non-trivial results
- [ ] Prompts produce structured, parseable JSON

---

## Phase 6: Agentic Decision-Making + Healing

### Deliverables

| # | File | Action | Description |
|---|------|--------|-------------|
| 6.1 | `lib/sam/depth-analysis/decision-engine.ts` | CREATE | Agentic decision-making after each chapter |
| 6.2 | `lib/sam/depth-analysis/healing-engine.ts` | CREATE | Re-analysis of flagged sections |
| 6.3 | `lib/sam/depth-analysis/post-processor.ts` | CREATE | Semantic dedup, prioritization, reflection |

### Decision Engine

```typescript
// lib/sam/depth-analysis/decision-engine.ts

export type AnalysisDecision =
  | { action: 'continue' }                                     // Normal progression
  | { action: 'deep-dive'; sections: string[]; reason: string } // Sections need deeper analysis
  | { action: 'reanalyze'; chapters: number[]; reason: string } // Prior chapters need re-check
  | { action: 'flag-healing'; issues: string[]; reason: string } // Queue for healing pass
  | { action: 'adjust-strategy'; changes: StrategyAdjustment }  // Change analysis approach
  | { action: 'skip'; reason: string }                          // Chapter too thin, skip
  | { action: 'halt'; reason: string };                         // Budget exhausted or critical error

export async function evaluateChapterOutcome(
  chapterResult: ChapterAnalysisResult,
  priorResults: ChapterAnalysisResult[],
  budgetState: BudgetState,
  analysisQuality: QualityValidation
): Promise<AnalysisDecision> {
  // Decision tree:
  //
  // 1. If analysisQuality.needsReanalysis AND budget allows
  //    -> { action: 'deep-dive', sections: analysisQuality.weakAreas }
  //
  // 2. If chapterResult reveals prerequisite gaps in prior chapters
  //    -> { action: 'reanalyze', chapters: [...affected] }
  //
  // 3. If CRITICAL issues found in specific sections
  //    -> { action: 'flag-healing', issues: [...criticalIssues] }
  //
  // 4. If Bloom's distribution dramatically different from prior chapters
  //    -> { action: 'adjust-strategy', changes: { focusOnBloomsBalance: true } }
  //
  // 5. If chapter has < 50 chars content
  //    -> { action: 'skip', reason: 'Empty chapter' }
  //
  // 6. If budget exhausted
  //    -> { action: 'halt', reason: 'Token budget exceeded' }
  //
  // 7. Default
  //    -> { action: 'continue' }
}
```

### Healing Engine

```typescript
// lib/sam/depth-analysis/healing-engine.ts

export async function healAnalysis(
  userId: string,
  chapterId: string,
  originalResult: ChapterAnalysisResult,
  healingReason: string,
  emitSSE: SSEEmitter
): Promise<ChapterAnalysisResult> {
  emitSSE('healing_start', { chapterId, reason: healingReason });

  // 1. Build targeted prompt:
  //    "Your previous analysis of this chapter found X issues but missed Y.
  //     Specifically re-analyze sections A, B with focus on: {reason}
  //     Previous findings for context: {originalResult summary}"
  //
  // 2. Run focused AI call (only the weak stages, not all 5)
  //
  // 3. Merge healing results with original (keep higher-confidence findings)
  //
  // 4. Re-score with quality gates

  emitSSE('healing_complete', { chapterId, issuesAdded, issuesResolved, scoreChange });
  return mergedResult;
}
```

### Post-Processor

```typescript
// lib/sam/depth-analysis/post-processor.ts

export async function runPostProcessing(
  analysisId: string,
  chapterResults: ChapterAnalysisResult[],
  crossResults: CrossChapterResult,
  emitSSE: SSEEmitter
): Promise<void> {
  emitSSE('post_processing', { stage: 'deduplication' });

  // 1. SEMANTIC ISSUE DEDUPLICATION
  //    - Generate content fingerprint per issue (location + type + evidence hash)
  //    - Merge issues that are semantically identical across chapters
  //    - Keep the most detailed version, aggregate occurrence count
  //    - Compare with prior analysis issues (if re-analyzing):
  //      - PERSISTED: same fingerprint exists in prior -> keep status from prior
  //      - NEW: fingerprint not in prior -> status: OPEN
  //      - RESOLVED: prior fingerprint not in current -> mark: RESOLVED

  emitSSE('post_processing', { stage: 'prioritization' });

  // 2. ISSUE PRIORITIZATION
  //    - Weight by: severity (4x) + frequency (2x) + impact area (1.5x) + fixability (1x)
  //    - Group by fix theme (e.g., "Add higher-order thinking" groups 5 Bloom's issues)
  //    - Generate fix plan with dependency order

  emitSSE('post_processing', { stage: 'reflection' });

  // 3. ANALYSIS REFLECTION (AI self-evaluation)
  //    - "You analyzed N chapters. Evaluate your analysis quality:
  //       - Were any chapters under-analyzed?
  //       - Are your severity ratings calibrated?
  //       - Did you miss any cross-cutting patterns?
  //       - Confidence level in your overall score?"
  //    - Store in Goal.metadata.analysisReflection

  // 4. SAVE RESULTS
  //    - Atomic transaction: CourseDepthAnalysisV3 + all DepthAnalysisIssue records
  //    - Issue IDs: content fingerprint (deterministic, not nanoid)
}
```

### Dependencies
- Phase 2 (state machine phases 5-6 call decision + healing)
- Phase 3 (decisions stored in plan checkpoint)
- Phase 5 (quality validation drives decisions)

### Verification
- [ ] Decision engine produces correct action for each scenario
- [ ] Healing improves analysis quality measurably
- [ ] Semantic dedup reduces issue count by merging duplicates
- [ ] Re-analysis preserves issue status from prior run
- [ ] Reflection produces actionable self-evaluation

---

## Phase 7: Unified System + Legacy Cleanup

### Deliverables

| # | File | Action | Description |
|---|------|--------|-------------|
| 7.1 | `app/(protected)/teacher/depth-analyzer/page.tsx` | MODIFY | Point to new agentic API |
| 7.2 | `app/(protected)/teacher/depth-analyzer/_components/hooks/use-quality-analysis.ts` | MODIFY | Handle new SSE events |
| 7.3 | `app/(protected)/teacher/courses/[courseId]/_components/depth-analyzer/hooks/useDepthAnalysis.ts` | MODIFY | Point to unified API |
| 7.4 | `app/(protected)/teacher/courses/[courseId]/_components/depth-analyzer/CourseDepthAnalyzer.tsx` | MODIFY | Use unified data shape |
| 7.5 | Deprecation markers | MODIFY | Mark old routes as deprecated |

### Unification Strategy

```
BEFORE (Two disconnected systems):
  System A: /api/teacher/depth-analysis-v2/* -> CourseDepthAnalysisV2
  System B: /api/course-depth-analysis + /api/sam/enhanced-depth-analysis -> CourseBloomsAnalysis

AFTER (Single agentic system):
  Unified: /api/sam/depth-analysis/orchestrate -> CourseDepthAnalysisV3
  Legacy compatibility: Old routes proxy to new system with mode mapping
```

### Migration Path

1. **Phase 7a**: Both old routes remain functional but emit deprecation header
2. **Phase 7b**: Standalone page (`/teacher/depth-analyzer`) points to new agentic API
3. **Phase 7c**: Course-embedded analyzer points to new agentic API (mode: 'quick')
4. **Phase 7d**: Old routes removed after 30-day deprecation period

### Data Migration

```sql
-- Migrate existing V2 analyses to V3 format
-- V3 is a superset of V2, so migration is additive (no data loss)
-- Old tables remain read-only for historical access
```

### Dependencies
- Phases 1-6 (all backend must be complete)

### Verification
- [ ] Standalone page works with new API
- [ ] Course-embedded analyzer works with new API (quick mode)
- [ ] Old analyses still viewable (historical data preserved)
- [ ] No data loss during migration

---

## Phase 8: UI Upgrades + SAM Chat Integration

### Deliverables

| # | File | Action | Description |
|---|------|--------|-------------|
| 8.1 | Standalone page sections | MODIFY | Display new framework results, healing events, decisions |
| 8.2 | SAM chat integration | MODIFY | Depth analyzer available as SAM chat tool |
| 8.3 | Goal/Plan UI | CREATE | Show analysis progress as SAM goal with plan steps |
| 8.4 | Resume UI | CREATE | "Resume interrupted analysis" flow |
| 8.5 | Memory UI | CREATE | "Compared to your last analysis..." indicators |

### SAM Chat Integration

```
User (in blooms-analyzer mode): "Analyze my React course"
  |
  v
SAM: "I'll analyze 'React Fundamentals' for quality.
      Analysis mode: standard (3 stages per chapter)
      Frameworks: Bloom's, Webb's DOK, SOLO, Gagne's, QM
      [Starting analysis...]"
  |
  v
Real-time updates in SAM chat:
  "Analyzing Chapter 1: Introduction to React... (1/8)"
  "  - Bloom's: Remember 40%, Understand 35%, Apply 25% -- needs higher-order thinking"
  "  - Gagne's: Missing 'Elicit Performance' and 'Provide Feedback' events"
  "  - 2 issues found: [CRITICAL] No assessment alignment, [MODERATE] Thin content"
  "Analyzing Chapter 2: Components... (2/8)"
  "  ...continuing analysis"
  |
  v
SAM: "Analysis complete!
      Overall Score: 72/100 (Good - some improvements needed)
      12 issues found: 3 Critical, 4 Moderate, 5 Minor
      Top priority: Add evaluation-level activities to Chapters 3, 5, 7
      [View full results ->]"
```

### Dependencies
- Phases 1-7 (full backend + unified system)

### Verification
- [ ] SAM chat correctly triggers depth analysis tool
- [ ] Real-time updates appear in SAM chat during analysis
- [ ] "View full results" links to standalone page
- [ ] Goal/Plan visible in SAM's goal tracker UI

---

## Database Schema Changes

### New Model: CourseDepthAnalysisV3

```prisma
// prisma/domains/03-learning.prisma (ADD)

model CourseDepthAnalysisV3 {
  id            String   @id @default(cuid())
  courseId      String
  userId        String
  version       Int      @default(1)
  status        DepthAnalysisStatus @default(IN_PROGRESS)

  // Scores
  overallScore      Float    @default(0)
  structuralScore   Float    @default(0)
  cognitiveScore    Float    @default(0)
  pedagogicalScore  Float    @default(0)
  flowScore         Float    @default(0)
  assessmentScore   Float    @default(0)

  // Multi-framework results
  bloomsDistribution   Json?    // { remember, understand, apply, analyze, evaluate, create }
  dokDistribution      Json?    // { recall, skill, strategic, extended }
  soloLevels           Json?    // { prestructural, unistructural, multistructural, relational, extended }
  finkDimensions       Json?    // { foundational, application, integration, human, caring, learning }
  marzanoLevels        Json?    // { retrieval, comprehension, analysis, utilization }

  // Detailed results
  chapterAnalysis      Json?    // Per-chapter breakdown
  crossChapterAnalysis Json?    // Flow, progression, consistency
  contentFlowGraph     Json?    // Knowledge dependency graph
  gagneCompliance      Json?    // Per-section Gagne's 9 Events
  alignmentMatrix      Json?    // Objective <-> Content <-> Assessment mapping

  // Issue tracking
  totalIssues       Int      @default(0)
  criticalIssues    Int      @default(0)
  moderateIssues    Int      @default(0)
  minorIssues       Int      @default(0)
  infoIssues        Int      @default(0)

  // Analysis metadata
  analysisMode      String   @default("standard")  // quick/standard/deep/comprehensive
  analysisMethod    String   @default("agentic")    // agentic/rule-based/legacy
  frameworks        String[] @default(["blooms", "dok", "gagne", "qm"])
  contentHash       String?                         // SHA-256 for dedup
  tokensUsed        Int      @default(0)
  estimatedCost     Float    @default(0)
  analysisTimeMs    Int      @default(0)

  // SAM integration
  goalId            String?                         // SAMGoal ID
  planId            String?                         // SAMExecutionPlan ID
  analysisReflection Json?                          // AI self-evaluation

  // Version chaining
  previousVersionId String?
  previousVersion   CourseDepthAnalysisV3? @relation("AnalysisVersionChain", fields: [previousVersionId], references: [id])
  nextVersions      CourseDepthAnalysisV3[] @relation("AnalysisVersionChain")

  // Relations
  course    Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  issues    DepthAnalysisIssueV3[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([courseId, status])
  @@index([userId, createdAt])
  @@index([contentHash])
}

model DepthAnalysisIssueV3 {
  id           String   @id @default(cuid())
  analysisId   String

  // Semantic identity (deterministic, not random)
  fingerprint  String                              // SHA-256(location + type + evidence)

  // Location
  chapterId       String?
  chapterTitle    String?
  chapterPosition Int?
  sectionId       String?
  sectionTitle    String?
  sectionPosition Int?
  contentType     String?

  // Classification
  type         String                              // STRUCTURE, CONTENT, FLOW, DEPTH, etc.
  severity     String                              // CRITICAL, MODERATE, MINOR, INFO
  framework    String    @default("blooms")         // Which framework detected this

  // Content
  title        String
  description  String
  evidence     Json?                               // { quotes, lineNumbers, context }
  impact       Json?                               // { area, description, affectedStudents }

  // Fix recommendation
  fix          Json?                               // { action, what, why, how, suggestedContent, examples }

  // Status workflow
  status       String    @default("OPEN")           // OPEN, IN_PROGRESS, RESOLVED, SKIPPED, WONT_FIX
  resolvedAt   DateTime?
  resolvedBy   String?
  userNotes    String?

  // Persistence across re-analyses
  firstSeenIn  String?                             // analysisId where this fingerprint first appeared
  occurrenceCount Int @default(1)                  // How many analyses found this same issue

  // Relations
  analysis     CourseDepthAnalysisV3 @relation(fields: [analysisId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([analysisId, severity])
  @@index([fingerprint])
  @@index([analysisId, status])
}
```

### Schema Safety

All new fields follow the golden rule:
- New models: safe (no existing data)
- `String?` for optional fields
- `@default(0)` / `@default("")` / `@default([])` for required fields
- No required fields without defaults on existing models

---

## File Map

### New Files (Create)

```
lib/sam/depth-analysis/
  index.ts                          -- Public exports
  types.ts                          -- All type definitions
  orchestrator.ts                   -- Core coordinator
  analysis-initializer.ts           -- DB + Goal + Plan creation
  analysis-controller.ts            -- Goal/Plan lifecycle (non-blocking)
  pipeline-runner.ts                -- State machine launcher
  analysis-state-machine.ts         -- AgentStateMachine wrapper
  step-executor-phases.ts           -- 8-phase step executor
  chapter-analyzer.ts               -- 5-stage per-chapter analysis
  cross-chapter-analyzer.ts         -- Cross-chapter analysis
  decision-engine.ts                -- Agentic decision-making
  healing-engine.ts                 -- Re-analysis of flagged sections
  post-processor.ts                 -- Dedup, prioritize, reflect
  checkpoint-manager.ts             -- Save/resume checkpoints
  memory-persistence.ts             -- Fire-and-forget KnowledgeGraph + SessionContext
  memory-recall.ts                  -- Prior analysis context recall
  quality-integration.ts            -- Quality gate pipeline
  framework-evaluators.ts           -- Multi-framework cognitive evaluation
  prompts/
    system-prompt.ts                -- Expert persona
    stage-1-structural.ts           -- Structural analysis
    stage-2-cognitive.ts            -- Multi-framework cognitive
    stage-3-pedagogical.ts          -- Pedagogical quality
    stage-4-flow.ts                 -- Content flow + prerequisites
    stage-5-assessment.ts           -- Assessment + accessibility
    cross-chapter.ts                -- Cross-chapter analysis
    healing.ts                      -- Targeted re-analysis
    reflection.ts                   -- Self-evaluation
    strategy-planning.ts            -- Analysis strategy planning

lib/sam/tools/
  depth-analyzer.ts                 -- SAM tool definition

lib/sam/skills/
  depth-analyzer.skill.md           -- Skill descriptor

app/api/sam/depth-analysis/
  orchestrate/route.ts              -- SSE gateway
  [analysisId]/route.ts             -- GET result, DELETE
  [analysisId]/issues/[issueId]/route.ts -- PATCH issue status
  history/route.ts                  -- GET paginated history
```

### Modified Files

```
lib/sam/agentic-tooling.ts          -- Register depth-analyzer tool
lib/sam/tool-planner.ts             -- Add auto-invoke + mode affinity
prisma/domains/03-learning.prisma   -- Add V3 models

app/(protected)/teacher/depth-analyzer/
  page.tsx                          -- Point to new API
  _components/hooks/use-quality-analysis.ts   -- Handle new SSE events
  _components/CourseQualityAnalyzer.tsx        -- Display new data

app/(protected)/teacher/courses/[courseId]/
  _components/depth-analyzer/hooks/useDepthAnalysis.ts     -- Point to unified API
  _components/depth-analyzer/CourseDepthAnalyzer.tsx        -- Use unified data
```

### Deprecated (Keep Read-Only, Remove After 30 Days)

```
app/api/teacher/depth-analysis-v2/          -- V2 routes (deprecated)
app/api/course-depth-analysis/              -- System B route (deprecated)
app/api/sam/enhanced-depth-analysis/        -- System B enhanced route (deprecated)
lib/sam/depth-analysis-v2/                  -- V2 analysis engine (deprecated)
```

---

## Migration Strategy

### Phase Rollout Order

```
Phase 1 (Foundation)          -- 1-2 days
  -> Tool + Registration + Skill descriptor
  -> Can test via SAM chat immediately

Phase 2 (Orchestrator)        -- 3-5 days
  -> Core pipeline + state machine + chapter analyzer
  -> New API route functional end-to-end

Phase 3 (Goal/Plan)           -- 2-3 days
  -> Goal tracking + checkpoint + resume
  -> Analysis shows in SAM goal tracker

Phase 4 (Memory)              -- 2-3 days
  -> Persistence + recall
  -> Cross-analysis learning active

Phase 5 (Quality Gates)       -- 2-3 days
  -> Multi-framework + quality validation
  -> Analysis results are higher quality

Phase 6 (Decisions + Healing) -- 2-3 days
  -> Agentic decisions + healing loop + post-processor
  -> System makes intelligent analysis choices

Phase 7 (Unification)         -- 2-3 days
  -> Migrate UI to new API
  -> Deprecate old routes

Phase 8 (UI + Polish)         -- 3-5 days
  -> SAM chat integration
  -> Goal/Plan UI
  -> Resume UI
  -> Memory indicators
```

### Total Estimated Effort: 18-27 days

### Rollback Strategy

Each phase is independently deployable:
- Phase 1-4: New code only, no existing code modified
- Phase 5-6: New code only, enhances Phase 2
- Phase 7: UI changes with feature flag (`USE_AGENTIC_DEPTH_ANALYSIS`)
- Phase 8: UI additions, non-breaking

Feature flag controls migration:
```typescript
const USE_AGENTIC = process.env.FEATURE_AGENTIC_DEPTH_ANALYSIS === 'true';
// When false: old V2 routes used
// When true: new agentic routes used
```

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI costs increase (more calls per analysis) | Medium | High | Budget tracker with hard limits per mode; 'quick' mode for casual use |
| Longer analysis time (5-stage vs 3-stage) | Medium | High | Mode system: quick (30s) for embedded, deep (5min) for standalone |
| Memory pollution (bad patterns persisted) | Low | Medium | Confidence threshold for memory writes; admin purge capability |
| State machine complexity | Medium | Medium | Comprehensive checkpoint tests; manual resume testing |
| Schema migration on Railway | Low | Low | All new tables, no existing table modifications |
| SAM package version conflicts | Medium | Low | Pin versions; test with `npm run typecheck:parallel` |

---

## Success Criteria

1. **Feature Parity**: Everything V2 does, V3 does better
2. **5-Layer Pattern**: All 5 SAM layers implemented and verified
3. **Agentic**: Analysis makes intelligent decisions (heal, deep-dive, skip)
4. **Resumable**: Any failure can be resumed from checkpoint
5. **Memory**: Second analysis recalls and builds on first
6. **Unified**: One system serves both standalone page and course-embedded
7. **Performance**: Quick mode < 30s, Standard < 2min, Deep < 5min
8. **Quality**: Analysis quality validated by SAM quality gates
9. **SAM Chat**: Full tool integration in blooms-analyzer mode
10. **Issue Identity**: Issues persist across re-analyses with semantic fingerprints

---

*Plan Version: 1.0*
*Created: 2026-03-04*
*Architecture Reference: AI Course Creation Pipeline*
*Pattern Reference: SAM_SKILL_TOOL_PATTERN.md*
