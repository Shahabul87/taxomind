# @sam-ai/memory - Testing Documentation

## Overview

This document describes the comprehensive test suite for the `@sam-ai/memory` package, which provides memory persistence, mastery tracking, and spaced repetition scheduling for the SAM AI educational system.

## Test Statistics

| Metric | Value |
|--------|-------|
| Total Tests | 215 |
| Test Files | 6 |
| Test Coverage Target | 80% |

## Test File Structure

```
src/__tests__/
├── setup.ts                          # Mock utilities and sample data factories
├── student-profile-store.test.ts     # InMemoryStudentProfileStore tests (41 tests)
├── spaced-repetition.test.ts         # InMemoryReviewScheduleStore + SpacedRepetitionScheduler tests (49 tests)
├── memory-store.test.ts              # InMemoryMemoryStore tests (32 tests)
├── mastery-tracker.test.ts           # MasteryTracker tests (36 tests)
├── evaluation-memory-integration.test.ts  # EvaluationMemoryIntegrationImpl tests (35 tests)
└── memory-summary.test.ts            # buildMemorySummary tests (22 tests)
```

## Test Configuration

Tests are configured using Vitest with the following settings:

```typescript
// vitest.config.ts
{
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
}
```

## Test Categories

### 1. InMemoryStudentProfileStore Tests (41 tests)

Tests the in-memory student profile storage implementation.

**Categories:**
- `get` - Profile retrieval
- `save` - Profile persistence
- `updateMastery` - Mastery level updates
- `getMastery` - Mastery retrieval
- `updatePathway` - Learning pathway updates
- `getActivePathways` - Active pathway queries
- `updateMetrics` - Performance metrics updates
- `getKnowledgeGaps` - Knowledge gap identification
- `delete` - Profile deletion
- Factory functions and singleton pattern

### 2. InMemoryReviewScheduleStore Tests (23 tests)

Tests the in-memory review schedule storage.

**Categories:**
- `scheduleReview` - Review scheduling
- `getPendingReviews` - Pending review queries
- `getOverdueReviews` - Overdue review queries
- `updateReview` - Review updates
- `completeReview` - Review completion
- `getReviewHistory` - Review history retrieval
- `pruneCompleted` - Completed review cleanup

### 3. SpacedRepetitionScheduler Tests (26 tests)

Tests the SM-2 based spaced repetition scheduling algorithm.

**Categories:**
- `scheduleFromEvaluation` - Schedule creation from evaluations
- `getPendingReviews` - Pending review queries with priority
- `getOverdueReviews` - Overdue review queries
- `completeReview` - Review completion with SM-2 updates
- `getReviewStats` - Statistics aggregation
- SM-2 algorithm intervals and easiness factor adjustments
- Custom configuration support

### 4. InMemoryMemoryStore Tests (32 tests)

Tests the in-memory long-term memory storage.

**Categories:**
- `store` - Memory entry storage
- `get` - Memory retrieval
- `getByType` - Type-based queries
- `getByTopic` - Topic-based queries
- `getRecent` - Recent memory queries
- `getImportant` - Importance-based queries
- `recordAccess` - Access tracking
- `pruneExpired` - TTL-based cleanup
- `deleteForStudent` - Student data deletion

### 5. MasteryTracker Tests (36 tests)

Tests the Bloom's taxonomy-weighted mastery tracking.

**Categories:**
- `processEvaluation` - Evaluation processing with Bloom's weights
- `getMastery` - Mastery retrieval
- `calculateMasteryLevel` - Level calculation (novice to expert)
- `applyDecay` - Mastery decay for unused topics
- `getTopicsNeedingReview` - Review recommendations
- `getMasterySummary` - Summary generation
- Custom configuration support

**Bloom's Taxonomy Weights:**
- REMEMBER: 0.5
- UNDERSTAND: 0.65
- APPLY: 0.8
- ANALYZE: 0.9
- EVALUATE: 1.0
- CREATE: 1.0

### 6. EvaluationMemoryIntegrationImpl Tests (35 tests)

Tests the complete evaluation memory integration system.

**Categories:**
- `recordEvaluationOutcome` - Full evaluation processing
- Pathway adjustments
- `getStudentProfile` - Profile retrieval
- `getPendingReviews` - Review management
- `getRelevantMemories` - Memory context retrieval
- `recalculatePathway` - Pathway recalculation
- `getMasterySummary` - Summary generation
- `getReviewStats` - Statistics
- Configuration options
- Importance calculation

### 7. buildMemorySummary Tests (22 tests)

Tests the memory summary helper function.

**Categories:**
- Basic functionality
- Mastery summary generation
- Review stats aggregation
- `maxTopics` option
- Multiple topics handling
- Concurrent execution
- Formatting
- Edge cases

## Sample Data Factories

The test setup provides reusable factory functions:

```typescript
// Sample data factories
createSampleTopicMastery()      // TopicMastery records
createSampleMasteryUpdate()     // MasteryUpdate objects
createSamplePathwayStep()       // PathwayStep objects
createSampleLearningPathway()   // LearningPathway objects
createSampleReviewScheduleEntry() // ReviewScheduleEntry objects
createSampleCognitivePreferences() // CognitivePreferences
createSamplePerformanceMetrics()   // PerformanceMetrics
createSampleStudentProfile()       // StudentProfile objects
createSampleEvaluationOutcome()    // EvaluationOutcome objects
createSampleMemoryEntry()          // MemoryEntry objects
```

## Mock Stores

Factory functions for creating mock stores:

```typescript
createMockStudentProfileStore()   // Mock StudentProfileStore
createMockReviewScheduleStore()   // Mock ReviewScheduleStore
createMockMemoryStore()           // Mock MemoryStore
```

## Test Utilities

```typescript
wait(ms)                  // Promise-based delay
createDeferred<T>()       // Deferred promise for async testing
generateTestId(prefix)    // Unique ID generation
createDateOffset(days)    // Date offset from now
```

## Constants for Testing

```typescript
ALL_BLOOMS_LEVELS         // ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']
ALL_MASTERY_LEVELS        // ['novice', 'beginner', 'intermediate', 'proficient', 'expert']
ALL_REVIEW_PRIORITIES     // ['urgent', 'high', 'medium', 'low']
ALL_MEMORY_ENTRY_TYPES    // ['EVALUATION_OUTCOME', 'MASTERY_UPDATE', 'PATHWAY_CHANGE', ...]
ALL_IMPORTANCE_LEVELS     // ['low', 'medium', 'high', 'critical']
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Phase 2 Completion Summary

Phase 2 of the SAM AI testing initiative has been completed with 215 tests covering the `@sam-ai/memory` package.

**Combined Test Count (Phase 1 + Phase 2):**
- Phase 1: 273 tests (@sam-ai/core + @sam-ai/adapter-prisma)
- Phase 2: 215 tests (@sam-ai/memory)
- **Total: 488 tests**

All tests pass TypeScript strict mode and ESLint checks.
