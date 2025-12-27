# @sam-ai/educational

Advanced educational engines for SAM AI Tutor - exam generation, evaluation, and Bloom's Taxonomy analysis.

## Installation

```bash
npm install @sam-ai/educational @sam-ai/core
```

## Features

- **Exam Generation** - Create Bloom's-aligned exams with adaptive question selection
- **Answer Evaluation** - AI-powered grading for subjective answers
- **Cognitive Profiling** - Track student progress across Bloom's levels
- **Spaced Repetition** - SM-2 algorithm for optimized review scheduling
- **Teacher Assistance** - Grading support and feedback suggestions

## Quick Start

```typescript
import { createSAMConfig, createAnthropicAdapter } from '@sam-ai/core';
import { createExamEngine, createEvaluationEngine } from '@sam-ai/educational';

// Create SAM configuration
const samConfig = createSAMConfig({
  ai: createAnthropicAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-sonnet-4-20250514',
  }),
});

// Create exam engine
const examEngine = createExamEngine({ samConfig });

// Generate an exam
const exam = await examEngine.generateExam(
  'course-123',        // courseId
  ['section-1'],       // sectionIds
  {
    totalQuestions: 20,
    duration: 60,
    bloomsDistribution: {
      REMEMBER: 15,
      UNDERSTAND: 20,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 15,
      CREATE: 5,
    },
    difficultyDistribution: {
      EASY: 30,
      MEDIUM: 50,
      HARD: 20,
    },
    questionTypes: ['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY'],
    adaptiveMode: true,
  },
  {
    userId: 'student-123',
    currentLevel: 'intermediate',
    learningStyle: 'visual',
  }
);

console.log('Generated exam with', exam.exam.questions.length, 'questions');
console.log('Bloom\'s alignment score:', exam.bloomsAnalysis.targetVsActual.alignmentScore);
```

## Engines

### ExamEngine

Generate comprehensive exams with Bloom's Taxonomy alignment:

```typescript
import { createExamEngine } from '@sam-ai/educational';

const examEngine = createExamEngine({
  samConfig,
  database: myDatabaseAdapter, // Optional - for question bank access
});

// Generate exam
const result = await examEngine.generateExam(courseId, sectionIds, config, studentProfile);

// Get exam analysis
const analysis = await examEngine.getExamAnalysis(examId);

// Generate study guide
const guide = await examEngine.generateStudyGuide(examId, studentId);
```

### EvaluationEngine

AI-powered answer evaluation and grading assistance:

```typescript
import { createEvaluationEngine } from '@sam-ai/educational';

const evaluationEngine = createEvaluationEngine({
  samConfig,
  settings: {
    enableAutoGrading: true,
    enableAIAssistance: true,
    strictnessLevel: 'moderate',
    feedbackDepth: 'comprehensive',
  },
});

// Evaluate subjective answer
const result = await evaluationEngine.evaluateAnswer(studentAnswer, {
  questionText: 'Explain photosynthesis',
  questionType: 'ESSAY',
  expectedAnswer: 'Photosynthesis is the process...',
  bloomsLevel: 'UNDERSTAND',
  maxPoints: 20,
});

// Evaluate objective answer
const objectiveResult = evaluationEngine.evaluateObjectiveAnswer({
  questionId: 'q-1',
  questionType: 'MULTIPLE_CHOICE',
  studentAnswer: 'B',
  correctAnswer: 'B',
  points: 5,
  bloomsLevel: 'REMEMBER',
});

// Get grading assistance for teachers
const assistance = await evaluationEngine.getGradingAssistance(
  questionText,
  expectedAnswer,
  studentAnswer,
  { criteria: ['Accuracy', 'Completeness'], maxScore: 20 },
  'ANALYZE'
);
```

### BloomsAnalysisEngine

Cognitive profiling and Bloom's Taxonomy analysis:

```typescript
import { createBloomsAnalysisEngine } from '@sam-ai/educational';

const bloomsEngine = createBloomsAnalysisEngine({
  samConfig,
  analysisDepth: 'comprehensive',
});

// Analyze content
const analysis = await bloomsEngine.analyzeContent(courseContent);
console.log('Dominant level:', analysis.dominantLevel);
console.log('Gaps:', analysis.gaps);

// Update cognitive progress
await bloomsEngine.updateCognitiveProgress(userId, sectionId, 'APPLY', 85);

// Get cognitive profile
const profile = await bloomsEngine.getCognitiveProfile(userId, courseId);
console.log('Overall mastery:', profile.overallMastery);

// Calculate spaced repetition
const schedule = await bloomsEngine.calculateSpacedRepetition({
  userId: 'student-123',
  conceptId: 'concept-456',
  performance: 4, // 1-5 scale
});
console.log('Next review:', schedule.nextReviewDate);

// Get learning recommendations
const recommendations = await bloomsEngine.getRecommendations(userId, courseId);
```

## Configuration

### ExamEngineConfig

| Option | Type | Description |
|--------|------|-------------|
| samConfig | SAMConfig | Required. SAM configuration with AI adapter |
| database | SAMDatabaseAdapter | Optional. Database adapter for persistence |
| defaults | ExamGenerationDefaults | Optional. Default exam settings |

### EvaluationEngineConfig

| Option | Type | Description |
|--------|------|-------------|
| samConfig | SAMConfig | Required. SAM configuration with AI adapter |
| database | SAMDatabaseAdapter | Optional. Database adapter for persistence |
| settings | EvaluationSettings | Optional. Evaluation behavior settings |

### EvaluationSettings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| enableAutoGrading | boolean | true | Enable automatic grading for objective questions |
| enableAIAssistance | boolean | true | Enable AI-powered evaluation |
| enablePartialCredit | boolean | true | Award partial credit where applicable |
| strictnessLevel | 'lenient' \| 'moderate' \| 'strict' | 'moderate' | Grading strictness |
| feedbackDepth | 'minimal' \| 'standard' \| 'comprehensive' | 'standard' | Feedback detail level |
| bloomsAnalysis | boolean | true | Include Bloom's level analysis |
| misconceptionDetection | boolean | true | Detect and flag misconceptions |

## Database Adapter

For persistence, provide a `SAMDatabaseAdapter` from `@sam-ai/core`:

```typescript
import { createExamEngine } from '@sam-ai/educational';
import { createInMemoryDatabase } from '@sam-ai/core';

// Using in-memory adapter (for testing/demos)
const database = createInMemoryDatabase();

const examEngine = createExamEngine({
  samConfig,
  database,
});
```

For production, implement the `SAMDatabaseAdapter` interface for your database:

```typescript
import type { SAMDatabaseAdapter } from '@sam-ai/core';

const myPrismaAdapter: SAMDatabaseAdapter = {
  findQuestions: async (params) => { /* Prisma query */ },
  findBloomsProgress: async (userId, courseId) => { /* Prisma query */ },
  // ... implement all required methods
};
```

## Types

### Question Types

```typescript
type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'ESSAY'
  | 'FILL_IN_BLANK'
  | 'MATCHING'
  | 'ORDERING';
```

### Bloom's Levels

```typescript
type BloomsLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';
```

## License

MIT

## Related Packages

- [@sam-ai/core](https://www.npmjs.com/package/@sam-ai/core) - Core engine orchestration
- [@sam-ai/react](https://www.npmjs.com/package/@sam-ai/react) - React hooks and components
- [@sam-ai/api](https://www.npmjs.com/package/@sam-ai/api) - Next.js API handlers
