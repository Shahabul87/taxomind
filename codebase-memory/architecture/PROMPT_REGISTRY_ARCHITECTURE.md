# Prompt Registry Architecture

> **Reference document**: Read this before creating new AI generation profiles, migrating existing routes, or integrating prompt-driven features with the SAM agentic system.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Architecture Overview](#architecture-overview)
3. [How It Fits Into SAM](#how-it-fits-into-sam)
4. [Core Concepts](#core-concepts)
5. [File Structure](#file-structure)
6. [Execution Lifecycle](#execution-lifecycle)
7. [Profile Catalog](#profile-catalog)
8. [Knowledge Modules](#knowledge-modules)
9. [Integration With AI Provider](#integration-with-ai-provider)
10. [Adding a New Profile](#adding-a-new-profile)
11. [Migrating an Existing Route](#migrating-an-existing-route)
12. [Integration With SAM Agentic Tools](#integration-with-sam-agentic-tools)
13. [File Reference Map](#file-reference-map)

---

## Problem Statement

52+ AI generation routes across the codebase each build their own prompts inline. Some have well-organized prompt modules (course creation has `prompts.ts`, depth analysis has a `prompts/` directory), but many hardcode prompts directly. There is no unified mechanism to:

- Load the right prompt + knowledge context + output validation for each task type
- Ensure consistent AI parameters (capability, tokens, temperature) across similar tasks
- Reuse pedagogical frameworks (Bloom&apos;s taxonomy, Gagne&apos;s events) without duplication
- Validate AI output with typed Zod schemas before passing to downstream code

The Prompt Registry solves this with a centralized mapping from **task type** to **typed PromptProfile**, and a single `executeProfile()` function that handles the full AI call lifecycle.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        API ROUTES / SAM TOOLS                           │
│                                                                         │
│  app/api/courses/generate-chapter-content/route.ts                      │
│  app/api/ai/chapter-sections/route.ts                                   │
│  app/api/exams/generate/route.ts                                        │
│  lib/sam/tools/course-creator.ts                                        │
│  lib/sam/course-creation/orchestrator.ts                                │
│                         │                                               │
│                         │  executeProfile({ taskType, input, userId })  │
│                         ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    PROMPT REGISTRY                                 │  │
│  │                  lib/sam/prompt-registry/                          │  │
│  │                                                                    │  │
│  │  index.ts          ← Public API: executeProfile(), listProfiles() │  │
│  │  registry.ts       ← registerProfile(), getProfile(),             │  │
│  │                       composeSystemPrompt()                        │  │
│  │  types.ts          ← PromptProfile<TInput,TOutput>,               │  │
│  │                       PromptTaskType, KnowledgeModule              │  │
│  │                                                                    │  │
│  │  knowledge/        ← Re-exports from canonical sources            │  │
│  │    index.ts           (content-generation-criteria.ts)             │  │
│  │                                                                    │  │
│  │  profiles/         ← One file per task type                       │  │
│  │    chapter-content.ts     course-stage-1.ts                       │  │
│  │    chapter-sections.ts    course-stage-2.ts                       │  │
│  │    exam-generation.ts     course-stage-3.ts                       │  │
│  │    bulk-chapters.ts       skill-roadmap.ts                        │  │
│  │    index.ts (auto-reg)    depth-analysis.ts                       │  │
│  └────────────────────────────┬──────────────────────────────────────┘  │
│                               │                                         │
│                               ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              lib/sam/ai-provider.ts (SINGLE ENTRY POINT)          │  │
│  │                                                                    │  │
│  │  runSAMChatWithMetadata()  ← Called by executeProfile()           │  │
│  │  • User preference resolution                                     │  │
│  │  • Rate limiting by subscription tier                              │  │
│  │  • Circuit breaker + automatic fallback                            │  │
│  │  • Usage tracking with cost estimation                             │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                               │                                         │
│  ┌───────────────────────────▼───────────────────────────────────────┐  │
│  │              lib/ai/enterprise-client.ts                           │  │
│  │              (Provider resolution, SDK adapters)                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## How It Fits Into SAM

The Prompt Registry sits **between** the application layer (routes, tools, orchestrators) and the AI provider layer. It is NOT a SAM package (`@sam-ai/*`); it lives in the Taxomind application layer at `lib/sam/prompt-registry/`.

```
SAM Agentic Pipeline (simplified):

  User message
       │
       ▼
  SAM Orchestrator (lib/sam/agentic-bridge.ts)
       │
       ├── Tool Planner (lib/sam/tool-planner.ts)
       │     └── Selects tool based on intent
       │
       ├── Tool Handler (lib/sam/tools/*.ts)
       │     └── Executes business logic
       │          │
       │          ├── Direct AI call (runSAMChatWithMetadata)  ← OLD way
       │          │
       │          └── executeProfile({ taskType, input })      ← NEW way
       │               │
       │               └── Prompt Registry
       │                    ├── Compose system prompt + knowledge
       │                    ├── Build user prompt from typed input
       │                    ├── Call ai-provider.ts
       │                    ├── Parse JSON + Zod validate
       │                    └── Return typed output
       │
       └── Memory Persistence (lib/sam/agentic-memory.ts)
```

**Key insight**: The Prompt Registry does NOT replace the SAM agentic pipeline. It replaces the inline prompt-building + AI-calling + response-parsing that happens INSIDE tool handlers and API routes. The agentic pipeline (goal tracking, tool planning, memory persistence) continues to operate above it.

---

## Core Concepts

### PromptProfile&lt;TInput, TOutput&gt;

The central type. Each profile bundles everything needed for one AI generation task:

| Field | Type | Purpose |
|-------|------|---------|
| `taskType` | `PromptTaskType` | Unique identifier (e.g. `'chapter-content-generation'`) |
| `description` | `string` | Human-readable purpose |
| `aiParameters` | `AIParameters` | `{ capability, maxTokens, temperature }` |
| `systemPrompt` | `string` | Base system prompt |
| `knowledgeModules` | `string[]` | IDs of knowledge modules to inject |
| `buildUserPrompt` | `(input: TInput) => string` | Builds the user message from typed input |
| `outputSchema` | `z.ZodType<TOutput>` | Zod schema that validates + parses AI output |
| `postValidate?` | `(output, input) => { valid, issues }` | Optional semantic checks beyond Zod |

### PromptTaskType

A union type enumerating all registered task types:

```typescript
type PromptTaskType =
  | 'chapter-content-generation'
  | 'chapter-sections-generation'
  | 'exam-generation'
  | 'bulk-chapters-generation'
  | 'course-stage-1'
  | 'course-stage-2'
  | 'course-stage-3'
  | 'skill-roadmap-generation'
  | 'depth-analysis'
  | 'practice-problems';
```

### KnowledgeModule

A named, reusable context block that gets composed into system prompts:

```typescript
interface KnowledgeModule {
  id: string;       // e.g. 'blooms-taxonomy'
  name: string;     // e.g. "Bloom's Taxonomy Framework"
  content: string;  // The actual text injected into the prompt
}
```

### AIParameters

```typescript
interface AIParameters {
  capability: AICapability;  // 'chat' | 'course' | 'analysis' | 'code' | 'skill-roadmap'
  maxTokens: number;
  temperature: number;
}
```

---

## File Structure

```
lib/sam/prompt-registry/
  types.ts                       # Core type definitions
  registry.ts                    # In-memory registry (register, get, compose, list)
  index.ts                       # Public API: executeProfile() + re-exports
  knowledge/
    index.ts                     # Knowledge modules from canonical sources
  profiles/
    chapter-content.ts           # Phase 1: chapter content generation
    chapter-sections.ts          # Phase 1: chapter sections generation
    exam-generation.ts           # Phase 1: exam question generation
    bulk-chapters.ts             # Phase 1: bulk chapter outlines
    course-stage-1.ts            # Phase 2: wraps buildStage1Prompt()
    course-stage-2.ts            # Phase 2: wraps buildStage2Prompt()
    course-stage-3.ts            # Phase 2: wraps buildStage3Prompt()
    skill-roadmap.ts             # Phase 2: wraps buildComprehensiveRoadmapPrompt()
    depth-analysis.ts            # Phase 2: wraps depth-analysis-v2 prompts
    index.ts                     # Auto-registers all profiles on import
```

---

## Execution Lifecycle

When `executeProfile()` is called, it performs these steps in order:

```
executeProfile({ taskType, input, userId, overrides? })
  │
  ├── 1. LOOKUP: getProfile(taskType) from registry Map
  │
  ├── 2. COMPOSE: composeSystemPrompt(profile)
  │      └── profile.systemPrompt + resolved knowledge module contents
  │
  ├── 3. BUILD: profile.buildUserPrompt(input)
  │      └── Returns the user-facing prompt string
  │
  ├── 4. CALL AI: withRetryableTimeout(runSAMChatWithMetadata({
  │        userId, capability, systemPrompt, messages, maxTokens, temperature
  │      }), TIMEOUT_DEFAULTS.AI_GENERATION)
  │      └── Full enterprise AI pipeline (preferences, rate limit, fallback)
  │
  ├── 5. EXTRACT JSON: regex match for { } or [ ] in response text
  │
  ├── 6. PARSE: profile.outputSchema.safeParse(rawParsed)
  │      └── Zod validation with typed output
  │
  ├── 7. POST-VALIDATE: profile.postValidate?.(data, input)
  │      └── Semantic checks (section count matches, no duplicates, etc.)
  │
  └── 8. RETURN: { data: TOutput, provider: string, model: string }
```

**Error handling**: If any step fails, an error is thrown. The calling route is responsible for catch blocks (template fallback, access error handling, timeout handling).

---

## Profile Catalog

### Phase 1: New Profiles (for routes with inline prompts)

| Task Type | Route | Input | Knowledge Modules |
|-----------|-------|-------|-------------------|
| `chapter-content-generation` | `/api/courses/generate-chapter-content` | `ChapterContentInput` | blooms-taxonomy, chapter-thinking |
| `chapter-sections-generation` | `/api/ai/chapter-sections` | `ChapterSectionsInput` | section-thinking |
| `exam-generation` | `/api/exams/generate` | `ExamGenerationInput` | blooms-taxonomy |
| `bulk-chapters-generation` | (rapid scaffolding) | `BulkChaptersInput` | blooms-taxonomy, chapter-thinking |

### Phase 2: Wrapper Profiles (delegate to existing prompt builders)

| Task Type | Wraps | Existing Module |
|-----------|-------|-----------------|
| `course-stage-1` | `buildStage1Prompt()` | `lib/sam/course-creation/prompts.ts` |
| `course-stage-2` | `buildStage2Prompt()` | `lib/sam/course-creation/prompts.ts` |
| `course-stage-3` | `buildStage3Prompt()` | `lib/sam/course-creation/prompts.ts` |
| `skill-roadmap-generation` | `buildComprehensiveRoadmapPrompt()` | `lib/sam/roadmap-generation/prompt-templates.ts` |
| `depth-analysis` | depth-analysis-v2 prompts | `lib/sam/depth-analysis-v2/prompts/` |

**Key design**: Wrapper profiles delegate `buildUserPrompt()` to the existing prompt builder. They do NOT duplicate the prompt logic. The existing modules remain the source of truth for prompt content.

---

## Knowledge Modules

Knowledge modules are re-exported from **existing canonical sources** to avoid duplication:

| Module ID | Source | Content |
|-----------|--------|---------|
| `blooms-taxonomy` | `lib/sam/prompts/content-generation-criteria.ts` | Serialized `BLOOMS_TAXONOMY` object with all 6 levels |
| `chapter-thinking` | Same file | `CHAPTER_THINKING_FRAMEWORK` string |
| `section-thinking` | Same file | `SECTION_THINKING_FRAMEWORK` string |
| `learning-objectives` | Same file | `LEARNING_OBJECTIVES_FRAMEWORK` string |

When a profile lists `knowledgeModules: ['blooms-taxonomy', 'chapter-thinking']`, the `composeSystemPrompt()` function appends those text blocks after the base `systemPrompt`.

### Adding New Knowledge Modules

To add a new module (e.g. Gagne&apos;s Nine Events from depth-analysis):

1. Identify the canonical source file
2. Export the constant from that file (if not already exported)
3. Add an entry to `KNOWLEDGE_MODULES` array in `knowledge/index.ts`
4. Reference the ID in any profile that needs it

---

## Integration With AI Provider

The Prompt Registry calls `runSAMChatWithMetadata()` from `lib/sam/ai-provider.ts`. This means every `executeProfile()` call automatically gets:

- **User preference resolution** (global + per-capability provider selection)
- **Platform admin controls** (enable/disable providers, maintenance mode)
- **Rate limiting** by subscription tier
- **Usage tracking** with cost estimation
- **Circuit breaker** (5 failures = open, 30s reset)
- **Automatic fallback** to secondary provider
- **3-tier caching** (platform 5min, user 60s, adapters 10min)

The registry does NOT bypass any of these protections. It is a convenience layer ON TOP of the AI provider.

---

## Adding a New Profile

### Step-by-Step Checklist

1. **Define input/output types** with Zod schemas in a new file under `profiles/`
2. **Write the profile** implementing `PromptProfile<TInput, TOutput>`
3. **Call `registerProfile()`** at module scope (bottom of the file)
4. **Import the file** in `profiles/index.ts` to auto-register
5. **Add the task type** to the `PromptTaskType` union in `types.ts`
6. **Add knowledge modules** if the profile needs pedagogical framework context
7. **Run `npm run lint && npm run typecheck:parallel`** to verify

### Example: Adding a Practice Problems Profile

```typescript
// lib/sam/prompt-registry/profiles/practice-problems.ts

import { z } from 'zod';
import { registerProfile } from '../registry';
import type { PromptProfile } from '../types';

export interface PracticeProblemsInput {
  topic: string;
  difficulty: string;
  count: number;
}

const PracticeProblemsSchema = z.array(z.object({
  problem: z.string(),
  solution: z.string(),
  difficulty: z.string(),
  hints: z.array(z.string()),
}));

type PracticeProblems = z.infer<typeof PracticeProblemsSchema>;

const profile: PromptProfile<PracticeProblemsInput, PracticeProblems> = {
  taskType: 'practice-problems',
  description: 'Generates practice problems for a topic',
  aiParameters: { capability: 'course', maxTokens: 3000, temperature: 0.7 },
  systemPrompt: 'You are an expert educator...',
  knowledgeModules: ['blooms-taxonomy'],
  buildUserPrompt: (input) => `Generate ${input.count} practice problems...`,
  outputSchema: PracticeProblemsSchema,
};

registerProfile(profile);
export { profile as practiceProblemsProfile };
```

Then add `import './practice-problems';` to `profiles/index.ts`.

---

## Migrating an Existing Route

### Before (inline prompt pattern)

```typescript
// ~80 lines of prompt/parse/validate
const SYSTEM_PROMPT = `You are an expert...`;
function buildUserPrompt(params) { /* 40 lines */ }
const response = await runSAMChatWithMetadata({...});
const jsonStr = extractJsonObject(response.content);
const parsed = JSON.parse(jsonStr);
if (!validateShape(parsed)) throw new Error('...');
return NextResponse.json(parsed);
```

### After (prompt registry pattern)

```typescript
// ~10 lines
import { executeProfile } from '@/lib/sam/prompt-registry';

const result = await executeProfile({
  taskType: 'chapter-content-generation',
  input: { chapterTitle, sectionCount, ... },
  userId: session.userId,
});
return NextResponse.json(result.data);
```

### What the route KEEPS:
- Authentication (`getCombinedSession()`)
- Rate limiting (`withRateLimit()`)
- Input validation (Zod schema on request body)
- Authorization (ownership check)
- Template fallback (in catch block)
- Timeout / access error handling (in catch block)

### What the route REMOVES:
- Inline `SYSTEM_PROMPT` constant
- Inline `buildUserPrompt()` function
- JSON extraction helpers (`extractJsonObject()`)
- Manual response validation (`validateGeneratedContent()`)
- Direct `runSAMChatWithMetadata()` call
- Direct `withRetryableTimeout()` wrapper (handled by `executeProfile`)

---

## Integration With SAM Agentic Tools

The Prompt Registry can be used inside SAM tool handlers that are part of the agentic pipeline. This is the recommended pattern for tools that need AI generation.

### Example: Course Creator Tool Using Registry

```typescript
// lib/sam/tools/course-creator.ts (handler excerpt)

import { executeProfile } from '@/lib/sam/prompt-registry';
import type { CourseStage1Input } from '@/lib/sam/prompt-registry/profiles/course-stage-1';

async function generateChapter(
  courseContext: CourseContext,
  chapterNumber: number,
  previousChapters: GeneratedChapter[],
  userId: string,
) {
  const result = await executeProfile<CourseStage1Input, Stage1Output>({
    taskType: 'course-stage-1',
    input: {
      courseContext,
      currentChapterNumber: chapterNumber,
      previousChapters,
    },
    userId,
  });

  return result.data.chapter;
}
```

### SAM Tool 5-Layer Pattern Compatibility

The Prompt Registry is compatible with all 5 layers of the SAM Skill & Tool pattern:

| Layer | How Registry Integrates |
|-------|------------------------|
| **1. Tool Definition** | Tool handler calls `executeProfile()` instead of raw AI calls |
| **2. Registration** | No change - tool registration in `agentic-tooling.ts` is unchanged |
| **3. Auto-Invoke** | No change - intent patterns in `tool-planner.ts` are unchanged |
| **4. Skill Descriptor** | Skill `.md` files can reference profile task types for documentation |
| **5. Goal/Plan + Memory** | Goal tracking wraps around `executeProfile()` result, not inside it |

### Flow: SAM Agentic Tool With Prompt Registry

```
User: "Create a course about React hooks"
       │
       ▼
  SAM Orchestrator
       │
       ▼
  Tool Planner → selects 'course-creator' tool
       │
       ▼
  Course Creator Tool Handler
       │
       ├── Creates SAM Goal (via TaxomindContext stores)
       │
       ├── Stage 1 Loop: for each chapter
       │     └── executeProfile({ taskType: 'course-stage-1', input, userId })
       │           ├── Composes prompt with chapter-thinking knowledge
       │           ├── Calls AI via ai-provider.ts
       │           ├── Parses + validates with Stage1OutputSchema
       │           └── Returns typed chapter data
       │
       ├── Stage 2 Loop: for each section
       │     └── executeProfile({ taskType: 'course-stage-2', input, userId })
       │
       ├── Stage 3 Loop: for each section detail
       │     └── executeProfile({ taskType: 'course-stage-3', input, userId })
       │
       ├── Saves to database via Prisma
       │
       └── Updates SAM Goal status to COMPLETED
```

---

## File Reference Map

| File | Purpose |
|------|---------|
| `lib/sam/prompt-registry/types.ts` | Core types: PromptProfile, PromptTaskType, KnowledgeModule, AIParameters |
| `lib/sam/prompt-registry/registry.ts` | In-memory Map + registration/lookup/composition functions |
| `lib/sam/prompt-registry/index.ts` | **Public API**: `executeProfile()`, re-exports |
| `lib/sam/prompt-registry/knowledge/index.ts` | Knowledge modules (re-exported from canonical sources) |
| `lib/sam/prompt-registry/profiles/*.ts` | One profile per AI generation task (9 total) |
| `lib/sam/prompt-registry/profiles/index.ts` | Side-effect imports that auto-register all profiles |
| `lib/sam/ai-provider.ts` | AI provider (called by executeProfile internally) |
| `lib/sam/utils/timeout.ts` | Timeout + retry utilities (used by executeProfile internally) |
| `lib/sam/prompts/content-generation-criteria.ts` | Canonical source for Bloom&apos;s taxonomy + thinking frameworks |
| `lib/sam/course-creation/prompts.ts` | Canonical source for course creation stage prompts |
| `lib/sam/roadmap-generation/prompt-templates.ts` | Canonical source for roadmap generation prompt |
| `lib/sam/depth-analysis-v2/prompts/` | Canonical source for depth analysis prompts |

---

## Design Decisions

### Why an in-memory Map, not a database?

Profiles are code-level constructs with functions (`buildUserPrompt`, `postValidate`) and Zod schemas. They cannot be serialized to a database. The Map is populated at import time via side-effect imports in `profiles/index.ts`.

### Why wrapper profiles instead of replacing existing prompt builders?

Existing prompt builders like `buildStage1Prompt()` are mature, tested, and deeply integrated with the course creation orchestrator. Wrapping them preserves all that logic while making them available through the unified registry API. Routes can adopt incrementally.

### Why does executeProfile throw instead of returning errors?

The calling route already has its own error handling (template fallback, access error responses, timeout handling). Returning errors would force every caller to check a result type. Throwing keeps the API simple and lets callers use their existing catch blocks.

### Why are knowledge modules separate from profiles?

Knowledge modules are reusable across multiple profiles. Bloom&apos;s taxonomy is used by chapter-content, exam-generation, and bulk-chapters. Separating them avoids duplication and ensures a single source of truth.

---

*Last updated: February 2026*
*Related docs: SAM_AGENTIC_ARCHITECTURE.md, SAM_SKILL_TOOL_PATTERN.md*
