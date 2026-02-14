# AI Course Creation Pipeline — Complete Technical Reference

> How Taxomind generates an entire course from a single prompt using SAM, Chapter DNA Templates, and a 3-Stage Depth-First Pipeline.

**Last Updated**: February 2026

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [User Journey: The 4-Step Wizard](#2-user-journey-the-4-step-wizard)
3. [Configuration Schema](#3-configuration-schema)
4. [API Route: SSE Streaming Endpoint](#4-api-route-sse-streaming-endpoint)
5. [The Orchestrator: Heart of the Pipeline](#5-the-orchestrator-heart-of-the-pipeline)
6. [Chapter DNA Templates](#6-chapter-dna-templates)
7. [Stage 1: Chapter Generation](#7-stage-1-chapter-generation)
8. [Stage 2: Section Generation](#8-stage-2-section-generation)
9. [Stage 3: Detail Generation](#9-stage-3-detail-generation)
10. [Quality Scoring System](#10-quality-scoring-system)
11. [Parsing, Validation & Fallbacks](#11-parsing-validation--fallbacks)
12. [Category-Specific Prompts](#12-category-specific-prompts)
13. [Cost Estimation](#13-cost-estimation)
14. [Resume Logic: True Continuation](#14-resume-logic-true-continuation)
15. [Memory Persistence](#15-memory-persistence)
16. [SSE Streaming: Real-Time Progress](#16-sse-streaming-real-time-progress)
17. [Goal Tracking Integration](#17-goal-tracking-integration)
18. [Complete Data Flow Diagram](#18-complete-data-flow-diagram)
19. [Architectural Decisions](#19-architectural-decisions)
20. [File Reference Map](#20-file-reference-map)

---

## 1. High-Level Overview

The AI course creation system is a **3-stage depth-first pipeline** that generates pedagogically-sound courses. A single user prompt (title + settings) produces a fully structured course with chapters, sections, lesson content, learning objectives, and practice activities.

**Key characteristics:**
- **Depth-first**: Each chapter is **fully completed** (chapters → sections → details) before moving to the next
- **Template-driven**: Chapter DNA templates enforce level-specific pedagogical structures (8/7/8 sections)
- **Quality-gated**: Every AI output is scored on 5 dimensions with automatic retries
- **Resumable**: Checkpoint-based recovery from any failure point — zero duplicate work
- **Streaming**: Real-time SSE events show live progress to the user

**Pipeline formula:**

```
1 Course = N Chapters
1 Chapter = M Sections (M determined by difficulty template: 8/7/8)
1 Section = 1 Detail (600-1000 words of structured HTML lesson content)

Total AI calls per course = N * (1 + M + M) = N * (1 + 2M)
Example: 8-chapter beginner course = 8 * (1 + 16) = 136 base calls
With 30% retry overhead: ~177 calls, ~45 minutes, ~$3-5 USD
```

---

## 2. User Journey: The 4-Step Wizard

**File:** `app/(protected)/teacher/create/ai-creator/page.tsx`

The user fills out a 4-step wizard:

| Step | Name | What the User Configures | Validation |
|------|------|--------------------------|------------|
| 1 | Course Basics | Title, category, subcategory, short overview | Title >= 10 chars, overview >= 50 chars |
| 2 | Target Audience | Difficulty level, target audience description | Both required |
| 3 | Learning Design | Course goals (freeform), Bloom's focus levels | >= 2 goals, >= 2 Bloom's levels |
| 4 | Review & Create | Chapter count, advanced settings, preview Chapter DNA | All validations pass |

**Step 4** shows a live preview of the Chapter DNA template based on the selected difficulty:
- The section roles (HOOK, INTUITION, etc.) are displayed
- The cost estimate is shown (tokens, time, USD)
- The "Create with SAM" button triggers generation

**After clicking "Create with SAM":**
1. `SequentialCreationModal` opens with a live progress UI
2. The modal calls the SSE API route
3. Progress events update the UI in real-time
4. On completion, the user is redirected to their new course

---

## 3. Configuration Schema

**File:** `lib/sam/course-creation/types.ts` (Lines 365-387)

```typescript
interface SequentialCreationConfig {
  courseTitle: string;
  courseDescription: string;
  targetAudience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  totalChapters: number;           // Default: 8
  sectionsPerChapter: number;      // Overridden by template (8/7/8)
  learningObjectivesPerChapter: number; // Default: 5
  learningObjectivesPerSection: number; // Default: 3
  courseGoals: string[];
  bloomsFocus: BloomsLevel[];      // e.g., ['UNDERSTAND', 'APPLY', 'ANALYZE']
  preferredContentTypes: string[];
  category: string;                // e.g., 'artificial-intelligence'
  subcategory?: string;            // e.g., 'machine-learning'
}
```

**Important:** `sectionsPerChapter` from the config is **always overridden** by the Chapter DNA template. The template is resolved from `difficulty`:
- `beginner` / `expert` (fallback) => 8 sections
- `intermediate` => 7 sections
- `advanced` => 8 sections

---

## 4. API Route: SSE Streaming Endpoint

**File:** `app/api/sam/course-creation/orchestrate/route.ts`

```
POST /api/sam/course-creation/orchestrate
Content-Type: application/json
Response: text/event-stream (Server-Sent Events)
```

### Request Flow:

1. **Authentication**: Verify user session via NextAuth
2. **Subscription gate**: Requires STARTER+ tier
3. **Zod validation**: Validate request body against `SequentialCreationConfig` schema
4. **AI adapter creation**: `createUserScopedAdapter(userId, 'course')` — resolves user's preferred AI provider
5. **SSE stream setup**: Create `ReadableStream` with event encoder
6. **Orchestration**: Call `orchestrateCourseCreation()` (new) or `resumeCourseCreation()` (resume)
7. **Stream events**: `progress`, `stage_start`, `item_generating`, `thinking`, `item_complete`, `stage_complete`, `complete`, `error`

### SSE Event Types:

| Event | When | Data |
|-------|------|------|
| `progress` | Continuously | `{ percentage, message }` |
| `stage_start` | Beginning of Stage 1/2/3 | `{ stage, chapter }` |
| `item_generating` | Before each AI call | `{ stage, chapter, section?, role? }` |
| `thinking` | After AI responds | `{ stage, chapter, thinking }` |
| `item_complete` | After saving to DB | `{ stage, chapter, section?, qualityScore }` |
| `stage_complete` | After stage finishes | `{ stage, chapter }` |
| `complete` | Pipeline done | `{ courseId, stats }` |
| `error` | On failure | `{ message, partial? }` |

---

## 5. The Orchestrator: Heart of the Pipeline

**File:** `lib/sam/course-creation/orchestrator.ts`

**Function:** `orchestrateCourseCreation(options: OrchestrateOptions): Promise<SequentialCreationResult>`

### Initialization Phase

1. **Build CourseContext** from config (title, audience, difficulty, Bloom's, etc.)
2. **Resolve category enhancer** (domain-specific prompt guidance)
3. **Resolve Chapter DNA template** from difficulty
4. **Create/load course record** in database
5. **Initialize SAM Goal + 3-step ExecutionPlan** for tracking
6. **Initialize ConceptTracker** (tracks concepts, vocabulary, skills across chapters)

### The Depth-First Loop

```
for each chapter (1..totalChapters):
  ┌──────────────────────────────────────────────┐
  │  STAGE 1: Generate Chapter                    │
  │  - 1 AI call (with up to 2 retries)          │
  │  - Output: GeneratedChapter                   │
  │  - Save: db.chapter.create()                  │
  │  - Track: concepts, Bloom's progression       │
  ├──────────────────────────────────────────────┤
  │  STAGE 2: Generate All Sections               │
  │  - M AI calls (M = template sections: 8/7/8) │
  │  - Each section gets its template role        │
  │  - Output: GeneratedSection[]                 │
  │  - Save: db.section.create() per section      │
  │  - Checkpoint after all sections done         │
  ├──────────────────────────────────────────────┤
  │  STAGE 3: Generate All Section Details        │
  │  - M AI calls (one per section)               │
  │  - Rich HTML lesson content per section       │
  │  - Output: SectionDetails per section         │
  │  - Save: db.section.update() per section      │
  │  - Per-section checkpoint (mid-chapter safe)  │
  ├──────────────────────────────────────────────┤
  │  CHAPTER COMPLETE                             │
  │  - Build CompletedChapter (full context)      │
  │  - Persist concepts to KnowledgeGraph (bg)    │
  │  - Persist quality scores to Session (bg)     │
  │  - Save chapter-level checkpoint              │
  └──────────────────────────────────────────────┘
  ↓ (CompletedChapter becomes context for NEXT chapter)
```

### Why Depth-First?

**Before (Stage-Batched):** Generate ALL chapters → then ALL sections → then ALL details. The AI generating Chapter 5 knows nothing about what was actually taught in Chapters 1-4's sections.

**After (Depth-First):** Chapter 2's generation knows the **exact section titles, lesson content, and concepts** from Chapter 1. This produces dramatically better coherence and prerequisite tracking.

### Constants

```typescript
const QUALITY_RETRY_THRESHOLD = 60;  // Minimum quality score to accept
const MAX_RETRIES = 2;               // Total attempts: 3 (1 original + 2 retries)
const SECONDS_PER_AI_CALL = 20;      // Average time per call (network + parsing + DB)
```

---

## 6. Chapter DNA Templates

**File:** `lib/sam/course-creation/chapter-templates.ts`

Chapter DNA templates are the **pedagogical backbone** of the pipeline. They enforce a fixed section structure per difficulty level, ensuring every chapter follows a proven teaching arc.

### Template Structures

#### Beginner: 8 Sections (Intuition-Heavy, Analogy-Rich)

| # | Role | Purpose | Content Type | Bloom's |
|---|------|---------|-------------|---------|
| 1 | HOOK | Story/scenario that makes the topic irresistible | reading | REMEMBER |
| 2 | INTUITION | Plain-English def + analogy mapping table + visual + "aha" | reading | UNDERSTAND |
| 3 | WALKTHROUGH | Step-by-step with REAL numbers, 3-5 iterations, pattern emerges | reading | APPLY |
| 4 | FORMALIZATION | Name things already known, formula as TRANSLATION | reading | UNDERSTAND |
| 5 | PLAYGROUND | 3 exercises: guided -> semi-guided -> independent | assignment | APPLY |
| 6 | PITFALLS | Named pitfalls, SAME analogy, misconception buster | reading | ANALYZE |
| 7 | SUMMARY | Key concepts + formula card + backward/forward connections | reading | REMEMBER |
| 8 | CHECKPOINT | Self-assessment + metacognitive reflection + confidence rating | quiz | EVALUATE |

**Design philosophy:** "Target: Smart 14-year-old with zero prior knowledge. Tone: Warm, encouraging. Analogy density: VERY HIGH."

#### Intermediate: 7 Sections (Mechanism-Focused, Derive-From-Scratch)

| # | Role | Purpose | Content Type | Bloom's |
|---|------|---------|-------------|---------|
| 1 | PROVOCATION | Challenge surface understanding with counterintuitive result | reading | ANALYZE |
| 2 | INTUITION_ENGINE | 2-3 mental models + unifying insight | reading | UNDERSTAND |
| 3 | DERIVATION | Motivated math with English translations + intuition checks | reading | ANALYZE |
| 4 | LABORATORY | 5+ exercises: compute, predict-verify, diagnose, compare, design | assignment | APPLY |
| 5 | DEPTH_DIVE | Edge cases, breaking conditions, connections | reading | ANALYZE |
| 6 | SYNTHESIS | Key insights + concept map + backward/forward connections | reading | EVALUATE |
| 7 | CHECKPOINT | Self-assessment L4-L5 + confidence rating | quiz | EVALUATE |

**Design philosophy:** "Target: CS undergraduate who knows basics but not WHY. Tone: Respectful, intellectually stimulating."

#### Advanced: 8 Sections (Research-Grade, Design & Critique)

| # | Role | Purpose | Content Type | Bloom's |
|---|------|---------|-------------|---------|
| 1 | OPEN_QUESTION | Intellectual puzzle, research framing | reading | EVALUATE |
| 2 | INTUITION | One POWERFUL analogy for genuinely counterintuitive ideas | reading | UNDERSTAND |
| 3 | FIRST_PRINCIPLES | Problem -> simplest -> add complexity -> formulation | reading | ANALYZE |
| 4 | ANALYSIS | Formal complexity + expressiveness + limitations | reading | ANALYZE |
| 5 | DESIGN_STUDIO | 4+ challenges L4-L6: analyze, evaluate, create, critique | project | CREATE |
| 6 | FRONTIER | Open questions + key papers + research project idea | reading | CREATE |
| 7 | SYNTHESIS | Design principles + concept map + connections | reading | EVALUATE |
| 8 | CHECKPOINT | Self-assessment L5-L6 + research readiness | quiz | EVALUATE |

**Design philosophy:** "Target: Graduate student or experienced practitioner. Tone: Collegial, direct."

### How INTUITION Differs Per Level

| Level | Section Name | Approach | Analogy Density |
|-------|-------------|----------|-----------------|
| Beginner | INTUITION | ONE analogy fully developed with mapping table + visual + "aha" | VERY HIGH |
| Intermediate | INTUITION_ENGINE | 2-3 DIFFERENT mental models + unifying insight | MODERATE |
| Advanced | INTUITION | ONE powerful analogy for genuinely counterintuitive ideas only | LOW but targeted |

### Template Injection into Prompts

The function `composeTemplatePromptBlocks(template, sectionPosition)` produces 3 blocks:

- **stage1Block**: Injected into Stage 1 prompt. Contains the full section structure, design philosophy, 5 Teaching Laws, chapter checklist, and 11 Universal Consistency Rules.
- **stage2Block**: Injected into Stage 2 prompt. Contains the specific section role, content type, Bloom's levels, word count target, tone, and format rules.
- **stage3Block**: Injected into Stage 3 prompt. Contains the section-type-specific HTML structure, consistency rules, exercise guidance, and the "explain-to-a-friend" test.

### 5 Unbreakable Teaching Laws (All Levels)

1. Never start with a definition — start with a story or question.
2. Never introduce a formula before building intuition for it.
3. Concrete -> Visual -> Abstract (always in this order).
4. Always show what goes wrong before showing what goes right.
5. Always end with the student doing something, not just reading.

### 11 Universal Consistency Rules

1. Every concept introduced MUST be used in at least one exercise within the same chapter.
2. Every formula MUST have a plain-English translation immediately following it.
3. Every "why" question raised MUST be answered within 2 sections.
4. Analogies introduced in early sections MUST be referenced in later sections.
5. Vocabulary introduced MUST be used consistently — never introduce synonyms without explanation.
6. Difficulty MUST increase monotonically within each chapter (easy -> hard).
7. Every chapter MUST end with the student DOING something, not just reading.
8. Code examples MUST be runnable — never use pseudo-code without a real equivalent.
9. Every section MUST reference at least one element from a previous section (backward links).
10. Visual descriptions MUST match the formal definitions exactly — no approximations.
11. Self-assessment questions MUST test the actual content taught, not adjacent topics.

---

## 7. Stage 1: Chapter Generation

**Prompt builder:** `buildStage1Prompt()` in `lib/sam/course-creation/prompts.ts`

### What the AI Receives

- Course context (title, audience, difficulty, goals)
- All previously generated chapters (titles, descriptions, topics, Bloom's levels)
- Completed chapters with **section-level detail** (depth-first advantage)
- Concept tracker (what's been introduced, vocabulary, skills)
- Bloom's progression (how levels escalate across chapters)
- Chapter DNA template (full section structure for this difficulty)
- Category-specific guidance (e.g., "always include runnable code examples" for programming)
- ARROW framework instructions

### What the AI Produces

```json
{
  "thinking": "SAM's 3-5 sentence reasoning about chapter design...",
  "chapter": {
    "position": 3,
    "title": "Middleware Pipeline and Request Lifecycle",
    "description": "Deep dive into how Express.js processes requests through middleware...",
    "bloomsLevel": "ANALYZE",
    "learningObjectives": [
      "Analyze the order of middleware execution in an Express.js application",
      "Differentiate between application-level and router-level middleware",
      "Implement custom error-handling middleware following best practices"
    ],
    "keyTopics": ["Middleware stack", "next() function", "Error handling"],
    "prerequisites": "Chapter 2: Route handlers and HTTP methods",
    "estimatedTime": "1.5-2 hours",
    "topicsToExpand": ["Middleware composition", "Error propagation", "Third-party middleware"],
    "conceptsIntroduced": ["Request pipeline", "Middleware chaining", "Error-first callbacks"]
  }
}
```

### Database Save

```typescript
db.chapter.create({
  data: {
    title, description, position, courseId,
    courseGoals: learningObjectives,
    learningOutcomes: learningObjectives,
    targetBloomsLevel: bloomsLevel,
    sectionCount: effectiveSectionsPerChapter,
    estimatedTime, prerequisites,
    isPublished: false,
  }
});
```

### Concept Tracking

After each chapter is generated:
- New concepts are added to `ConceptTracker.concepts` (Map)
- Key topics are added to `ConceptTracker.vocabulary`
- Bloom's level is added to `bloomsProgression`
- This data feeds into the **next** chapter's prompt for coherence

---

## 8. Stage 2: Section Generation

**Prompt builder:** `buildStage2Prompt()` in `lib/sam/course-creation/prompts.ts`

Runs **M times per chapter** (M = template sections: 8/7/8).

### What the AI Receives

- Everything from Stage 1, plus:
- The generated chapter (title, description, topics, objectives)
- The template section role for this position (e.g., position 3 = WALKTHROUGH for beginner)
- All previously generated sections in this chapter
- All existing section titles across the course (uniqueness enforcement)
- Remaining topics to cover in this chapter

### What the AI Produces

```json
{
  "thinking": "This section serves as THE WALKTHROUGH...",
  "section": {
    "position": 3,
    "title": "Building Your First Middleware Chain",
    "contentType": "reading",
    "estimatedDuration": "15-20 minutes",
    "topicFocus": "Middleware composition and the next() function",
    "parentChapterContext": {
      "title": "Middleware Pipeline and Request Lifecycle",
      "bloomsLevel": "ANALYZE",
      "relevantObjectives": ["Analyze middleware execution order"]
    },
    "conceptsIntroduced": ["Middleware chain", "next() propagation"],
    "conceptsReferenced": ["Route handlers", "HTTP methods"],
    "templateRole": "WALKTHROUGH"
  }
}
```

### Content Type Enforcement

The template fixes the content type per section:
- HOOK, INTUITION, FORMALIZATION, PITFALLS, SUMMARY = `reading`
- PLAYGROUND, LABORATORY = `assignment`
- DESIGN_STUDIO = `project`
- CHECKPOINT = `quiz`

The AI cannot override this — it's enforced in the prompt and validated during parsing.

---

## 9. Stage 3: Detail Generation

**Prompt builder:** `buildStage3Prompt()` in `lib/sam/course-creation/prompts.ts`

Runs **M times per chapter** — one call per section.

### What the AI Receives

- Full course + chapter + section context
- The template's section-type-specific format rules and HTML structure
- Other sections in this chapter (for cross-referencing)
- Cumulative knowledge from prior chapters (depth-first advantage)
- ARROW assessment types for practical activity design

### What the AI Produces

```json
{
  "thinking": "For this WALKTHROUGH section, I need to show 3-5 iterations with real numbers...",
  "details": {
    "description": "<h2>Worked Example</h2><p>Let's build a middleware chain step by step...</p><h3>Iteration 1</h3><ol><li>Create a logger middleware...</li></ol>...",
    "learningObjectives": [
      "Given an Express.js application, implement a 3-layer middleware chain following the request-response pattern",
      "Analyze the execution order of middleware functions using console logging"
    ],
    "keyConceptsCovered": ["Middleware chaining", "next() function", "Request-response cycle"],
    "practicalActivity": "Build a middleware chain with logger, auth, and error handler. Verify execution order by adding console.log timestamps to each layer.",
    "resources": ["Express.js middleware guide", "MDN: HTTP request lifecycle"]
  }
}
```

### HTML Lesson Content

The `description` field contains 600-1000 words of structured HTML. The structure depends on whether a template is active:

**With template (default):** Follows section-type-specific structure. For example, WALKTHROUGH must have:
- 3-5 iterations with real numbers
- Pattern discovery at the end
- Verification step

**Without template (legacy):** Generic 5-section structure:
1. `<h2>Why This Matters</h2>` — Real-world story/scenario
2. `<h2>The Big Picture</h2>` — Contextual connection
3. `<h2>What You Will Learn</h2>` — Key concepts with analogies
4. `<h2>Problems You Can Solve</h2>` — Concrete problems
5. `<h2>Real-World Applications</h2>` — Companies, products, systems

### Database Save

```typescript
db.section.update({
  where: { id: section.id },
  data: {
    description: details.description,
    learningObjectives: details.learningObjectives.join('\n'),
    resourceUrls: details.resources?.join('\n') ?? null
  }
});
```

---

## 10. Quality Scoring System

**File:** `lib/sam/course-creation/helpers.ts`

Every AI output (chapter, section, details) is scored on 5 dimensions before acceptance.

### Scoring Dimensions

| Dimension | What It Measures | Chapter Weight | Section Weight | Details Weight |
|-----------|-----------------|---------------|----------------|----------------|
| Completeness | All required fields present, minimum lengths met | 20% | 20% | 25% |
| Specificity | Not generic, topic-specific language | 15% | 20% | 15% |
| Bloom's Alignment | Objectives use correct Bloom's verb tier | 30% | 20% | 25% |
| Uniqueness | Not duplicating previous content (Jaccard similarity) | 15% | 20% | 15% |
| Depth | Sufficient detail, concepts introduced, word count | 20% | 20% | 20% |

### Quality Gate Flow

```
Generate AI response
       │
       ▼
Parse + Score (5 dimensions → weighted overall)
       │
       ├── Score >= 60 → Accept ✓
       │
       └── Score < 60 → Retry (up to 2 retries)
                │
                ├── Better score? → Keep best
                │
                └── All retries exhausted → Accept best attempt
```

### Example Scoring (Chapter)

```
Completeness: 85  (description 120 words, 5 objectives, 4 topics)
Specificity:  70  (title 28 chars, mentions course topic)
Bloom's:      90  (4/5 objectives use correct verbs)
Uniqueness:   95  (Jaccard < 0.3 with prior chapters)
Depth:        80  (>100 words, 3 concepts, objectives avg 10 words)

Overall = 85*0.20 + 70*0.15 + 90*0.30 + 95*0.15 + 80*0.20
        = 17 + 10.5 + 27 + 14.25 + 16
        = 84.75 → 85 (passes threshold of 60)
```

---

## 11. Parsing, Validation & Fallbacks

### Parsing Flow (All 3 Stages)

```
Raw AI response (string)
       │
       ▼
cleanAIResponse() — Remove markdown fences, trim whitespace
       │
       ▼
JSON.parse() — Extract { thinking, chapter/section/details }
       │
       ├── Success → Validate required fields
       │                    │
       │                    ├── Valid → Normalize (clean titles, ensure arrays, normalize enums)
       │                    │               │
       │                    │               ▼
       │                    │          Score quality → Return typed object
       │                    │
       │                    └── Missing fields → Use defaults + lower quality score
       │
       └── Parse failure → Use fallback generator
                               │
                               ▼
                          buildFallbackChapter() / buildFallbackSection() / buildFallbackDetails()
```

### Fallback Generators

When AI output can't be parsed, fallbacks ensure the pipeline never stops:

- **`buildFallbackChapter(position, courseContext)`**: Generates a chapter based on position and course title
- **`buildFallbackSection(position, chapter, existingTitles)`**: Generates a section with template role
- **`buildFallbackDetails(chapter, section, courseContext, templateDef?)`**: Generates role-appropriate HTML content

The details fallback is **template-aware** — it generates different HTML depending on the section role:
- HOOK: "A Real-World Challenge" story
- INTUITION: Analogy mapping table + "aha" moment
- PLAYGROUND: 3 progressive exercises (guided -> semi -> independent)
- LABORATORY: 5 exercise types (compute, predict-verify, diagnose, compare, design)
- DERIVATION: Step-by-step with English translations + intuition checks
- etc.

Fallback quality scores are set to 50 (below the retry threshold) to flag them for future improvement.

---

## 12. Category-Specific Prompts

**File:** `lib/sam/course-creation/category-prompts/`

15 domain-specific enhancers that add specialized pedagogical guidance:

| Category | Key Guidance |
|----------|-------------|
| Programming | Runnable code examples, debug scenarios, performance considerations |
| Data Science | Dataset examples, visualization descriptions, statistical rigor |
| Mathematics | Proof structure, worked examples, visual representations |
| AI/ML | Model architecture diagrams, training pipeline descriptions |
| Business | Case studies, ROI analysis, stakeholder perspectives |
| etc. | ... |

### Integration

```typescript
const enhancer = getCategoryEnhancer(courseCategory, subcategory);
const categoryPrompt = composeCategoryPrompt(enhancer);
// categoryPrompt.expertiseBlock → injected into system prompt
// categoryPrompt.chapterGuidanceBlock → injected into Stage 1
// categoryPrompt.sectionGuidanceBlock → injected into Stage 2
// categoryPrompt.detailGuidanceBlock → injected into Stage 3
```

---

## 13. Cost Estimation

**File:** `lib/sam/course-creation/cost-estimator.ts`

Before generation begins, the system estimates cost, time, and token usage.

### Base Token Estimates Per Call

| Stage | Input Tokens | Output Tokens | Note |
|-------|-------------|---------------|------|
| Stage 1 (Chapter) | 2,000 | 2,000 | +15% context growth per subsequent chapter |
| Stage 2 (Section) | 1,500 | 1,500 | Per section |
| Stage 3 (Details) | 2,000 | 3,000 | Varies by section type (multiplier) |

### Stage 3 Token Multipliers by Section Type

| Role | Multiplier | Reason |
|------|-----------|--------|
| DESIGN_STUDIO | 1.5x | Complex multi-challenge output |
| DERIVATION | 1.4x | Math-heavy with English translations |
| FIRST_PRINCIPLES | 1.4x | Multi-layer reasoning |
| LABORATORY | 1.3x | 5 exercise prompts |
| WALKTHROUGH | 1.2x | Multi-iteration worked example |
| FORMALIZATION | 1.2x | Formula + mapping |
| ANALYSIS | 1.2x | Formal analysis + comparison table |
| PLAYGROUND | 1.1x | 3 progressive exercises |
| INTUITION_ENGINE | 1.0x | 2-3 mental models |
| DEPTH_DIVE | 1.0x | Edge cases + connections |
| PITFALLS | 0.9x | Named pitfalls, concise |
| FRONTIER | 0.9x | Pointers, not full content |
| INTUITION | 0.8x | One analogy with mapping |
| PROVOCATION | 0.8x | Short provocation |
| OPEN_QUESTION | 0.8x | Question framing |
| HOOK | 0.7x | Brief story |
| CHECKPOINT | 0.7x | Assessment questions |
| SYNTHESIS | 0.7x | Summary + concept map |
| SUMMARY | 0.6x | Concise recap |

### Modifiers

- **Context growth**: +15% per subsequent chapter (accumulating context)
- **Difficulty multiplier**: Beginner 1.0x, Intermediate 1.1x, Advanced 1.2x, Expert 1.3x
- **Bloom's multiplier**: +5% per Bloom's level beyond 2
- **Retry overhead**: +30% for quality gate retries

### Example: 8-Chapter Beginner Course

```
Chapters: 8, Sections/chapter: 8 (beginner template)

Stage 1: 8 AI calls
Stage 2: 8 * 8 = 64 AI calls
Stage 3: 8 * 8 = 64 AI calls
Base calls: 136

With 30% retry overhead: ~177 total calls
Estimated time: 177 * 20s = ~59 min
Estimated cost (DeepSeek): ~$0.15
Estimated cost (Claude): ~$4.50
```

---

## 14. Resume Logic: True Continuation

**File:** `lib/sam/course-creation/orchestrator.ts` — `resumeCourseCreation()`

### Checkpoint Structure

The pipeline saves checkpoints at 3 granularity levels:

| Level | When | What's Saved |
|-------|------|-------------|
| Per-section detail | After each Stage 3 call | Section ID + description saved flag |
| Per-chapter sections | After all Stage 2 calls | All section IDs for chapter |
| Per-chapter complete | After all 3 stages done | Full chapter + sections + details + concept tracker |

### Resume Process

1. **Load checkpoint** from `SAMExecutionPlan.checkpointData`
2. **Verify course** exists and belongs to user
3. **Reconstruct state**: ConceptTracker, bloomsProgression, quality scores, section titles
4. **Build CompletedChapters** from DB (chapters with all sections + details)
5. **Detect partial chapter**: If a chapter has some sections with descriptions and some without, only the ones without are regenerated
6. **Skip completed work**: The orchestrator loop starts at `completedChapterCount + 1`
7. **Skip sections with details**: Stage 3 skips sections that already have descriptions

### What Makes This "True Resume"

- **Zero duplicate AI calls**: Sections with descriptions are skipped entirely
- **Context preserved**: Concept tracker, Bloom's progression, and vocabulary are restored from checkpoint
- **Mid-chapter safe**: Per-section checkpoints mean even a failure mid-chapter loses at most 1 section's work
- **Goal tracking consistent**: SAM Goal is reactivated, ExecutionPlan steps resume where they left off

---

## 15. Memory Persistence

**File:** `lib/sam/course-creation/memory-persistence.ts`

After each chapter completes, two background operations fire (non-blocking):

### Concept Persistence (KnowledgeGraph)

```typescript
persistConceptsBackground(userId, courseId, conceptTracker, stage);
```

- Converts `ConceptTracker.concepts` Map to knowledge graph entities
- Creates edges: `prerequisite_for` relationships between sequential concepts
- Enables: Future course recommendations, prerequisite checking, SAM tutoring context

### Quality Score Persistence (SessionContext)

```typescript
persistQualityScoresBackground(userId, courseId, qualityScores, stage);
```

- Stores average quality per stage
- Enables: Course quality analytics, improvement recommendations, A/B testing

**Fire-and-forget**: Both operations run in the background. Failures are logged but never block course generation.

---

## 16. SSE Streaming: Real-Time Progress

### Server Side (API Route)

Events are emitted via `onSSEEvent` callback throughout the orchestrator:

```typescript
onSSEEvent?.({
  type: 'item_generating',
  data: { stage: 2, chapter: 3, section: 5, role: 'PLAYGROUND' }
});
```

### Client Side

**File:** `hooks/use-sam-sequential-creation.ts`

The hook:
1. Opens a `fetch()` connection to the SSE endpoint
2. Reads the stream chunk by chunk
3. Parses SSE events (`event: type\ndata: {...}\n\n`)
4. Updates React state with progress data
5. Supports cancellation via `AbortController`

### Progress Calculation

```
percentage = (completedItems / totalItems) * 100

totalItems = totalChapters * (1 + 2 * sectionsPerChapter)
           = 8 * (1 + 2*8)
           = 136 for 8-chapter beginner

completedItems increments after each:
  - Chapter generation (+1)
  - Section generation (+1 per section)
  - Detail generation (+1 per section)
```

---

## 17. Goal Tracking Integration

**File:** `lib/sam/course-creation/course-creation-controller.ts`

Every course creation is tracked as a SAM Goal with a 3-step ExecutionPlan:

```
SAM Goal: "Create course: [Course Title]"
  └── ExecutionPlan
       ├── Step 0: "Generate Chapters" (Stage 1)
       ├── Step 1: "Generate Sections" (Stage 2)
       └── Step 2: "Enrich Section Details" (Stage 3)
```

### Lifecycle

| Event | Function | What Happens |
|-------|----------|-------------|
| Start | `initializeCourseCreationGoal()` | Create Goal (ACTIVE) + Plan + 3 Steps |
| Stage begins | `advanceCourseStage()` | Mark step as `in_progress` |
| Stage ends | `completeStageStep()` | Mark step as `completed` + save outputs |
| All done | `completeCourseCreation()` | Mark Goal as `COMPLETED` |
| Failure | `failCourseCreation()` | Mark Goal as `FAILED` + save checkpoint |
| Resume | `reactivateCourseCreation()` | Reactivate Goal + Plan |

Checkpoint data is stored on the ExecutionPlan, enabling resume from any failure point.

---

## 18. Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (Browser)                          │
│                                                                     │
│  AI Creator Wizard (4 steps)                                        │
│  ┌─────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Basics  │→ │ Audience     │→ │ Learning     │→ │ Review &    │ │
│  │ (title, │  │ (difficulty, │  │ (goals,      │  │ Create      │ │
│  │ category)│  │ audience)    │  │ Bloom's)     │  │ (preview)   │ │
│  └─────────┘  └──────────────┘  └──────────────┘  └──────┬──────┘ │
│                                                           │        │
│  SequentialCreationModal ◄────── SSE events ◄─────────────┤        │
│  ┌──────────────────────────────────────────┐             │        │
│  │ ████████████████░░░░░░ 67%               │             │        │
│  │ Generating Chapter 5, THE LABORATORY...  │             │        │
│  │                                          │             │        │
│  │ ✓ Ch1: Foundations (Score: 85)           │             │        │
│  │ ✓ Ch2: Core Concepts (Score: 78)        │             │        │
│  │ ✓ Ch3: Patterns (Score: 82)             │             │        │
│  │ ✓ Ch4: Applications (Score: 91)         │             │        │
│  │ ◌ Ch5: Advanced Topics...               │             │        │
│  └──────────────────────────────────────────┘             │        │
└───────────────────────────────────────────────────────────┼────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                API ROUTE (Server)                                    │
│  POST /api/sam/course-creation/orchestrate                          │
│                                                                     │
│  1. Auth check (NextAuth)                                           │
│  2. Subscription gate (STARTER+)                                    │
│  3. Zod validation                                                  │
│  4. Create AI adapter (user-scoped, respects provider preferences)  │
│  5. SSE stream setup                                                │
│  6. Call orchestrateCourseCreation() or resumeCourseCreation()      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                                      │
│                                                                     │
│  ┌─ INIT ──────────────────────────────────────────────────────┐   │
│  │ - Build CourseContext from config                            │   │
│  │ - Resolve category enhancer (programming, data-science...)  │   │
│  │ - Resolve Chapter DNA template (beginner:8, inter:7, adv:8) │   │
│  │ - Create course in DB (db.course.create)                    │   │
│  │ - Create SAM Goal + 3-step ExecutionPlan                    │   │
│  │ - Initialize ConceptTracker                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ LOOP: For each chapter ────────────────────────────────────┐   │
│  │                                                              │   │
│  │  ┌─ STAGE 1: Chapter ──────────────────────────────────┐   │   │
│  │  │ buildStage1Prompt() → AI call → parse → score       │   │   │
│  │  │ Retry if score < 60 (up to 2 retries, keep best)    │   │   │
│  │  │ db.chapter.create() → track concepts + Bloom's      │   │   │
│  │  │ SSE: item_generating → thinking → item_complete      │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                          │                                  │   │
│  │                          ▼                                  │   │
│  │  ┌─ STAGE 2: Sections (x M) ──────────────────────────┐   │   │
│  │  │ For each section 1..M:                               │   │   │
│  │  │   Get template role (HOOK, DERIVATION, etc.)         │   │   │
│  │  │   buildStage2Prompt() → AI call → parse → score      │   │   │
│  │  │   db.section.create()                                │   │   │
│  │  │   SSE: item_generating → item_complete               │   │   │
│  │  │ Checkpoint: save after all sections done              │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                          │                                  │   │
│  │                          ▼                                  │   │
│  │  ┌─ STAGE 3: Details (x M) ───────────────────────────┐   │   │
│  │  │ For each section:                                    │   │   │
│  │  │   Skip if resuming & already has description         │   │   │
│  │  │   buildStage3Prompt() → AI call → parse → score      │   │   │
│  │  │   db.section.update(description, objectives, etc.)   │   │   │
│  │  │   Per-section checkpoint                             │   │   │
│  │  │   SSE: item_generating → thinking → item_complete    │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                          │                                  │   │
│  │                          ▼                                  │   │
│  │  ┌─ CHAPTER COMPLETE ─────────────────────────────────┐   │   │
│  │  │ Build CompletedChapter (context for next chapter)   │   │   │
│  │  │ persistConceptsBackground() → KnowledgeGraph        │   │   │
│  │  │ persistQualityScoresBackground() → SessionContext    │   │   │
│  │  │ Full chapter checkpoint                             │   │   │
│  │  │ SSE: stage_complete                                 │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ COMPLETE ──────────────────────────────────────────────────┐   │
│  │ Mark SAM Goal as COMPLETED                                  │   │
│  │ Return { courseId, chaptersCreated, sectionsCreated, stats } │   │
│  │ SSE: complete                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                           │
│                                                                     │
│  Course ──< Chapter ──< Section                                     │
│  │           │           ├── title                                  │
│  │           │           ├── description (600-1000 words HTML)      │
│  │           │           ├── learningObjectives                     │
│  │           │           ├── type (reading/assignment/quiz/project) │
│  │           │           └── resourceUrls                          │
│  │           ├── title                                              │
│  │           ├── description                                        │
│  │           ├── targetBloomsLevel                                  │
│  │           ├── learningOutcomes                                   │
│  │           └── sectionCount                                       │
│  ├── title                                                          │
│  ├── difficulty                                                     │
│  ├── courseGoals                                                     │
│  └── categoryId                                                     │
│                                                                     │
│  SAMGoal ──< SAMExecutionPlan ──< SAMPlanStep                      │
│                 └── checkpointData (JSON: full pipeline state)      │
│                                                                     │
│  KnowledgeGraph (concepts + edges)                                  │
│  SessionContext (quality scores)                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 19. Architectural Decisions

### Why Depth-First Instead of Stage-Batched?

| Aspect | Stage-Batched (Before) | Depth-First (Current) |
|--------|----------------------|----------------------|
| Chapter 5 context | Knows only chapter titles 1-4 | Knows every section + lesson from chapters 1-4 |
| Resume granularity | Must restart entire stage | Resume from exact section |
| Coherence | Moderate | High (explicit prerequisite tracking) |
| Memory usage | All chapters in memory | Only current + completed chapters |
| User experience | Long wait, then bulk results | Incremental progress per chapter |

### Why Chapter DNA Templates Instead of Free-Form?

| Aspect | Free-Form (Before) | Template-Driven (Current) |
|--------|-------------------|--------------------------|
| Section count | 3-12 per chapter (inconsistent) | 8/7/8 (deterministic per level) |
| Pedagogical arc | Random ordering | Proven: intuition -> formalization -> practice |
| Content type | AI-chosen | Fixed per role (reading/assignment/quiz/project) |
| Quality | Highly variable | Consistent structure, creative content |

### Why Quality Gates with Retries Instead of Accept-All?

Without quality gates, 15-20% of AI output was generic or off-topic. With quality gates:
- Average quality improved from 58 -> 78
- Retry overhead is only ~30% (most content passes on first attempt)
- The "keep best" strategy means even retries improve quality

### Why Fire-and-Forget Memory Persistence?

KnowledgeGraph writes could fail due to transient DB issues. Making them blocking would reduce reliability. Fire-and-forget ensures 99.8% generation reliability while still capturing data for future use.

---

## 20. File Reference Map

### Core Pipeline

| File | Purpose | Key Functions |
|------|---------|--------------|
| `lib/sam/course-creation/orchestrator.ts` | Main pipeline orchestrator | `orchestrateCourseCreation()`, `resumeCourseCreation()` |
| `lib/sam/course-creation/prompts.ts` | Prompt builders for all 3 stages | `buildStage1Prompt()`, `buildStage2Prompt()`, `buildStage3Prompt()` |
| `lib/sam/course-creation/types.ts` | Type definitions | `SequentialCreationConfig`, `GeneratedChapter`, `GeneratedSection`, `SectionDetails` |
| `lib/sam/course-creation/helpers.ts` | Quality scoring + parsing + fallbacks | `scoreChapter()`, `scoreSection()`, `scoreDetails()`, `buildFallback*()` |
| `lib/sam/course-creation/chapter-templates.ts` | Chapter DNA templates | `getTemplateForDifficulty()`, `composeTemplatePromptBlocks()` |

### API & Client

| File | Purpose |
|------|---------|
| `app/api/sam/course-creation/orchestrate/route.ts` | SSE streaming endpoint |
| `app/(protected)/teacher/create/ai-creator/page.tsx` | 4-step wizard UI |
| `app/(protected)/teacher/create/ai-creator/components/steps/advanced-settings-step.tsx` | Chapter DNA preview + cost estimate |
| `hooks/use-sam-sequential-creation.ts` | Client-side SSE hook |

### Supporting Systems

| File | Purpose |
|------|---------|
| `lib/sam/course-creation/cost-estimator.ts` | Token/cost/time estimation |
| `lib/sam/course-creation/memory-persistence.ts` | Background KnowledgeGraph + SessionContext persistence |
| `lib/sam/course-creation/course-creation-controller.ts` | SAM Goal + ExecutionPlan lifecycle |
| `lib/sam/course-creation/category-prompts/` | 15 domain-specific prompt enhancers |

### Tests

| File | What It Tests |
|------|--------------|
| `__tests__/lib/sam/course-creation/orchestrator.test.ts` | Full pipeline, abort, retry, fallback |
| `__tests__/lib/sam/course-creation/chapter-templates.test.ts` | Template structures, section counts, roles |
| `__tests__/lib/sam/course-creation/cost-estimator.test.ts` | Cost/token/time calculations |
| `__tests__/lib/sam/course-creation/helpers.test.ts` | Quality scoring, parsing, fallbacks |
| `__tests__/lib/sam/course-creation/category-prompts.test.ts` | Category enhancer resolution |

---

*This document describes the pipeline as of February 2026, after the Combined ARROW Course Format update (8/7/8 sections per difficulty level).*
