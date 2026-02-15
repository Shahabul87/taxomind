# AI Course Creation Pipeline — Deep Analysis Report

**Date**: 2026-02-14
**Scope**: Full pipeline analysis — every file in `lib/sam/course-creation/`, all 7 API routes, frontend entry point, and SAM integration assessment
**Methodology**: Line-by-line source code reading, no inference or fabrication

---

## Executive Summary

The Taxomind AI course creation pipeline is a **sophisticated 3-stage generation system** with significant agentic characteristics layered on top. It is NOT a traditional agentic loop (observe→think→act→observe) but rather a **deterministic pipeline with agentic augmentation** — quality feedback loops, memory systems, adaptive strategy, self-critique, and autonomous decision-making operate as satellite modules around a fixed execution path.

**Agentic Score: 6.5/10** — The pipeline uses SAM infrastructure properly for storage (Goals, Plans, SubGoals, Memory) and quality validation (QualityGatePipeline, PedagogicalPipeline), but does NOT use SAM's core agentic loop, tool execution framework, or conversational reasoning. The AI never decides its own next action — the orchestrator does.

---

## Architecture Overview

```
Frontend (page.tsx)
    ↓ SSE via useSequentialCreation hook
API Route (orchestrate/route.ts)
    ↓ calls
Orchestrator (orchestrator.ts) — THE BRAIN
    ↓ depth-first loop: for each chapter →
    │   Stage 1 → Stage 2 (all sections) → Stage 3 (all details) → checkpoint
    │
    ├── prompts.ts ← builds system+user prompts per stage
    ├── chapter-templates.ts ← Chapter DNA structure (Beginner/Intermediate/Advanced)
    ├── category-prompts/ ← 15 domain-specific enhancers
    ├── streaming-accumulator.ts ← SSE streaming + thinking extraction
    ├── response-parsers.ts ← JSON parsing + fallback
    ├── helpers.ts ← scoring, normalization, fallbacks
    │
    ├── quality-integration.ts ← SAM QualityGatePipeline + PedagogicalPipeline
    ├── quality-feedback.ts ← extracts actionable feedback for retries
    ├── self-critique.ts ← analyzes AI reasoning quality
    ├── adaptive-strategy.ts ← adjusts temperature/retries dynamically
    │
    ├── memory-recall.ts ← reads KnowledgeGraph + SessionContext
    ├── memory-persistence.ts ← writes concepts + quality to memory stores
    ├── course-planner.ts ← pre-generation AI blueprint
    ├── agentic-decisions.ts ← between-chapter decision engine
    ├── course-reflector.ts ← post-generation structural analysis
    │
    ├── checkpoint-manager.ts ← save/restore/resume
    ├── chapter-regenerator.ts ← single chapter re-generation
    ├── cost-estimator.ts ← token/cost/time estimation
    ├── experiments.ts ← A/B testing framework
    │
    └── course-creation-controller.ts ← SAM Goal/Plan/SubGoal tracking
```

---

## File-by-File Analysis

### 1. `orchestrator.ts` (~1473 lines) — **THE CORE**

**What it does**: Main `orchestrateCourseCreation()` function. Executes the depth-first pipeline: for each chapter, runs Stage 1 (chapter) → Stage 2 (all sections) → Stage 3 (all details), then checkpoints.

**SAM Integration**:
- Uses `runSAMChatWithPreference()` for all AI calls (proper unified AI provider)
- Creates SAM Goals via `initializeCourseCreationGoal()`
- Creates SubGoals per chapter via `initializeChapterSubGoal()`
- Advances plan steps via `advanceCourseStage()` / `completeStageStep()`
- Stores blueprint, decisions, reflection in Goal/Plan metadata
- Persists concepts to KnowledgeGraph, quality to SessionContext
- Validates with SAM QualityGatePipeline + PedagogicalPipeline
- Runs post-creation enrichment via `@sam-ai/educational` engines
- Records AI usage via `recordAIUsage()`

**Agentic Features**:
- Quality feedback retry loop (max 1 retry per stage, with feedback injection)
- Memory recall before generation (prior course knowledge)
- Blueprint planning (pre-generation AI call)
- Between-chapter agentic decisions (continue/adjust/flag)
- Self-critique analysis of AI reasoning
- Adaptive strategy adjustment (temperature, retries, tokens)
- Course reflection post-completion

**What's NOT agentic**:
- Fixed execution order — AI never chooses what to do next
- No tool selection — orchestrator decides which stage runs
- No branching — always runs Stage 1→2→3 in order
- No autonomous replanning — blueprint is advisory only
- Retry logic is simple (max 1 retry, not iterative refinement)

**Agentic Score: 7/10** — Heavily augmented pipeline with genuine feedback loops, but the AI is a content generator, not a decision-maker.

---

### 2. `prompts.ts` (~1124 lines) — **AI THINKING GUIDANCE**

**What it does**: Builds `{systemPrompt, userPrompt}` pairs for all 3 stages. Contains the `COURSE_DESIGN_EXPERTISE` constant (~110 lines) that defines SAM's pedagogical identity.

**How AI thinking is guided**:

1. **System Prompt** = `COURSE_DESIGN_EXPERTISE` + stage-specific design principles + category domain expertise + template DNA block + memory recall block + blueprint context
2. **User Prompt** = specific instructions for the current stage + course context + previous chapters/sections + concept tracker state + quality feedback (on retry) + adaptive guidance

**Key guidance mechanisms**:
- **ARROW Framework**: 11-step pedagogical approach (Application First → Meta-Cognition) injected into every system prompt
- **Bloom's Taxonomy Verbs**: Each chapter gets a content-aware Bloom's level; prompts include level-appropriate verb lists
- **Explicit Thinking Steps**: Each stage prompt includes "THINKING PROCESS" with numbered steps the AI must follow
- **Quality Gates in Prompt**: Each stage prompt includes "QUALITY GATES" the AI must self-check
- **Position-Aware Narrative**: Chapters get different guidance based on position (opening chapter, foundation, development, mastery, capstone)
- **Concept Flow Tracking**: Prompts include `conceptsIntroducedSoFar` and `conceptsReferencedSoFar` arrays from the ConceptTracker
- **Cross-Chapter Context**: Each chapter prompt includes summaries of all previous chapters

**SAM Integration**: Uses `CHAPTER_THINKING_FRAMEWORK`, `SECTION_THINKING_FRAMEWORK`, `LEARNING_OBJECTIVES_FRAMEWORK` from `@/lib/sam/prompts/content-generation-criteria` — shared SAM prompt building blocks.

**Agentic Score: 5/10** — Excellent prompt engineering with structured thinking guidance, but prompts are template-based, not dynamically composed by an agent.

---

### 3. `chapter-templates.ts` (~905 lines) — **CHAPTER DNA SYSTEM**

**What it does**: Defines difficulty-specific section structures (Beginner=8, Intermediate=7, Advanced=8 sections). Each section has a fixed role (HOOK, INTUITION, WALKTHROUGH, FORMALIZATION, PLAYGROUND, PITFALLS, SUMMARY, CHECKPOINT for Beginner, etc.).

**Key innovation**: The AI generates content WITHIN a fixed pedagogical structure — it doesn't choose the structure. This is a significant architectural decision: structure is deterministic, content is generative.

**Features**:
- 5 Unbreakable Teaching Laws shared across all templates
- 11 Universal Consistency Rules
- Per-section: role, purpose, contentType, wordCountRange, formatRules, htmlStructure, tone, exerciseGuidance, consistencyRules
- Chapter checklists for self-verification
- `composeTemplatePromptBlocks()` generates injection blocks for Stage 1/2/3 prompts

**SAM Integration**: None directly — pure pedagogical domain knowledge. But it integrates WITH the SAM system through prompt injection.

**Agentic Score: 3/10** — Deterministic structure, no agent involvement. But the quality of the rules is very high.

---

### 4. `category-prompts/` (registry.ts, types.ts, 15+ domain files)

**What it does**: 15 domain-specific prompt enhancers (programming, mathematics, data-science-ml, engineering, finance-accounting, business-management, design-creative, health-science, language-communication, education, personal-development, music, lifestyle, arts-humanities, general).

Each enhancer provides:
- `domainExpertise` — appended to system prompt
- `teachingMethodology` — domain teaching approach
- `bloomsInDomain` — how each Bloom's level translates in this domain
- `contentTypeGuidance` — domain-specific content type preferences
- `qualityCriteria` — domain quality standards
- `chapterSequencingAdvice` — domain progression patterns
- `activityExamples` — domain-specific activities

**SAM Integration**: None — pure domain knowledge. Composed via `composeCategoryPrompt()` and injected into prompts.

**Agentic Score: 2/10** — Static domain knowledge registry with fuzzy matching. No learning or adaptation.

---

### 5. `course-creation-controller.ts` (~514 lines) — **SAM GOAL/PLAN BRIDGE**

**What it does**: Creates and manages SAM Goals, Plans, and SubGoals for course creation. This is the primary SAM infrastructure integration point.

**SAM Integration** (PROPER):
- `getGoalStores()` from TaxomindContext — correct pattern
- Creates `SAMGoal` with `GoalStatus.ACTIVE`
- Creates `SAMExecutionPlan` with 3 steps (one per stage)
- Creates `SAMSubGoal` per chapter with `SubGoalType.CREATE`
- Stores blueprint in Goal context
- Stores decisions in Plan checkpointData
- Stores reflection in Goal context
- `failCourseCreation()` preserves checkpoint data when marking plan as FAILED
- All operations non-blocking (errors logged, not thrown)

**Agentic Score: 8/10** — Proper SAM integration following documented patterns. Goal/Plan/SubGoal lifecycle is well-managed. The only gap is that these are tracking mechanisms, not decision-driving — the orchestrator runs the same pipeline regardless of Goal state.

---

### 6. `quality-integration.ts` (~467 lines) — **SAM QUALITY GATES**

**What it does**: Wraps `@sam-ai/quality` QualityGatePipeline and `@sam-ai/pedagogy` PedagogicalPipeline for validation.

**SAM Integration** (PROPER):
- Uses `createQualityGatePipeline()` from `@sam-ai/quality`
- Uses `createPedagogicalPipeline()` from `@sam-ai/pedagogy`
- `validateChapterWithSAM()`, `validateSectionWithSAM()`, `validateDetailsWithSAM()`
- `blendScores()`: 60% custom + 40% SAM (within SAM: 60% quality, 40% pedagogy)
- 8-second timeout with graceful fallback

**Agentic Score: 7/10** — Genuine use of SAM quality packages. The blending approach (custom + SAM) is pragmatic. But validation is passive — it scores content, doesn't drive regeneration decisions autonomously.

---

### 7. `quality-feedback.ts` (~168 lines) — **FEEDBACK LOOP**

**What it does**: Extracts actionable feedback from SAM validation results and builds prompt injection blocks for retry attempts.

**How it works**: After a failed quality check, `extractQualityFeedback()` identifies critical issues, pedagogy issues, weak dimensions, failed gates, and reasoning weaknesses. `buildQualityFeedbackBlock()` formats these into a structured text block injected into the retry prompt.

**Agentic Score: 7/10** — This IS genuinely agentic behavior: the system identifies specific failures and injects targeted guidance for the retry. It's a closed feedback loop.

---

### 8. `self-critique.ts` (~355 lines) — **REASONING ANALYSIS**

**What it does**: Pure text analysis (NO AI calls) of the AI's "thinking" field output. Checks for structured thinking step coverage against expected steps per stage, ARROW framework keyword coverage, and concept tracker references.

**Agentic Score: 5/10** — Self-monitoring without AI involvement. Deterministic pattern matching against expected thinking steps. The `shouldRetry` recommendation is used by the orchestrator.

---

### 9. `adaptive-strategy.ts` (~329 lines) — **DYNAMIC PARAMETER ADJUSTMENT**

**What it does**: `AdaptiveStrategyMonitor` class tracks quality performance and adjusts generation parameters using bounded rules.

**5 adaptation rules**:
1. Temperature (0.4-0.9): lower on poor quality, raise on good
2. Max retries (1-3): increase if quality is low
3. Retry threshold (50-70): raise bar for high performers, lower for struggling
4. Token limits: stage-specific adjustments
5. Self-critique enable/disable: based on critique confidence

**Agentic Score: 6/10** — Genuine adaptive behavior, but rule-based (not learned). Parameters are bounded and adjustments are conservative.

---

### 10. `memory-recall.ts` (~353 lines) — **MEMORY READING**

**What it does**: Reads from SAM's KnowledgeGraph (prior concepts by category) and SessionContext (quality patterns from previous course creations). Returns a `RecalledMemory` used to augment prompts.

**SAM Integration** (PROPER):
- `getMemoryStores()` from TaxomindContext
- Queries `knowledgeGraph.searchByEntity()` for prior concepts
- Queries `sessionContext.getBySessionId()` for quality patterns
- 3-second timeout per query with safe fallback

**Agentic Score: 8/10** — This is genuine agentic memory: the system learns from past course creations and applies that knowledge to new ones. However, the recall is keyword-based (category matching), not semantic.

---

### 11. `memory-persistence.ts` (~217 lines) — **MEMORY WRITING**

**What it does**: Fire-and-forget writes to SAM's KnowledgeGraph (concepts as entities, prerequisite edges) and SessionContext (quality scores).

**SAM Integration** (PROPER):
- `getMemoryStores()` from TaxomindContext
- `knowledgeGraph.addEntity()` for concept persistence
- `knowledgeGraph.addEdge()` for prerequisite relationships
- `sessionContext.saveContext()` for quality patterns

**Agentic Score: 7/10** — Proper memory writing. Combined with memory-recall, this creates a genuine learning loop across course creations.

---

### 12. `course-planner.ts` (~343 lines) — **PRE-GENERATION BLUEPRINT**

**What it does**: Single AI call before the pipeline starts. Creates a `CourseBlueprintPlan` with chapter sequence, concept dependencies, Bloom's strategy, and risk areas.

**SAM Integration**: Uses `runSAMChatWithPreference()` for the AI call. Blueprint is stored in SAM Goal context via `storeBlueprintInGoal()`.

**Agentic Score: 6/10** — Pre-planning is an agentic behavior (think before act). But the blueprint is advisory — the pipeline doesn't restructure itself based on the blueprint. It's used for prompt injection and post-hoc comparison.

---

### 13. `agentic-decisions.ts` (~354 lines) — **BETWEEN-CHAPTER DECISION ENGINE**

**What it does**: Pure code analysis (NO AI calls) between chapters. `evaluateChapterOutcome()` returns an `AgenticDecision` with action: `'continue'`, `'adjust_strategy'`, or `'flag_for_review'`.

**Decision factors**: Quality score vs threshold, quality trend (improving/stable/declining), concept coverage against blueprint, consecutive low scores.

**What happens with decisions**:
- `'continue'` → no intervention
- `'adjust_strategy'` → builds adaptive guidance block for next chapter's prompt
- `'flag_for_review'` → logs warning, adds stronger guidance, but does NOT stop or re-plan

**Agentic Score: 6/10** — Genuine autonomous decision-making, but the decision space is narrow (3 options) and consequences are limited to prompt adjustments. A truly agentic system would re-plan, skip chapters, or request human input.

---

### 14. `course-reflector.ts` (~450 lines) — **POST-GENERATION ANALYSIS**

**What it does**: Pure structural analysis (NO AI calls) after all chapters are generated. Analyzes Bloom's progression, concept coverage, flagged chapters (quality outliers), and produces a coherence score.

**SAM Integration**: Reflection stored in SAM Goal context via `storeReflectionInGoal()`. Emitted as SSE event.

**Agentic Score: 5/10** — Post-hoc analysis is valuable but passive. A truly agentic system would use reflection to trigger autonomous regeneration of flagged chapters.

---

### 15. `checkpoint-manager.ts` (~383 lines) — **RESUME SYSTEM**

**What it does**: Serializes complete pipeline state to `SAMExecutionPlan.checkpointData`. `resumeCourseCreation()` reconstructs `ResumeState` from checkpoint + database, handles partial chapters with orphan cleanup, then calls `orchestrateCourseCreation()` with resumeState.

**SAM Integration** (PROPER): Uses `planStore` from TaxomindContext to persist checkpoint data.

**Agentic Score: 5/10** — Fault tolerance is important for agentic systems. The checkpoint granularity is good (chapter-level with mid-chapter recovery).

---

### 16. `chapter-regenerator.ts` (~526 lines) — **SINGLE CHAPTER REGENERATION**

**What it does**: Full Stage 1→2→3 regeneration for a single chapter, triggered by user from the UI (after seeing flagged chapters).

**SAM Integration**: Uses `runSAMChatWithPreference()`, quality integration, and proper database operations.

**Agentic Score: 4/10** — Human-triggered, not autonomous. A truly agentic system would auto-regenerate flagged chapters based on reflection results.

---

### 17. `streaming-accumulator.ts` (~228 lines) — **STREAMING + THINKING**

**What it does**: `ThinkingExtractor` class — state machine (scanning → in_thinking → done) that extracts the "thinking" field from streaming JSON. Uses `runSAMChatStream()` from unified AI provider.

**Agentic Score: 3/10** — Infrastructure, not agentic behavior. But thinking extraction enables transparency.

---

### 18. `response-parsers.ts` (~180 lines) — **RESPONSE PARSING**

**What it does**: Parses AI responses for all 3 stages with validation and fallback. Each parser returns `{data, thinking, qualityScore}`.

**Agentic Score: 2/10** — Pure parsing. Robust fallback generation prevents pipeline crashes.

---

### 19. `helpers.ts` (~797 lines) — **UTILITY FUNCTIONS**

**What it does**: Pure helper functions — parsing, normalization, quality scoring (5-dimensional: completeness, specificity, bloomsAlignment, uniqueness, depth), fallback generators, coverage validation, Jaccard similarity.

**Notable**: The custom quality scoring is sophisticated — weighted multi-dimensional scores with template compliance checks, Bloom's verb validation via `validateObjective()`, and inter-chapter uniqueness via Jaccard similarity.

**Agentic Score: 2/10** — Pure utilities. But the quality scoring functions are the foundation of the feedback loop.

---

### 20. `cost-estimator.ts` (~234 lines) — **TOKEN/COST ESTIMATION**

**What it does**: Pure estimation logic (no DB access). Calculates expected tokens, cost, and time based on course structure. Accounts for context growth per chapter, difficulty multipliers, template-specific section token multipliers, and retry overhead (30%).

**Agentic Score: 1/10** — Pure calculation, no agentic behavior.

---

### 21. `experiments.ts` (~171 lines) — **A/B TESTING FRAMEWORK**

**What it does**: Deterministic hash-based user assignment for comparing pedagogical approaches (ARROW vs Traditional). Outcomes stored in `SAMExecutionPlan.schedule` JSON field.

**Currently**: All experiments are `active: false` — no active experiments running.

**Agentic Score: 3/10** — Infrastructure for agentic learning, but not active. When active, it would enable the system to learn which approach produces better quality.

---

### 22. `types.ts` (~628 lines) — **TYPE DEFINITIONS**

**What it does**: All TypeScript interfaces for the pipeline. Includes Bloom's Taxonomy reference data, content types, quality score structure, creation state, SSE events, checkpoint data, concept tracker, blueprint plan, agentic decision types, course reflection types.

**Agentic Score: 1/10** — Type definitions, but they reveal the system's design decisions.

---

### 23. `index.ts` (~54 lines) — **BARREL EXPORTS**

**What it does**: Re-exports everything from the module. Well-organized by category.

**Agentic Score: 0/10** — Module organization.

---

### 24. `post-creation-enrichment.ts` (~288 lines) — **BACKGROUND ENRICHMENT**

**What it does**: Fire-and-forget after course completion. Uses `@sam-ai/educational` engines: `createKnowledgeGraphEngine()` and `createBloomsAnalysisEngine()`. Also uses `getUserScopedSAMConfig()` from adapters.

**SAM Integration** (PROPER):
- Uses `createKnowledgeGraphEngine()` from `@sam-ai/educational`
- Uses `createBloomsAnalysisEngine()` from `@sam-ai/educational`
- Uses `getUserScopedSAMConfig()` for proper adapter configuration
- Runs as background enrichment — doesn't block course creation

**Agentic Score: 6/10** — Proper use of SAM educational engines for post-processing. Autonomous background operation.

---

### 25. `course-creator.skill.md` (~43 lines) — **SKILL DESCRIPTOR**

**What it does**: SAM skill descriptor defining the course creation capability — triggers, required information, output format.

**SAM Integration**: Follows the SAM Skill/Tool pattern documented in `SAM_SKILL_TOOL_PATTERN.md`.

**Agentic Score: 4/10** — Proper skill definition, but the pipeline doesn't use SAM's tool execution framework to invoke itself.

---

## API Routes Analysis

### 26. `orchestrate/route.ts` (~175 lines) — **MAIN SSE ENDPOINT**

**What it does**: POST endpoint that streams SSE events. Validates with Zod, gates on subscription, creates ReadableStream, calls `orchestrateCourseCreation()` or `resumeCourseCreation()`.

**Security**: Auth check, subscription gate, Zod validation, abort signal support.

**Agentic Score: 2/10** — Thin API layer. Proper security practices.

---

### 27. `stage-1/route.ts` (~336 lines) — **STANDALONE STAGE 1**

**What it does**: Generates ONE chapter independently. Uses `createUserScopedAdapter()` directly (not the unified provider pattern). Has its own parsing and quality scoring logic — duplicated from helpers.ts.

**Issue**: This route duplicates logic from `helpers.ts` and `response-parsers.ts`. It appears to be an older implementation that predates the orchestrator. The orchestrator uses its own parsing pipeline via `response-parsers.ts`.

**SAM Integration**: Uses `createUserScopedAdapter()` — valid but inconsistent with the orchestrator which uses `runSAMChatWithPreference()`.

**Agentic Score: 2/10** — Standalone endpoint, no agentic features. Code duplication concern.

---

### 28. `stage-2/route.ts` (~398 lines) — **STANDALONE STAGE 2**

**Same pattern as stage-1**: Independent endpoint with duplicated parsing/scoring logic. Predates the orchestrator.

**Agentic Score: 2/10**

---

### 29. `stage-3/route.ts` (~359 lines) — **STANDALONE STAGE 3**

**Same pattern**: Independent endpoint with duplicated logic. Predates the orchestrator.

**Agentic Score: 2/10**

---

### 30. `estimate-cost/route.ts` (~160 lines) — **COST ESTIMATION**

**What it does**: POST endpoint that resolves user's preferred AI provider, gets pricing, and calls `estimateCourseCost()`. Proper auth, Zod validation.

**Agentic Score: 1/10** — Pure estimation.

---

### 31. `progress/route.ts` (~128 lines) — **RESUME CHECK**

**What it does**: GET endpoint that checks for active/resumable course creation sessions. Queries `SAMExecutionPlan` for checkpoint data, verifies course exists and is unpublished.

**SAM Integration**: Reads from SAMExecutionPlan — proper pattern.

**Agentic Score: 3/10** — Enables cross-device resume.

---

### 32. `regenerate-chapter/route.ts` (~111 lines) — **CHAPTER REGENERATION**

**What it does**: POST endpoint that calls `regenerateChapter()`. Zod validation, auth, subscription gate.

**Agentic Score: 2/10** — Human-triggered regeneration.

---

## Frontend Analysis

### 33. `page.tsx` (~621 lines) — **AI CREATOR PAGE**

**What it does**: 4-step wizard (Course Basics → Target Audience → Learning Design → Review & Create). Uses `useSamWizard()` for form state and `useSequentialCreation()` hook for the generation pipeline.

**Key features**:
- Resume banner for incomplete courses
- Keyboard shortcuts (Ctrl+Enter to proceed/generate)
- SAM Memory integration (`samMemory.saveWizardData()`, `samMemory.startSession()`)
- Sequential creation modal with real-time progress
- Chapter regeneration UI
- Mobile-responsive with MobileStepNav

**SAM Integration**: Uses SAM memory system for wizard data persistence. The `useSequentialCreation()` hook calls the orchestrate API and handles SSE events.

**Agentic Score: 3/10** — Human-driven wizard. SAM memory integration is proper but surface-level.

---

## SAM Package Usage Summary

| SAM Package | Used? | How |
|-------------|-------|-----|
| `@sam-ai/agentic` | Yes | GoalStatus, PlanStatus, SubGoalType types + TaxomindContext stores |
| `@sam-ai/core` | No | Orchestrator, StateMachine NOT used — custom pipeline instead |
| `@sam-ai/educational` | Yes | KnowledgeGraphEngine + BloomsAnalysisEngine (post-creation) |
| `@sam-ai/memory` | No | Not directly — uses stores through TaxomindContext |
| `@sam-ai/pedagogy` | Yes | PedagogicalPipeline for quality validation |
| `@sam-ai/quality` | Yes | QualityGatePipeline for quality validation |
| `@sam-ai/react` | No | Hooks not used in AI creator page |
| `@sam-ai/api` | No | Route handlers not used — custom routes instead |
| `@sam-ai/adapter-prisma` | Indirect | Through TaxomindContext store creation |
| `@sam-ai/adapter-taxomind` | Indirect | Through TaxomindContext |

---

## What's Truly Agentic (Working Well)

1. **Quality Feedback Loop**: Failed quality → extract issues → inject feedback into retry prompt → regenerate. This is a genuine closed-loop improvement cycle.

2. **Memory System**: Read prior course concepts (KnowledgeGraph) and quality patterns (SessionContext) → augment current generation prompts → write new concepts and quality back. Cross-creation learning.

3. **Adaptive Strategy**: Quality trends drive parameter adjustments (temperature, retries, thresholds). The system genuinely adapts its generation strategy based on observed performance.

4. **Between-Chapter Decisions**: Autonomous evaluation of chapter outcomes with three possible actions. The guidance injection for struggling generations is effective.

5. **Goal/Plan/SubGoal Tracking**: Proper SAM lifecycle management — create, advance, complete, fail, resume. SubGoal decomposition per chapter provides granular tracking.

6. **Checkpoint/Resume**: Robust failure recovery with mid-generation resume capability. Essential for long-running generation pipelines.

---

## What's Missing for a Truly Agentic System

### Critical Gaps

1. **No Agentic Loop**: The pipeline follows a fixed execution order (Stage 1→2→3 per chapter). A truly agentic system would use SAM's `@sam-ai/core` Orchestrator or StateMachine to dynamically choose what to do next based on observations.

2. **No Tool Framework**: SAM has a tool execution framework (`agentic-tooling.ts`). The course creation pipeline does not register as a tool or use the tool planner. It's invoked directly via API routes, bypassing SAM's reasoning about WHEN to create a course.

3. **No Autonomous Regeneration**: The reflection identifies flagged chapters, but regeneration requires human action (clicking a button). An agentic system would autonomously regenerate chapters that score below threshold.

4. **No Dynamic Re-planning**: The blueprint is advisory only. If the first 3 chapters reveal that the original plan is flawed, the system doesn't restructure. It continues with the same plan, adjusting only prompt guidance.

5. **No Conversational Reasoning**: The AI never "thinks aloud" about structural decisions. Each AI call is a single request→response. There's no multi-turn conversation where SAM reasons about course structure.

6. **No Inter-Chapter Negotiation**: When an agentic decision says "adjust_strategy", the adjustment is a text block in the prompt. There's no iterative negotiation between the planner and the generator.

### Moderate Gaps

7. **Self-Critique is Pattern Matching**: The self-critique module checks for keyword presence in the AI's thinking output. It doesn't analyze reasoning quality — just whether expected terms appear.

8. **Memory Recall is Keyword-Based**: The memory system queries by category string matching, not semantic similarity. A course on "Machine Learning" won't benefit from memories stored under "Artificial Intelligence".

9. **A/B Testing Inactive**: The experiment framework is built but all experiments are `active: false`. No active learning about which pedagogical approach works better.

10. **No Multi-Agent Collaboration**: A single AI generates everything. An agentic system might have specialized agents for different stages (outline architect, content writer, quality reviewer) that negotiate and iterate.

11. **Quality Scoring is Static**: The 5-dimensional scoring (completeness, specificity, bloomsAlignment, uniqueness, depth) uses fixed rules. An agentic system would learn optimal scoring weights from user feedback.

12. **Post-Creation Enrichment is Fire-and-Forget**: The KnowledgeGraph and Bloom's analysis engines run but their outputs aren't fed back into anything. They create data but nobody reads it.

### Minor Gaps

13. **Standalone Stage Routes are Legacy**: `stage-1/route.ts`, `stage-2/route.ts`, `stage-3/route.ts` duplicate logic from the orchestrator. They appear to be from before the orchestrator was built.

14. **No User Feedback Integration**: There's no mechanism for the system to learn from user ratings of generated courses. The memory system stores AI-computed quality, not human assessments.

15. **Blueprint Comparison is Superficial**: The reflection compares concept coverage against the blueprint, but doesn't analyze structural alignment (did the chapter sequence match the plan?).

---

## How AI Thinking is Guided

The pipeline guides AI thinking through a **layered prompt architecture**:

### Layer 1: Pedagogical Identity (System Prompt)
```
COURSE_DESIGN_EXPERTISE (~110 lines)
├── ARROW Framework (11 steps)
├── SAM Personality definition
├── Non-negotiable rules (never start with definitions, etc.)
└── Supporting frameworks (Bloom's, Cognitive Load, Backward Design, etc.)
```

### Layer 2: Domain Expertise (System Prompt)
```
Category Prompt Enhancer
├── Domain expertise identity
├── Teaching methodology for this domain
├── Bloom's levels translated to domain activities
├── Content type preferences
└── Quality criteria specific to domain
```

### Layer 3: Structural Template (System/User Prompt)
```
Chapter DNA Template
├── Section roles (HOOK, INTUITION, WALKTHROUGH, etc.)
├── Format rules per section type
├── 5 Unbreakable Teaching Laws
├── 11 Universal Consistency Rules
├── Expected HTML structure
└── Explain-to-a-Friend test criterion
```

### Layer 4: Contextual Awareness (User Prompt)
```
├── All previous chapters (titles, descriptions, key topics, Bloom's levels)
├── Concept tracker state (introduced so far, referenced so far)
├── Course-wide learning objectives
├── Blueprint context (planned chapter sequence, concept dependencies)
├── Memory recall (prior course knowledge, quality patterns)
├── Adaptive guidance (from between-chapter decisions)
└── Quality feedback (on retries — specific issues to address)
```

### Layer 5: Explicit Thinking Instructions
```
Per-stage THINKING PROCESS:
├── Stage 1: "Think about: position in course, concept flow, Bloom's progression..."
├── Stage 2: "Think about: what aspect of the chapter this section covers..."
└── Stage 3: "Think about: content depth, activity design, Bloom's verb selection..."

Per-stage QUALITY GATES:
├── "Verify: objectives use correct Bloom's verbs"
├── "Verify: concepts are unique, not duplicated"
└── "Verify: content matches the section template role"
```

This 5-layer system is **well-designed for consistency** — it gives the AI enough structure to produce uniform quality while leaving creative freedom for content. The thinking process steps and quality gates create a lightweight "chain of thought" without requiring actual multi-step reasoning.

---

## Recommendations for True Agentic Pipeline

### Priority 1: Agentic Loop via SAM Core
Replace the fixed orchestrator loop with SAM's `@sam-ai/core` StateMachine or Orchestrator. The agent should observe generation quality, decide what to do next (generate, regenerate, replan, ask human), and act accordingly.

### Priority 2: Tool Registration
Register course creation stages as SAM tools. Let the tool planner decide when to invoke each stage based on the current state. This enables SAM's conversational mode to reason about course creation.

### Priority 3: Autonomous Regeneration
When the course reflector flags chapters, automatically queue them for regeneration without human intervention. Use quality thresholds and a maximum regeneration budget.

### Priority 4: Multi-Turn Reasoning
For complex courses, use multi-turn conversations where SAM reasons about structure before generating. "Given this Bloom's progression, should chapter 5 introduce a new concept or deepen chapter 4?"

### Priority 5: Semantic Memory
Replace keyword-based memory recall with vector similarity search. The KnowledgeGraph already has entity/edge structure — add embedding-based search for concept similarity.

---

## Conclusion

The Taxomind AI course creation pipeline is a **production-grade, sophisticated generation system** that makes substantial use of SAM infrastructure for tracking (Goals, Plans, SubGoals), quality (QualityGatePipeline, PedagogicalPipeline), and memory (KnowledgeGraph, SessionContext). The prompt engineering is exceptional — the 5-layer system produces consistent, pedagogically-sound course content.

However, it is **not a true agentic system**. The AI is a content generator operating within a deterministic pipeline. The "agentic" features (feedback loops, adaptive strategy, memory, decisions) are **satellite modules** that augment the pipeline but don't fundamentally change its fixed execution model. The AI never decides what to do next — the orchestrator does.

To become truly agentic, the pipeline needs to transition from "pipeline with agentic features" to "agentic system that generates courses" — where SAM's core reasoning loop drives the entire process, tools are registered and selected dynamically, and the system can autonomously replan, regenerate, and learn from outcomes.

**Overall Pipeline Agentic Score: 6.5/10**

| Category | Score | Notes |
|----------|-------|-------|
| SAM Infrastructure Integration | 8/10 | Goals, Plans, SubGoals, Memory stores — all properly used |
| SAM Package Usage | 6/10 | Quality + Pedagogy + Educational used; Core, React, API not used |
| AI Thinking Guidance | 8/10 | Excellent 5-layer prompt architecture |
| Feedback Loops | 7/10 | Quality feedback + retry, adaptive strategy |
| Autonomous Decision-Making | 5/10 | Between-chapter decisions exist but consequences are limited |
| Memory & Learning | 7/10 | Cross-creation memory with KnowledgeGraph + SessionContext |
| Dynamic Replanning | 2/10 | Blueprint is advisory, no real replanning |
| Tool Framework Integration | 1/10 | Skill defined but not registered as a tool |
| Multi-Agent Collaboration | 1/10 | Single AI, no specialized agents |

---

*Report generated from complete source code analysis. Every file in the pipeline was read in full. No inference or fabrication.*
