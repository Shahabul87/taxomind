# @sam-ai/agentic API Documentation

Complete API reference for all modules in the @sam-ai/agentic package.

## Table of Contents

1. [Goal Planning](#goal-planning)
2. [Tool Registry](#tool-registry)
3. [Memory System](#memory-system)
4. [Proactive Interventions](#proactive-interventions)
5. [Self-Evaluation](#self-evaluation)
6. [Learning Analytics](#learning-analytics)
7. [Types & Enums](#types--enums)

---

## Goal Planning

### GoalManager

Manages learning goals for users.

#### `createGoal(input: GoalInput): Promise<Goal>`

Creates a new learning goal.

```typescript
interface GoalInput {
  userId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: GoalStatus;
  priority: string;
  targetDate?: Date;
  subGoals?: SubGoal[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `decomposeGoal(goalId: string): Promise<Goal>`

Decomposes a goal into actionable sub-goals.

#### `getGoalsByStatus(userId: string, status: GoalStatus): Promise<Goal[]>`

Gets goals filtered by status.

#### `updateGoalProgress(goalId: string, progress: number): Promise<Goal>`

Updates goal progress percentage.

---

### PlanExecutor

Executes learning plans step by step.

#### `createPlan(input: PlanInput): Promise<Plan>`

Creates an execution plan for a goal.

```typescript
interface PlanInput {
  goalId: string;
  userId: string;
  dailyMinutes?: number;
  startDate?: Date;
}

interface Plan {
  id: string;
  goalId: string;
  userId: string;
  status: PlanStatus;
  steps: PlanStep[];
  progress: number;
  schedule?: Schedule;
  createdAt: Date;
}
```

#### `startPlan(planId: string): Promise<Plan>`

Starts plan execution.

#### `pausePlan(planId: string): Promise<Plan>`

Pauses plan execution.

#### `resumePlan(planId: string): Promise<Plan>`

Resumes a paused plan.

#### `completeStep(planId: string, stepId: string, result: StepResult): Promise<PlanStep>`

Marks a step as completed.

---

## Tool Registry

### ToolRegistry

Manages available tools and their configurations.

#### `registerTool(tool: ToolDefinition): void`

Registers a new tool.

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  parameters: Record<string, ParameterDef>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
  permissions?: string[];
  rateLimit?: RateLimitConfig;
}

interface ParameterDef {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
  description?: string;
}
```

#### `getTool(name: string): Tool | undefined`

Gets a tool by name.

#### `listTools(category?: string): Tool[]`

Lists all registered tools, optionally filtered by category.

#### `validatePermission(userId: string, toolName: string): Promise<boolean>`

Validates if a user can use a tool.

---

### ToolExecutor

Executes tools with validation and logging.

#### `execute(request: ExecutionRequest): Promise<ToolExecutionResult>`

Executes a tool.

```typescript
interface ExecutionRequest {
  toolName: string;
  params: Record<string, unknown>;
  userId: string;
  context?: Record<string, unknown>;
}

interface ToolExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  duration: number;
  auditId: string;
}
```

---

## Memory System

### MemoryManager

Manages conversation memory and context.

#### `add(entry: MemoryEntry): Promise<void>`

Adds an entry to memory.

```typescript
interface MemoryEntry {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
```

#### `getContext(): Promise<MemoryEntry[]>`

Gets current context window.

#### `summarize(): Promise<string>`

Summarizes and compresses memory.

#### `shouldSummarize(): boolean`

Checks if memory should be summarized.

#### `clear(): void`

Clears all memory.

---

## Proactive Interventions

### BehaviorMonitor

Monitors user behavior and triggers interventions.

#### `recordEvent(event: BehaviorEvent): Promise<void>`

Records a behavior event.

```typescript
interface BehaviorEvent {
  userId: string;
  type: BehaviorEventType;
  data: Record<string, unknown>;
  timestamp?: Date;
}

enum BehaviorEventType {
  PAGE_VIEW = 'page_view',
  QUIZ_ATTEMPT = 'quiz_attempt',
  CONTENT_INTERACTION = 'content_interaction',
  ERROR_ENCOUNTERED = 'error_encountered',
  HELP_REQUESTED = 'help_requested',
}
```

#### `checkInterventions(context: InterventionContext): Promise<Intervention[]>`

Checks if interventions should be triggered.

```typescript
interface Intervention {
  id: string;
  type: InterventionType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedActions: string[];
  timing: InterventionTiming;
}

enum InterventionType {
  STRUGGLE_DETECTED = 'struggle_detected',
  CHURN_RISK = 'churn_risk',
  ENCOURAGEMENT = 'encouragement',
  BREAK_SUGGESTION = 'break_suggestion',
  CONTENT_RECOMMENDATION = 'content_recommendation',
}
```

---

### CheckInScheduler

Schedules and manages check-ins.

#### `scheduleCheckIn(checkIn: ScheduledCheckIn): Promise<ScheduledCheckIn>`

Schedules a check-in.

```typescript
interface ScheduledCheckIn {
  userId: string;
  type: CheckInType;
  scheduledFor: Date;
  questions: CheckInQuestion[];
}

enum CheckInType {
  PROGRESS_CHECK = 'progress_check',
  GOAL_REVIEW = 'goal_review',
  WELL_BEING = 'well_being',
  FEEDBACK_REQUEST = 'feedback_request',
}
```

#### `getPendingCheckIns(userId: string): Promise<TriggeredCheckIn[]>`

Gets pending check-ins for a user.

#### `completeCheckIn(checkInId: string, responses: CheckInResponse[]): Promise<CheckInResult>`

Completes a check-in with responses.

---

## Self-Evaluation

### ConfidenceScorer

Scores confidence of AI responses.

#### `score(input: ConfidenceInput): Promise<ConfidenceScore>`

Scores response confidence.

```typescript
interface ConfidenceInput {
  response: string;
  topic?: string;
  questionType?: string;
  sources?: string[];
}

interface ConfidenceScore {
  id: string;
  overall: number;           // 0-1
  level: ConfidenceLevel;
  factors: ConfidenceFactor[];
  computedAt: Date;
}

enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

interface ConfidenceFactor {
  type: ConfidenceFactorType;
  score: number;
  weight: number;
  description: string;
}
```

---

### ResponseVerifier

Verifies accuracy of responses.

#### `verify(input: VerificationInput): Promise<VerificationResult>`

Verifies a response.

```typescript
interface VerificationInput {
  response: string;
  topic?: string;
  sources?: string[];
}

interface VerificationResult {
  id: string;
  status: VerificationStatus;
  issues: VerificationIssue[];
  suggestions: CorrectionSuggestion[];
  verifiedAt: Date;
}

enum VerificationStatus {
  VERIFIED = 'verified',
  ISSUES_FOUND = 'issues_found',
  UNABLE_TO_VERIFY = 'unable_to_verify',
}
```

---

### QualityTracker

Tracks quality metrics over time.

#### `recordMetric(record: QualityRecord): Promise<void>`

Records a quality metric.

```typescript
interface QualityRecord {
  responseId: string;
  userId: string;
  metrics: QualityMetric;
  feedback?: StudentFeedback;
}

interface QualityMetric {
  accuracy: number;
  helpfulness: number;
  clarity: number;
  relevance?: number;
}
```

#### `getSummary(userId: string, period: TimePeriod): Promise<QualitySummary>`

Gets quality summary for a period.

---

## Learning Analytics

### ProgressAnalyzer

Analyzes learning progress and trends.

#### `recordSession(input: LearningSessionInput): Promise<LearningSession>`

Records a learning session.

```typescript
interface LearningSessionInput {
  userId: string;
  topicId: string;
  duration: number;           // minutes
  questionsAnswered?: number;
  correctAnswers?: number;
  conceptsCovered?: string[];
  focusScore?: number;        // 0-1
}

interface LearningSession {
  id: string;
  userId: string;
  topicId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  activitiesCompleted: number;
  questionsAnswered: number;
  correctAnswers: number;
  conceptsCovered: string[];
  focusScore?: number;
}
```

#### `analyzeTrends(userId: string, period: TimePeriod): Promise<ProgressTrend[]>`

Analyzes progress trends.

```typescript
interface ProgressTrend {
  metric: 'mastery' | 'time_spent' | 'accuracy' | 'engagement';
  direction: TrendDirection;
  changePercentage: number;
  dataPoints: TrendDataPoint[];
  insight: string;
}

enum TrendDirection {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining',
  FLUCTUATING = 'fluctuating',
}
```

#### `generateReport(userId: string, period?: TimePeriod): Promise<ProgressReport>`

Generates a comprehensive progress report.

```typescript
interface ProgressReport {
  id: string;
  userId: string;
  period: TimePeriod;
  summary: ProgressSummary;
  topicBreakdown: TopicProgress[];
  trends: ProgressTrend[];
  gaps: LearningGap[];
  recommendations: string[];
}
```

#### `detectGaps(userId: string): Promise<LearningGap[]>`

Detects learning gaps.

```typescript
interface LearningGap {
  id: string;
  conceptId: string;
  conceptName: string;
  severity: 'critical' | 'moderate' | 'minor';
  evidence: GapEvidence[];
  suggestedActions: string[];
}
```

---

### SkillAssessor

Assesses and tracks skills.

#### `registerSkill(skill: Skill): void`

Registers a skill definition.

```typescript
interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  prerequisites: string[];
  relatedConcepts: string[];
  assessmentCriteria: string[];
}
```

#### `assessSkill(input: SkillAssessmentInput): Promise<SkillAssessment>`

Assesses a skill based on performance.

```typescript
interface SkillAssessmentInput {
  userId: string;
  skillId: string;
  score: number;              // 0-100
  source: AssessmentSource;
  questionsAnswered?: number;
  correctAnswers?: number;
}

interface SkillAssessment {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  level: MasteryLevel;
  score: number;
  confidence: number;
  source: AssessmentSource;
  assessedAt: Date;
}

enum MasteryLevel {
  NOVICE = 'novice',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  PROFICIENT = 'proficient',
  EXPERT = 'expert',
}

enum AssessmentSource {
  QUIZ = 'quiz',
  EXERCISE = 'exercise',
  PROJECT = 'project',
  PEER_REVIEW = 'peer_review',
  SELF_ASSESSMENT = 'self_assessment',
  AI_EVALUATION = 'ai_evaluation',
}
```

#### `getSkillMap(userId: string): Promise<SkillMap>`

Gets the complete skill map for a user.

```typescript
interface SkillMap {
  userId: string;
  skills: SkillNode[];
  overallLevel: MasteryLevel;
  strongestSkills: string[];
  weakestSkills: string[];
  suggestedFocus: string[];
}
```

#### `predictDecay(userId: string): Promise<SkillDecay[]>`

Predicts skill decay based on time since practice.

---

### RecommendationEngine

Generates personalized learning recommendations.

#### `addContent(content: ContentItem): void`

Adds content to the recommendation pool.

```typescript
interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  topicId: string;
  skillIds: string[];
  conceptIds: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;           // minutes
  url?: string;
  tags: string[];
}

enum ContentType {
  VIDEO = 'video',
  ARTICLE = 'article',
  EXERCISE = 'exercise',
  QUIZ = 'quiz',
  PROJECT = 'project',
  TUTORIAL = 'tutorial',
  DOCUMENTATION = 'documentation',
}
```

#### `generateRecommendations(input: RecommendationInput): Promise<RecommendationBatch>`

Generates personalized recommendations.

```typescript
interface RecommendationInput {
  userId: string;
  availableTime?: number;     // minutes
  learningStyle?: LearningStyle;
  learningGaps?: LearningGap[];
  skillDecay?: SkillDecay[];
  currentGoals?: string[];
}

interface RecommendationBatch {
  id: string;
  userId: string;
  recommendations: Recommendation[];
  generatedAt: Date;
  totalEstimatedTime: number;
}

interface Recommendation {
  id: string;
  type: ContentType;
  priority: RecommendationPriority;
  reason: RecommendationReason;
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: string;
  confidence: number;
  resourceId?: string;
  resourceUrl?: string;
}

enum RecommendationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

enum RecommendationReason {
  KNOWLEDGE_GAP = 'knowledge_gap',
  SKILL_DECAY = 'skill_decay',
  PREREQUISITE = 'prerequisite',
  REINFORCEMENT = 'reinforcement',
  EXPLORATION = 'exploration',
  CHALLENGE = 'challenge',
  REVIEW = 'review',
}
```

#### `generateLearningPath(userId: string, targetSkillIds: string[], currentAssessments: SkillAssessment[]): Promise<LearningPath>`

Generates a structured learning path.

```typescript
interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetSkills: string[];
  steps: LearningPathStep[];
  totalDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  currentStep: number;
}

interface LearningPathStep {
  order: number;
  title: string;
  description: string;
  contentType: ContentType;
  resourceId?: string;
  estimatedDuration: number;
  skillsGained: string[];
  isCompleted: boolean;
}
```

---

## Types & Enums

### Common Enums

```typescript
// Goal Status
enum GoalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

// Plan Status
enum PlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Time Periods
enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ALL_TIME = 'all_time',
}

// Learning Styles
enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  READING_WRITING = 'reading_writing',
  KINESTHETIC = 'kinesthetic',
}
```

### Package Constants

```typescript
const CAPABILITIES = {
  GOAL_PLANNING: 'goal-planning',
  TOOL_REGISTRY: 'tool-registry',
  MENTOR_TOOLS: 'mentor-tools',
  MEMORY_SYSTEM: 'memory-system',
  PROACTIVE_INTERVENTIONS: 'proactive-interventions',
  SELF_EVALUATION: 'self-evaluation',
  LEARNING_ANALYTICS: 'learning-analytics',
} as const;
```

---

## Error Handling

All methods throw typed errors:

```typescript
import { AgenticError, ErrorCode } from '@sam-ai/agentic';

try {
  await goalManager.decomposeGoal('invalid-id');
} catch (error) {
  if (error instanceof AgenticError) {
    switch (error.code) {
      case ErrorCode.NOT_FOUND:
        // Handle not found
        break;
      case ErrorCode.VALIDATION_ERROR:
        // Handle validation error
        break;
      case ErrorCode.PERMISSION_DENIED:
        // Handle permission error
        break;
    }
  }
}
```

---

## Version

Current version: **0.1.0**

For the latest updates, see the [CHANGELOG](./CHANGELOG.md).
