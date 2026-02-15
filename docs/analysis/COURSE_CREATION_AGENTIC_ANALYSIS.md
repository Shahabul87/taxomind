# Course Creation Pipeline — Deep Agentic Analysis Report (v2 — Complete)

**Date**: 2026-02-14
**Scope**: Full file-by-file analysis of ALL 50+ files in the AI course creation pipeline
**Entry Point**: `/teacher/create/ai-creator`
**Files Analyzed**: `lib/sam/course-creation/` (20 files), `lib/sam/tools/` (2 files), `lib/sam/skills/` (1 file), `category-prompts/` (19 files), `app/api/sam/course-creation/` (7 routes), `hooks/` (3 files), `app/(protected)/teacher/create/ai-creator/` (25+ UI files), SAM integration files (3 files)

---

## Executive Summary

The course creation pipeline is a **deeply engineered, 3-stage depth-first AI generation system** with significant agentic capabilities. It integrates the SAM AI Agentic System (`@sam-ai/agentic`) at multiple levels: state machine, goal/plan tracking, tool registry, memory stores, quality gates from `@sam-ai/quality` and `@sam-ai/pedagogy`, and educational engines from `@sam-ai/educational`.

**Overall Agentic Score: 7.5/10**

The pipeline goes far beyond simple prompt-to-response AI generation. It has genuine agentic features: autonomous decision-making between chapters, self-critique loops, adaptive parameter tuning, bidirectional memory (recall + persist), AI blueprint planning, healing loops with AI diagnosis, course reflection, and a state machine that wraps SAM's `AgentStateMachine`. However, there are gaps that prevent it from being a fully autonomous agentic system.

---

## File-by-File Analysis

### Layer 1: Core Pipeline Engine

---

#### `lib/sam/course-creation/orchestrator.ts` (1667 lines)
**Role**: Central orchestration of the entire 3-stage depth-first pipeline
**Agentic Score**: 8/10

**What It Does Well (Agentic)**:
- Routes to `CourseCreationStateMachine` (agentic path) by default (`useAgenticStateMachine = true`)
- Calls `planCourseBlueprint()` before generation (pre-planning AI call)
- Calls `recallCourseCreationMemory()` before starting (memory-augmented generation)
- Between each chapter: calls `evaluateChapterOutcomeWithAI()` for autonomous decision-making
- After decisions: calls `applyAgenticDecision()` + `generateBridgeContent()` + `replanRemainingChapters()`
- After all chapters: runs `reflectOnCourseWithAI()` for post-generation analysis
- Saves checkpoints after each chapter via `saveCheckpointWithRetry()`
- Fires `runPostCreationEnrichmentBackground()` for fire-and-forget enrichment
- Quality retry loops with feedback injection at each stage
- The extracted `generateSingleChapter()` function encapsulates the full depth-first pipeline per chapter

**What's Missing**:
- The "legacy path" (simple for-loop) still exists as a fallback
- No real-time user intervention during generation (pause/modify/redirect mid-pipeline)

---

#### `lib/sam/course-creation/course-state-machine.ts` (624 lines)
**Role**: Wraps `AgentStateMachine` from `@sam-ai/agentic` for pipeline lifecycle
**Agentic Score**: 9/10

**What It Does Well (Agentic)**:
- Creates a proper `AgentStateMachine` with states: `idle -> planning -> generating -> evaluating -> adapting -> completed/failed`
- Each chapter is a "step" -- the state machine drives the loop
- The `onStepExecute` callback runs the FULL agentic loop per chapter:
  1. `initializeChapterSubGoal()` -- SubGoal decomposition
  2. `generateSingleChapter()` -- depth-first generation
  3. `persistConceptsBackground()` + `persistQualityScoresBackground()` -- memory write
  4. `recallChapterContext()` -- memory read for cross-chapter context
  5. `evaluateChapterOutcomeWithAI()` -- AI-driven decision
  6. `applyAgenticDecision()` -- apply the decision
  7. `generateBridgeContent()` -- scaffolding insertion
  8. `replanRemainingChapters()` -- dynamic replanning
  9. Skip logic based on decision
  10. Inline healing with AI diagnosis (`diagnoseChapterIssues()`)
  11. `saveCheckpointWithRetry()` -- fault tolerance
- Supports pause/resume/abort lifecycle
- Maps state machine events to SSE events for real-time UI updates
- `SharedPipelineState` interface for mutable state shared across steps

**What's Missing**:
- No rollback capability -- if a chapter fails mid-generation, the state machine doesn't roll back DB changes
- No parallel chapter generation (each chapter is sequential)

---

#### `lib/sam/course-creation/types.ts` (767 lines)
**Role**: All TypeScript types for the pipeline
**Agentic Score**: N/A (type definitions)

**Key Types**:
- `BloomsLevel` -- 6 cognitive levels with `BLOOMS_TAXONOMY` constant (verbs, descriptions, cognitive processes)
- `CourseContext` -- full course metadata including `bloomsFocus`, `courseSubcategory`
- `ConceptTracker` -- cumulative concept inventory (`Map<string, {introducedIn, referencedIn, type}>`)
- `CourseBlueprintPlan` -- AI-generated pre-plan with chapter sequence, concept flow, risk areas
- `AgenticDecision` -- 7 possible actions: `continue`, `adjust_strategy`, `flag_for_review`, `regenerate_chapter`, `inject_bridge_content`, `replan_remaining`, `skip_next_chapter`
- `CheckpointData` -- serializable state for resume including mid-chapter recovery fields
- `CourseReflection` -- post-generation analysis with coherence score and flagged chapters
- `ComposedTemplatePrompt` -- template blocks for Stage 1/2/3 injection
- `TemplateSectionRole` -- 20 distinct section roles across all difficulty templates

**Assessment**: Types are comprehensive and well-designed. They encode agentic concepts (decisions, strategies, checkpoints) as first-class types.

---

#### `lib/sam/course-creation/prompts.ts` (~1100 lines)
**Role**: The prompt engineering heart -- builds Stage 1/2/3 prompts with ARROW framework
**Agentic Score**: 8/10

**What It Does Well (Agentic)**:
- `COURSE_DESIGN_EXPERTISE` defines SAM's identity as an ARROW framework expert (11 pedagogical phases)
- Structured thinking instructions (`Step 1: Analyze prerequisites...`, `Step 2: Design learning arc...`) -- guides the AI's reasoning process
- Each prompt has clear `systemPrompt` (identity + principles) + `userPrompt` (context + instructions)
- Stage 1 prompt includes: concept flow from previous chapters, position-aware guidance, blueprint block, memory recall block, category-specific guidance, chapter DNA template block
- Stage 2 prompt includes: full course-wide context, scaffolding guidance, ARROW section flow, template constraints
- Stage 3 prompt includes: cumulative knowledge state, content-type-specific activity guidance, template HTML structure
- `getContentAwareBloomsLevel()` ensures monotonic Bloom's progression across chapters
- Quality gates built into every prompt ("verify these criteria before finalizing")

**What's Missing**:
- No A/B testing of prompt variants in production (the `TRADITIONAL_DESIGN_EXPERTISE` experiment variant exists but isn't dynamically toggled)
- No prompt versioning system -- prompt changes require code changes

---

#### `lib/sam/course-creation/course-creation-controller.ts` (515 lines)
**Role**: Bridge between course creation and SAM's goal/plan tracking
**Agentic Score**: 9/10

**What It Does Well (Agentic)**:
- Uses `getGoalStores()` from TaxomindContext (follows architecture rules)
- `initializeCourseCreationGoal()` -- creates a SAM `Goal` with metadata and a 3-step `ExecutionPlan`:
  1. "Generate chapters" (status: `pending`)
  2. "Generate sections for each chapter" (status: `pending`)
  3. "Generate section details" (status: `pending`)
- `initializeChapterSubGoal()` -- Phase 3 SubGoal decomposition per chapter with 3 sub-steps
- `storeBlueprintInGoal()` -- stores the AI-generated blueprint in goal metadata
- `storeDecisionInPlan()` -- logs agentic decisions in plan step metadata
- `storeReflectionInGoal()` -- stores post-generation analysis in goal metadata
- `completeCourseCreation()` -- marks goal as `achieved` with final stats
- `failCourseCreation()` -- preserves checkpoint data when marking failure
- `reactivateCourseCreation()` -- re-opens a failed goal for resume

**What's Missing**:
- The 3-step ExecutionPlan is static -- it should dynamically adapt based on chapter count
- No inter-goal learning (previous course creation goals don't inform the current one at the plan level)

---

### Layer 2: Agentic Decision & Planning Modules

---

#### `lib/sam/course-creation/course-planner.ts` (527 lines)
**Role**: Pre-generation AI blueprint planning
**Agentic Score**: 8/10

**What It Does Well**:
- `planCourseBlueprint()` -- single AI call before any content generation to create:
  - Optimal chapter sequence with rationale
  - Concept dependency graph
  - Bloom's progression strategy
  - Risk areas to monitor
- `buildBlueprintBlock()` -- injects blueprint guidance into Stage 1 prompts so every chapter is informed by the plan
- `replanRemainingChapters()` -- dynamic mid-course re-planning when triggered by agentic decisions
- Non-blocking: falls back to a default blueprint on failure
- 30-second timeout prevents blocking

**What's Missing**:
- The blueprint doesn't incorporate user feedback (user can't modify the plan before generation starts)
- No versioning of replans -- if replanning happens 3 times, there's no trace of the evolution

---

#### `lib/sam/course-creation/agentic-decisions.ts` (871 lines)
**Role**: Between-chapter autonomous decision engine
**Agentic Score**: 9/10

**What It Does Well**:
- 3-tier decision system:
  1. `evaluateChapterOutcome()` -- pure code analysis (no AI calls): quality trends, concept coverage, blueprint alignment
  2. `evaluateChapterOutcomeEnhanced()` -- extended checks: Bloom's regression, consecutive low quality, very low scores
  3. `evaluateChapterOutcomeWithAI()` -- AI-driven decisions with rule-based guardrails
- AI can be overridden when quality is critically low (rule-based guardrails take precedence)
- 7 possible actions: `continue`, `adjust_strategy`, `flag_for_review`, `regenerate_chapter`, `inject_bridge_content`, `replan_remaining`, `skip_next_chapter`
- `applyAgenticDecision()` -- makes decisions actionable (modifies strategy monitor, adds to healing queue)
- `generateBridgeContent()` -- creates scaffolding paragraphs between chapters for concept gaps
- `analyzeQualityTrend()` -- detects improving/declining/stable patterns across chapters
- `buildAdaptiveGuidance()` -- creates guidance text from accumulated decisions

**What's Missing**:
- No user confirmation for high-impact decisions (regenerate, skip, replan) -- fully autonomous
- Decisions are not persisted to a queryable log (only stored in plan step metadata)

---

#### `lib/sam/course-creation/self-critique.ts` (355 lines)
**Role**: Analysis of AI reasoning quality
**Agentic Score**: 7/10

**What It Does Well**:
- `critiqueGeneration()` -- pure text analysis of the AI's thinking (NO additional AI calls)
- Checks structured thinking steps coverage (Step 1, Step 2, etc.)
- Checks ARROW framework keyword coverage (`APPLICATION`, `REVERSE`, `REASON`, `ORIGINATE`, `WIRE`)
- Checks concept tracker references in thinking text
- Produces `GenerationCritique` with actionable improvements and confidence score
- Only runs when quality score < retry threshold (efficiency-conscious)

**What's Missing**:
- No AI-powered self-critique (the critique is purely text-matching, not semantic analysis)
- Could use embeddings to check semantic similarity between thinking and output

---

#### `lib/sam/course-creation/course-reflector.ts` (612 lines)
**Role**: Post-generation structural analysis
**Agentic Score**: 7/10

**What It Does Well**:
- `reflectOnCourse()` -- pure deterministic analysis: Bloom's progression gaps, concept coverage percentage, flagged chapters, coherence score
- `reflectOnCourseWithAI()` -- hybrid: rule-based baseline + single LLM call for pedagogical insights
- AI can adjust coherenceScore by +/-15, add/remove flags, enrich summary
- Falls back gracefully to rule-based on AI failure

**What's Missing**:
- Reflection doesn't trigger automatic fixes directly -- it produces a report and the healing loop is separate
- No user-facing reflection summary (it's only stored in goal metadata)

---

#### `lib/sam/course-creation/healing-loop.ts` (422 lines)
**Role**: Autonomous post-generation quality recovery
**Agentic Score**: 8/10

**What It Does Well**:
- `runHealingLoop()` -- iterative regeneration of flagged chapters until coherence threshold is met
- `diagnoseChapterIssues()` -- AI diagnosis determining healing strategy type
- 5 strategy types: `full_regeneration`, `sections_only`, `details_only`, `targeted_sections`, `skip_healing`
- Routes to appropriate regenerator based on strategy (`regenerateChapter`, `regenerateSectionsOnly`, `regenerateDetailsOnly`)
- Hard cap on iterations (`ABSOLUTE_MAX_ITERATIONS = 3`) -- prevents infinite loops
- Safety: only heals above severity threshold, skips if coherence already acceptable

**What's Missing**:
- No parallel healing (heals one chapter at a time)
- The inline healing path (in `course-state-machine.ts`) duplicates some logic
- No metrics on healing success rate over time

---

#### `lib/sam/course-creation/adaptive-strategy.ts` (359 lines)
**Role**: Dynamic parameter tuning based on generation performance
**Agentic Score**: 7/10

**What It Does Well**:
- `AdaptiveStrategyMonitor` class tracks performance and adapts:
  - Temperature: bounded 0.4-0.9, adjusted by +/-0.05 per observation
  - Max retries: 1-3, increased on consecutive failures
  - Retry threshold: 50-70, relaxed on persistent low quality
  - Max tokens: stage-specific adjustments based on truncation detection
  - Self-critique: enabled after 2+ failures
- `applyOverrides()` -- accepts external strategy changes from agentic decisions
- Serializable history for checkpoint persistence

**What's Missing**:
- No learning across courses -- strategy resets for each new course creation
- Parameters are adapted heuristically, not by a learned model

---

### Layer 3: Memory & Persistence

---

#### `lib/sam/course-creation/memory-recall.ts` (353 lines)
**Role**: Reads from SAM's KnowledgeGraph and SessionContext stores
**Agentic Score**: 8/10

**What It Does Well**:
- `recallCourseCreationMemory()` -- queries prior concepts in the same domain and quality patterns from previous courses
- `recallChapterContext()` -- between-chapter related concept cross-referencing (CALLED by the state machine)
- `buildMemoryRecallBlock()` -- generates prompt augmentation block from recalled memory
- Uses `getMemoryStores()` from TaxomindContext (follows architecture rules)
- All queries have 3-second timeout -- empty results = safe fallback
- Genuinely cross-session: recalls from prior course creations, not just the current one

**What's Missing**:
- No vector search (uses exact string matching in KnowledgeGraph, not semantic similarity)
- Memory recall quality isn't measured -- no feedback loop on whether recalled context improves quality

---

#### `lib/sam/course-creation/memory-persistence.ts` (217 lines)
**Role**: Fire-and-forget background persistence to SAM stores
**Agentic Score**: 7/10

**What It Does Well**:
- `persistConceptsBackground()` -- writes concepts to KnowledgeGraph with entity creation and prerequisite relationships
- `persistQualityScoresBackground()` -- writes quality scores to SessionContext
- Uses `getMemoryStores()` from TaxomindContext
- Never blocks course generation (fire-and-forget)

**What's Missing**:
- No persistence of the ARROW framework analysis or self-critique results
- No persistence of agentic decisions for cross-course learning

---

#### `lib/sam/course-creation/checkpoint-manager.ts` (383 lines)
**Role**: Checkpoint save/restore for resume-on-failure
**Agentic Score**: 7/10

**What It Does Well**:
- `saveCheckpoint()` -- serializes full pipeline state to `SAMExecutionPlan.checkpointData`
- `saveCheckpointWithRetry()` -- reliable persistence with retry
- `resumeCourseCreation()` -- reconstructs `ResumeState` from checkpoint + DB, handles:
  - Partial chapter detection (sections with/without details)
  - Orphan chapter cleanup
  - ConceptTracker deserialization from JSON
  - Mid-chapter recovery (last completed stage/section index)
- Passes `ResumeState` to `orchestrateCourseCreation()` which skips to the right point

**What's Missing**:
- No UI to show checkpoint history or allow manual checkpoint selection
- Checkpoints aren't versioned -- only the latest is kept

---

### Layer 4: Quality Validation

---

#### `lib/sam/course-creation/quality-integration.ts` (467 lines)
**Role**: SAM Quality Gates + Pedagogy integration
**Agentic Score**: 8/10

**What It Does Well**:
- Uses `@sam-ai/quality` `createQualityGatePipeline()` and `@sam-ai/pedagogy` `createPedagogicalPipeline()`
- Validates chapters, sections, and details at all 3 stages
- Combined score: `0.6 * customScore + 0.4 * samScore`
- Within SAM weight: `0.6 * qualityGates + 0.4 * pedagogy`
- Runs quality and pedagogy in parallel via `Promise.allSettled()`
- 8-second timeout prevents pipeline blocking
- Graceful fallback: uses custom score alone if SAM validation fails
- Extracts `failedGates`, `qualityIssues`, `pedagogyIssues`, `suggestions` for feedback injection

**What's Missing**:
- Pipeline singletons are module-level -- not reset between courses
- No custom quality gate configuration per domain/category

---

#### `lib/sam/course-creation/quality-feedback.ts` (168 lines)
**Role**: Builds actionable feedback blocks for retry loops
**Agentic Score**: 6/10

**What It Does Well**:
- `extractQualityFeedback()` -- combines SAM validation issues with custom score weaknesses
- `buildQualityFeedbackBlock()` -- generates structured prompt text:
  - Critical issues, pedagogy issues, weak dimensions, failed gates
  - Reasoning weaknesses (from self-critique)
  - Missing structured thinking steps
  - Required improvements
- Display-friendly format: "Attempt X/3, Previous Score: Y/100"

**What's Missing**:
- Feedback is text-based only -- no structured data that the AI could parse more efficiently
- No feedback prioritization (all issues listed equally)

---

#### `lib/sam/course-creation/helpers.ts` (797 lines)
**Role**: Pure helper functions -- parsing, scoring, fallback generators
**Agentic Score**: 5/10

**What It Does Well**:
- `scoreChapter()`, `scoreSection()`, `scoreDetails()` -- multi-dimensional quality scoring:
  - Completeness (structural checks)
  - Specificity (title length, generic detection)
  - Bloom's Alignment (verb presence in objectives, uses `validateObjective()`)
  - Uniqueness (Jaccard similarity against existing items)
  - Depth (word count, concept count, HTML structure)
- Template-aware scoring: adjusts word count expectations based on `TemplateSectionDef`
- Comprehensive fallback generators for every template role (20+ roles with appropriate HTML structure)

**What's Missing**:
- Scoring is entirely heuristic -- no ML-based scoring
- The fallback generators (300+ lines) could be a separate module

---

#### `lib/sam/course-creation/response-parsers.ts` (180 lines)
**Role**: Parses AI responses for all 3 stages
**Agentic Score**: 4/10

**What It Does Well**:
- Clean JSON parsing with `cleanAIResponse()` (strips markdown fences)
- Graceful fallback on parse errors (never crashes the pipeline)
- Type-safe output construction with validation

**What's Missing**:
- No structured output validation (Zod schemas for AI responses)
- No partial parsing (if JSON is 90% valid, it still fails completely)

---

### Layer 5: Content Templates & Domain Knowledge

---

#### `lib/sam/course-creation/chapter-templates.ts` (1005 lines)
**Role**: Chapter DNA Templates -- difficulty-specific section structures
**Agentic Score**: 6/10

**What It Does Well**:
- 3 complete templates (Beginner: 8 sections, Intermediate: 7, Advanced: 8)
- Each section has: role, purpose, contentType, bloomsLevels, wordCountRange, formatRules, htmlStructure, tone, consistencyRules
- 5 Unbreakable Teaching Laws and 11 Universal Consistency Rules
- `selectTemplateSections()` -- dynamic section selection based on AI-recommended count, Bloom's level, and complexity
- `composeTemplatePromptBlocks()` -- generates Stage 1/2/3 injection blocks from templates
- Teaching philosophy: "INTUITION FIRST -- students feel the concept before seeing formulas"

**What's Missing**:
- Templates are static -- no AI-driven template selection or customization
- No user-defined template creation

---

#### `lib/sam/course-creation/category-prompts/` (19 files)
**Role**: 15 domain-specific prompt enhancers
**Agentic Score**: 5/10

**Files**: `types.ts`, `index.ts`, `registry.ts`, `programming.ts`, `data-science-ml.ts`, `data-structures-algorithms.ts`, `mathematics.ts`, `engineering.ts`, `finance-accounting.ts`, `business-management.ts`, `design-creative.ts`, `health-science.ts`, `language-communication.ts`, `education.ts`, `personal-development.ts`, `music.ts`, `lifestyle.ts`, `arts-humanities.ts`, `general.ts`

**What It Does Well**:
- Each enhancer provides: `domainExpertise`, `teachingMethodology`, `bloomsInDomain` (all 6 levels), `contentTypeGuidance`, `qualityCriteria`, `chapterSequencingAdvice`, `activityExamples`
- Research-based pedagogy (e.g., mathematics references MIT OCW, 3Blue1Brown, Polya's heuristics)
- Fuzzy category matching with normalization (handles hyphens, case differences)
- General fallback when no domain matches

**What's Missing**:
- Enhancers are static -- no AI-driven domain detection or enhancer generation
- No subcategory-level specialization

---

### Layer 6: Regeneration & Enrichment

---

#### `lib/sam/course-creation/chapter-regenerator.ts` (905 lines)
**Role**: Chapter and partial regeneration (full, sections-only, details-only)
**Agentic Score**: 6/10

**What It Does Well**:
- 3 regeneration modes:
  1. `regenerateChapter()` -- full Stage 1+2+3 regeneration
  2. `regenerateSectionsOnly()` -- keeps chapter, regenerates Stage 2+3
  3. `regenerateDetailsOnly()` -- keeps chapter+sections, regenerates Stage 3 only
- Each mode runs quality gates at every stage
- Rebuilds context from neighboring chapters for coherence
- SSE events for real-time UI updates

**What's Missing**:
- No agentic decision-making during regeneration (no between-section decisions, no adaptive strategy)
- Doesn't use the state machine -- runs as a simple procedural loop

---

#### `lib/sam/course-creation/post-creation-enrichment.ts` (288 lines)
**Role**: Background enrichment after course completion
**Agentic Score**: 7/10

**What It Does Well**:
- Uses `@sam-ai/educational` engines: `createKnowledgeGraphEngine` and `createBloomsAnalysisEngine`
- `enrichKnowledgeGraph()` -- extracts concepts from all chapters and builds a concept graph with prerequisites
- `enrichBloomsAnalysis()` -- full cognitive profile across all chapters
- Runs concurrently via `Promise.allSettled()`
- Fire-and-forget: never blocks the user

**What's Missing**:
- Results aren't surfaced to the user (no UI for the enrichment data)
- No enrichment for individual chapters (only whole-course)

---

#### `lib/sam/course-creation/streaming-accumulator.ts` (228 lines)
**Role**: Real-time streaming with thinking extraction
**Agentic Score**: 5/10

**What It Does Well**:
- `ThinkingExtractor` state machine: scans streaming JSON for `"thinking": "..."` field
- Emits thinking chunks via callback as they arrive (real-time transparency)
- Falls back to blocking `runSAMChatWithPreference()` if streaming fails
- Uses `runSAMChatStream()` from unified AI provider

**What's Missing**:
- Only extracts thinking -- doesn't do real-time quality assessment of the stream

---

### Layer 7: SAM Integration (Tools & Skills)

---

#### `lib/sam/tools/course-creator.ts` (733 lines)
**Role**: Conversational tool for course creation parameter collection
**Agentic Score**: 7/10

**What It Does Well**:
- Follows SAM's 5-layer tool pattern (`ToolDefinition` from `@sam-ai/agentic`)
- Conversational 7-step parameter collection: courseName -> subject -> targetAudience -> difficulty -> bloomsFocus -> chapterCount -> contentTypes
- In-memory state management with TTL cleanup (10 minutes)
- Stateless fallback for serverless environments
- Returns `triggerGeneration: true` with `apiEndpoint` when complete
- Zod schema validation for input
- Proper `ToolCategory`, `PermissionLevel`, `ConfirmationType` from `@sam-ai/agentic`

**What's Missing**:
- The tool doesn't invoke the orchestrator directly -- it returns a trigger object
- No AI-assisted parameter suggestions during collection

---

#### `lib/sam/tools/course-chapter-generator.ts` (240 lines)
**Role**: Direct-mode tool for single chapter generation + healer tool
**Agentic Score**: 8/10

**What It Does Well**:
- `createCourseChapterGeneratorTool()` -- direct-mode tool that calls `generateSingleChapter()` when `chapterStepContext` is provided via metadata
- `createCourseHealerTool()` -- direct-mode tool that calls `regenerateChapter()` for quality recovery
- Both follow SAM's `ToolDefinition` pattern with proper schemas, permissions, rate limits
- Metadata flags: `isConversational: false`, `isDirect: true`, `agenticIntegration: true`
- Used by the `AgentStateMachine` to invoke chapter generation as a tool step

**What's Missing**:
- No tool composition (can't chain chapter generator -> quality check -> heal in a single tool invocation)

---

#### `lib/sam/skills/course-creator.skill.md` (43 lines)
**Role**: Skill descriptor for SAM's course creation capability
**Agentic Score**: 5/10

---

#### `lib/sam/agentic-tooling.ts` (partially read)
**Role**: Tool registry initialization
**Agentic Score**: 7/10

- Registers course creation tools: `createCourseCreatorTool`, `createCourseChapterGeneratorTool`, `createCourseHealerTool`
- Uses `getStore()` and `getIntegrationProfile()` from TaxomindContext

---

#### `lib/sam/tool-planner.ts` (partially read)
**Role**: Mode-to-tool affinity mapping
**Agentic Score**: 6/10

- Maps `'course-architect'` mode to `['sam-course-creator', 'sam-course-chapter-generator', 'sam-course-healer']`
- AI-based tool selection with mode context boosting

---

### Layer 8: API Routes

---

#### `app/api/sam/course-creation/orchestrate/route.ts` (176 lines)
**Role**: SSE streaming endpoint for course creation
**Agentic Score**: 6/10

- Auth + subscription gate before generation starts
- Zod validation of request body (`OrchestrateRequestSchema`)
- SSE streaming with proper headers
- Delegates to `orchestrateCourseCreation()` or `resumeCourseCreation()` based on `resumeCourseId`
- `maxDuration = 900` (15 minutes) with auto-reconnection

---

#### Other API routes (`stage-1/`, `stage-2/`, `stage-3/`, `regenerate-chapter/`, `progress/`, `estimate-cost/`)
**Agentic Score**: 3/10

These are standalone endpoints for individual stages or utility functions. They don't participate in the agentic pipeline.

---

### Layer 9: Frontend (Hooks & UI)

---

#### `hooks/use-progressive-course-creation.ts`
**Role**: Adaptive UI behavior based on user patterns
**Agentic Score**: 5/10

- Tracks user patterns: preferred content types, typical chapter count, favorite difficulty
- Adapts interface: show/hide advanced options, auto-fill suggestions, quick mode
- Uses localStorage (not SAM's memory stores)

---

#### `hooks/use-ai-course-creator.ts`
**Agentic Score**: 3/10

Uses the legacy `/api/ai/course-planner` endpoint, NOT the agentic orchestrator.

---

#### `hooks/use-ai-course-integration.ts`
**Agentic Score**: 2/10

Simple CRUD hook -- no agentic features.

---

#### `app/(protected)/teacher/create/ai-creator/` (25+ files)
**Agentic Score**: 5/10

The AI Creator wizard UI with SSE connection, progress tracking, SAM assistant panel, and multi-step form. No real-time intervention during generation.

---

## Agentic Feature Matrix

| Feature | Implemented | Quality | Notes |
|---------|:-----------:|:-------:|-------|
| State Machine (`AgentStateMachine`) | Yes | High | Wraps `@sam-ai/agentic` properly |
| Goal/Plan Tracking | Yes | High | Goal -> SubGoals -> ExecutionPlan |
| Pre-Generation Blueprint | Yes | High | AI-planned chapter sequence |
| Between-Chapter Decisions | Yes | High | 7 action types with AI + rules |
| Memory Recall (cross-session) | Yes | Medium | KnowledgeGraph queries, no vector search |
| Memory Persistence | Yes | Medium | Fire-and-forget to KG/SessionContext |
| Quality Gates (SAM) | Yes | High | `@sam-ai/quality` + `@sam-ai/pedagogy` |
| Self-Critique | Yes | Medium | Text-matching, not semantic |
| Adaptive Strategy | Yes | Medium | Heuristic, not learned |
| Healing Loop | Yes | High | AI-diagnosed, 5 strategies |
| Course Reflection | Yes | Medium | Hybrid rule-based + AI |
| Post-Creation Enrichment | Yes | Medium | `@sam-ai/educational` engines |
| Checkpoint/Resume | Yes | High | Mid-chapter recovery |
| Bridge Content | Yes | High | Scaffolding for concept gaps |
| Dynamic Replanning | Yes | High | Triggered by decisions |
| Streaming + Thinking | Yes | Medium | Real-time thinking extraction |
| Tool Registry Integration | Yes | High | 3 tools in SAM tool registry |
| Category-Specific Prompts | Yes | High | 15 domain enhancers |
| Chapter DNA Templates | Yes | High | 3 difficulty templates |
| ARROW Pedagogical Framework | Yes | High | 11-phase teaching methodology |
| Conversational Tool Collection | Yes | Medium | 7-step parameter collection |

---

## What's Missing: Gap Analysis

### Critical Gaps (High Priority)

1. **No Vector/Semantic Search in Memory Recall** -- Memory recall uses exact string matching in KnowledgeGraph. For a truly agentic system, it should use embedding-based semantic search to find related concepts across courses.

2. **No User Intervention During Generation** -- Once generation starts, the user can only watch. A truly agentic system would allow the user to:
   - Approve/reject each chapter before proceeding
   - Modify the blueprint mid-generation
   - Redirect the AI's focus based on early results

3. **No Cross-Course Learning at Decision Level** -- Agentic decisions (regenerate, skip, replan) don't learn from previous courses. If the AI consistently struggles with "Advanced" chapters in "Mathematics", it should adapt its approach.

4. **No Prompt Versioning/A-B Testing** -- The ARROW framework prompt is hardcoded. A truly agentic system would:
   - Track which prompt versions produce higher quality
   - Automatically select better-performing prompts
   - Allow rollback to previous prompt versions

### Important Gaps (Medium Priority)

5. **Response Parsers Lack Structured Validation** -- AI responses are parsed as raw JSON without Zod schema validation. Partial/malformed responses cause full fallback.

6. **Regeneration Doesn't Use Agentic Features** -- `chapter-regenerator.ts` runs as a simple procedural loop without the state machine, decisions, or adaptive strategy.

7. **No Parallel Chapter Generation** -- The state machine processes chapters sequentially. Speculative parallel generation could reduce total time.

8. **No Feedback Loop on Memory Recall Quality** -- No measurement of whether recalled context actually improved generation quality.

9. **Self-Critique is Text-Matching Only** -- Keyword matching instead of semantic analysis. An LLM-based critique would be more accurate.

10. **Progressive Disclosure Hook Uses localStorage** -- `use-progressive-course-creation.ts` tracks user patterns in localStorage instead of SAM's memory stores.

### Nice-to-Have Gaps (Low Priority)

11. **No Agentic Template Selection** -- AI could analyze the course topic and select/customize the template.

12. **No Multi-Agent Collaboration** -- A multi-agent approach (planner, writer, critic) could improve quality.

13. **No Cost-Aware Decision Making** -- Agentic decisions don't consider token/cost budgets.

14. **No Enrichment UI** -- Post-creation enrichment results aren't shown to the user.

15. **Legacy Hooks and Endpoints** -- `use-ai-course-creator.ts` and individual stage routes bypass the agentic pipeline.

---

## How AI Thinking Is Guided

The pipeline guides AI thinking through a **5-layer prompt architecture**:

### Layer 1: Identity & Philosophy (System Prompt)
- `COURSE_DESIGN_EXPERTISE` -- SAM's identity as an ARROW framework expert
- 11 pedagogical phases from Application to Wiring
- 5 Unbreakable Teaching Laws
- 11 Universal Consistency Rules

### Layer 2: Domain Expertise (System Prompt)
- Category-specific `domainExpertise` from 15 domain enhancers
- Domain-specific `teachingMethodology` and `bloomsInDomain`
- Domain-specific `contentTypeGuidance` and `chapterSequencingAdvice`

### Layer 3: Structural Constraints (User Prompt)
- Chapter DNA Template blocks (role, purpose, contentType, formatRules, htmlStructure)
- Blueprint guidance block (chapter sequence, concept dependencies, risk areas)
- Memory recall block (prior concepts, quality patterns)

### Layer 4: Contextual Awareness (User Prompt)
- ConceptTracker -- cumulative concept inventory across all prior chapters
- Bloom's progression -- ensures monotonic cognitive level increase
- Previous chapter summaries with key topics and learning objectives
- Quality feedback from failed attempts (specific issues + suggestions)

### Layer 5: Structured Thinking Instructions (User Prompt)
- Explicit step-by-step reasoning: "Step 1: Analyze prerequisites...", "Step 2: Design learning arc..."
- Quality gates: "Before finalizing, verify: [checklist]"
- JSON output format with `thinking` field for transparency

**This is one of the most thorough prompt engineering systems for educational content generation.** The AI is not just told "generate a chapter" -- it's given an identity, domain expertise, structural constraints, cumulative context, and step-by-step reasoning instructions.

---

## SAM AI Agentic System Usage Assessment

### What's Properly Used

| SAM Component | Used Correctly | Where |
|--------------|:--------------:|-------|
| `AgentStateMachine` | Yes | `course-state-machine.ts` |
| `Goal` / `SubGoal` stores | Yes | `course-creation-controller.ts` |
| `ExecutionPlan` / `PlanStep` | Yes | `course-creation-controller.ts` |
| `TaxomindContext` | Yes | All store access via `getGoalStores()`, `getMemoryStores()` |
| `ToolDefinition` | Yes | `course-creator.ts`, `course-chapter-generator.ts` |
| `ToolCategory` / `PermissionLevel` | Yes | Tool definitions |
| `KnowledgeGraph` store | Yes | `memory-recall.ts`, `memory-persistence.ts` |
| `SessionContext` store | Yes | `memory-persistence.ts` |
| `@sam-ai/quality` | Yes | `quality-integration.ts` |
| `@sam-ai/pedagogy` | Yes | `quality-integration.ts` |
| `@sam-ai/educational` | Yes | `post-creation-enrichment.ts` |
| `runSAMChatWithPreference` | Yes | All AI calls via unified provider |
| `runSAMChatStream` | Yes | `streaming-accumulator.ts` |
| `getUserScopedSAMConfig` | Yes | `post-creation-enrichment.ts` |

### What's Not Used (Opportunities)

| SAM Component | Status | Opportunity |
|--------------|--------|-------------|
| `ToolExecutor` | Not used | Could use for chaining tools |
| `Vector` store | Not used | Semantic search for memory recall |
| `BehaviorEvent` store | Not used | Track user behavior patterns |
| `Pattern` store | Not used | Detect recurring quality patterns |
| `Intervention` store | Not used | Proactive quality interventions |
| `LearningPath` store | Not used | Build adaptive learning paths |
| `CourseGraph` store | Not used | Graph-based course relationships |
| `@sam-ai/memory` MasteryTracker | Not used | Track concept mastery across courses |
| `@sam-ai/memory` SpacedRepetition | Not used | Optimize review scheduling |
| `@sam-ai/safety` | Not used | Bias detection in generated content |
| `@sam-ai/react` hooks | Not used | SAM-aware React hooks for the UI |

---

## Agentic Scorecard (Per File)

| File | Lines | Agentic Score | Key Strength | Key Gap |
|------|-------|:-------------:|-------------|---------|
| `orchestrator.ts` | 1,667 | 8/10 | Depth-first with full agentic loop | Legacy path still exists |
| `course-state-machine.ts` | 624 | 9/10 | Full `AgentStateMachine` integration | No rollback, no parallelism |
| `agentic-decisions.ts` | 871 | 9/10 | 7 decision types, AI + rules | No user confirmation for high-impact |
| `prompts.ts` | ~1,100 | 8/10 | ARROW framework + thinking steps | No prompt versioning |
| `course-creation-controller.ts` | 515 | 9/10 | Goal/SubGoal/Plan tracking | Static 3-step plan |
| `course-planner.ts` | 527 | 8/10 | AI blueprint + mid-course replanning | No user input on plan |
| `healing-loop.ts` | 422 | 8/10 | AI-diagnosed, 5 strategies | No parallel healing |
| `quality-integration.ts` | 467 | 8/10 | SAM quality + pedagogy packages | Fixed blending weights |
| `memory-recall.ts` | 353 | 8/10 | Bidirectional cross-session memory | No vector search |
| `memory-persistence.ts` | 217 | 7/10 | KnowledgeGraph + SessionContext writes | No decision persistence |
| `adaptive-strategy.ts` | 359 | 7/10 | Dynamic parameter adaptation | No cross-course learning |
| `course-reflector.ts` | 612 | 7/10 | Hybrid rule-based + AI reflection | Results not surfaced to user |
| `self-critique.ts` | 355 | 7/10 | Metacognitive analysis | Text-matching, not semantic |
| `checkpoint-manager.ts` | 383 | 7/10 | Mid-chapter resume | No checkpoint versioning |
| `post-creation-enrichment.ts` | 288 | 7/10 | Educational engine integration | Results not consumed |
| `chapter-regenerator.ts` | 905 | 6/10 | 3 regeneration modes | No agentic features |
| `quality-feedback.ts` | 168 | 6/10 | Intelligent retry guidance | No prioritization |
| `chapter-templates.ts` | 1,005 | 6/10 | 3 difficulty templates, 20 section roles | Static, no AI selection |
| `category-prompts/` (19 files) | ~5,000+ | 5/10 | 15 domain enhancers, research-based | Static knowledge |
| `streaming-accumulator.ts` | 228 | 5/10 | Real-time thinking visibility | UX, not agentic |
| `helpers.ts` | 797 | 5/10 | Multi-dimensional quality scoring | Heuristic only |
| `response-parsers.ts` | 180 | 4/10 | Graceful fallback | No Zod validation |
| `course-creator.ts` (tool) | 733 | 7/10 | 5-layer tool pattern, 7-step collection | Trigger-only, not direct |
| `course-chapter-generator.ts` | 240 | 8/10 | Direct-mode tool, healer tool | No tool composition |
| `orchestrate/route.ts` | 176 | 6/10 | SSE streaming, resume support | Transport layer |
| **Pipeline Average** | | **7.5/10** | | |

---

## Conclusion

This is a **genuinely agentic pipeline** -- not a superficial wrapper around API calls. The pipeline demonstrates:
- **Autonomous decision-making** between chapters (7 decision types with AI + rule guardrails)
- **Bidirectional memory** (recall from prior courses + persist for future ones)
- **Self-improvement** via healing loops with AI diagnosis and adaptive strategy
- **Pre-planning** with AI blueprints and dynamic mid-course replanning
- **Structured reasoning** via ARROW framework and step-by-step thinking instructions
- **Proper SAM integration** via `AgentStateMachine`, goals, plans, tools, memory stores, quality packages

The main areas for improvement are:
1. Semantic/vector search for memory recall
2. User intervention capabilities during generation
3. Cross-course learning from decisions and quality patterns
4. Using more SAM stores (Vector, BehaviorEvent, Pattern, LearningPath)
5. Removing the legacy path and hooks that bypass the agentic pipeline

**This pipeline is among the most sophisticated AI course generation systems. With the gaps addressed above, it would be a best-in-class agentic LMS platform.**
