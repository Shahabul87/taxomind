# SAM Agentic AI Implementation Report

**Date**: January 4, 2026
**Status**: Completed
**Version**: 1.1.0

---

## Executive Summary

This report documents the implementation of critical infrastructure improvements to the SAM Agentic AI system, focusing on build system fixes, goal persistence, and sub-goal persistence with database integration.

---

## Changes Overview

| Category | Task | Status |
|----------|------|--------|
| Build Scripts | Add `@sam-ai/agentic` to build system | ✅ Completed |
| Build Scripts | Add `@sam-ai/agentic` to publish script | ✅ Completed |
| TypeScript | Add path aliases for `@sam-ai/agentic` | ✅ Completed |
| Goal Persistence | Wire GoalStore to agentic-bridge | ✅ Completed |
| Goal Persistence | Add AIAdapter for GoalDecomposer | ✅ Completed |
| Sub-Goal Persistence | Create SubGoalStore interface | ✅ Completed |
| Sub-Goal Persistence | Implement PrismaSubGoalStore | ✅ Completed |
| Sub-Goal Persistence | Wire decompose route to persist | ✅ Completed |
| Plans Integration | Use real sub-goals from database | ✅ Completed |
| Multi-Session | Create PrismaLearningPlanStore | ✅ Completed |
| Multi-Session | Wire LearningPlanStore to agentic-bridge | ✅ Completed |

---

## Detailed Changes

### 1. Build Scripts Fix

#### File: `scripts/sam-build-all.sh`

**Change**: Added `"agentic"` to the PACKAGES array.

```bash
PACKAGES=(
  "core"           # No internal deps
  "quality"        # No internal deps
  "pedagogy"       # No internal deps
  "memory"         # No internal deps
  "safety"         # No internal deps
  "agentic"        # Depends on core (NEW)
  "adapter-prisma" # Depends on core
  "educational"    # Depends on core
  "api"            # Depends on core, educational
  "react"          # Depends on core, educational
)
```

**Impact**: The `@sam-ai/agentic` package is now included in the monorepo build process.

---

#### File: `scripts/publish-sam-packages.sh`

**Change**: Added `"agentic"` to the PACKAGES array.

```bash
PACKAGES=(
  "core"
  "quality"
  "pedagogy"
  "memory"
  "safety"
  "agentic"        # NEW
  "adapter-prisma"
  "educational"
  "api"
  "react"
)
```

**Impact**: The `@sam-ai/agentic` package will be published to npm when running the publish script.

---

### 2. TypeScript Configuration

#### File: `tsconfig.json`

**Change**: Added path aliases for `@sam-ai/agentic`.

```json
{
  "compilerOptions": {
    "paths": {
      "@sam-ai/agentic": ["./packages/agentic/src/index.ts"],
      "@sam-ai/agentic/*": ["./packages/agentic/src/*"]
    }
  }
}
```

**Impact**: TypeScript can now resolve imports from `@sam-ai/agentic` during development.

---

### 3. SubGoalStore Interface

#### File: `packages/agentic/src/goal-planning/types.ts`

**Change**: Added `SubGoalStore` interface and related types.

```typescript
export interface CreateSubGoalInput {
  goalId: string;
  title: string;
  description?: string;
  type: SubGoalType;
  order: number;
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites?: string[];
  successCriteria?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateSubGoalInput {
  title?: string;
  description?: string;
  type?: SubGoalType;
  order?: number;
  estimatedMinutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  prerequisites?: string[];
  successCriteria?: string[];
  status?: StepStatus;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface SubGoalQueryOptions {
  status?: StepStatus[];
  type?: SubGoalType[];
  limit?: number;
  offset?: number;
  orderBy?: 'order' | 'createdAt' | 'estimatedMinutes';
  orderDir?: 'asc' | 'desc';
}

export interface SubGoalStore {
  create(input: CreateSubGoalInput): Promise<SubGoal>;
  createMany(inputs: CreateSubGoalInput[]): Promise<SubGoal[]>;
  get(subGoalId: string): Promise<SubGoal | null>;
  getByGoal(goalId: string, options?: SubGoalQueryOptions): Promise<SubGoal[]>;
  update(subGoalId: string, input: UpdateSubGoalInput): Promise<SubGoal>;
  delete(subGoalId: string): Promise<void>;
  deleteByGoal(goalId: string): Promise<void>;
  markComplete(subGoalId: string): Promise<SubGoal>;
  markFailed(subGoalId: string): Promise<SubGoal>;
  markSkipped(subGoalId: string): Promise<SubGoal>;
}
```

---

#### File: `packages/agentic/src/goal-planning/index.ts`

**Change**: Exported new SubGoalStore types.

```typescript
export {
  // ... existing exports ...
  type SubGoalStore,
  type SubGoalQueryOptions,
  type CreateSubGoalInput,
  type UpdateSubGoalInput,
} from './types';
```

---

### 4. PrismaSubGoalStore Implementation

#### File: `lib/sam/stores/prisma-subgoal-store.ts` (NEW)

**Created**: Full implementation of SubGoalStore interface using Prisma.

**Key Features**:
- CRUD operations for sub-goals
- Batch creation via `createMany()`
- Query filtering by status, type
- Enum mapping between Prisma and agentic types
- Mark complete/failed/skipped status transitions

**Size**: 336 lines

---

#### File: `lib/sam/stores/index.ts`

**Change**: Added exports for PrismaSubGoalStore.

```typescript
// SubGoal Store
export {
  PrismaSubGoalStore,
  createPrismaSubGoalStore,
} from './prisma-subgoal-store';
```

---

### 5. Decompose Route Integration

#### File: `app/api/sam/agentic/goals/[goalId]/decompose/route.ts`

**Changes**:
1. Imported `createPrismaSubGoalStore` and `CreateSubGoalInput`
2. Initialize `subGoalStore` at module level
3. Delete existing sub-goals before re-decomposing
4. Persist decomposed sub-goals to database

```typescript
// Delete existing sub-goals for this goal (if re-decomposing)
await subGoalStore.deleteByGoal(goalId);

// Persist sub-goals to database
const subGoalInputs: CreateSubGoalInput[] = decomposition.subGoals.map(
  (sg, index) => ({
    goalId,
    title: sg.title,
    description: sg.description,
    type: sg.type,
    order: sg.order ?? index,
    estimatedMinutes: sg.estimatedMinutes,
    difficulty: sg.difficulty,
    prerequisites: sg.prerequisites ?? [],
    successCriteria: sg.successCriteria ?? [],
  })
);

const persistedSubGoals = await subGoalStore.createMany(subGoalInputs);
```

---

### 6. Plans Route Integration

#### File: `app/api/sam/agentic/plans/route.ts`

**Changes**:
1. Imported `createPrismaSubGoalStore` and `SubGoal` type
2. Initialize `subGoalStore` at module level
3. Replaced stub single-step decomposition with real sub-goals from database
4. Added validation to require sub-goals exist before plan creation
5. Added helper function `calculateOverallDifficulty()`

**Before (Stub)**:
```typescript
const subGoal: SubGoal = {
  id: `subgoal-${goal.id}-1`,
  goalId: goal.id,
  title: goal.title,
  // ... stub data
};
```

**After (Real Data)**:
```typescript
const subGoals = await subGoalStore.getByGoal(goal.id, {
  orderBy: 'order',
  orderDir: 'asc',
});

if (subGoals.length === 0) {
  return NextResponse.json(
    { error: 'Goal has no sub-goals', message: 'Please decompose first' },
    { status: 400 }
  );
}

const decomposition: GoalDecomposition = {
  goalId: goal.id,
  subGoals: subGoals.map((sg) => ({ /* mapped sub-goal data */ })),
  dependencies: { /* built from prerequisites */ },
  estimatedDuration: subGoals.reduce((sum, sg) => sum + sg.estimatedMinutes, 0),
  difficulty: calculateOverallDifficulty(subGoals),
  confidence: 0.9,
};
```

---

## Multi-Session Tracking Verification

The `PrismaPlanStore` already implements comprehensive multi-session tracking:

### Existing Features in `lib/sam/stores/prisma-plan-store.ts`:

| Feature | Implementation |
|---------|----------------|
| Session Count | `PlanState.sessionCount` |
| Current Session Start | `PlanState.currentSessionStart` |
| Total Active Time | `PlanState.totalActiveTime` |
| Last Active At | `PlanState.lastActiveAt` |
| Completed Steps | `PlanState.completedSteps[]` |
| Failed Steps | `PlanState.failedSteps[]` |
| Skipped Steps | `PlanState.skippedSteps[]` |
| Checkpoints | `saveState()` / `loadState()` |
| Resume Capability | `restoreCheckpoint()` |

### Additional Analytics Stores Available:

- `PrismaLearningSessionStore` - Individual learning session tracking
- `PrismaTopicProgressStore` - Topic-level progress metrics
- `PrismaLearningGapStore` - Gap detection and resolution
- `PrismaSkillAssessmentStore` - Skill level tracking
- `PrismaRecommendationStore` - Personalized recommendations

---

## File Changes Summary

| File | Action | Lines Changed |
|------|--------|---------------|
| `scripts/sam-build-all.sh` | Modified | +1 line |
| `scripts/publish-sam-packages.sh` | Modified | +1 line |
| `tsconfig.json` | Modified | +2 lines |
| `packages/agentic/src/goal-planning/types.ts` | Modified | +50 lines |
| `packages/agentic/src/goal-planning/index.ts` | Modified | +4 lines |
| `lib/sam/stores/prisma-subgoal-store.ts` | Created | 336 lines |
| `lib/sam/stores/index.ts` | Modified | +5 lines |
| `app/api/sam/agentic/goals/[goalId]/decompose/route.ts` | Modified | +25 lines |
| `app/api/sam/agentic/plans/route.ts` | Modified | +45 lines |

**Total**: 9 files modified/created

---

## Verification Results

```
✅ SubGoal type is imported
✅ createPrismaSubGoalStore is imported
✅ subGoalStore.getByGoal is used
✅ Decompose route has subGoalStore
✅ Decompose route persists sub-goals
✅ PrismaSubGoalStore is exported
✅ Build script includes agentic package
✅ Publish script includes agentic package
✅ TSConfig has @sam-ai/agentic path alias
✅ No ESLint errors
```

---

## API Workflow (Updated)

### Before Implementation

```
POST /api/sam/agentic/goals (create goal)
POST /api/sam/agentic/goals/{id}/decompose (AI decomposition - not persisted!)
POST /api/sam/agentic/plans (create plan with stub sub-goal)
```

### After Implementation

```
POST /api/sam/agentic/goals (create goal → persisted to DB)
POST /api/sam/agentic/goals/{id}/decompose (AI decomposition → sub-goals persisted to DB)
POST /api/sam/agentic/plans (reads sub-goals from DB → creates plan)
GET /api/sam/agentic/plans/{id} (returns plan with steps from sub-goals)
```

---

## Next Steps (Remaining from Gap Analysis)

### Portability & Plumbing
- [x] Build script updates
- [x] Goal persistence
- [x] Sub-goal persistence
- [x] Tool handlers implementation ✅ (Jan 3, 2026)
- [x] Vector search integration ✅ (Jan 3, 2026)
- [x] Knowledge graph integration ✅ (Jan 3, 2026)

### Intelligence & Integrations
- [x] Proactive check-in scheduler ✅ (Jan 3, 2026)
- [x] Behavior monitor integration ✅ (Jan 3, 2026)
- [x] Real-time intervention triggers ✅ (Jan 3, 2026)
- [x] External API tool support ✅ (Jan 3, 2026)

---

## Tool Handlers Implementation (Jan 3, 2026)

### New File: `lib/sam/tool-repositories.ts`

Created comprehensive repository implementations for mentor tools:

| Repository | Backing Store | Functions |
|------------|---------------|-----------|
| `createContentRepository()` | Course, Chapter, Section models | `getRelatedContent()`, `searchContent()` |
| `createSessionRepository()` | In-memory cache (Map) | `create()`, `get()`, `update()`, `getByUser()` |
| `createReminderRepository()` | In-memory cache (Map) | `create()`, `get()`, `update()`, `getByUser()`, `delete()` |
| `createNotificationRepository()` | Notification model | `create()`, `get()`, `update()`, `getByUser()`, `markRead()`, `markAllRead()` |
| `createProgressRepository()` | UserProgress, QuizResult, SAMStreak, SAMLearningGoal | `getStudyMetrics()`, `getGoalProgress()` |

### Wiring in `lib/sam/agentic-tooling.ts`

Updated `registerMentorTools()` to wire repositories to mentor tools:

```typescript
const repositories = createToolRepositories();

const tools = createMentorTools({
  aiAdapter: getToolAiAdapter(),
  logger,
  content: {
    contentRepository: repositories.contentRepository,
  },
  scheduling: {
    sessionRepository: repositories.sessionRepository,
    reminderRepository: repositories.reminderRepository,
  },
  notification: {
    notificationRepository: repositories.notificationRepository,
    progressRepository: repositories.progressRepository,
  },
});
```

### Tool Execution Flow

```
POST /api/sam/agentic/tools (invoke tool)
     ↓
ensureToolingInitialized() → registerMentorTools()
     ↓
createToolRepositories() → wire to createMentorTools()
     ↓
toolExecutor.execute() → tool handler uses repositories
     ↓
Repository methods (e.g., contentRepository.searchContent())
     ↓
Prisma queries (Course, Chapter, Section, etc.)
     ↓
Return structured results
```

### Verified Tools with Repositories

| Tool ID | Category | Repository Used |
|---------|----------|-----------------|
| content-generate | content | aiAdapter |
| content-recommend | content | contentRepository |
| content-summarize | content | aiAdapter |
| schedule-session | scheduling | sessionRepository |
| schedule-reminder | scheduling | reminderRepository |
| schedule-optimize | scheduling | sessionRepository |
| schedule-get | scheduling | sessionRepository |
| notification-send | notification | notificationRepository |
| notification-get | notification | notificationRepository |
| notification-mark-read | notification | notificationRepository |
| notification-progress-report | notification | progressRepository |
| notification-achievement | notification | notificationRepository |

---

## Vector Search Integration (Jan 3, 2026)

### New Files Created

| File | Purpose |
|------|---------|
| `lib/sam/providers/openai-embedding-provider.ts` | OpenAI embedding provider implementing `EmbeddingProvider` interface |
| `lib/sam/providers/index.ts` | Provider exports |
| `lib/sam/agentic-vector-search.ts` | Vector search integration for agentic tools |

### OpenAI Embedding Provider

Implements the `EmbeddingProvider` interface from `@sam-ai/agentic`:

```typescript
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  async embed(text: string): Promise<number[]>;
  async embedBatch(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
  getModelName(): string;
}
```

**Features**:
- Uses OpenAI `text-embedding-3-small` model (1536 dimensions)
- Automatic retries with exponential backoff
- Batch processing with configurable batch size
- Text truncation for large inputs

### Vector Search Integration

The `agentic-vector-search.ts` module provides:

| Function | Purpose |
|----------|---------|
| `getAgenticVectorStore()` | Singleton VectorStore with Prisma adapter |
| `searchContent()` | Semantic search for content |
| `findRelatedContent()` | Find similar content to a source |
| `indexContent()` | Index new content for search |
| `indexContentBatch()` | Batch index multiple items |
| `removeIndexedContent()` | Remove indexed content |

### Content Repository Enhancement

Updated `createContentRepository().searchContent()` to use hybrid search:

1. **Semantic Search First**: Uses vector similarity via OpenAI embeddings
2. **Keyword Fallback**: Falls back to database keyword search if vector search returns few results
3. **Result Ranking**: Combined results sorted by relevance score

```typescript
// Semantic search with hybrid fallback
const vectorResults = await vectorSearchContent(query, {
  topK: limit,
  minScore: 0.6,
});

// Supplement with keyword search if needed
if (recommendations.length < limit) {
  const courses = await db.course.findMany({
    where: { title: { contains: query, mode: 'insensitive' } },
  });
  // ... merge and deduplicate
}
```

### Architecture Flow

```
User Query
    ↓
content-recommend tool → contentRepository.searchContent()
    ↓
vectorSearchContent() → VectorStore.search()
    ↓
OpenAIEmbeddingProvider.embed() → Query vector
    ↓
PrismaVectorAdapter.searchByVector() → SAMVectorEmbedding table
    ↓
Cosine similarity calculation → Ranked results
    ↓
Fallback: Prisma keyword search if needed
    ↓
Merged & deduplicated recommendations
```

### Pre-existing Infrastructure Used

| Component | Location |
|-----------|----------|
| `PrismaVectorAdapter` | `lib/sam/stores/prisma-memory-stores.ts` |
| `SAMVectorEmbedding` model | `prisma/schema.prisma` |
| `cosineSimilarity()` | `@sam-ai/agentic` |
| `VectorStore` class | `@sam-ai/agentic` |

---

## Knowledge Graph Integration (Jan 3, 2026)

### New File Created

| File | Purpose |
|------|---------|
| `lib/sam/agentic-knowledge-graph.ts` | Unified API for agentic tools to access knowledge graph capabilities |

### Integration Layer Functions

The `agentic-knowledge-graph.ts` module provides a unified API:

| Function | Purpose |
|----------|---------|
| `getKnowledgeGraphManager()` | Access KG manager from memory system |
| `getKGContentRecommendations()` | Get personalized content recommendations |
| `getKGRelatedContent()` | Get related content for a section |
| `getKGLearningPath()` | Generate personalized learning paths |
| `findKGLearningPath()` | Find optimal path between concepts |
| `getKGUserProfile()` | Get user skill profile for personalization |
| `updateKGUserSkill()` | Update user skill after completing content |
| `buildKGForCourse()` | Build knowledge graph for a course |
| `searchKGEntities()` | Search entities by name pattern |

### Enhanced Content Repository

Updated `tool-repositories.ts` to integrate knowledge graph for personalized recommendations:

```typescript
// If we have user context, use knowledge graph for personalized recommendations
if (context.userId && (context.courseId || context.sectionId)) {
  const kgRecommendations = await getKGContentRecommendations(
    {
      userId: context.userId,
      courseId: context.courseId,
      currentSectionId: context.sectionId,
    },
    {
      limit,
      includePrerequisites: true,
      focusOnWeakAreas: true,
    }
  );
  // Map and return personalized recommendations
}
```

### Recommendation Priority Flow

The enhanced content repository now follows this priority:

1. **Knowledge Graph First**: Personalized recommendations based on user skill profile
2. **KG Related Content**: Related concepts via graph traversal
3. **Database Fallback**: Direct Prisma queries for chapters/sections/courses
4. **Final Ranking**: All results sorted by relevance score

### Pre-existing Infrastructure Used

| Component | Location |
|-----------|----------|
| `PrismaKnowledgeGraphStore` | `lib/sam/stores/prisma-memory-stores.ts` |
| `KnowledgeGraphManager` | `packages/agentic/src/memory/knowledge-graph.ts` |
| `knowledge-graph-service.ts` | `lib/sam/services/knowledge-graph-service.ts` |
| `getAgenticMemorySystem()` | `lib/sam/agentic-memory.ts` |

### Knowledge Graph Service Features

The existing `knowledge-graph-service.ts` provides:

| Function | Purpose |
|----------|---------|
| `buildCourseGraph()` | Builds KG from Course/Chapter/Section entities |
| `getUserSkillProfile()` | Gets user skills, mastered/struggling concepts |
| `updateUserSkill()` | Updates user skill after completing content |
| `generateLearningPath()` | Creates personalized learning path |
| `getRelatedConcepts()` | Finds related concepts via graph traversal |
| `findConceptPath()` | Finds optimal path between two concepts |

### Architecture Flow

```
Content Request
    ↓
contentRepository.getRelatedContent()
    ↓
getKGContentRecommendations() → KnowledgeGraphManager
    ↓
getUserSkillProfile() → User mastery/struggling concepts
    ↓
buildCourseGraph() → Course/Chapter/Section entities
    ↓
rankConceptsByRelevance() → Priority: struggling > in-progress > new
    ↓
Fallback: getKGRelatedContent() → Graph traversal
    ↓
Final Fallback: Direct Prisma queries
    ↓
Merged & sorted recommendations
```

### Personalization Features

The KG integration enables:

1. **Focus on Weak Areas**: Prioritizes concepts the user has struggled with
2. **Progress-Aware**: Considers mastered vs in-progress concepts
3. **Skill Matching**: Recommends concepts matching user level
4. **Prerequisite Awareness**: Respects concept dependencies
5. **Spaced Repetition**: Suggests review for concepts not practiced recently

---

## Proactive Check-In Scheduler (Jan 3, 2026)

### New File Created

| File | Purpose |
|------|---------|
| `lib/sam/agentic-proactive-scheduler.ts` | Unified proactive scheduling service integrating CheckInScheduler with BehaviorMonitor |

### ProactiveScheduler Class

The `ProactiveScheduler` class provides:

| Method | Purpose |
|--------|---------|
| `evaluateAndSchedule()` | Evaluate user context and auto-schedule proactive check-ins |
| `trackBehaviorEvent()` | Track behavior events and trigger immediate interventions |
| `scheduleDailyReminder()` | Schedule recurring daily learning reminders |
| `scheduleWeeklySummary()` | Schedule weekly progress summaries |
| `scheduleProgressCheck()` | Schedule progress check-ins |
| `scheduleMilestoneCelebration()` | Create milestone celebration check-ins |
| `setupNewUserCheckIns()` | Initialize onboarding check-ins for new users |

### Configuration Options

```typescript
interface ProactiveSchedulerConfig {
  defaultChannel?: NotificationChannel;
  enableDailyReminders?: boolean;
  enableWeeklySummary?: boolean;
  enableStreakProtection?: boolean;
  enableInactivityReengagement?: boolean;
  enableStruggleDetection?: boolean;
  inactivityThresholdDays?: number;  // Default: 3
  streakRiskHours?: number;          // Default: 20
}
```

### Automatic Check-In Triggers

The scheduler automatically creates check-ins based on:

| Trigger | Check-In Type | Condition |
|---------|---------------|-----------|
| Streak at risk | `STREAK_RISK` | User hasn't practiced within `streakRiskHours` |
| Inactivity | `INACTIVITY_REENGAGEMENT` | User inactive for `inactivityThresholdDays` |
| Struggle detected | `STRUGGLE_DETECTION` | `struggleProbability > 0.6` from BehaviorMonitor |
| Frustration signals | Immediate intervention | Emotional signal intensity > 0.7 |
| Repeated failures | Content recommendation | 3+ consecutive assessment failures |

### Behavior Monitor Integration

The scheduler integrates with `BehaviorMonitor` for:

1. **Pattern Detection**: Learning habits, time preferences, struggle patterns
2. **Churn Prediction**: Risk scoring with factors and interventions
3. **Struggle Prediction**: Identify struggling areas and recommend support
4. **Emotional Processing**: Detect frustration and trigger break suggestions

### New User Onboarding Flow

```
Day 0: Welcome check-in (immediate)
  ├── Question: What are you most excited to learn?
  └── Actions: Start Learning, Set Goals

Day 1: Follow-up check-in
  ├── Question: How was the difficulty level?
  └── Action: Continue Learning

Day 7: Weekly summary check-in
  ├── Questions: Satisfaction, Focus areas
  └── Actions: View Report, Plan Next Week
```

### Pre-existing Infrastructure Used

| Component | Location |
|-----------|----------|
| `CheckInScheduler` | `packages/agentic/src/proactive-intervention/check-in-scheduler.ts` |
| `BehaviorMonitor` | `packages/agentic/src/proactive-intervention/behavior-monitor.ts` |
| `PrismaCheckInStore` | `lib/sam/stores/prisma-checkin-store.ts` |
| Cron endpoint | `app/api/cron/sam-checkins/route.ts` |
| Check-in API | `app/api/sam/agentic/checkins/route.ts` |
| Trigger evaluation | `app/api/sam/agentic/checkins/evaluate/route.ts` |

### Usage Example

```typescript
import { getProactiveScheduler } from '@/lib/sam/agentic-proactive-scheduler';

// Get singleton instance
const scheduler = getProactiveScheduler();

// Evaluate user and auto-schedule check-ins
const result = await scheduler.evaluateAndSchedule(userId);
// Returns: { scheduled, triggered, interventions, predictions }

// Track a behavior event with immediate intervention check
const { event, immediateActions } = await scheduler.trackBehaviorEvent({
  userId,
  sessionId,
  timestamp: new Date(),
  type: BehaviorEventType.FRUSTRATION_SIGNAL,
  data: {},
  pageContext: { url: '/course/123' },
  emotionalSignals: [{ type: 'frustration', intensity: 0.8, source: 'behavior' }],
});

// Setup new user onboarding
const onboardingCheckIns = await scheduler.setupNewUserCheckIns(userId);
```

---

## External API Tool Support (Jan 3, 2026)

### New File Created

| File | Purpose |
|------|---------|
| `lib/sam/agentic-external-api-tools.ts` | External API tools for web search, dictionary, Wikipedia, calculator, and URL fetching |

### External API Tools Created

The module provides 5 external API tools following the `ToolDefinition` interface:

| Tool ID | Name | Description | APIs Used |
|---------|------|-------------|-----------|
| `external-web-search` | Web Search | Search the web for information | DuckDuckGo Instant Answer API |
| `external-dictionary` | Dictionary Lookup | Word definitions, phonetics, synonyms | Free Dictionary API |
| `external-wikipedia` | Wikipedia Search | Article summaries for educational research | Wikipedia REST API |
| `external-calculator` | Calculator | Evaluate mathematical expressions | Local safe eval (sanitized) |
| `external-url-fetch` | URL Fetch | Fetch text content from URLs | Native fetch with safety checks |

### Tool Factory Function

```typescript
export function createExternalAPITools(
  deps: ExternalAPIToolsDependencies = {}
): ToolDefinition[] {
  // Returns all 5 external API tools configured with:
  // - Category: ToolCategory.EXTERNAL
  // - Rate limiting per user (30 calls/minute base)
  // - Required permissions (READ, EXECUTE)
  // - Zod input/output schemas
}
```

### Configuration Options

```typescript
interface ExternalAPIToolsDependencies {
  webSearchApiKey?: string;      // Optional premium search API
  dictionaryApiKey?: string;     // Optional premium dictionary
  logger?: typeof logger;         // Custom logger
  rateLimitPerMinute?: number;   // Rate limit override (default: 30)
}
```

### Safety Features

Each tool implements comprehensive safety measures:

1. **Input Validation**: Zod schemas validate all inputs
2. **Rate Limiting**: Per-user rate limits via `RateLimit` config
3. **URL Blocking**: Blocks localhost, private IPs for URL fetch
4. **Expression Sanitization**: Calculator only allows safe math operators
5. **Timeout Handling**: 10-second timeout for external requests
6. **Content Filtering**: URL fetch only handles text-based content
7. **Confirmation Required**: URL fetch requires explicit user confirmation

### Rate Limiting Configuration

| Tool | Rate Limit | Reason |
|------|------------|--------|
| Web Search | 30/min | Standard API calls |
| Dictionary | 60/min | Lightweight lookups |
| Wikipedia | 30/min | Standard API calls |
| Calculator | 150/min | No external API, local eval |
| URL Fetch | 15/min | Heavy operation, requires confirmation |

### Wiring in `agentic-tooling.ts`

```typescript
import { createExternalAPITools } from '@/lib/sam/agentic-external-api-tools';

async function registerExternalAPITools(toolRegistry: ToolRegistry): Promise<void> {
  const externalTools = createExternalAPITools({
    logger,
    rateLimitPerMinute: 30,
  });

  for (const tool of externalTools) {
    toolCache.set(tool.id, tool);
    await toolRegistry.register(tool);  // or update if exists
  }
}

export async function ensureToolingInitialized(): Promise<ToolingSystem> {
  const system = getToolingSystem();
  await registerMentorTools(system.toolRegistry);
  await registerExternalAPITools(system.toolRegistry);  // NEW
  return system;
}
```

### Convenience Functions

```typescript
// Get all external API tool IDs
export function getExternalAPIToolIds(): string[] {
  return ['external-web-search', 'external-dictionary', ...];
}

// Check if a tool ID is an external API tool
export function isExternalAPITool(toolId: string): boolean {
  return getExternalAPIToolIds().includes(toolId);
}
```

### Usage Example

```typescript
// Search the web
const searchResult = await toolExecutor.execute(
  'external-web-search',
  userId,
  { query: 'quantum computing basics', maxResults: 5 }
);

// Look up a word
const dictResult = await toolExecutor.execute(
  'external-dictionary',
  userId,
  { word: 'photosynthesis', language: 'en' }
);

// Get Wikipedia summary
const wikiResult = await toolExecutor.execute(
  'external-wikipedia',
  userId,
  { query: 'Theory of Relativity', extractLength: 2000 }
);

// Calculate expression
const calcResult = await toolExecutor.execute(
  'external-calculator',
  userId,
  { expression: 'sqrt(144) + 5^2', precision: 2 }
);

// Fetch URL content (requires confirmation)
const fetchResult = await toolExecutor.execute(
  'external-url-fetch',
  userId,
  { url: 'https://example.com/article.html', maxLength: 5000 }
);
```

### Error Handling

All tools return structured `ToolExecutionResult` with error codes:

| Error Code | Meaning |
|------------|---------|
| `INVALID_INPUT` | Zod validation failed |
| `SEARCH_FAILED` | Web search API error |
| `DICTIONARY_FAILED` | Dictionary API error |
| `WIKIPEDIA_FAILED` | Wikipedia API error |
| `INVALID_EXPRESSION` | Calculator expression not safe |
| `INVALID_RESULT` | Calculator result not a valid number |
| `CALCULATION_FAILED` | General calculation error |
| `BLOCKED_DOMAIN` | URL is localhost/private IP |
| `UNSUPPORTED_CONTENT` | URL returned non-text content |
| `TIMEOUT` | Request exceeded 10 seconds |
| `FETCH_FAILED` | General URL fetch error |

---

## Multi-Session LearningPlanStore Implementation (Jan 4, 2026)

### Issue Identified

The `MultiSessionPlanTracker` was using an in-memory store instead of persistent database storage, as noted in `lib/sam/agentic-bridge.ts`:

```typescript
// Line 349-350 (before fix):
// LearningPlanStore adapter does not exist yet, so keep plan tracker in-memory.
this.planTracker = createMultiSessionPlanTracker({ logger: proactiveLogger });
```

### Solution Implemented

Created `PrismaLearningPlanStore` that implements the `LearningPlanStore` interface from `@sam-ai/agentic`.

### New File Created

| File | Purpose |
|------|---------|
| `lib/sam/stores/prisma-learning-plan-store.ts` | Prisma implementation of LearningPlanStore for multi-session plan tracking |

### Architecture Approach

The `LearningPlan` type has unique properties (`weeklyMilestones`, `dailyTargets`, `difficultyAdjustments`, `paceAdjustments`) that differ from the existing `ExecutionPlan` type. The implementation maps these to the existing `SAMExecutionPlan` Prisma model using JSON fields:

| LearningPlan Field | Storage Location |
|--------------------|------------------|
| `weeklyMilestones` | `schedule` JSON field |
| `dailyTargets` | `schedule` JSON field |
| `difficultyAdjustments` | `schedule` JSON field |
| `paceAdjustments` | `schedule` JSON field |
| `durationWeeks`, `currentWeek`, `currentDay` | `checkpointData` JSON field |
| `title`, `description` | `checkpointData` JSON field |

### LearningPlanStore Interface Implementation

```typescript
export class PrismaLearningPlanStore implements LearningPlanStore {
  async get(id: string): Promise<LearningPlan | null>;
  async getByUser(userId: string): Promise<LearningPlan[]>;
  async getActive(userId: string): Promise<LearningPlan | null>;
  async create(plan: Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningPlan>;
  async update(id: string, updates: Partial<LearningPlan>): Promise<LearningPlan>;
  async delete(id: string): Promise<boolean>;
  async getDailyTarget(planId: string, date: Date): Promise<DailyTarget | null>;
  async updateDailyTarget(planId: string, date: Date, updates: Partial<DailyTarget>): Promise<DailyTarget>;
  async getWeeklyBreakdown(planId: string, weekNumber: number): Promise<WeeklyBreakdown | null>;
}
```

### Wiring in agentic-bridge.ts

Updated `initProactiveInterventions()` method:

```typescript
// Use Prisma LearningPlanStore for persistent multi-session plan tracking
const learningPlanStore = this.usePrismaStores ? createPrismaLearningPlanStore() : undefined;
this.planTracker = createMultiSessionPlanTracker({
  store: learningPlanStore,
  logger: proactiveLogger,
});
```

### Exports Added

Updated `lib/sam/stores/index.ts`:

```typescript
// Multi-Session Learning Plan Store
export {
  PrismaLearningPlanStore,
  createPrismaLearningPlanStore,
} from './prisma-learning-plan-store';
```

### Type Mappings

The implementation handles status mapping between `LearningPlanStatus` (from proactive-intervention) and Prisma enums:

| LearningPlanStatus | Prisma SAMPlanStatus |
|--------------------|----------------------|
| `draft` | `DRAFT` |
| `active` | `ACTIVE` |
| `paused` | `PAUSED` |
| `completed` | `COMPLETED` |
| `abandoned` | `CANCELLED` |

### Benefits

1. **Persistent Plans**: Learning plans now survive server restarts
2. **Multi-Session Tracking**: Weekly milestones and daily targets persist across sessions
3. **Progress Continuity**: `currentWeek`, `currentDay`, and adjustments are preserved
4. **User Session Resume**: Users can resume their learning plans from any device
5. **Analytics Support**: Historical plan data available for analysis

---

## Conclusion

The SAM Agentic AI system now has:

1. **Proper Build Integration**: The `@sam-ai/agentic` package is included in build and publish scripts
2. **Complete Goal Persistence**: Goals are persisted to database via GoalStore
3. **Sub-Goal Persistence**: Sub-goals from AI decomposition are persisted to database
4. **Real Plan Generation**: Plans use actual persisted sub-goals instead of stub data
5. **Multi-Session Support**: Comprehensive session tracking via PlanStore and **LearningPlanStore**
6. **Full Tool Handlers**: All 12 mentor tools now have repository implementations wired
7. **Vector Search Integration**: Semantic search using OpenAI embeddings with Prisma persistence
8. **Knowledge Graph Integration**: Personalized recommendations using graph traversal and user skill profiles
9. **Proactive Check-In Scheduler**: Automatic check-in scheduling based on user behavior and context
10. **Behavior Monitor Integration**: Pattern detection, churn/struggle prediction, emotional processing
11. **Real-Time Intervention Triggers**: Immediate interventions for frustration signals and repeated failures
12. **External API Tool Support**: Web search, dictionary, Wikipedia, calculator, and URL fetching tools
13. **Multi-Session Learning Plan Persistence**: LearningPlanStore for weekly milestones, daily targets, and adaptive adjustments

**All gap analysis items are now complete.** The SAM Agentic AI system is feature-complete for:
- Goal planning and persistence
- Intelligent tool execution with repositories
- Semantic search and knowledge graph integration
- Proactive engagement and behavior monitoring
- External API access for research and learning support
- Multi-session learning plan tracking and persistence

---

*Report generated: January 3, 2026*
*Updated: January 3, 2026 (Tool Handlers Implementation)*
*Updated: January 3, 2026 (Vector Search Integration)*
*Updated: January 3, 2026 (Knowledge Graph Integration)*
*Updated: January 3, 2026 (Proactive Check-In Scheduler)*
*Updated: January 3, 2026 (External API Tool Support)*
*Updated: January 4, 2026 (Multi-Session LearningPlanStore Implementation - ALL GAPS COMPLETE)*
*Author: Claude AI Assistant*
