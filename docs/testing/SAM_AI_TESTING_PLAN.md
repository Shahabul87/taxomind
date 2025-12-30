# SAM AI Testing Plan

**Version:** 1.0.0
**Created:** December 2025
**Status:** DRAFT - Pending Review

---

## Executive Summary

The SAM AI system consists of **10 packages** (~78,000 LOC) with **minimal test coverage** (only 1 test file exists). This plan outlines a comprehensive testing strategy to achieve **80%+ code coverage** across all packages.

### Current State
| Metric | Value |
|--------|-------|
| Total Packages | 10 |
| Total LOC | ~78,000 |
| Existing Test Files | 1 |
| Current Coverage | <1% |
| Target Coverage | 80%+ |

### Testing Priorities
1. **P0 - Critical:** Core orchestration, database adapters
2. **P1 - High:** Memory system, educational engines
3. **P2 - Medium:** Safety, quality, pedagogy validators
4. **P3 - Low:** React hooks, API handlers

---

## Package Testing Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TEST PYRAMID                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────┐                              │
│                    │   E2E   │  10% - User flows            │
│                    │  Tests  │  (~20 tests)                 │
│                    └────┬────┘                              │
│               ┌─────────┴─────────┐                         │
│               │   Integration     │  20% - Package          │
│               │      Tests        │  interactions (~80)     │
│               └────────┬──────────┘                         │
│          ┌─────────────┴─────────────┐                      │
│          │       Unit Tests          │  70% - Functions,    │
│          │    (Foundation Layer)     │  classes (~350)      │
│          └───────────────────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Core Package Tests (P0)

### 1.1 @sam-ai/core

**Priority:** P0 - Critical
**Estimated Tests:** 80-100
**Test Framework:** Vitest (already configured)

#### Test Files to Create

```
packages/core/src/__tests__/
├── orchestrator/
│   ├── sam-agent-orchestrator.test.ts
│   ├── engine-registration.test.ts
│   ├── execution-tiers.test.ts
│   └── dependency-resolution.test.ts
├── state-machine/
│   ├── sam-state-machine.test.ts
│   ├── state-transitions.test.ts
│   └── event-listeners.test.ts
├── engines/
│   ├── base-engine.test.ts
│   ├── context-engine.test.ts
│   ├── blooms-engine.test.ts
│   ├── response-engine.test.ts
│   ├── content-engine.test.ts
│   ├── assessment-engine.test.ts
│   └── personalization-engine.test.ts
├── adapters/
│   ├── anthropic-adapter.test.ts
│   ├── memory-cache-adapter.test.ts
│   ├── in-memory-database-adapter.test.ts
│   └── noop-database-adapter.test.ts
└── types/
    └── type-guards.test.ts
```

#### Key Test Scenarios

**SAMAgentOrchestrator Tests:**
```typescript
describe('SAMAgentOrchestrator', () => {
  describe('Engine Registration', () => {
    it('should register engine successfully');
    it('should throw on duplicate engine registration');
    it('should validate engine interface');
    it('should track engine dependencies');
  });

  describe('Execution Tiers', () => {
    it('should execute Tier 1 engines first');
    it('should respect engine dependencies');
    it('should handle parallel execution');
    it('should timeout slow engines');
  });

  describe('Orchestration', () => {
    it('should orchestrate complete flow');
    it('should handle engine failures gracefully');
    it('should aggregate results correctly');
    it('should emit lifecycle events');
  });
});
```

**SAMStateMachine Tests:**
```typescript
describe('SAMStateMachine', () => {
  it('should initialize with default state');
  it('should transition states correctly');
  it('should emit state change events');
  it('should prevent invalid transitions');
  it('should maintain conversation context');
  it('should serialize/deserialize state');
});
```

---

### 1.2 @sam-ai/adapter-prisma

**Priority:** P0 - Critical
**Estimated Tests:** 50-60
**Test Framework:** Jest + Prisma Test Utils

#### Test Files to Create

```
packages/adapter-prisma/src/__tests__/
├── adapters/
│   ├── prisma-sam-adapter.test.ts
│   └── adapter-factory.test.ts
├── stores/
│   ├── sample-store.test.ts
│   ├── student-profile-store.test.ts
│   ├── memory-store.test.ts
│   ├── review-schedule-store.test.ts
│   └── golden-test-store.test.ts
├── transactions/
│   └── transaction-support.test.ts
└── migrations/
    └── schema-generation.test.ts
```

#### Key Test Scenarios

**PrismaSAMAdapter Tests:**
```typescript
describe('PrismaSAMAdapter', () => {
  describe('CRUD Operations', () => {
    it('should create records');
    it('should read records with filters');
    it('should update records');
    it('should delete records');
    it('should handle pagination');
  });

  describe('Transactions', () => {
    it('should commit successful transactions');
    it('should rollback failed transactions');
    it('should handle nested transactions');
  });

  describe('Error Handling', () => {
    it('should handle connection errors');
    it('should handle constraint violations');
    it('should handle query timeouts');
  });
});
```

**Store Tests (Pattern for all stores):**
```typescript
describe('StudentProfileStore', () => {
  it('should get profile by userId');
  it('should create new profile');
  it('should update existing profile');
  it('should update mastery data');
  it('should handle missing profiles gracefully');
  it('should validate input data');
});
```

---

## Phase 2: Learning System Tests (P1)

### 2.1 @sam-ai/memory

**Priority:** P1 - High
**Estimated Tests:** 70-80
**Test Framework:** Vitest

#### Test Files to Create

```
packages/memory/src/__tests__/
├── mastery/
│   ├── mastery-tracker.test.ts
│   ├── mastery-calculation.test.ts
│   ├── decay-algorithm.test.ts
│   └── stability-detection.test.ts
├── pathway/
│   ├── pathway-calculator.test.ts
│   ├── remediation-paths.test.ts
│   └── learning-adjustments.test.ts
├── spaced-repetition/
│   ├── scheduler.test.ts
│   ├── sm2-algorithm.test.ts
│   └── review-priority.test.ts
├── stores/
│   ├── student-profile-store.test.ts
│   └── in-memory-store.test.ts
└── integration/
    └── evaluation-memory-integration.test.ts
```

#### Key Test Scenarios

**MasteryTracker Tests:**
```typescript
describe('MasteryTracker', () => {
  describe('Mastery Calculation', () => {
    it('should calculate mastery with recency weight');
    it('should apply Blooms weights correctly');
    // REMEMBER: 0.5, UNDERSTAND: 0.7, APPLY: 0.9,
    // ANALYZE: 1.0, EVALUATE: 1.05, CREATE: 1.1
    it('should require 3+ assessments for stability');
    it('should handle edge cases (0%, 100%)');
  });

  describe('Decay Algorithm', () => {
    it('should decay unused topics over time');
    it('should respect configurable decay rate');
    it('should not decay recently accessed topics');
  });

  describe('Recommendations', () => {
    it('should recommend review for declining mastery');
    it('should suggest advancement for stable high mastery');
    it('should identify struggling topics');
  });
});
```

**SpacedRepetitionScheduler Tests:**
```typescript
describe('SpacedRepetitionScheduler', () => {
  it('should schedule initial review at 1 day');
  it('should expand intervals: 1 -> 3 -> 7 -> 14 -> 30');
  it('should apply SM2 difficulty adjustments');
  it('should prioritize overdue reviews');
  it('should handle difficulty ratings (1-5)');
});
```

---

### 2.2 @sam-ai/educational

**Priority:** P1 - High
**Estimated Tests:** 100-120
**Test Framework:** Vitest

#### Test Files to Create

```
packages/educational/src/__tests__/
├── engines/
│   ├── exam-engine.test.ts
│   ├── advanced-exam-engine.test.ts
│   ├── evaluation-engine.test.ts
│   ├── blooms-analysis-engine.test.ts
│   ├── personalization-engine.test.ts
│   ├── practice-problems-engine.test.ts
│   ├── adaptive-content-engine.test.ts
│   ├── socratic-teaching-engine.test.ts
│   ├── analytics-engine.test.ts
│   ├── predictive-engine.test.ts
│   ├── achievement-engine.test.ts
│   ├── collaboration-engine.test.ts
│   └── unified-blooms-engine.test.ts (EXISTS - expand)
├── validation/
│   ├── schema-validators.test.ts
│   ├── json-extraction.test.ts
│   └── partial-validation.test.ts
└── integration/
    ├── engine-composition.test.ts
    └── caching-behavior.test.ts
```

#### Key Test Scenarios

**UnifiedBloomsEngine Tests (Expand Existing):**
```typescript
describe('UnifiedBloomsEngine', () => {
  describe('Content Analysis', () => {
    it('should analyze single content piece');
    it('should aggregate course-level analysis');
    it('should cache analysis results');
    it('should invalidate stale cache');
  });

  describe('Cognitive Progress', () => {
    it('should track progress across levels');
    it('should identify cognitive gaps');
    it('should generate improvement paths');
  });

  describe('Distribution Calculation', () => {
    it('should calculate even distribution');
    it('should handle skewed content');
    it('should suggest rebalancing');
  });
});
```

**EvaluationEngine Tests:**
```typescript
describe('EvaluationEngine', () => {
  describe('Rubric Grading', () => {
    it('should grade against rubric criteria');
    it('should calculate weighted scores');
    it('should provide criterion-level feedback');
  });

  describe('Feedback Generation', () => {
    it('should generate constructive feedback');
    it('should highlight strengths');
    it('should suggest improvements');
    it('should adapt to student level');
  });
});
```

**PredictiveEngine Tests:**
```typescript
describe('PredictiveEngine', () => {
  describe('Outcome Prediction', () => {
    it('should predict course completion');
    it('should estimate grade probability');
    it('should identify at-risk students');
  });

  describe('Risk Assessment', () => {
    it('should detect engagement decline');
    it('should flag knowledge gaps');
    it('should recommend interventions');
  });
});
```

---

## Phase 3: Safety & Quality Tests (P2)

### 3.1 @sam-ai/safety

**Priority:** P2 - Medium
**Estimated Tests:** 60-70
**Test Framework:** Vitest

#### Test Files to Create

```
packages/safety/src/__tests__/
├── detectors/
│   ├── discouraging-language-detector.test.ts
│   ├── bias-detector.test.ts
│   ├── accessibility-checker.test.ts
│   └── constructive-framing-checker.test.ts
├── validators/
│   ├── fairness-safety-validator.test.ts
│   └── safe-evaluation-wrapper.test.ts
├── auditors/
│   └── fairness-auditor.test.ts
└── utils/
    └── feedback-rewriter.test.ts
```

#### Key Test Scenarios

**BiasDetector Tests:**
```typescript
describe('BiasDetector', () => {
  describe('Gender Bias', () => {
    it('should detect gendered language');
    it('should flag stereotypical assumptions');
    it('should allow gender-neutral alternatives');
  });

  describe('Cultural Bias', () => {
    it('should detect cultural assumptions');
    it('should flag Western-centric examples');
    it('should suggest inclusive alternatives');
  });

  describe('Age Bias', () => {
    it('should detect ageist language');
    it('should flag generational stereotypes');
  });
});
```

**FairnessSafetyValidator Tests:**
```typescript
describe('FairnessSafetyValidator', () => {
  it('should pass clean feedback');
  it('should detect multiple issue types');
  it('should aggregate severity scores');
  it('should generate recommendations');
  it('should support quick validation mode');
  it('should rewrite problematic feedback');
});
```

---

### 3.2 @sam-ai/quality

**Priority:** P2 - Medium
**Estimated Tests:** 40-50
**Test Framework:** Vitest

#### Test Files to Create

```
packages/quality/src/__tests__/
├── gates/
│   ├── completeness-gate.test.ts
│   ├── example-quality-gate.test.ts
│   ├── difficulty-match-gate.test.ts
│   ├── structure-gate.test.ts
│   └── depth-gate.test.ts
├── pipeline/
│   ├── quality-gate-pipeline.test.ts
│   └── quick-validation.test.ts
└── integration/
    └── content-validation-flow.test.ts
```

#### Key Test Scenarios

**ContentQualityGatePipeline Tests:**
```typescript
describe('ContentQualityGatePipeline', () => {
  describe('Gate Execution', () => {
    it('should run all enabled gates');
    it('should skip disabled gates');
    it('should aggregate gate results');
    it('should short-circuit on critical failure');
  });

  describe('Individual Gates', () => {
    it('CompletenessGate: should verify all elements');
    it('ExampleQualityGate: should check relevance');
    it('DifficultyMatchGate: should verify level match');
    it('StructureGate: should check organization');
    it('DepthGate: should verify appropriate depth');
  });
});
```

---

### 3.3 @sam-ai/pedagogy

**Priority:** P2 - Medium
**Estimated Tests:** 40-50
**Test Framework:** Vitest

#### Test Files to Create

```
packages/pedagogy/src/__tests__/
├── evaluators/
│   ├── blooms-aligner.test.ts
│   ├── scaffolding-evaluator.test.ts
│   └── zpd-evaluator.test.ts
├── pipeline/
│   └── pedagogical-pipeline.test.ts
└── verbs/
    └── blooms-verb-mapping.test.ts
```

#### Key Test Scenarios

**BloomsAligner Tests:**
```typescript
describe('BloomsAligner', () => {
  describe('Verb Mapping', () => {
    it('should map "list" to REMEMBER');
    it('should map "explain" to UNDERSTAND');
    it('should map "apply" to APPLY');
    it('should map "analyze" to ANALYZE');
    it('should map "evaluate" to EVALUATE');
    it('should map "create" to CREATE');
  });

  describe('Activity Analysis', () => {
    it('should detect implicit cognitive level');
    it('should handle multi-level activities');
    it('should support strict/lenient modes');
  });
});
```

**ZPDEvaluator Tests:**
```typescript
describe('ZPDEvaluator', () => {
  describe('Zone Detection', () => {
    it('should identify Safe Zone (too easy)');
    it('should identify Learning Zone (optimal)');
    it('should identify Frustration Zone (too hard)');
  });

  describe('Support Adequacy', () => {
    it('should check hint availability');
    it('should verify example presence');
    it('should assess practice opportunities');
  });
});
```

---

## Phase 4: Integration Tests (P1)

### 4.1 Cross-Package Integration

**Priority:** P1 - High
**Estimated Tests:** 60-80
**Test Framework:** Vitest

#### Test Files to Create

```
packages/__integration__/
├── core-educational/
│   ├── orchestrator-engines.test.ts
│   └── context-flow.test.ts
├── core-memory/
│   ├── mastery-tracking.test.ts
│   └── pathway-generation.test.ts
├── educational-safety/
│   ├── evaluation-safety.test.ts
│   └── feedback-validation.test.ts
├── educational-quality/
│   ├── content-quality.test.ts
│   └── exam-quality.test.ts
├── memory-adapter/
│   ├── profile-persistence.test.ts
│   └── mastery-sync.test.ts
└── full-stack/
    ├── student-learning-flow.test.ts
    ├── exam-evaluation-flow.test.ts
    └── adaptive-learning-flow.test.ts
```

#### Key Integration Scenarios

**Student Learning Flow:**
```typescript
describe('Student Learning Flow Integration', () => {
  it('should track mastery across assessments');
  it('should generate adaptive learning paths');
  it('should schedule spaced repetition reviews');
  it('should persist progress to database');
  it('should apply safety checks to feedback');
});
```

**Exam Evaluation Flow:**
```typescript
describe('Exam Evaluation Flow Integration', () => {
  it('should generate aligned exam questions');
  it('should evaluate responses with rubrics');
  it('should validate feedback for safety');
  it('should update mastery based on results');
  it('should recommend next learning steps');
});
```

---

## Phase 5: Advanced Package Tests (P3)

### 5.1 @taxomind/sam-engine

**Priority:** P3 - Low
**Estimated Tests:** 30-40
**Test Framework:** Jest (already configured)

#### Test Files to Create

```
packages/sam-engine/src/__tests__/
├── engine/
│   ├── sam-engine.test.ts
│   ├── plugin-system.test.ts
│   ├── event-system.test.ts
│   └── rate-limiting.test.ts
├── providers/
│   ├── anthropic-provider.test.ts
│   └── openai-provider.test.ts
└── conversation/
    └── conversation-management.test.ts
```

---

### 5.2 @sam-ai/react

**Priority:** P3 - Low
**Estimated Tests:** 50-60
**Test Framework:** Vitest + React Testing Library

#### Test Files to Create

```
packages/react/src/__tests__/
├── hooks/
│   ├── use-sam.test.ts
│   ├── use-sam-chat.test.ts
│   ├── use-sam-actions.test.ts
│   ├── use-sam-page-context.test.ts
│   ├── use-sam-form.test.ts
│   ├── use-sam-form-sync.test.ts
│   ├── use-sam-practice-problems.test.ts
│   └── use-sam-adaptive-content.test.ts
├── context/
│   ├── sam-provider.test.ts
│   └── context-detection.test.ts
└── components/
    └── (any UI components).test.ts
```

---

### 5.3 @sam-ai/api

**Priority:** P3 - Low
**Estimated Tests:** 30-40
**Test Framework:** Vitest + MSW (Mock Service Worker)

#### Test Files to Create

```
packages/api/src/__tests__/
├── handlers/
│   ├── message-handlers.test.ts
│   ├── analysis-handlers.test.ts
│   └── action-handlers.test.ts
├── middleware/
│   ├── authentication.test.ts
│   ├── authorization.test.ts
│   ├── rate-limiting.test.ts
│   └── logging.test.ts
└── utils/
    ├── response-formatting.test.ts
    └── error-handling.test.ts
```

---

## Test Infrastructure Setup

### Required Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "msw": "^2.0.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0"
  }
}
```

### Vitest Configuration (packages/*/vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
```

### Jest Configuration (packages/sam-engine/jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Mock Utilities (packages/*/src/__tests__/mocks/)

```typescript
// AI Provider Mock
export const mockAnthropicAdapter = {
  complete: vi.fn().mockResolvedValue({
    content: 'Mock response',
    usage: { input_tokens: 100, output_tokens: 50 },
  }),
};

// Database Mock
export const mockPrismaClient = {
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  studentProfile: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  // ... other models
};

// Storage Mock
export const mockStorage = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
};
```

---

## Test Execution Strategy

### Local Development

```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test --workspace=@sam-ai/core

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Estimated Effort

| Phase | Package(s) | Tests | Effort |
|-------|-----------|-------|--------|
| 1 | core, adapter-prisma | 130-160 | 3-4 days |
| 2 | memory, educational | 170-200 | 4-5 days |
| 3 | safety, quality, pedagogy | 140-170 | 3-4 days |
| 4 | Integration tests | 60-80 | 2-3 days |
| 5 | sam-engine, react, api | 110-140 | 3-4 days |

**Total Estimated Tests:** 610-750
**Total Estimated Effort:** 15-20 days

---

## Success Criteria

### Coverage Targets

| Package | Line Coverage | Branch Coverage |
|---------|--------------|-----------------|
| @sam-ai/core | 85% | 80% |
| @sam-ai/adapter-prisma | 80% | 75% |
| @sam-ai/memory | 85% | 80% |
| @sam-ai/educational | 80% | 75% |
| @sam-ai/safety | 90% | 85% |
| @sam-ai/quality | 85% | 80% |
| @sam-ai/pedagogy | 85% | 80% |
| @sam-ai/sam-engine | 75% | 70% |
| @sam-ai/react | 75% | 70% |
| @sam-ai/api | 75% | 70% |

### Quality Gates

- [ ] All tests pass on CI
- [ ] Coverage thresholds met
- [ ] No critical paths untested
- [ ] Integration tests validate cross-package flows
- [ ] Mocks properly isolate units
- [ ] Tests are deterministic (no flaky tests)

---

## Risk Mitigation

### Known Challenges

1. **AI Provider Mocking:** Anthropic/OpenAI responses need realistic mocks
2. **Database Testing:** Requires test database setup
3. **Async Complexity:** Many async flows need careful handling
4. **Type System:** Complex generics may complicate test setup

### Mitigation Strategies

1. **Snapshot testing** for AI response formats
2. **Docker-based test database** for isolation
3. **Vitest's async utilities** for race condition handling
4. **Type-safe mock factories** using generics

---

## Recommended Execution Order

```
Week 1-2: Phase 1 (Core + Adapter)
├── Setup test infrastructure
├── @sam-ai/core tests
└── @sam-ai/adapter-prisma tests

Week 2-3: Phase 2 (Learning System)
├── @sam-ai/memory tests
└── @sam-ai/educational tests (critical engines)

Week 3-4: Phase 3 (Safety & Quality)
├── @sam-ai/safety tests
├── @sam-ai/quality tests
└── @sam-ai/pedagogy tests

Week 4: Phase 4 (Integration)
├── Cross-package integration tests
└── Full-stack flow tests

Week 5: Phase 5 (Advanced)
├── @sam-ai/sam-engine tests
├── @sam-ai/react tests
└── @sam-ai/api tests
```

---

## Questions for Review

1. **Priority Adjustment:** Should any package priority be changed?
2. **Coverage Targets:** Are 80%+ targets realistic for initial phase?
3. **Test Frameworks:** Vitest for all packages or keep Jest for sam-engine?
4. **Integration Scope:** Which cross-package flows are most critical?
5. **CI/CD Integration:** Required test gates for PR merging?
6. **Timeline:** Is 15-20 days acceptable, or need faster delivery?

---

## Approval

| Role | Name | Date | Approval |
|------|------|------|----------|
| Project Owner | | | [ ] Approved |
| Tech Lead | | | [ ] Approved |
| QA Lead | | | [ ] Approved |

---

**Next Steps:**
1. Review and approve this plan
2. Set up test infrastructure
3. Begin Phase 1 implementation
4. Daily progress tracking

