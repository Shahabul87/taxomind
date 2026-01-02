# @sam-ai/agentic

Autonomous agentic capabilities for SAM AI Mentor - providing goal planning, tool execution, proactive interventions, self-evaluation, and learning analytics.

## Overview

The `@sam-ai/agentic` package provides six core capabilities that enable SAM AI to function as an autonomous educational mentor:

| Phase | Capability | Description |
|-------|------------|-------------|
| A | Goal Planning | Autonomous goal tracking, decomposition, and execution planning |
| B | Tool Registry | Permissioned action execution with audit logging |
| C | Memory System | Working memory, context management, and persistence |
| D | Proactive Interventions | Context-aware mentor triggers and behavioral monitoring |
| E | Self-Evaluation | Confidence scoring, response verification, and quality tracking |
| F | Learning Analytics | Progress analysis, skill assessment, and recommendations |

## Installation

```bash
npm install @sam-ai/agentic
# or
pnpm add @sam-ai/agentic
```

## Quick Start

```typescript
import {
  createGoalManager,
  createProgressAnalyzer,
  createConfidenceScorer,
  MasteryLevel,
  ConfidenceLevel,
} from '@sam-ai/agentic';

// Create a goal for a student
const goalManager = createGoalManager();
const goal = await goalManager.createGoal({
  userId: 'student-123',
  title: 'Master JavaScript Fundamentals',
  targetDate: new Date('2025-03-01'),
});

// Track learning progress
const analyzer = createProgressAnalyzer();
await analyzer.recordSession({
  userId: 'student-123',
  topicId: 'javascript-basics',
  duration: 45,
  questionsAnswered: 20,
  correctAnswers: 18,
});

// Evaluate response confidence
const scorer = createConfidenceScorer();
const confidence = await scorer.score({
  response: 'A closure is a function that has access to variables from its outer scope...',
  topic: 'javascript-closures',
});

console.log(confidence.level); // 'high' | 'medium' | 'low'
```

## Phase A: Goal Planning

Create, decompose, and track learning goals with intelligent execution planning.

### Creating Goals

```typescript
import { createGoalManager, GoalStatus } from '@sam-ai/agentic';

const manager = createGoalManager();

// Create a learning goal
const goal = await manager.createGoal({
  userId: 'student-123',
  title: 'Learn React Framework',
  description: 'Master React fundamentals and build a project',
  targetDate: new Date('2025-02-15'),
  priority: 'high',
});

// Decompose into sub-goals
const decomposed = await manager.decomposeGoal(goal.id);
console.log(decomposed.subGoals);
// [
//   { title: 'Understand JSX Syntax', estimatedMinutes: 60 },
//   { title: 'Learn Component Lifecycle', estimatedMinutes: 90 },
//   { title: 'Master Hooks', estimatedMinutes: 120 },
//   ...
// ]

// Get active goals
const active = await manager.getGoalsByStatus('student-123', GoalStatus.ACTIVE);
```

### Executing Plans

```typescript
import { createPlanExecutor, PlanStatus } from '@sam-ai/agentic';

const executor = createPlanExecutor();

// Create an execution plan
const plan = await executor.createPlan({
  goalId: goal.id,
  userId: 'student-123',
  dailyMinutes: 30,
});

// Start execution
await executor.startPlan(plan.id);

// Complete a step
await executor.completeStep(plan.id, plan.steps[0].id, {
  actualMinutes: 25,
  notes: 'Completed JSX tutorial',
});

// Get progress
const progress = await executor.getProgress(plan.id);
console.log(progress.completionPercentage); // 15
```

## Phase B: Tool Registry

Register, validate, and execute mentor tools with full audit logging.

### Registering Tools

```typescript
import { createToolRegistry, createToolExecutor } from '@sam-ai/agentic';

const registry = createToolRegistry();

// Register a custom tool
registry.registerTool({
  name: 'generate_quiz',
  description: 'Generate a quiz for a topic',
  category: 'assessment',
  parameters: {
    topicId: { type: 'string', required: true },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    questionCount: { type: 'number', default: 10 },
  },
  handler: async (params) => {
    // Generate quiz logic
    return { questions: [...] };
  },
  permissions: ['student', 'teacher'],
  rateLimit: { maxCalls: 10, windowMs: 60000 },
});
```

### Executing Tools

```typescript
const executor = createToolExecutor({ registry });

// Execute a tool
const result = await executor.execute({
  toolName: 'generate_quiz',
  params: {
    topicId: 'javascript-arrays',
    difficulty: 'medium',
    questionCount: 5,
  },
  userId: 'student-123',
  context: { courseId: 'course-456' },
});

if (result.success) {
  console.log(result.result); // Quiz questions
} else {
  console.error(result.error);
}
```

## Phase C: Memory System

Manage conversation memory, context windows, and persistent storage.

### Working Memory

```typescript
import { createMemoryManager } from '@sam-ai/agentic';

const memory = createMemoryManager({
  maxContextTokens: 4000,
  summaryThreshold: 3000,
});

// Add to memory
await memory.add({
  role: 'user',
  content: 'Explain closures in JavaScript',
  timestamp: new Date(),
});

await memory.add({
  role: 'assistant',
  content: 'A closure is a function that...',
  timestamp: new Date(),
});

// Get context for next request
const context = await memory.getContext();

// Summarize when context is large
if (memory.shouldSummarize()) {
  await memory.summarize();
}
```

## Phase D: Proactive Interventions

Monitor behavior, schedule check-ins, and trigger timely interventions.

### Behavior Monitoring

```typescript
import { createBehaviorMonitor, BehaviorEventType } from '@sam-ai/agentic';

const monitor = createBehaviorMonitor();

// Record user behavior
await monitor.recordEvent({
  userId: 'student-123',
  type: BehaviorEventType.PAGE_VIEW,
  data: {
    pageId: 'lesson-arrays',
    duration: 300,
    scrollDepth: 0.8,
  },
});

// Check for interventions
const interventions = await monitor.checkInterventions({
  userId: 'student-123',
  context: {
    currentTopic: 'arrays',
    sessionDuration: 45,
    mistakeCount: 5,
  },
});

// Handle interventions
for (const intervention of interventions) {
  if (intervention.type === 'STRUGGLE_DETECTED') {
    // Show help or hint
  }
}
```

### Check-In Scheduling

```typescript
import { createCheckInScheduler, CheckInType } from '@sam-ai/agentic';

const scheduler = createCheckInScheduler();

// Schedule a check-in
await scheduler.scheduleCheckIn({
  userId: 'student-123',
  type: CheckInType.PROGRESS_CHECK,
  scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  questions: [
    { text: 'How are you feeling about the material?', type: 'scale' },
    { text: 'What topics need more review?', type: 'text' },
  ],
});

// Get pending check-ins
const pending = await scheduler.getPendingCheckIns('student-123');
```

## Phase E: Self-Evaluation

Score confidence, verify responses, and track quality metrics.

### Confidence Scoring

```typescript
import { createConfidenceScorer, ConfidenceLevel } from '@sam-ai/agentic';

const scorer = createConfidenceScorer();

// Score a response
const score = await scorer.score({
  response: 'The time complexity of binary search is O(log n)...',
  topic: 'algorithms',
  questionType: 'explanation',
  sources: ['textbook', 'course-notes'],
});

console.log(score.level);    // ConfidenceLevel.HIGH
console.log(score.overall);  // 0.92
console.log(score.factors);  // Details about confidence factors
```

### Response Verification

```typescript
import { createResponseVerifier, VerificationStatus } from '@sam-ai/agentic';

const verifier = createResponseVerifier();

// Verify accuracy
const result = await verifier.verify({
  response: 'Quick sort has O(n) average time complexity',
  topic: 'algorithms',
  sources: ['algorithm-textbook'],
});

if (result.status === VerificationStatus.ISSUES_FOUND) {
  console.log(result.issues);
  // [{ type: 'FACTUAL_ERROR', description: 'Quick sort has O(n log n) average complexity' }]
  console.log(result.suggestions);
  // [{ correctedContent: '...' }]
}
```

### Quality Tracking

```typescript
import { createQualityTracker } from '@sam-ai/agentic';

const tracker = createQualityTracker();

// Record quality metrics
await tracker.recordMetric({
  responseId: 'resp-123',
  userId: 'student-123',
  metrics: {
    accuracy: 0.95,
    helpfulness: 0.88,
    clarity: 0.92,
  },
  feedback: {
    studentRating: 5,
    wasHelpful: true,
  },
});

// Get quality summary
const summary = await tracker.getSummary('student-123', 'weekly');
console.log(summary.averageAccuracy);   // 0.93
console.log(summary.averageHelpfulness); // 0.90
```

## Phase F: Learning Analytics

Track progress, assess skills, and generate personalized recommendations.

### Progress Analysis

```typescript
import { createProgressAnalyzer, TimePeriod } from '@sam-ai/agentic';

const analyzer = createProgressAnalyzer();

// Record a learning session
await analyzer.recordSession({
  userId: 'student-123',
  topicId: 'javascript-functions',
  duration: 45,
  questionsAnswered: 20,
  correctAnswers: 17,
  conceptsCovered: ['arrow-functions', 'callbacks', 'closures'],
  focusScore: 0.85,
});

// Analyze trends
const trends = await analyzer.analyzeTrends('student-123', TimePeriod.WEEKLY);
console.log(trends[0].direction); // 'improving'
console.log(trends[0].insight);   // 'Your accuracy improved by 15% this week'

// Generate report
const report = await analyzer.generateReport('student-123', TimePeriod.WEEKLY);
console.log(report.summary.overallMastery);    // 72
console.log(report.summary.topicsCompleted);   // 5
console.log(report.gaps);                       // Learning gaps detected
```

### Skill Assessment

```typescript
import { createSkillAssessor, MasteryLevel, AssessmentSource } from '@sam-ai/agentic';

const assessor = createSkillAssessor();

// Register skills
assessor.registerSkill({
  id: 'js-arrays',
  name: 'JavaScript Arrays',
  category: 'javascript',
  prerequisites: ['js-basics'],
  assessmentCriteria: ['Can create arrays', 'Understands methods', 'Can iterate'],
});

// Assess a skill
const assessment = await assessor.assessSkill({
  userId: 'student-123',
  skillId: 'js-arrays',
  score: 85,
  source: AssessmentSource.QUIZ,
  questionsAnswered: 20,
  correctAnswers: 17,
});

console.log(assessment.level);      // MasteryLevel.PROFICIENT
console.log(assessment.confidence); // 0.88

// Get skill map
const skillMap = await assessor.getSkillMap('student-123');
console.log(skillMap.strongestSkills); // ['js-arrays', 'js-objects']
console.log(skillMap.weakestSkills);   // ['js-async']
console.log(skillMap.suggestedFocus);  // ['js-async', 'js-promises']
```

### Recommendations

```typescript
import { createRecommendationEngine, ContentType, LearningStyle } from '@sam-ai/agentic';

const engine = createRecommendationEngine();

// Add content
engine.addContent({
  id: 'video-async',
  title: 'Async JavaScript Explained',
  type: ContentType.VIDEO,
  topicId: 'javascript-async',
  skillIds: ['js-async', 'js-promises'],
  duration: 30,
  difficulty: 'medium',
  tags: ['async', 'await', 'promises'],
});

// Generate recommendations
const batch = await engine.generateRecommendations({
  userId: 'student-123',
  availableTime: 60,
  learningStyle: LearningStyle.VISUAL,
  learningGaps: [...], // From progress analyzer
  skillDecay: [...],   // Skills needing review
});

console.log(batch.recommendations);
// [
//   { title: 'Async JavaScript Explained', priority: 'high', reason: 'knowledge_gap' },
//   { title: 'Promise Practice Exercises', priority: 'medium', reason: 'skill_decay' },
//   ...
// ]

// Generate learning path
const path = await engine.generateLearningPath(
  'student-123',
  ['js-async', 'js-promises'],
  currentAssessments
);

console.log(path.steps);      // Ordered learning steps
console.log(path.totalDuration); // Total estimated time
```

## Integration with SAM AI

Use the `SAMAgenticBridge` for seamless integration:

```typescript
import { createSAMAgenticBridge } from '@/lib/sam/agentic-bridge';

// Create bridge instance
const bridge = createSAMAgenticBridge({
  userId: 'student-123',
  courseId: 'course-456',
  enableGoalPlanning: true,
  enableLearningAnalytics: true,
  enableSelfEvaluation: true,
});

// Use unified API
const goal = await bridge.createGoal('Master React Hooks');
const recommendations = await bridge.getRecommendations({ availableTime: 30 });
const confidence = await bridge.scoreConfidence(aiResponse);

// Comprehensive analysis
const analysis = await bridge.analyzeResponse(aiResponse, {
  userId: 'student-123',
  currentTopic: 'react-hooks',
  sessionStartTime: new Date(),
});
```

## API Reference

### Package Exports

```typescript
// Goal Planning
export { GoalManager, PlanExecutor, createGoalManager, createPlanExecutor };
export { GoalStatus, PlanStatus };

// Tool Registry
export { ToolRegistry, ToolExecutor, createToolRegistry, createToolExecutor };

// Memory System
export { MemoryManager, createMemoryManager };

// Proactive Interventions
export { BehaviorMonitor, CheckInScheduler, MultiSessionPlanTracker };
export { createBehaviorMonitor, createCheckInScheduler, createMultiSessionPlanTracker };

// Self-Evaluation
export { ConfidenceScorer, ResponseVerifier, QualityTracker };
export { createConfidenceScorer, createResponseVerifier, createQualityTracker };
export { ConfidenceLevel, VerificationStatus };

// Learning Analytics
export { ProgressAnalyzer, SkillAssessor, RecommendationEngine };
export { createProgressAnalyzer, createSkillAssessor, createRecommendationEngine };
export { MasteryLevel, TrendDirection, ContentType, LearningStyle };

// Utilities
export { CAPABILITIES, hasCapability };
```

## Configuration

### Environment Variables

```env
# Optional: Enable debug logging
SAM_AGENTIC_DEBUG=true

# Optional: Custom rate limits
SAM_TOOL_RATE_LIMIT_MAX=100
SAM_TOOL_RATE_LIMIT_WINDOW=60000
```

### Custom Stores

All components support custom storage implementations:

```typescript
import { createProgressAnalyzer, type LearningSessionStore } from '@sam-ai/agentic';

// Custom Prisma-based store
class PrismaSessionStore implements LearningSessionStore {
  async create(session) { /* Prisma implementation */ }
  async get(id) { /* Prisma implementation */ }
  // ... other methods
}

const analyzer = createProgressAnalyzer({
  sessionStore: new PrismaSessionStore(),
});
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- progress-analyzer.test.ts
```

## Architecture

```
@sam-ai/agentic
├── goal-planning/           # Phase A: Goal Management
│   ├── goal-manager.ts
│   ├── plan-executor.ts
│   └── types.ts
├── tool-registry/           # Phase B: Tool Execution
│   ├── registry.ts
│   ├── executor.ts
│   └── types.ts
├── memory/                  # Phase C: Memory System
│   ├── memory-manager.ts
│   └── types.ts
├── proactive-intervention/  # Phase D: Interventions
│   ├── behavior-monitor.ts
│   ├── check-in-scheduler.ts
│   └── plan-tracker.ts
├── self-evaluation/         # Phase E: Self-Evaluation
│   ├── confidence-scorer.ts
│   ├── response-verifier.ts
│   └── quality-tracker.ts
└── learning-analytics/      # Phase F: Analytics
    ├── progress-analyzer.ts
    ├── skill-assessor.ts
    └── recommendation-engine.ts
```

## License

MIT

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
