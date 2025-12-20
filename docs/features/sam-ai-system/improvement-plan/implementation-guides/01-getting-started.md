# Getting Started - SAM AI Tutor Development

## Purpose
This guide helps new developers onboard to the SAM AI Tutor improvement plan implementation. It provides a clear path from zero knowledge to productive contribution.

---

## Prerequisites

### Required Knowledge
- **TypeScript/JavaScript**: Intermediate level (async/await, generics, type inference)
- **React 19**: Functional components, hooks (useState, useEffect, useCallback, useMemo)
- **Next.js 15**: App Router, Server Components, Server Actions, API routes
- **Prisma ORM**: Schema definition, migrations, query patterns
- **PostgreSQL**: Basic SQL, understanding of indexes and relations

### Recommended Knowledge
- **AI/ML Basics**: Understanding of LLMs, embeddings, vector search
- **Educational Theory**: Bloom's Taxonomy, spaced repetition, scaffolding
- **System Design**: Caching strategies, rate limiting, circuit breakers

---

## Local Development Setup

### 1. Repository Setup
```bash
# Clone repository
git clone https://github.com/your-org/sam-ai-tutor.git
cd sam-ai-tutor

# Install dependencies
npm install

# Verify installation
npm run lint
npx tsc --noEmit
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Required environment variables
DATABASE_URL="postgresql://user:password@localhost:5433/taxomind_dev"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# AI Provider Keys (Phase 1+)
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Redis (Phase 2+)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Vector Database (Phase 3+)
PINECONE_API_KEY="..."
PINECONE_ENVIRONMENT="us-east-1"
```

### 3. Database Setup
```bash
# Start local PostgreSQL (Docker)
npm run dev:docker:start

# Run migrations
npx prisma migrate dev

# Seed development data
npm run dev:db:seed

# Open Prisma Studio (visual DB browser)
npm run dev:db:studio
```

### 4. Verify Setup
```bash
# Run development server
npm run dev

# In another terminal, run tests
npm run test

# Check build
npm run build

# Access application
# Navigate to http://localhost:3000
```

---

## Project Structure Deep Dive

### High-Level Directory Organization
```
sam-ai-tutor/
├── app/                          # Next.js 15 App Router
│   ├── (course)/                 # Course learning interface
│   ├── (protected)/              # Role-based protected routes
│   └── api/                      # API routes (100+ endpoints)
│
├── components/                   # React components
│   ├── sam/                      # SAM AI components
│   ├── ui/                       # Shadcn UI primitives
│   └── learning/                 # Learning-specific components
│
├── lib/                          # Core libraries
│   ├── sam/                      # SAM AI Tutor engines
│   │   ├── engines/              # 35+ specialized engines
│   │   ├── core/                 # SAMBaseEngine foundation
│   │   ├── orchestration/        # Multi-engine coordination
│   │   └── memory/               # Student memory system
│   │
│   ├── ai/                       # AI integrations
│   │   ├── anthropic/            # Claude integration
│   │   ├── openai/               # GPT integration
│   │   └── embeddings/           # Vector embeddings
│   │
│   ├── db/                       # Database utilities
│   │   ├── db.ts                 # Prisma client singleton
│   │   └── enterprise-db.ts      # Enterprise safety layer
│   │
│   └── utils/                    # Shared utilities
│
├── prisma/                       # Database schema
│   ├── schema.prisma             # 50+ models
│   └── migrations/               # Migration history
│
├── improvement-plan/             # This documentation
│   ├── phase-1-foundation/
│   ├── phase-2-intelligence/
│   ├── phase-3-advanced/
│   ├── phase-4-thinking/
│   ├── architecture/
│   ├── implementation-guides/    # You are here
│   ├── testing-strategies/
│   └── metrics-kpis/
│
└── __tests__/                    # Test suites
    ├── unit/
    ├── integration/
    └── e2e/
```

### Key Files to Understand First

#### 1. SAM Base Engine (`lib/sam/core/SAMBaseEngine.ts`)
**Purpose**: Foundation for all 35+ SAM engines

```typescript
export abstract class SAMBaseEngine {
  protected config: EngineConfig;
  protected cache: EngineCache;
  protected logger: EngineLogger;

  // Every engine implements this
  abstract execute(input: EngineInput): Promise<EngineOutput>;

  // Built-in caching, error handling, monitoring
  protected getCached(key: string): Promise<any>;
  protected setCached(key: string, value: any, ttl: number): Promise<void>;
  protected logError(error: Error, context: object): void;
}
```

**Why it matters**: All engines inherit from this class, providing consistent:
- Error handling and logging
- Caching mechanisms
- Performance monitoring
- Input validation

#### 2. Orchestration Layer (`lib/sam/orchestration/orchestrator.ts`)
**Purpose**: Coordinates multiple engines for complex queries

```typescript
interface OrchestrationPlan {
  query: string;
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  engines: Array<{
    name: string;
    priority: number;
    dependencies: string[];
  }>;
  estimated_time_ms: number;
}

export class SAMOrchestrator {
  async orchestrate(query: string): Promise<SAMResponse> {
    const plan = await this.createPlan(query);
    const results = await this.executeEngines(plan);
    return this.synthesizeResponse(results);
  }
}
```

**Why it matters**: This is the brain that decides which engines to use and in what order.

#### 3. Student Memory System (`lib/sam/memory/student-memory.ts`)
**Purpose**: Persistent student model (knowledge graph + learning style)

```typescript
interface StudentMemory {
  user_id: string;
  knowledge_graph: {
    concepts: Array<{
      id: string;
      name: string;
      mastery_level: number; // 0.0 - 1.0
      last_assessed: Date;
    }>;
    relationships: Array<{
      from_concept: string;
      to_concept: string;
      relationship_type: 'PREREQUISITE' | 'RELATED' | 'APPLIES_TO';
    }>;
  };
  learning_style: {
    visual_preference: number;
    auditory_preference: number;
    kinesthetic_preference: number;
  };
  emotional_state: {
    current_motivation: number; // 0.0 - 1.0
    frustration_level: number;
    confidence_level: number;
  };
}
```

**Why it matters**: This is what makes SAM adaptive - it remembers each student's journey.

---

## Understanding the Phase System

### Phase 1: Foundation (Months 1-3)
**Goal**: Solid engineering foundation + basic multi-engine chat

**Key Deliverables**:
- Circuit breaker pattern for AI API calls
- Two-tier caching (memory + Redis)
- Multi-provider failover (Claude ↔ GPT)
- Basic chat with 5 engines (Conversation, Code, Math, Explanation, Quiz)

**Your First Task**: If starting here, implement the circuit breaker:
```bash
# File to create: lib/ai/circuit-breaker.ts
# Reference: improvement-plan/phase-1-foundation/02-reliability-patterns.md
```

### Phase 2: Intelligence (Months 4-6)
**Goal**: Make SAM understand students deeply

**Key Deliverables**:
- Student knowledge graph (what student knows)
- Learning style detection (VARK model)
- Emotional state tracking (motivation, frustration)
- Adaptive difficulty adjustment

**Your First Task**: Extend the student memory system:
```bash
# File to modify: lib/sam/memory/student-memory.ts
# Reference: improvement-plan/phase-2-intelligence/02-student-memory.md
```

### Phase 3: Advanced Intelligence (Months 7-12)
**Goal**: Evidence-based teaching + predictive analytics

**Key Deliverables**:
- Bloom's Taxonomy evaluator
- IRT-based adaptive testing
- Spaced repetition scheduler
- At-risk student detection

**Your First Task**: Implement Bloom's evaluator:
```bash
# File to create: lib/sam/engines/pedagogy/blooms-evaluator.ts
# Reference: improvement-plan/phase-3-advanced/03-pedagogical-evaluators.md
```

### Phase 4: Thinking Machine (Months 13-18)
**Goal**: Autonomous planning and Socratic teaching

**Key Deliverables**:
- Planner-executor architecture
- 20+ educational tool registry
- Socratic questioning engine
- Multi-agent collaboration (4 agents: Tutor, Critic, Socratic, Synthesizer)

**Your First Task**: Build the planner agent:
```bash
# File to create: lib/sam/agents/planner-agent.ts
# Reference: improvement-plan/phase-4-thinking/01-planner-executor-architecture.md
```

---

## Development Workflow

### 1. Pick a Task from Roadmap
```bash
# View current phase status
cat improvement-plan/PROGRESS-SUMMARY.md

# Choose a specific feature
# Example: "Implement Circuit Breaker" (Phase 1)
```

### 2. Read the Specification
```bash
# Read the relevant phase document
cat improvement-plan/phase-1-foundation/02-reliability-patterns.md

# Understand the requirements, interfaces, and examples
```

### 3. Create the Implementation
```typescript
// lib/ai/circuit-breaker.ts
import { CircuitBreakerConfig, CircuitState } from './types';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: Date | null = null;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    const elapsed = Date.now() - this.lastFailureTime.getTime();
    return elapsed >= this.config.resetTimeout;
  }
}
```

### 4. Write Tests First (TDD)
```typescript
// __tests__/unit/ai/circuit-breaker.test.ts
import { CircuitBreaker } from '@/lib/ai/circuit-breaker';

describe('CircuitBreaker', () => {
  it('should allow requests when circuit is CLOSED', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 5000,
    });

    const result = await cb.execute(async () => 'success');
    expect(result).toBe('success');
  });

  it('should open circuit after threshold failures', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 5000,
    });

    const failingFn = async () => {
      throw new Error('Service unavailable');
    };

    // Trigger 3 failures
    await expect(cb.execute(failingFn)).rejects.toThrow();
    await expect(cb.execute(failingFn)).rejects.toThrow();
    await expect(cb.execute(failingFn)).rejects.toThrow();

    // Circuit should be OPEN now
    await expect(cb.execute(async () => 'test')).rejects.toThrow(
      'Circuit breaker is OPEN'
    );
  });

  it('should attempt reset after timeout', async () => {
    jest.useFakeTimers();
    const cb = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeout: 5000,
    });

    // Open circuit
    const failingFn = async () => {
      throw new Error('Service unavailable');
    };
    await expect(cb.execute(failingFn)).rejects.toThrow();
    await expect(cb.execute(failingFn)).rejects.toThrow();

    // Fast-forward time
    jest.advanceTimersByTime(6000);

    // Should attempt reset (HALF_OPEN state)
    const result = await cb.execute(async () => 'success');
    expect(result).toBe('success');

    jest.useRealTimers();
  });
});
```

### 5. Run Tests
```bash
# Run tests for your new feature
npm test __tests__/unit/ai/circuit-breaker.test.ts

# Run full test suite
npm run test

# Check coverage
npm run test:coverage
```

### 6. Integrate with Existing Code
```typescript
// lib/ai/anthropic/client.ts
import { CircuitBreaker } from '@/lib/ai/circuit-breaker';

const anthropicCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
});

export async function callClaude(prompt: string): Promise<string> {
  return anthropicCircuitBreaker.execute(async () => {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0].text;
  });
}
```

### 7. Manual Testing
```bash
# Start dev server
npm run dev

# Test in browser
# Navigate to http://localhost:3000
# Interact with SAM chat to verify circuit breaker works
```

### 8. Code Review Checklist
```bash
# Before committing
npm run lint              # Fix all ESLint errors
npx tsc --noEmit         # Fix all TypeScript errors
npm run test             # All tests passing
npm run build            # Production build succeeds

# Git commit
git add lib/ai/circuit-breaker.ts __tests__/unit/ai/circuit-breaker.test.ts
git commit -m "feat(ai): implement circuit breaker for API resilience

- Add CircuitBreaker class with CLOSED/OPEN/HALF_OPEN states
- Configurable failure threshold and reset timeout
- Comprehensive unit tests with 95% coverage
- Integrate with Anthropic API client

Ref: improvement-plan/phase-1-foundation/02-reliability-patterns.md"

# Create pull request
git push origin feature/circuit-breaker
gh pr create --title "feat(ai): implement circuit breaker" --body "..."
```

---

## Common Development Tasks

### Task 1: Adding a New SAM Engine
**Scenario**: You need to create a new engine for chemistry tutoring

```bash
# 1. Create engine file
touch lib/sam/engines/chemistry/chemistry-tutor-engine.ts

# 2. Implement engine extending SAMBaseEngine
```

```typescript
// lib/sam/engines/chemistry/chemistry-tutor-engine.ts
import { SAMBaseEngine, EngineInput, EngineOutput } from '@/lib/sam/core/SAMBaseEngine';

export class ChemistryTutorEngine extends SAMBaseEngine {
  constructor() {
    super({
      name: 'Chemistry Tutor',
      version: '1.0.0',
      capabilities: ['balancing-equations', 'stoichiometry', 'periodic-table'],
    });
  }

  async execute(input: EngineInput): Promise<EngineOutput> {
    // Check cache first
    const cacheKey = `chemistry:${input.query}`;
    const cached = await this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Detect chemistry topic
      const topic = await this.detectTopic(input.query);

      // Generate response based on topic
      let response: string;
      switch (topic) {
        case 'balancing':
          response = await this.helpBalanceEquation(input.query);
          break;
        case 'stoichiometry':
          response = await this.solveStoichiometry(input.query);
          break;
        default:
          response = await this.generalChemistryHelp(input.query);
      }

      const output: EngineOutput = {
        success: true,
        data: { response, topic },
        metadata: {
          engine: this.config.name,
          timestamp: new Date().toISOString(),
        },
      };

      // Cache result
      await this.setCached(cacheKey, output, 3600); // 1 hour

      return output;
    } catch (error) {
      this.logError(error as Error, { input });
      return {
        success: false,
        error: {
          code: 'CHEMISTRY_ERROR',
          message: 'Failed to process chemistry query',
        },
      };
    }
  }

  private async detectTopic(query: string): Promise<string> {
    // Simple keyword detection (replace with AI in production)
    if (/balance|equation/i.test(query)) return 'balancing';
    if (/mole|stoichiometry|grams/i.test(query)) return 'stoichiometry';
    return 'general';
  }

  private async helpBalanceEquation(query: string): Promise<string> {
    // Implementation for balancing chemical equations
    return `To balance this equation, follow these steps:\n1. Count atoms on each side\n2. Adjust coefficients...`;
  }

  private async solveStoichiometry(query: string): Promise<string> {
    // Implementation for stoichiometry problems
    return `For this stoichiometry problem:\n1. Convert to moles\n2. Use mole ratios...`;
  }

  private async generalChemistryHelp(query: string): Promise<string> {
    // Fallback to AI for general questions
    const prompt = `You are a chemistry tutor. Student question: ${query}`;
    // Call AI provider here
    return `Chemistry explanation...`;
  }
}
```

```bash
# 3. Register engine in orchestrator
# Edit: lib/sam/orchestration/engine-registry.ts
```

```typescript
// lib/sam/orchestration/engine-registry.ts
import { ChemistryTutorEngine } from '@/lib/sam/engines/chemistry/chemistry-tutor-engine';

export const engineRegistry = {
  // ... existing engines
  chemistry: new ChemistryTutorEngine(),
};
```

```bash
# 4. Write tests
touch __tests__/unit/sam/engines/chemistry-tutor-engine.test.ts

# 5. Run tests
npm test __tests__/unit/sam/engines/chemistry-tutor-engine.test.ts
```

### Task 2: Adding a Database Model for Student Knowledge Graph
**Scenario**: Implement the knowledge graph for Phase 2

```bash
# 1. Update Prisma schema
# Edit: prisma/schema.prisma
```

```prisma
// prisma/schema.prisma

// New models for knowledge graph
model ConceptNode {
  id              String   @id @default(cuid())
  userId          String
  conceptName     String
  masteryLevel    Float    @default(0.0) // 0.0 - 1.0
  lastAssessed    DateTime @default(now())
  timesReviewed   Int      @default(0)

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Relationships to other concepts
  prerequisitesFrom ConceptRelationship[] @relation("PrerequisiteFrom")
  prerequisitesTo   ConceptRelationship[] @relation("PrerequisiteTo")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, conceptName])
  @@index([userId])
  @@index([masteryLevel])
}

model ConceptRelationship {
  id              String   @id @default(cuid())
  fromConceptId   String
  toConceptId     String
  relationshipType String  // PREREQUISITE, RELATED, APPLIES_TO
  strength        Float    @default(1.0) // 0.0 - 1.0

  fromConcept     ConceptNode @relation("PrerequisiteFrom", fields: [fromConceptId], references: [id], onDelete: Cascade)
  toConcept       ConceptNode @relation("PrerequisiteTo", fields: [toConceptId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([fromConceptId, toConceptId, relationshipType])
  @@index([fromConceptId])
  @@index([toConceptId])
}

model StudentLearningStyle {
  id                    String   @id @default(cuid())
  userId                String   @unique

  visualPreference      Float    @default(0.33)
  auditoryPreference    Float    @default(0.33)
  kinestheticPreference Float    @default(0.34)

  currentMotivation     Float    @default(0.7)
  frustrationLevel      Float    @default(0.2)
  confidenceLevel       Float    @default(0.6)

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([userId])
}
```

```bash
# 2. Create migration
npx prisma migrate dev --name add_knowledge_graph

# 3. Generate Prisma client
npx prisma generate

# 4. Create service for knowledge graph operations
touch lib/sam/memory/knowledge-graph-service.ts
```

```typescript
// lib/sam/memory/knowledge-graph-service.ts
import { db } from '@/lib/db';

export class KnowledgeGraphService {
  async updateMastery(
    userId: string,
    conceptName: string,
    newMasteryLevel: number
  ): Promise<void> {
    await db.conceptNode.upsert({
      where: {
        userId_conceptName: {
          userId,
          conceptName,
        },
      },
      update: {
        masteryLevel: newMasteryLevel,
        lastAssessed: new Date(),
        timesReviewed: { increment: 1 },
      },
      create: {
        userId,
        conceptName,
        masteryLevel: newMasteryLevel,
      },
    });
  }

  async addPrerequisite(
    userId: string,
    fromConcept: string,
    toConcept: string
  ): Promise<void> {
    // Get or create concept nodes
    const fromNode = await this.getOrCreateNode(userId, fromConcept);
    const toNode = await this.getOrCreateNode(userId, toConcept);

    // Create relationship
    await db.conceptRelationship.create({
      data: {
        fromConceptId: fromNode.id,
        toConceptId: toNode.id,
        relationshipType: 'PREREQUISITE',
        strength: 1.0,
      },
    });
  }

  async getWeakConcepts(userId: string, threshold = 0.6): Promise<string[]> {
    const weakConcepts = await db.conceptNode.findMany({
      where: {
        userId,
        masteryLevel: { lt: threshold },
      },
      orderBy: {
        masteryLevel: 'asc',
      },
      select: {
        conceptName: true,
      },
    });

    return weakConcepts.map((c) => c.conceptName);
  }

  private async getOrCreateNode(userId: string, conceptName: string) {
    return db.conceptNode.upsert({
      where: {
        userId_conceptName: {
          userId,
          conceptName,
        },
      },
      update: {},
      create: {
        userId,
        conceptName,
        masteryLevel: 0.0,
      },
    });
  }
}
```

```bash
# 5. Write tests for service
touch __tests__/unit/sam/memory/knowledge-graph-service.test.ts

# 6. Test in Prisma Studio
npm run dev:db:studio
```

### Task 3: Debugging a Failing Test
**Scenario**: Integration test fails after adding new engine

```bash
# Run failing test with verbose output
npm test __tests__/integration/sam/orchestration.test.ts -- --verbose

# Example error output:
# FAIL __tests__/integration/sam/orchestration.test.ts
#   ● SAM Orchestrator › should route chemistry questions to chemistry engine
#     TypeError: engineRegistry.chemistry is not a function
```

**Debugging steps**:

1. **Check if engine is registered**:
```bash
grep -r "chemistry" lib/sam/orchestration/engine-registry.ts
# Output: (nothing found)
# Issue: Forgot to register chemistry engine!
```

2. **Fix the registration**:
```typescript
// lib/sam/orchestration/engine-registry.ts
import { ChemistryTutorEngine } from '@/lib/sam/engines/chemistry/chemistry-tutor-engine';

export const engineRegistry = {
  conversation: new ConversationEngine(),
  code: new CodeExplanationEngine(),
  math: new MathEngine(),
  chemistry: new ChemistryTutorEngine(), // Add this!
};
```

3. **Re-run test**:
```bash
npm test __tests__/integration/sam/orchestration.test.ts
# PASS (all tests passing now)
```

---

## Getting Help

### Documentation Resources
1. **Phase Documentation**: `improvement-plan/phase-X-name/`
2. **Architecture Docs**: `improvement-plan/architecture/`
3. **Code Standards**: `improvement-plan/implementation-guides/02-code-standards.md`
4. **Testing Guide**: `improvement-plan/testing-strategies/`

### Team Communication
- **Slack**: #sam-ai-tutor-dev channel
- **Weekly Sync**: Thursdays 2pm EST
- **Code Reviews**: GitHub pull requests

### Common Questions

**Q: Which phase should I start with?**
A: Start with Phase 1 tasks, even if later phases interest you more. The foundation is critical.

**Q: Can I work on multiple phases simultaneously?**
A: No. Phases must be completed sequentially due to dependencies.

**Q: How do I know if my code follows the standards?**
A: Run `npm run lint` and `npx tsc --noEmit`. Both must pass with zero errors.

**Q: What if I find a bug in the improvement plan docs?**
A: Open a GitHub issue with label `documentation-bug`. We review these weekly.

**Q: Can I propose architectural changes?**
A: Yes! Create an RFC (Request for Comments) document in `improvement-plan/rfcs/` and tag the team.

---

## Next Steps

1. **Complete local setup** (this document)
2. **Read code standards**: `improvement-plan/implementation-guides/02-code-standards.md`
3. **Pick your first task**: `improvement-plan/PROGRESS-SUMMARY.md`
4. **Read testing guide**: `improvement-plan/testing-strategies/01-integration-testing.md`
5. **Start coding!**

Welcome to the team! 🚀
