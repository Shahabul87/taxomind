# AI Creator Course Generation: File-Wise Authenticated Report + Fix Plan

Date: 2026-02-18  
Scope: `http://localhost:3000/teacher/create/ai-creator`

## 0) Verification Method (No Guessing)
This report is based on direct code inspection of frontend, API routes, orchestrator modules, prompt/template system, and skill-loader system.

Primary flow files verified:
- Frontend page and wizard: `app/(protected)/teacher/create/ai-creator/page.tsx`, `app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts`
- SSE client runtime: `hooks/use-sam-sequential-creation/index.ts`, `hooks/use-sam-sequential-creation/sse-event-handler.ts`, `hooks/use-sam-sequential-creation/sse-stream-reader.ts`
- APIs: `app/api/sam/course-creation/orchestrate/route.ts`, `progress/route.ts`, `dismiss/route.ts`, `regenerate-chapter/route.ts`, `approve/route.ts`, `approve-and-resume/route.ts`, `estimate-cost/route.ts`
- Orchestration pipeline: `lib/sam/course-creation/orchestrator.ts`, `pipeline-runner.ts`, `course-state-machine.ts`, `step-executor-phases.ts`, `chapter-generator.ts`, `checkpoint-manager.ts`, `course-initializer.ts`, `course-creation-controller.ts`, `completion-handler.ts`, `post-processor.ts`
- Prompt/template/skill systems: `lib/sam/course-creation/prompts.ts`, `chapter-templates.ts`, `category-prompts/skill-loader.ts`, `category-prompts/registry.ts`, `category-prompts/skill-schema.ts`, `lib/sam/ai-provider.ts`

---

## 1) How AI Is Creating Courses (Full Pipeline)

### 1.1 Frontend Start/Resume Trigger
- Wizard form is collected in `page.tsx` and mapped into sequential config in:
  - start: `page.tsx:264-285`
  - resume: `page.tsx:343-366`
- Modal + resume banner are rendered in:
  - resume banner: `page.tsx:506-544`
  - modal wiring: `page.tsx:547-560`

### 1.2 Frontend SSE Runtime
- New creation sends `POST /api/sam/course-creation/orchestrate` with `requestId`:
  - `hooks/use-sam-sequential-creation/index.ts:395-456`
- Resume sends same endpoint with `resumeCourseId`:
  - `hooks/use-sam-sequential-creation/index.ts:244-251`
- Auto-reconnect on non-terminal stream end/network errors:
  - `hooks/use-sam-sequential-creation/index.ts:266-341`, `478-560`
- SSE parsing/dispatch:
  - reader: `sse-stream-reader.ts:23-69`
  - event handling: `sse-event-handler.ts`

### 1.3 API Route Layer
- `orchestrate` route does: auth + subscription + rate-limit + request validation + idempotency + SSE stream:
  - auth/subscription/rate: `orchestrate/route.ts:107-123`
  - validation schema: `orchestrate/route.ts:43-63`
  - requestId guard: `orchestrate/route.ts:139-150`
  - in-flight + DB dedupe: `orchestrate/route.ts:154-289`
  - stream and orchestrator call: `orchestrate/route.ts:295-367`
- Resume progress source:
  - `progress/route.ts:54-131`
- Dismiss/Cancel source:
  - `dismiss/route.ts:34-54`
- Chapter regeneration:
  - `regenerate-chapter/route.ts:79-103`

### 1.4 Core Orchestrator and Execution
- Main coordinator:
  - `orchestrator.ts`
- Flow inside orchestrator:
  1. Build `CourseContext` from config (`orchestrator.ts:131-149`)
  2. Resolve category/domain prompt enhancer (`orchestrator.ts:151-166`)
  3. Resolve chapter template (`orchestrator.ts:168-177`)
  4. Optional memory recall (`orchestrator.ts:179-196`)
  5. Optional blueprint planning (`orchestrator.ts:208-245`)
  6. Initialize course/goal/plan/checkpoint for new runs (`orchestrator.ts:411-427`, `course-initializer.ts:72-130`)
  7. Execute pipeline via state machine (`orchestrator.ts:488-521`, `pipeline-runner.ts:111-188`)
  8. Post-processing reflection/healing (`orchestrator.ts:562-569`, `post-processor.ts:56-162`)
  9. Finalize and emit complete (`orchestrator.ts:582-606`, `completion-handler.ts:53-197`)

### 1.5 State Machine Steps Per Chapter
- State machine wrapper: `course-state-machine.ts:124-228`
- Per-step phases:
  - skip -> lifecycle setup -> generate -> lifecycle complete -> memory -> decision -> inline healing -> checkpoint
  - implemented in `step-executor-phases.ts`

### 1.6 Generation Stages
- Stage 1 chapter generation + retries/critique:
  - `chapter-generator.ts:183-340`
- Stage 2 section generation:
  - `chapter-generator.ts:746-1013`
- Stage 3 section detail generation:
  - `chapter-generator.ts:525-744`

---

## 2) How User Prompt and System Prompt Are Applied

### 2.1 Prompt Construction
- Stage prompt builders return `{ systemPrompt, userPrompt }`:
  - Stage 1: `prompts.ts:656-976`
  - Stage 2: `prompts.ts:982-1248`
  - Stage 3: `prompts.ts:1289-1631`
- User form config becomes structured prompt context (title, audience, goals, bloom levels, etc.) in stage user prompts:
  - Stage 1 context block: `prompts.ts:815-826`
  - Stage 2 context block: `prompts.ts:1089-1106`
  - Stage 3 context block: `prompts.ts:1475-1518`

### 2.2 Runtime Application to AI Calls
- Stage 1 actual call includes both:
  - `messages: [{ role: 'user', content: augmentedS1User }]`
  - `systemPrompt: s1System`
  - `chapter-generator.ts:229-240`
- Stage 2 same pattern:
  - `chapter-generator.ts:792-803`
- Stage 3 same pattern:
  - `chapter-generator.ts:582-593`
- Provider pass-through to enterprise client:
  - `ai-provider.ts:79-88`, `144-153`

### 2.3 Prompt Budget Enforcement
- High/medium/low priority sections are trimmed if needed:
  - `prompts.ts` uses `PromptPriority`, `enforceTokenBudget` and returns budget telemetry:
  - Stage1: `prompts.ts:810-975`
  - Stage2: `prompts.ts:1084-1247`
  - Stage3: `prompts.ts:1470-1629`

---

## 3) How AI Is Guided to “Think Like a Professor” + Improvement Need

### 3.1 Current Guidance (Confirmed)
- Core pedagogical identity is explicit:
  - “world’s best professor” and ARROW framework in `COURSE_DESIGN_EXPERTISE`
  - `prompts.ts:92-153`
- It includes Bloom’s, backward design, constructive alignment, cognitive load, spiral curriculum, ABCD objectives:
  - `prompts.ts:85-90`, `140-153`
- Stage-specific thinking steps and strict JSON schemas are enforced:
  - Stage1 thinking/output: `prompts.ts:872-950`
  - Stage2 thinking/output: `prompts.ts:1148-1222`
  - Stage3 thinking/output: `prompts.ts:1534-1605`

### 3.2 Quality Judgment
- The “professor-like” guidance is strong in prompt design.
- But two structural issues reduce realized quality:
  1. Human escalation gate is backend-capable but not fully wired in this UI flow.
  2. User can set very low sections/chapter while template has more required pedagogical roles.

Conclusion: prompting quality is strong; system wiring and guardrails need improvement.

---

## 4) What Template AI Is Using During Course Creation

### 4.1 Template Source and Selection
- Template system: `lib/sam/course-creation/chapter-templates.ts`
- Difficulty templates:
  - beginner = 8 sections (`chapter-templates.ts:741-760`)
  - intermediate = 7 sections (`chapter-templates.ts:762-782`)
  - advanced = 8 sections (`chapter-templates.ts:784-804`)
  - expert maps to advanced (`chapter-templates.ts:820-823`)

### 4.2 Where Template Is Injected
- Orchestrator resolves template:
  - `orchestrator.ts:168-177`
- Prompt block injection by stage:
  - `composeTemplatePromptBlocks(...)` used in chapter generation:
  - Stage1: `chapter-generator.ts:205-213`
  - Stage2: `chapter-generator.ts:762-789`
  - Stage3: `chapter-generator.ts:556-579`

### 4.3 Important Behavior
- Count generation is strict to user-selected `sectionsPerChapter`:
  - orchestrator strict count: `orchestrator.ts:170-171`
  - Stage2 loop uses `effectiveSectionsPerChapter`: `chapter-generator.ts:746`
- Template is currently role/format guidance, not hard chapter-size enforcement.

---

## 5) What Skill AI Is Loading + Is Skill Loading Perfect?

### 5.1 Skill Type in This Pipeline
This is the course-domain skill system (`.skill.md` under `lib/sam/skills/course-domains`), not Codex AGENTS skill files.

### 5.2 Loading and Matching Flow
- Loader reads/parses/validates `.skill.md` files:
  - path source: `skill-loader.ts:22`
  - parse frontmatter (gray-matter): `skill-loader.ts:96`
  - zod validation: `skill-loader.ts:98`, schema in `skill-schema.ts:17-23`
  - markdown H2 section mapping: `skill-loader.ts:62-88`
  - cache: `skill-loader.ts:50-52`, `147-160`
- Registry matches category/subcategory via exact/substring normalization:
  - `registry.ts:32-34`, `118-127`, `157-186`
- Multi-domain blending (primary + secondary):
  - `registry.ts:204-229`
- Prompt block composition from enhancer:
  - `registry.ts:242-293`

### 5.3 Skill Inventory Check
- 16 domain skills present and checked for required headers/frontmatter fields:
  - files under `lib/sam/skills/course-domains/*.skill.md`
- Required sections exist in all inspected files (`Domain Expertise`, `Teaching Methodology`, `Content Type Guidance`, `Quality Criteria`, `Chapter Sequencing Advice`).

### 5.4 Is It Perfect?
No. It is functional but not perfect.
- Matching is heuristic substring only (no confidence score/conflict reporting).
- H2 section name dependency is brittle (renamed headings silently produce empty blocks).
- Invalid skills are skipped with warning logs only (no hard health gate/metric).

---

## 6) Critical Findings (File-Authenticated)

### F1) Escalation gate is not end-to-end wired for AI Creator UI (High)
Evidence:
- Backend supports escalation decisions:
  - `approve/route.ts`, `approve-and-resume/route.ts`
- Pipeline emits pause event when enabled:
  - `step-executor-phases.ts:375-398`
- `SequentialCreationConfig` supports `enableEscalationGate`:
  - `types.ts:430-431`
- But orchestrate request schema does not accept `enableEscalationGate` / `fallbackPolicy`:
  - `orchestrate/route.ts:43-63`
- Frontend page/hook do not send these fields:
  - `page.tsx:268-285`, `349-366`
  - `hooks/use-sam-sequential-creation/index.ts:436-454`, `247-250`
- UI has no approval button flow to call `/approve` or `/approve-and-resume`:
  - search found no frontend calls for these APIs.

### F2) Section-count quality guardrail is weak (High)
Evidence:
- UI allows 2 sections minimum (`course-structure-step.tsx:169-171`)
- Template includes multiple required pedagogical roles (5+ required in some templates).
- Selection logic can truncate required set when target count is too low:
  - `chapter-templates.ts:1015-1021`
Impact:
- Very small chapter structures can remove key pedagogical roles, reducing output quality.

### F3) `chapter_count_adjusted` path appears dead in production flow (Medium)
Evidence:
- Frontend handles event: `sse-event-handler.ts:206-217`
- Type includes event: `types.ts:299`
- No production emission found in runtime code search.
- Blueprint parser can produce `recommendedChapterCount`: `course-planner.ts:231-241`
- Orchestrator still enforces strict user chapter count: `orchestrator.ts:266-267`

### F4) Skill loading is resilient but silently degradable (Medium)
Evidence:
- Invalid skills are only warned and skipped: `skill-loader.ts:99-103`
- Missing markdown section headings default to empty strings: `skill-loader.ts:129-134`
Impact:
- Pedagogical guidance can degrade without failing fast or surfacing quality alarms.

### F5) Pause UX is treated as generic error UX (Medium)
Evidence:
- SSE pause sets phase `paused` but also sets `error`: `sse-event-handler.ts:248-266`
- Modal error state checks `phase==='error' || !!error` and shows Resume/StartOver only:
  - `sequential-creation-modal.tsx:576`, `782-794`
Impact:
- Human review decision workflow is not explicit in UI.

---

## 7) Detailed File-Wise Fix Plan (What + How)

## Priority P0 (Do first)

### P0-A: Wire escalation gate end-to-end
Files:
- `app/api/sam/course-creation/orchestrate/route.ts`
- `hooks/use-sam-sequential-creation/index.ts`
- `app/(protected)/teacher/create/ai-creator/types/sam-creator.types.ts`
- `app/(protected)/teacher/create/ai-creator/components/steps/advanced-settings-step.tsx`
- `app/(protected)/teacher/create/ai-creator/page.tsx`
- `components/sam/sequential-creation-modal.tsx`

Changes:
1. Extend orchestrate request schema to accept:
   - `enableEscalationGate?: boolean`
   - `fallbackPolicy?: { haltRateThreshold?: number; haltOnExcessiveFallbacks?: boolean }`
2. Add these controls to AI Creator form model and advanced settings UI.
3. Send fields from page -> hook -> orchestrate request body for both start and resume.
4. Add modal “Paused for Review” UI when `progress.state.phase === 'paused'` with explicit actions:
   - `Approve & Continue`
   - `Approve & Heal`
   - `Abort`
5. For approve actions, call `POST /api/sam/course-creation/approve-and-resume` and consume returned SSE stream (same parsing pipeline as orchestrate stream).

Verification:
- Manual: force `enableEscalationGate=true` and trigger `quality_flag` -> `pipeline_paused` -> click each action.
- Add integration test for UI-to-API decision loop.

## Priority P1

### P1-A: Add section-count guardrail to protect course quality
Files:
- `app/(protected)/teacher/create/ai-creator/components/steps/course-structure-step.tsx`
- `app/(protected)/teacher/create/ai-creator/components/steps/advanced-settings-step.tsx`
- `lib/sam/course-creation/chapter-templates.ts`

Changes:
1. Compute dynamic minimum sections from template required roles for selected difficulty.
2. Enforce slider minimum to that required minimum (or at least show hard warning if below).
3. In backend, optionally hard-validate `sectionsPerChapter` against this quality floor (defense in depth).

Verification:
- Unit tests for required-min calculation.
- UI test: difficulty change updates allowed slider range.

### P1-B: Normalize paused state UX (separate from generic error)
Files:
- `components/sam/sequential-creation-modal.tsx`
- `hooks/use-sam-sequential-creation/sse-event-handler.ts`

Changes:
1. Add dedicated paused visual state and message card (not plain “Error”).
2. Keep resume/retry for failures, but show approval actions for paused.
3. Preserve quality-flag metadata in state for actionable display.

Verification:
- Component tests for `phase=paused` rendering.

## Priority P2

### P2-A: Remove or complete dead `chapter_count_adjusted` path
Files:
- `lib/sam/course-creation/types.ts`
- `hooks/use-sam-sequential-creation/sse-event-handler.ts`
- `lib/sam/course-creation/orchestrator.ts`
- `lib/sam/course-creation/course-planner.ts`

Choose one approach:
1. If strict user chapter count is final product decision: remove event type + handler + test expectations.
2. If adaptive chapter count is intended: emit event from orchestrator when blueprint recommendation differs and explicitly resolve policy.

Verification:
- SSE contract tests aligned with chosen behavior.

### P2-B: Harden skill loading diagnostics
Files:
- `lib/sam/course-creation/category-prompts/skill-loader.ts`
- `lib/sam/course-creation/category-prompts/registry.ts`

Changes:
1. Add strict section presence validation (`Domain Expertise`, etc.) and explicit warning with missing keys.
2. Emit startup summary metric/log: loaded count, skipped count, skipped file IDs.
3. Add deterministic conflict diagnostics when multiple enhancers match strongly.
4. Replace non-ASCII blend separator (`×`) with ASCII (`x`) for consistency.

Verification:
- Unit tests with malformed skill files and heading variants.

## Priority P3

### P3-A: Make advisory AI tools explicit as optional (not pipeline inputs)
Files:
- `app/(protected)/teacher/create/ai-creator/components/course-scoring-panel.tsx`
- `app/(protected)/teacher/create/ai-creator/components/sam-learning-design-assistance.tsx`

Current state:
1. These components exist but are not imported by `app/(protected)/teacher/create/ai-creator/page.tsx` (no usage found in project search).
2. Their APIs are therefore not part of the active generation runtime for this route.

Changes:
1. Add UI note: these tools suggest data but do not auto-enter generation pipeline until applied to form fields.
2. Add telemetry flag when suggestion is applied vs viewed only.

Verification:
- UX review and analytics event checks.

---

## 8) Additional Notes for “Good Quality Course Generation”

High-impact improvements after P0/P1:
1. Add minimum objective quality validator pre-run (ABCD and Bloom verb checks) before calling orchestrate.
2. Surface prompt-budget truncation warnings to UI when high-priority context gets dropped.
3. Add a final coherence review panel with flagged chapters and one-click chapter regeneration queue.

---

## 9) Final Answer to Your 5 Questions

1. Full pipeline: Wizard -> SSE hook -> orchestrate API -> orchestrator -> state machine -> chapter generator (3 stages) -> post-processing -> completion events -> UI updates. Confirmed by the files listed in sections 1.1–1.6.
2. User/system prompts: Built in `prompts.ts` per stage and passed together in every AI call from `chapter-generator.ts` through `ai-provider.ts`.
3. Professor-like thinking: Strongly encoded in ARROW + instructional frameworks in `prompts.ts`; improvement is mainly in system wiring/guardrails, not lack of pedagogical prompt design.
4. Template used: Difficulty-based Chapter DNA templates from `chapter-templates.ts`; roles/format constraints are injected into prompts; count remains user-driven strict mode.
5. Skill loading: Domain skills load from `.skill.md` via `skill-loader.ts` + `registry.ts`; functional but not perfect due heuristic matching and silent degradation risks.
