# AI Creator Pipeline Authentic File-Wise Report

Date: 2026-02-14  
Route audited: `http://localhost:3000/teacher/create/ai-creator`  
Method: direct code audit of pipeline files and integration files; active-vs-legacy wiring validated from imports/usages.

## Ground Truth

- The live generation path is `page.tsx` -> `useSequentialCreation` -> `/api/sam/course-creation/orchestrate` -> `orchestrateCourseCreation` -> `CourseCreationStateMachine` (default) -> `generateSingleChapter` loop and satellite modules.
- This is not "just prompting". It includes planning, memory recall/persist, adaptive retries, critic pass, AI decisioning, replan hooks, checkpoint/resume, healing, and post-reflection.
- It is still a constrained agentic system (agentic inside a predefined course-generation envelope), not a fully open autonomous planner.

## 1) Frontend Route Layer (`app/(protected)/teacher/create/ai-creator`)

Active in live route:

- `page.tsx` — **High** agentic integration. Wires sequential SSE flow (`useSequentialCreation`), resume, chapter regeneration UI, and memory-session telemetry (`samMemory`).  
  Missing: orchestration controls are still user-triggered (no interactive mid-run steering).
- `layout.tsx` — **Low**. Server-side auth/subscription gate only.  
  Missing: none critical.
- `_components/AICreatorLayout.tsx` — **Low**. Shell/header/sidebar layout only.
- `hooks/use-sam-wizard.ts` — **Medium** but mostly wizard-state and analytics. Used for form state/navigation. Contains older blueprint-generation code path not used by current sequential create button.
- `hooks/use-sam-action-handler.ts` — **Low/Medium**. Action application utility; not central to sequential orchestrator.
- `types/sam-creator.types.ts` — **Low**. Shared request/options constants and TS contracts.
- `components/steps/course-basics-step.tsx` — **Low**. Form input step.
- `components/steps/target-audience-step.tsx` — **Low**. Form input step.
- `components/steps/course-structure-step.tsx` — **Low/Medium**. Learning-design config surface (Bloom focus, objectives, structure).
- `components/steps/advanced-settings-step.tsx` — **Medium**. Final review + cost-estimate UI for generation readiness.
- `components/navigation/MobileStepNav.tsx` — **Low**. Navigation and generate action trigger.

Present in folder but not wired into active page render path:

- `components/course-scoring-panel.tsx`
- `components/navigation/VerticalStepper.tsx`
- `components/sam-learning-design-assistance.tsx`
- `components/sam-wizard/enterprise-progress-tracker.tsx`
- `components/sam-wizard/progress-tracker.tsx`
- `components/sam-wizard/simple-progress-tracker.tsx`
- `components/ui/AnimatedBackground.tsx`
- `components/ui/EnhancedButton.tsx`
- `components/ui/FormField.tsx`
- `components/ui/StepSkeleton.tsx`

SAM-wizard support chain (internally wired but not route-critical):

- `components/sam-wizard/sam-assistant-panel.tsx` (re-export surface)
- `components/sam-wizard/sam-assistant-panel-redesigned.tsx`
- `components/sam-wizard/SuggestionHistory.tsx`
- `components/sam-wizard/SAMBottomSheet.tsx`
- `components/sam-wizard/ConfidenceIndicator.tsx`

## 2) Frontend Sequential Runtime Files

- `hooks/use-sam-sequential-creation.ts` — **High**. SSE parser, terminal-event handling, ETA tracking, auto-reconnect, local resume key, DB progress hydration, cancel/reset, chapter regenerate API call.
- `components/sam/sequential-creation-modal.tsx` — **Medium**. Real-time observability UI (stage/progress/thinking/quality/regenerate actions).  
  Missing: no user-in-the-loop approval gate per chapter.

## 3) API Layer (`app/api/sam/course-creation`)

- `orchestrate/route.ts` — **High** as transport/orchestration gateway. Auth + sub gate + validation + SSE streaming + resume delegation.
- `progress/route.ts` — **Medium**. Reads checkpoint from `SAMExecutionPlan` for cross-device resume.
- `regenerate-chapter/route.ts` — **Medium**. Single-chapter regeneration endpoint.
- `estimate-cost/route.ts` — **Low**. Provider-aware cost estimation, not agentic control.
- `stage-1/route.ts` — **Low/Legacy**. Standalone single-stage generation (user-scoped adapter, local parser/scorer).
- `stage-2/route.ts` — **Low/Legacy**. Standalone single-stage generation.
- `stage-3/route.ts` — **Low/Legacy**. Standalone single-stage generation.

Key gap here: stage-1/2/3 routes are not used by the main sequential SSE path and duplicate partial logic.

## 4) Core Orchestration Layer (`lib/sam/course-creation`)

Primary core:

- `orchestrator.ts` — **Very High**. Master flow; default state-machine path; stage generation, critic retry, adaptive feedback loops, memory recall/persist hooks, AI decisions, replan hooks, checkpointing, reflection, healing trigger, enrichment trigger.
- `course-state-machine.ts` — **Very High**. Wraps `AgentStateMachine`; chapter step execution; decision application; skip guardrails; inline healing strategy selection; checkpoint persistence.
- `types.ts` — **Foundational**. Encodes agentic concepts (`AgenticDecision`, `CourseBlueprintPlan`, `CheckpointData`, healing/reflection/SSE event types).
- `prompts.ts` — **High**. Structured system/user prompts for all stages with ARROW, Bloom guidance, memory/blueprint/category/template context injection.

Decisioning/planning/healing/quality:

- `agentic-decisions.ts` — **High**. Rule-based + AI-assisted decision synthesis, action payloads, guardrails, adaptive guidance blocks, bridge-content decision support.
- `course-planner.ts` — **High**. Pre-generation blueprint planning + replan utility.
- `course-reflector.ts` — **Medium/High**. Post-run reflection (rule + AI augmentation).
- `healing-loop.ts` — **High**. Autonomous diagnosis and selective regeneration strategy.
- `adaptive-strategy.ts` — **Medium/High**. Parameter adaptation with bounded heuristics.
- `quality-integration.ts` — **High**. SAM quality + pedagogy pipelines, score blending.
- `quality-feedback.ts` — **Medium**. Structured retry feedback extraction/block generation.
- `self-critique.ts` — **Medium**. Deterministic reasoning-pattern checks feeding retries.
- `chapter-critic.ts` — **Medium/High**. Independent critic persona pass; one extra revision pass if improved.

Memory/checkpoint/regeneration:

- `memory-recall.ts` — **High**. Reads KnowledgeGraph/SessionContext for prior concept and quality patterns.
- `memory-persistence.ts` — **Medium/High**. Background writes to memory stores.
- `checkpoint-manager.ts` — **High** for resilience. Save/retry checkpoint and reconstruct resume state.
- `chapter-regenerator.ts` — **Medium**. Full/partial chapter regeneration tools.

Support modules:

- `chapter-templates.ts` — **Medium**. Deterministic chapter DNA and template block composition.
- `helpers.ts` — **Medium**. Parsing/normalization/scoring/fallback utilities.
- `response-parsers.ts` — **Low/Medium**. Stage response parsing/fallback conversion.
- `streaming-accumulator.ts` — **Medium**. Streaming + thinking extraction.
- `post-creation-enrichment.ts` — **Medium**. Background enrichment via educational engines.
- `course-creation-controller.ts` — **High** infra. Goal/plan/sub-goal lifecycle bridge and metadata writes.
- `experiments.ts` — **Low/Medium**. A/B scaffolding.
- `cost-estimator.ts` — **Low**. Non-agentic estimation utility.
- `index.ts` — **Low** barrel export.

## 5) Category Prompt Files (`lib/sam/course-creation/category-prompts`)

Registry/types:

- `types.ts` — schema for enhancer payloads.
- `registry.ts` — enhancer selection + prompt composition (fuzzy category matching).
- `index.ts` — export surface.

Enhancers audited (all present):

- `general.ts`
- `programming.ts`
- `data-science-ml.ts`
- `data-structures-algorithms.ts`
- `mathematics.ts`
- `engineering.ts`
- `finance-accounting.ts`
- `business-management.ts`
- `design-creative.ts`
- `health-science.ts`
- `language-communication.ts`
- `education.ts`
- `personal-development.ts`
- `music.ts`
- `lifestyle.ts`
- `arts-humanities.ts`

Assessment: strong domain pedagogy coverage and consistent structure, but static knowledge injection (not self-evolving).

## 6) SAM Integration Files (outside course-creation folder)

- `lib/sam/ai-provider.ts` — unified AI entrypoint used by orchestrator path.
- `lib/sam/taxomind-context.ts` — server-only singleton providing stores and adapters.
- `lib/sam/stores/prisma-plan-store.ts` — `PlanStore` implementation on Prisma models.
- `lib/sam/stores/prisma-goal-store.ts` — `GoalStore` implementation on Prisma model.
- `lib/sam/prompts/content-generation-criteria.ts` — shared Bloom/thinking frameworks used by prompts/helpers.
- `lib/sam/multi-agent-coordinator.ts` — coordinator exists; in this pipeline it is touched mainly via critic registration path, not full multi-agent chapter-generation orchestration.

## 7) Authentic "How Agentic Is It?" Verdict

Strengths (real agentic behavior):

- AI-planned blueprint before generation.
- AI + rule hybrid between-chapter decisions.
- Adaptive retry strategy and quality-feedback loops.
- Independent critic persona with revision pass.
- Memory recall from prior runs plus memory persistence.
- State-machine execution with checkpoint/resume.
- Healing loop and targeted regeneration strategies.

Current limits (why not fully autonomous LMS agent yet):

- Execution envelope is still mostly predefined (chapter/section/detail scaffold fixed).
- Multi-agent coordinator is not yet the primary orchestrator for chapter generation.
- Legacy stage endpoints remain and can diverge.
- Memory recall is mostly structured/string-driven, not semantic vector retrieval in this flow.
- Human remains the trigger for start/stop and most policy decisions.

## 8) Missing Capabilities (Concrete)

- Consolidate/remove legacy stage routes or explicitly mark them compatibility-only.
- Add semantic memory retrieval path (vector-assisted concept recall) into `memory-recall.ts`.
- Promote coordinator-level multi-agent deliberation from optional critic role to core planning/evaluation.
- Introduce explicit policy hooks for user-in-the-loop approvals at chapter boundaries.
- Add structured schema validation for model outputs before parse fallback path.
- Persist and analyze decision outcomes across courses (not only per-run metadata).

## Final Score

- Agentic implementation quality: **7.8 / 10**
- SAM portability/alignment quality: **8.2 / 10**
- Prompt/system guidance consistency: **8.5 / 10**
- "Fully autonomous agentic LMS" readiness: **6.8 / 10**

This is a strong agentic course-generation foundation with real SAM integration, but it still behaves as a controlled agentic pipeline rather than a fully open autonomous LMS agent system.
