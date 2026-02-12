# SAM Skill & Tool Integration Pattern

> **MANDATORY READING**: Read this document before creating any new SAM tool, skill, or AI-powered feature that integrates with the SAM agentic pipeline. It defines the 5-layer pattern that every Taxomind-specific AI capability must follow.

---

## Table of Contents

1. [Layer Architecture](#layer-architecture)
2. [The 5-Layer Pattern](#the-5-layer-pattern)
3. [Layer 1: Tool Definition](#layer-1-tool-definition)
4. [Layer 2: Tool Registration](#layer-2-tool-registration)
5. [Layer 3: Auto-Invoke & Mode Affinity](#layer-3-auto-invoke--mode-affinity)
6. [Layer 4: Skill Descriptor](#layer-4-skill-descriptor)
7. [Layer 5: Goal/Plan Tracking & Memory Persistence](#layer-5-goalplan-tracking--memory-persistence)
8. [Existing Tools Reference](#existing-tools-reference)
9. [Step-by-Step Checklist](#step-by-step-checklist)
10. [File Reference Map](#file-reference-map)

---

## Layer Architecture

All SAM skills/tools live in the **Taxomind application layer** (`lib/sam/`), NOT inside `@sam-ai/*` packages. The framework provides reusable interfaces; the app provides business logic.

```
┌─────────────────────────────────────────────────────────────┐
│                   TAXOMIND APPLICATION                       │
│                                                              │
│  lib/sam/tools/            ← Tool implementations            │
│  lib/sam/skills/           ← Skill descriptors (.skill.md)   │
│  lib/sam/tool-planner.ts   ← Auto-invoke & mode affinity     │
│  lib/sam/agentic-tooling.ts← Tool registration               │
│  lib/sam/course-creation/  ← Domain orchestrators            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                   @sam-ai/agentic (FRAMEWORK)                │
│                                                              │
│  ToolDefinition, ToolHandler, ToolExecutionResult            │
│  ToolCategory, PermissionLevel, ConfirmationType             │
│  GoalStatus, PlanStatus                                      │
│  Goal/Plan/KnowledgeGraph store interfaces                   │
└──────────────────────────────────────────────────────────────┘
```

**Key principle**: `@sam-ai/agentic` defines the contracts (interfaces, types, enums). Taxomind implements the business logic (handlers, orchestrators, prompts).

---

## The 5-Layer Pattern

Every SAM skill/tool integration requires 5 layers:

| Layer | File(s) | Purpose |
|-------|---------|---------|
| 1. Tool Definition | `lib/sam/tools/<name>.ts` | Handler logic, input schema, conversational collection |
| 2. Registration | `lib/sam/agentic-tooling.ts` | Register in the global tool registry |
| 3. Auto-Invoke | `lib/sam/tool-planner.ts` | Intent patterns + mode affinity for autonomous triggering |
| 4. Skill Descriptor | `lib/sam/skills/<name>.skill.md` | Human/AI-readable capability description for context injection |
| 5. Goal/Plan + Memory | Domain-specific controller + persistence | SAM Goal tracking, KnowledgeGraph, SessionContext |

---

## Layer 1: Tool Definition

**Location**: `lib/sam/tools/<tool-name>.ts`

### Structure

Every tool file exports two things:
1. A **creator function** that returns a `ToolDefinition`
2. A **handler factory** that returns a `ToolHandler`

### Conversational Tool Pattern

For tools that collect parameters step-by-step (like course-creator, skill-roadmap):

```typescript
import { z } from 'zod';
import {
  type ToolDefinition,
  type ToolHandler,
  type ToolExecutionResult,
  ToolCategory,
  PermissionLevel,
  ConfirmationType,
} from '@sam-ai/agentic';

// 1. Define collection steps
type CollectionStep = 'param1' | 'param2' | 'param3' | 'complete';

// 2. Define input schema (supports both direct and conversational modes)
const InputSchema = z.object({
  // Direct mode: all params provided at once
  param1: z.string().optional(),
  param2: z.string().optional(),
  // Conversational mode: step-by-step collection
  action: z.enum(['start', 'continue', 'generate']).optional(),
  currentStep: z.string().optional(),
  userResponse: z.string().optional(),
  collected: z.record(z.unknown()).optional(),
  conversationId: z.string().optional(),
});

// 3. Create the tool definition
export function createMyTool(): ToolDefinition {
  return {
    id: 'sam-my-tool',
    name: 'My Tool',
    description: 'What this tool does',
    category: ToolCategory.CONTENT, // or ANALYSIS, ASSESSMENT, etc.
    handler: createMyToolHandler(),
    inputSchema: InputSchema,
    requiredPermissions: [PermissionLevel.WRITE, PermissionLevel.EXECUTE],
    confirmationType: ConfirmationType.IMPLICIT,
    enabled: true,
    timeoutMs: 60000,
    maxRetries: 1,
    rateLimit: { maxCalls: 10, windowMs: 3600000, scope: 'user' },
    tags: ['relevant', 'tags'],
  };
}
```

### In-Memory State for Conversations

For multi-step conversational tools, use a TTL-based in-memory store with stateless fallback:

```typescript
// In-memory state with TTL (for serverless resilience, also reconstruct from input)
const STATE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const conversationStates = new Map<string, ConversationState>();

// Always support stateless reconstruction from input.collected
function reconstructState(input: Record<string, unknown>): ConversationState {
  // Rebuild from collected params if in-memory state is lost
}
```

### Handler Return Patterns

```typescript
// Asking a question (conversational step):
return {
  success: true,
  output: {
    type: 'question',
    currentStep: 'param1',
    question: 'What is your preference?',
    options: ['Option A', 'Option B'],
    conversationId,
    collected: { ...collectedSoFar },
  },
  message: 'What is your preference?',
};

// Generation trigger (all params collected):
return {
  success: true,
  output: {
    type: 'generate_feature',
    triggerGeneration: true,
    params: { ...allCollectedParams },
    apiEndpoint: '/api/sam/feature/generate',
  },
  message: 'Starting generation with your parameters...',
};
```

---

## Layer 2: Tool Registration

**Location**: `lib/sam/agentic-tooling.ts`

Add your tool to the standalone tools array:

```typescript
import { createMyTool } from '@/lib/sam/tools/my-tool';

// Inside doRegisterStandaloneTools():
standaloneTools.push(createMyTool());
```

This registers the tool in the global `AgentTool` table so SAM's tool execution pipeline can find it.

---

## Layer 3: Auto-Invoke & Mode Affinity

**Location**: `lib/sam/tool-planner.ts`

### Mode-Tool Affinity

Maps SAM modes to their preferred tools. When a user is in a specific mode, affiliated tools get a score boost during tool selection:

```typescript
const MODE_TOOL_AFFINITY: Record<string, string[]> = {
  'my-mode': ['sam-my-tool'],
  // Also add any alias modes
  'my-mode-alt': ['sam-my-tool'],
};
```

### Auto-Invoke Configuration

Bypasses AI-based tool planning when user intent clearly matches. Uses regex patterns:

```typescript
const MODE_AUTO_INVOKE: Record<string, AutoInvokeConfig> = {
  'my-mode': {
    toolId: 'sam-my-tool',
    intentPatterns: [
      /\b(keyword1|keyword2)\b.*\b(target1|target2)\b/i,
      /\bexact phrase\b/i,
    ],
    defaultInput: { action: 'start' },
  },
};
```

**Important**: Also add input extraction logic in the `checkAutoInvoke()` function if your tool can extract meaningful parameters from the user's message (e.g., course name, skill name).

### How Tool Selection Works

```
User message arrives
  ↓
1. checkAutoInvoke() — regex pattern match → immediate tool invocation (confidence: 0.95)
  ↓ (if no match)
2. scoreTool() — keyword scoring + MODE_TOOL_BOOST for affiliated tools
  ↓
3. selectToolsForPlanning() — top N tools sent to AI for decision
  ↓
4. AI returns { action: 'call_tool', toolId, input, confidence }
  ↓
5. Confidence check (>= 0.55) → invoke tool
```

---

## Layer 4: Skill Descriptor

**Location**: `lib/sam/skills/<name>.skill.md`

A markdown file that describes the skill's capabilities in human/AI-readable format. Gets injected into SAM's system prompt so SAM knows what it can do.

### Template

```markdown
# [Skill Name]

## What It Does
[1-2 sentence description of the capability]

## When to Use
- [Trigger condition 1]
- [Trigger condition 2]
- [Trigger condition 3]

## Capabilities
- [Capability 1 with specifics]
- [Capability 2 with specifics]
- [Quality/validation aspects]

## Required Information
1. [Parameter 1] - [description]
2. [Parameter 2] - [description]
...

## Output
- [What gets created in the database]
- [What the user sees]
```

**Key**: Keep it concise. This gets loaded into token-limited context windows.

---

## Layer 5: Goal/Plan Tracking & Memory Persistence

### Goal/Plan Controller

**Location**: `lib/sam/<domain>/<domain>-controller.ts`

Tracks the lifecycle of the operation as a SAM Goal with an ExecutionPlan:

```typescript
import { getGoalStores } from '@/lib/sam/taxomind-context';
import { GoalStatus, PlanStatus } from '@sam-ai/agentic';

// Create goal + plan at start
export async function initializeGoal(userId, title, entityId) {
  const { goal: goalStore, plan: planStore } = getGoalStores();

  const samGoal = await goalStore.create({
    userId,
    title: `Action: ${title}`,
    status: GoalStatus.ACTIVE,
    priority: 'high',
    context: { entityId, type: 'my-operation' },
  });

  const samPlan = await planStore.create({
    goalId: samGoal.id,
    userId,
    status: PlanStatus.ACTIVE,
    overallProgress: 0,
    steps: [
      { title: 'Step 1', order: 0, status: 'pending', /* ... */ },
      { title: 'Step 2', order: 1, status: 'pending', /* ... */ },
    ],
    // ... other required fields
  });

  return { goalId: samGoal.id, planId: samPlan.id, stepIds: samPlan.steps.map(s => s.id) };
}

// Advance step → in_progress
export async function advanceStage(planId, stepIds, stageNumber) { /* ... */ }

// Complete step
export async function completeStep(planId, stepIds, stageNumber, outputs) { /* ... */ }

// Mark entire operation complete
export async function completeOperation(goalId, planId, stats) { /* ... */ }

// Mark operation failed
export async function failOperation(goalId, planId, errorMessage) { /* ... */ }
```

**Critical**: All controller functions are **non-blocking** (catch errors and log warnings). Goal tracking must never crash the main operation.

### Memory Persistence

**Location**: `lib/sam/<domain>/memory-persistence.ts`

Fire-and-forget background persistence to SAM's memory stores:

```typescript
import { getMemoryStores } from '@/lib/sam/taxomind-context';

// Fire-and-forget — caller does NOT await
export function persistDataBackground(userId, entityId, data, stage): void {
  doPersist(userId, entityId, data, stage).catch(error => {
    logger.warn('[MemoryPersistence] Background persistence failed', { error });
  });
}

async function doPersist(userId, entityId, data, stage): Promise<void> {
  const { knowledgeGraph, sessionContext } = getMemoryStores();

  // Write to KnowledgeGraph (entities + relationships)
  const entity = await knowledgeGraph.createEntity({ type: 'concept', name, properties: { ... } });

  // Write to SessionContext (session state + insights)
  await sessionContext.create({ userId, courseId: entityId, insights: { ... } });
}
```

**Critical**: Memory persistence must NEVER block the main operation. Always fire-and-forget.

### Orchestrator Integration Pattern

Hook the controller + persistence into your domain orchestrator:

```typescript
// At start
const { goalId, planId, stepIds } = await initializeGoal(userId, title, entityId);

// Before each stage
await advanceStage(planId, stepIds, stageNumber);

// After each stage completes
await completeStep(planId, stepIds, stageNumber, [`${count} items`]);
persistDataBackground(userId, entityId, tracker, stageNumber);
persistQualityBackground(userId, entityId, scores.slice(), stageNumber);

// On success
await completeOperation(goalId, planId, stats);
return { success: true, goalId, planId, ... };

// On error (in catch block — goalId/planId must be declared outside try)
await failOperation(goalId, planId, errorMessage);
return { success: false, goalId, planId, error: errorMessage };
```

---

## Existing Tools Reference

| Tool ID | File | Type | Mode |
|---------|------|------|------|
| `sam-course-creator` | `lib/sam/tools/course-creator.ts` | Conversational (7 steps) | `course-creator` |
| `sam-skill-roadmap-generator` | `lib/sam/tools/skill-roadmap-generator.ts` | Conversational (7 steps) | `skill-roadmap-builder` |
| `sam-quiz-grader` | `lib/sam/tools/quiz-grader.ts` | Direct | `exam-builder` |
| `sam-flashcard-generator` | `lib/sam/tools/flashcard-generator.ts` | Direct | `learning-coach` |
| `sam-diagram-generator` | `lib/sam/tools/diagram-generator.ts` | Direct | `blooms-analyzer` |
| `sam-study-timer` | `lib/sam/tools/study-timer.ts` | Direct | `learning-coach` |
| `sam-progress-exporter` | `lib/sam/tools/progress-exporter.ts` | Direct | - |
| `sam-learning-analytics` | `lib/sam/tools/learning-analytics-tool.ts` | Direct | - |

### When to Use Conversational vs Direct

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **Conversational** | 4+ required params, user needs guidance | Course Creator, Skill Roadmap |
| **Direct** | 1-3 params, clear intent from message | Quiz Grader, Flashcard Generator |

---

## Step-by-Step Checklist

When creating a new SAM tool/skill, follow these steps in order:

### 1. Create Tool File
- [ ] Create `lib/sam/tools/<name>.ts`
- [ ] Define input schema with Zod (support both direct + conversational if needed)
- [ ] Implement handler following existing patterns
- [ ] Export `create<Name>Tool()` function returning `ToolDefinition`

### 2. Register Tool
- [ ] Add import in `lib/sam/agentic-tooling.ts`
- [ ] Add `create<Name>Tool()` to `doRegisterStandaloneTools()`

### 3. Configure Auto-Invoke
- [ ] Add mode affinity in `MODE_TOOL_AFFINITY` in `lib/sam/tool-planner.ts`
- [ ] Add auto-invoke config in `MODE_AUTO_INVOKE` with intent regex patterns
- [ ] Add input extraction logic in `checkAutoInvoke()` if applicable

### 4. Create Skill Descriptor
- [ ] Create `lib/sam/skills/<name>.skill.md`
- [ ] Document: What It Does, When to Use, Capabilities, Required Info, Output

### 5. Add Goal/Plan Tracking (if long-running)
- [ ] Create `lib/sam/<domain>/<domain>-controller.ts` with goal/plan lifecycle functions
- [ ] Create `lib/sam/<domain>/memory-persistence.ts` with fire-and-forget background writes
- [ ] Hook both into orchestrator: advance before stage, complete+persist after stage
- [ ] Declare `goalId`/`planId` outside try block for error handler access
- [ ] Add `goalId`/`planId` to result types

### 6. Verify
- [ ] `npm run lint` — 0 errors
- [ ] `npm run typecheck:parallel` — 0 errors
- [ ] Test via SAM chat: send intent message, verify auto-invoke triggers
- [ ] Test conversational flow: walk through all collection steps
- [ ] Test direct mode (if supported): provide all params at once
- [ ] Verify goal/plan records created in database (Prisma Studio)

---

## File Reference Map

| File | Purpose |
|------|---------|
| `lib/sam/tools/*.ts` | Tool implementations (handlers + definitions) |
| `lib/sam/skills/*.skill.md` | Skill capability descriptors (injected into SAM context) |
| `lib/sam/agentic-tooling.ts` | Global tool registration |
| `lib/sam/tool-planner.ts` | Auto-invoke patterns, mode affinity, AI-based tool selection |
| `lib/sam/taxomind-context.ts` | Store access: `getGoalStores()`, `getMemoryStores()` |
| `lib/sam/course-creation/orchestrator.ts` | Reference: full 5-layer integration example |
| `lib/sam/course-creation/course-creation-controller.ts` | Reference: goal/plan lifecycle |
| `lib/sam/course-creation/memory-persistence.ts` | Reference: fire-and-forget memory writes |
| `@sam-ai/agentic` | Framework: ToolDefinition, ToolHandler, GoalStatus, PlanStatus |
| `@sam-ai/core` | Framework: AIAdapter (CoreAIAdapter) |

---

*Last updated: February 2026*
