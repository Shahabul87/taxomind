# Integration Testing Strategy - SAM AI Tutor

## Purpose
This document defines the comprehensive integration testing strategy for the SAM AI Tutor system. Integration tests verify that multiple components work together correctly across the entire 18-month transformation.

---

## Testing Philosophy

### Core Principles
1. **Test Real Interactions**: Integration tests should use real database, real AI API calls (with mocks in CI), and real component interactions
2. **Critical Paths First**: Focus on user-facing workflows that span multiple systems
3. **Phase-Specific Testing**: Each phase has unique integration test requirements
4. **Fail Fast**: Integration tests should catch regressions early in development

---

## Test Environment Setup

### Local Integration Test Environment
```bash
# 1. Use separate test database
DATABASE_URL="postgresql://user:password@localhost:5433/taxomind_test"

# 2. Use test API keys (rate-limited sandbox accounts)
ANTHROPIC_API_KEY="sk-ant-test-..."
OPENAI_API_KEY="sk-test-..."

# 3. Use test Redis instance
UPSTASH_REDIS_REST_URL="https://test-redis..."
```

### Test Database Management
```typescript
// __tests__/helpers/test-db.ts
import { PrismaClient } from '@prisma/client';

export class TestDatabase {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL_TEST,
    });
  }

  async reset(): Promise<void> {
    // Clear all tables in reverse dependency order
    await this.prisma.$executeRaw`TRUNCATE TABLE "Enrollment" CASCADE`;
    await this.prisma.$executeRaw`TRUNCATE TABLE "Purchase" CASCADE`;
    await this.prisma.$executeRaw`TRUNCATE TABLE "Course" CASCADE`;
    await this.prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    await this.prisma.$executeRaw`TRUNCATE TABLE "ConceptNode" CASCADE`;
    await this.prisma.$executeRaw`TRUNCATE TABLE "ConceptRelationship" CASCADE`;
  }

  async seed(): Promise<void> {
    // Create test users
    const testUser = await this.prisma.user.create({
      data: {
        id: 'test-user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      },
    });

    // Create test courses
    const testCourse = await this.prisma.course.create({
      data: {
        id: 'test-course-1',
        userId: testUser.id,
        title: 'Test Course',
        description: 'A course for integration testing',
        isPublished: true,
        price: 49.99,
      },
    });

    return { testUser, testCourse };
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
```

### Jest Configuration for Integration Tests
```javascript
// jest.config.integration.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/helpers/integration-setup.ts'],
  maxWorkers: 1, // Run integration tests sequentially to avoid DB conflicts
  testTimeout: 30000, // 30 seconds for real API calls
};
```

```typescript
// __tests__/helpers/integration-setup.ts
import { TestDatabase } from './test-db';

const testDb = new TestDatabase();

beforeAll(async () => {
  await testDb.reset();
  await testDb.seed();
});

afterAll(async () => {
  await testDb.close();
});

beforeEach(async () => {
  // Reset specific test data if needed
});
```

---

## Phase 1: Foundation Integration Tests

### Test 1: Multi-Engine Chat Flow
**Scenario**: User asks a question that requires multiple engines

```typescript
// __tests__/integration/phase-1/multi-engine-chat.test.ts
import { SAMOrchestrator } from '@/lib/sam/orchestration/orchestrator';
import { TestDatabase } from '@/__tests__/helpers/test-db';

describe('Phase 1: Multi-Engine Chat Integration', () => {
  const testDb = new TestDatabase();
  const orchestrator = new SAMOrchestrator();

  beforeAll(async () => {
    await testDb.reset();
    await testDb.seed();
  });

  it('should route code question to CodeExplanationEngine', async () => {
    const query = 'Explain this Python code: for i in range(10): print(i)';
    const userId = 'test-user-1';

    const response = await orchestrator.processQuery({
      query,
      userId,
      courseId: undefined,
    });

    expect(response.success).toBe(true);
    expect(response.data?.enginesUsed).toContain('CodeExplanationEngine');
    expect(response.data?.response).toContain('loop'); // Code explanation
  });

  it('should route math question to MathEngine', async () => {
    const query = 'Solve: 2x + 5 = 15';
    const userId = 'test-user-1';

    const response = await orchestrator.processQuery({
      query,
      userId,
    });

    expect(response.success).toBe(true);
    expect(response.data?.enginesUsed).toContain('MathEngine');
    expect(response.data?.response).toContain('x = 5');
  });

  it('should handle circuit breaker when API fails', async () => {
    // Simulate API failure by using invalid key
    const originalKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'invalid-key';

    const query = 'Explain quantum physics';
    const userId = 'test-user-1';

    // First 5 requests should fail (opening circuit)
    for (let i = 0; i < 5; i++) {
      const response = await orchestrator.processQuery({ query, userId });
      expect(response.success).toBe(false);
    }

    // Circuit should be OPEN now - next request should fail immediately
    const startTime = Date.now();
    const response = await orchestrator.processQuery({ query, userId });
    const elapsed = Date.now() - startTime;

    expect(response.success).toBe(false);
    expect(elapsed).toBeLessThan(100); // Should fail fast without API call

    // Restore original key
    process.env.ANTHROPIC_API_KEY = originalKey;
  });
});
```

### Test 2: Multi-Provider Failover
**Scenario**: Primary AI provider fails, system fails over to secondary

```typescript
// __tests__/integration/phase-1/multi-provider-failover.test.ts
import { AIProviderManager } from '@/lib/ai/provider-manager';

describe('Phase 1: Multi-Provider Failover', () => {
  it('should failover from Claude to GPT when Claude fails', async () => {
    const manager = new AIProviderManager();

    // Simulate Claude failure
    jest.spyOn(manager, 'callClaude').mockRejectedValue(new Error('Claude API down'));

    const prompt = 'Explain photosynthesis';
    const response = await manager.generateResponse(prompt);

    expect(response.success).toBe(true);
    expect(response.provider).toBe('openai'); // Fell back to GPT
    expect(response.data).toBeDefined();
  });

  it('should return error when all providers fail', async () => {
    const manager = new AIProviderManager();

    // Simulate all providers failing
    jest.spyOn(manager, 'callClaude').mockRejectedValue(new Error('Claude down'));
    jest.spyOn(manager, 'callGPT').mockRejectedValue(new Error('GPT down'));

    const prompt = 'Explain photosynthesis';
    const response = await manager.generateResponse(prompt);

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('ALL_PROVIDERS_FAILED');
  });
});
```

### Test 3: Two-Tier Caching
**Scenario**: Test L1 (memory) and L2 (Redis) caching layers

```typescript
// __tests__/integration/phase-1/two-tier-caching.test.ts
import { CacheManager } from '@/lib/cache/cache-manager';

describe('Phase 1: Two-Tier Caching', () => {
  const cache = new CacheManager();

  beforeEach(async () => {
    await cache.clear();
  });

  it('should serve from L1 cache on repeated requests', async () => {
    const key = 'test-key-1';
    const value = { data: 'test-value' };

    // First request - cache miss, fetch from source
    await cache.set(key, value, 3600);

    // Second request - L1 cache hit
    const startTime = Date.now();
    const result = await cache.get(key);
    const elapsed = Date.now() - startTime;

    expect(result).toEqual(value);
    expect(elapsed).toBeLessThan(5); // L1 cache is extremely fast
  });

  it('should promote L2 hit to L1 cache', async () => {
    const key = 'test-key-2';
    const value = { data: 'test-value-2' };

    // Set in cache
    await cache.set(key, value, 3600);

    // Clear L1 cache only (L2 still has the value)
    cache.clearL1();

    // Request should hit L2 and promote to L1
    const result1 = await cache.get(key);
    expect(result1).toEqual(value);

    // Next request should hit L1 (faster)
    const startTime = Date.now();
    const result2 = await cache.get(key);
    const elapsed = Date.now() - startTime;

    expect(result2).toEqual(value);
    expect(elapsed).toBeLessThan(5); // Fast L1 hit
  });

  it('should respect TTL and expire cached values', async () => {
    const key = 'test-key-3';
    const value = { data: 'test-value-3' };

    // Set with 1 second TTL
    await cache.set(key, value, 1);

    // Immediately should be available
    expect(await cache.get(key)).toEqual(value);

    // Wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Should be expired now
    expect(await cache.get(key)).toBeNull();
  });
});
```

---

## Phase 2: Intelligence Integration Tests

### Test 4: Student Knowledge Graph Updates
**Scenario**: Student answers questions, knowledge graph updates correctly

```typescript
// __tests__/integration/phase-2/knowledge-graph-updates.test.ts
import { QuizEngine } from '@/lib/sam/engines/quiz-engine';
import { KnowledgeGraphService } from '@/memory/knowledge-graph-service';

describe('Phase 2: Knowledge Graph Integration', () => {
  const quizEngine = new QuizEngine();
  const kgService = new KnowledgeGraphService();
  const userId = 'test-user-1';

  beforeEach(async () => {
    // Clear knowledge graph for user
    await db.conceptNode.deleteMany({ where: { userId } });
  });

  it('should update mastery when student answers correctly', async () => {
    // Student takes quiz on "Algebra"
    const quizResult = await quizEngine.evaluateAnswer({
      userId,
      conceptName: 'Algebra',
      questionId: 'q1',
      userAnswer: 'x = 5',
      correctAnswer: 'x = 5',
    });

    expect(quizResult.success).toBe(true);
    expect(quizResult.data?.isCorrect).toBe(true);

    // Check knowledge graph updated
    const concept = await db.conceptNode.findUnique({
      where: {
        userId_conceptName: { userId, conceptName: 'Algebra' },
      },
    });

    expect(concept).toBeDefined();
    expect(concept!.masteryLevel).toBeGreaterThan(0.0);
    expect(concept!.timesReviewed).toBe(1);
  });

  it('should decrease mastery when student answers incorrectly', async () => {
    // Set initial mastery
    await kgService.updateMastery(userId, 'Calculus', 0.8);

    // Student answers incorrectly
    await quizEngine.evaluateAnswer({
      userId,
      conceptName: 'Calculus',
      questionId: 'q2',
      userAnswer: 'wrong answer',
      correctAnswer: 'correct answer',
    });

    // Check mastery decreased
    const concept = await db.conceptNode.findUnique({
      where: {
        userId_conceptName: { userId, conceptName: 'Calculus' },
      },
    });

    expect(concept!.masteryLevel).toBeLessThan(0.8);
  });

  it('should establish prerequisite relationships', async () => {
    // Algebra is prerequisite for Calculus
    await kgService.addPrerequisite(userId, 'Algebra', 'Calculus');

    // Verify relationship exists
    const relationship = await db.conceptRelationship.findFirst({
      where: {
        relationshipType: 'PREREQUISITE',
      },
      include: {
        fromConcept: true,
        toConcept: true,
      },
    });

    expect(relationship).toBeDefined();
    expect(relationship!.fromConcept.conceptName).toBe('Algebra');
    expect(relationship!.toConcept.conceptName).toBe('Calculus');
  });
});
```

### Test 5: Learning Style Detection
**Scenario**: System detects student's learning style from interaction patterns

```typescript
// __tests__/integration/phase-2/learning-style-detection.test.ts
import { LearningStyleDetector } from '@/lib/sam/intelligence/learning-style-detector';

describe('Phase 2: Learning Style Detection', () => {
  const detector = new LearningStyleDetector();
  const userId = 'test-user-1';

  it('should detect visual preference from image-heavy interactions', async () => {
    // Simulate student requesting diagrams frequently
    for (let i = 0; i < 10; i++) {
      await detector.recordInteraction(userId, {
        type: 'DIAGRAM_REQUEST',
        concept: `Concept ${i}`,
      });
    }

    const learningStyle = await detector.detectLearningStyle(userId);

    expect(learningStyle.visualPreference).toBeGreaterThan(0.5);
    expect(learningStyle.visualPreference).toBeGreaterThan(
      learningStyle.auditoryPreference
    );
  });

  it('should detect kinesthetic preference from code execution requests', async () => {
    // Simulate student running code frequently
    for (let i = 0; i < 10; i++) {
      await detector.recordInteraction(userId, {
        type: 'CODE_EXECUTION',
        concept: `Programming ${i}`,
      });
    }

    const learningStyle = await detector.detectLearningStyle(userId);

    expect(learningStyle.kinestheticPreference).toBeGreaterThan(0.5);
  });
});
```

---

## Phase 3: Advanced Intelligence Integration Tests

### Test 6: Adaptive Difficulty Adjustment (IRT)
**Scenario**: Question difficulty adapts based on student performance

```typescript
// __tests__/integration/phase-3/adaptive-difficulty.test.ts
import { IRTEngine } from '@/lib/sam/engines/adaptive/irt-engine';

describe('Phase 3: Adaptive Difficulty (IRT)', () => {
  const irtEngine = new IRTEngine();
  const userId = 'test-user-1';

  it('should increase difficulty after consecutive correct answers', async () => {
    // Student answers 5 easy questions correctly
    for (let i = 0; i < 5; i++) {
      await irtEngine.evaluateAnswer({
        userId,
        questionId: `easy-${i}`,
        difficulty: 0.3,
        isCorrect: true,
      });
    }

    // Next question should be harder
    const nextQuestion = await irtEngine.getNextQuestion(userId, 'Algebra');

    expect(nextQuestion.difficulty).toBeGreaterThan(0.3);
    expect(nextQuestion.difficulty).toBeLessThan(0.8); // Not too hard
  });

  it('should decrease difficulty after consecutive wrong answers', async () => {
    // Student gets 5 hard questions wrong
    for (let i = 0; i < 5; i++) {
      await irtEngine.evaluateAnswer({
        userId,
        questionId: `hard-${i}`,
        difficulty: 0.9,
        isCorrect: false,
      });
    }

    // Next question should be easier
    const nextQuestion = await irtEngine.getNextQuestion(userId, 'Algebra');

    expect(nextQuestion.difficulty).toBeLessThan(0.9);
    expect(nextQuestion.difficulty).toBeGreaterThan(0.2); // Not too easy
  });
});
```

### Test 7: Spaced Repetition Scheduler
**Scenario**: System schedules review based on forgetting curve

```typescript
// __tests__/integration/phase-3/spaced-repetition.test.ts
import { SpacedRepetitionScheduler } from '@/lib/sam/engines/adaptive/spaced-repetition';

describe('Phase 3: Spaced Repetition', () => {
  const scheduler = new SpacedRepetitionScheduler();
  const userId = 'test-user-1';

  it('should schedule next review based on performance', async () => {
    // Student reviews concept with good performance
    const reviewResult = await scheduler.recordReview({
      userId,
      conceptName: 'Photosynthesis',
      quality: 4, // 0-5 scale, 4 is good recall
    });

    // Next review should be in several days
    const nextReview = reviewResult.nextReviewDate;
    const daysUntilReview =
      (nextReview.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

    expect(daysUntilReview).toBeGreaterThan(1);
    expect(daysUntilReview).toBeLessThan(14);
  });

  it('should schedule earlier review for poor performance', async () => {
    // Student barely remembers concept
    const reviewResult = await scheduler.recordReview({
      userId,
      conceptName: 'Quantum Mechanics',
      quality: 1, // Poor recall
    });

    // Next review should be soon
    const nextReview = reviewResult.nextReviewDate;
    const daysUntilReview =
      (nextReview.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

    expect(daysUntilReview).toBeLessThan(1); // Within 24 hours
  });

  it('should fetch concepts due for review', async () => {
    // Create several concepts with different review dates
    await scheduler.recordReview({
      userId,
      conceptName: 'Concept A',
      quality: 3,
    });

    // Fast-forward time (mock Date.now)
    const originalNow = Date.now;
    Date.now = jest.fn(() => originalNow() + 7 * 24 * 60 * 60 * 1000); // +7 days

    const dueForReview = await scheduler.getConceptsDueForReview(userId);

    expect(dueForReview).toContain('Concept A');

    // Restore Date.now
    Date.now = originalNow;
  });
});
```

---

## Phase 4: Thinking Machine Integration Tests

### Test 8: Planner-Executor Workflow
**Scenario**: Complex query triggers planning and multi-step execution

```typescript
// __tests__/integration/phase-4/planner-executor.test.ts
import { PlannerAgent } from '@/lib/sam/agents/planner-agent';
import { ExecutorAgent } from '@/lib/sam/agents/executor-agent';

describe('Phase 4: Planner-Executor Integration', () => {
  const planner = new PlannerAgent();
  const executor = new ExecutorAgent();

  it('should create and execute learning plan for complex goal', async () => {
    const query = 'I want to learn full-stack web development from scratch';
    const userId = 'test-user-1';

    // Step 1: Planner creates plan
    const plan = await planner.createPlan({ query, userId });

    expect(plan.steps.length).toBeGreaterThan(5); // Multi-step plan
    expect(plan.steps[0].title).toContain('HTML'); // Should start with basics
    expect(plan.total_estimated_time).toBeGreaterThan(20); // Hours

    // Step 2: Executor executes plan
    const executionResult = await executor.executePlan({
      plan,
      userId,
      stepIndex: 0, // Execute first step
    });

    expect(executionResult.success).toBe(true);
    expect(executionResult.data?.response).toBeDefined();
    expect(executionResult.data?.completedStep).toBe(0);
  });

  it('should replan when student struggles', async () => {
    const initialPlan = await planner.createPlan({
      query: 'Learn calculus',
      userId: 'test-user-1',
    });

    // Simulate student struggling on step 2 (limits)
    await executor.executePlan({
      plan: initialPlan,
      userId: 'test-user-1',
      stepIndex: 1,
      performance: { score: 0.3, struggled: true }, // Low score
    });

    // System should replan to add prerequisite step
    const revisedPlan = await planner.replan({
      originalPlan: initialPlan,
      currentStep: 1,
      issue: 'Student struggling with limits - may need algebra review',
    });

    expect(revisedPlan.steps.length).toBeGreaterThan(initialPlan.steps.length);
    expect(revisedPlan.steps.some((s) => s.title.includes('Algebra'))).toBe(true);
  });
});
```

### Test 9: Multi-Agent Collaboration
**Scenario**: Four agents collaborate on Socratic dialogue

```typescript
// __tests__/integration/phase-4/multi-agent-collaboration.test.ts
import { SocraticOrchestrator } from '@/lib/sam/agents/socratic-orchestrator';

describe('Phase 4: Multi-Agent Collaboration', () => {
  const orchestrator = new SocraticOrchestrator();

  it('should coordinate 4 agents for Socratic teaching', async () => {
    const query = 'Why does water boil at different temperatures at different altitudes?';
    const userId = 'test-user-1';

    const response = await orchestrator.processSocraticQuery({
      query,
      userId,
    });

    // Verify all agents contributed
    expect(response.agentsInvolved).toContain('TutorAgent');
    expect(response.agentsInvolved).toContain('CriticAgent');
    expect(response.agentsInvolved).toContain('SocraticAgent');
    expect(response.agentsInvolved).toContain('SynthesizerAgent');

    // Verify Socratic approach (questions, not answers)
    expect(response.data?.response).toMatch(/\?/); // Contains questions
    expect(response.data?.response.toLowerCase()).toContain('pressure'); // Guiding concept
  });

  it('should reach consensus when agents disagree', async () => {
    const query = 'Is Pluto a planet?';
    const userId = 'test-user-1';

    // This is a controversial topic where agents might disagree
    const response = await orchestrator.processSocraticQuery({
      query,
      userId,
    });

    expect(response.data?.consensusReached).toBe(true);
    expect(response.data?.finalAnswer).toBeDefined();
    expect(response.data?.dissenting_opinions).toBeDefined(); // Show both sides
  });
});
```

---

## CI/CD Integration Testing

### GitHub Actions Workflow
```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: taxomind_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run Prisma migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5433/taxomind_test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5433/taxomind_test
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_TEST_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_TEST_KEY }}
          UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_TEST_URL }}
          UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_TEST_TOKEN }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Integration Test Checklist

Before merging any phase:

### Phase 1 Checklist
- [ ] Multi-engine routing works correctly
- [ ] Circuit breaker opens after threshold failures
- [ ] Multi-provider failover succeeds
- [ ] Two-tier caching (L1 + L2) works
- [ ] All API routes return standard response format

### Phase 2 Checklist
- [ ] Knowledge graph updates on quiz completion
- [ ] Learning style detected from interactions
- [ ] Emotional state tracking works
- [ ] Adaptive difficulty adjusts appropriately
- [ ] Student memory persists across sessions

### Phase 3 Checklist
- [ ] Bloom's Taxonomy evaluator categorizes correctly
- [ ] IRT engine adjusts difficulty dynamically
- [ ] Spaced repetition schedules reviews correctly
- [ ] Predictive analytics identifies at-risk students
- [ ] Multi-modal understanding processes images

### Phase 4 Checklist
- [ ] Planner creates multi-step learning plans
- [ ] Executor completes plan steps successfully
- [ ] Replanner adapts when student struggles
- [ ] 4-agent collaboration reaches consensus
- [ ] Socratic questioning guides discovery

---

## Performance Benchmarks for Integration Tests

### Acceptable Response Times
- **Simple query** (1 engine): <500ms
- **Moderate query** (2-3 engines): <1500ms
- **Complex query** (4+ engines): <2500ms
- **Planning** (Phase 4): <3000ms
- **Multi-agent** (Phase 4): <5000ms

### Example Performance Test
```typescript
it('should meet performance SLA for simple queries', async () => {
  const startTime = Date.now();

  await orchestrator.processQuery({
    query: 'What is 2+2?',
    userId: 'test-user-1',
  });

  const elapsed = Date.now() - startTime;
  expect(elapsed).toBeLessThan(500); // Must be under 500ms
});
```

---

## Debugging Failed Integration Tests

### Common Failure Patterns

1. **Database Connection Issues**:
```bash
# Check test database is running
psql postgresql://postgres:postgres@localhost:5433/taxomind_test -c "SELECT 1"

# Reset test database
npm run test:db:reset
```

2. **API Rate Limiting**:
```typescript
// Add exponential backoff for API calls
async function callWithBackoff(fn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2 ** i * 1000));
    }
  }
}
```

3. **Flaky Tests Due to Timing**:
```typescript
// Use waitFor for async updates
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(getKnowledgeGraph()).toContain('Algebra');
}, { timeout: 5000 });
```

---

## Summary

Integration testing is critical for ensuring the SAM AI Tutor system works as a cohesive whole. Focus on:
- **Real interactions** across multiple components
- **Phase-specific workflows** that validate each transformation stage
- **Performance benchmarks** to prevent regressions
- **Comprehensive coverage** of critical user paths

**Next Steps**: Review unit testing guide and end-to-end testing strategy.
