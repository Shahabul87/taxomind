# Student Memory System

**Timeline**: Weeks 17-18 (2 weeks)
**Priority**: 🔴 Critical
**Budget**: $28,000
**Owner**: Senior Backend Engineer + ML/AI Engineer

---

## 📋 Executive Summary

Build a comprehensive student memory system that tracks each student's learning journey, preferences, knowledge state, and interaction history. This transforms SAM from a stateless assistant into a personalized tutor that "remembers" each student.

### Current Problem
```
❌ Every conversation starts from zero context
❌ SAM doesn't remember student's knowledge level
❌ No learning preference tracking (visual, auditory, etc.)
❌ Repeated explanations for same concepts
❌ No difficulty adaptation based on performance
❌ Generic responses not tailored to individual students
❌ Lost conversation context between sessions
```

### Target Solution
```
✅ Persistent student profile with learning history
✅ Knowledge state tracking (what student knows/struggles with)
✅ Learning preference detection and storage
✅ Interaction history for context continuity
✅ Adaptive difficulty based on performance
✅ Personalized recommendations
✅ Progress milestones and achievements
```

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Memory recall accuracy >90%
- ✅ Preference prediction accuracy >85%
- ✅ Knowledge state accuracy >80%
- ✅ Memory retrieval latency <50ms (p95)
- ✅ Storage growth rate <100KB per student/month

### Personalization Metrics
- ✅ Personalized responses >70% of interactions
- ✅ Difficulty adaptation accuracy >75%
- ✅ Learning style match >80%
- ✅ "SAM knows me" rating >4.0/5

### Business Metrics
- ✅ Student engagement increase 40%
- ✅ Return rate (daily usage) increase 60%
- ✅ Course completion rate increase 25%
- ✅ Student satisfaction increase to 4.5/5

---

## 🏗️ Technical Design

### Student Memory Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Student Interaction                    │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Memory Manager     │
              │  - Collect signal   │
              │  - Update state     │
              │  - Store memory     │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Knowledge  │ │ Preferences │ │  History    │
│   State     │ │             │ │             │
│             │ │             │ │             │
│ - Concepts  │ │ - Learning  │ │ - Sessions  │
│ - Skills    │ │   style     │ │ - Questions │
│ - Mastery   │ │ - Pace      │ │ - Struggles │
│ - Gaps      │ │ - Bloom lvl │ │ - Successes │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
                       ▼
              ┌─────────────────────┐
              │   PostgreSQL        │
              │   StudentMemory     │
              │   - Structured      │
              │   - Indexed         │
              │   - Fast queries    │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Memory Retrieval  │
              │   - Context assembly│
              │   - Priority filter │
              │   - Recency weight  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Personalized SAM   │
              │  - Knows student    │
              │  - Adapts responses │
              │  - Tailored help    │
              └─────────────────────┘
```

### Database Schema

```prisma
// prisma/schema.prisma (additions)

model StudentMemory {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  // Knowledge State
  knownConcepts     Json // { conceptId: masteryLevel }
  strugglingConcepts Json // { conceptId: struggleCount }
  skillLevels       Json // { skill: level }

  // Learning Preferences
  learningStyle     LearningStyle @default(BALANCED)
  preferredPace     Pace          @default(NORMAL)
  bloomPreference   BloomLevel    @default(UNDERSTAND)
  difficultyLevel   Difficulty    @default(MEDIUM)

  // Interaction Patterns
  averageSessionLength  Int    // minutes
  questionsPerSession   Float
  completionRate        Float  // 0-1
  engagementScore       Float  // 0-1

  // Progress Tracking
  totalSessions         Int    @default(0)
  totalQuestions        Int    @default(0)
  correctAnswers        Int    @default(0)
  coursesStarted        String[] // courseIds
  coursesCompleted      String[] // courseIds

  // Metadata
  lastInteractionAt DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([userId])
  @@index([userId])
}

model InteractionHistory {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])

  sessionId         String

  // Interaction details
  questionAsked     String
  responseGiven     String
  conceptsCovered   String[] // conceptIds
  bloomLevel        BloomLevel
  difficulty        Difficulty

  // Performance signals
  wasHelpful        Boolean?
  studentRating     Int?     // 1-5
  followUpCount     Int      @default(0)
  timeSpent         Int      // seconds

  // Context
  courseId          String?
  chapterId         String?
  sectionId         String?

  timestamp         DateTime @default(now())

  @@index([userId, sessionId])
  @@index([userId, timestamp])
}

model ConceptMastery {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  conceptId     String
  conceptName   String

  // Mastery tracking
  masteryLevel  Float    // 0-1 (IRT-based)
  confidence    Float    // 0-1

  // Practice statistics
  totalAttempts Int      @default(0)
  correctCount  Int      @default(0)

  // Learning curve
  firstSeenAt   DateTime
  lastPracticedAt DateTime
  daysToMastery Int?

  // Relationships
  prerequisites String[] // conceptIds student should learn first
  relatedConcepts String[] // conceptIds

  @@unique([userId, conceptId])
  @@index([userId, masteryLevel])
}

enum LearningStyle {
  VISUAL
  AUDITORY
  READING
  KINESTHETIC
  BALANCED
}

enum Pace {
  SLOW
  NORMAL
  FAST
}

enum BloomLevel {
  REMEMBER
  UNDERSTAND
  APPLY
  ANALYZE
  EVALUATE
  CREATE
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
  ADAPTIVE
}
```

### Memory Manager Implementation

```typescript
// sam-ai-tutor/lib/memory/memory-manager.ts

export class StudentMemoryManager {
  private db: PrismaClient;
  private cache: CacheManager;

  constructor(db: PrismaClient, cache: CacheManager) {
    this.db = db;
    this.cache = cache;
  }

  async getStudentMemory(userId: string): Promise<StudentMemoryProfile> {
    const cacheKey = `memory:${userId}`;

    // Try cache first
    const cached = await this.cache.get<StudentMemoryProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    // Load from database
    let memory = await this.db.studentMemory.findUnique({
      where: { userId }
    });

    if (!memory) {
      // Create new memory for first-time user
      memory = await this.db.studentMemory.create({
        data: {
          userId,
          knownConcepts: {},
          strugglingConcepts: {},
          skillLevels: {},
          averageSessionLength: 0,
          questionsPerSession: 0,
          completionRate: 0,
          engagementScore: 0
        }
      });
    }

    // Load recent interactions
    const recentInteractions = await this.db.interactionHistory.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    // Load concept mastery
    const conceptMastery = await this.db.conceptMastery.findMany({
      where: { userId },
      orderBy: { masteryLevel: 'desc' }
    });

    const profile: StudentMemoryProfile = {
      userId,
      knowledgeState: {
        knownConcepts: memory.knownConcepts as Record<string, number>,
        strugglingConcepts: memory.strugglingConcepts as Record<string, number>,
        skillLevels: memory.skillLevels as Record<string, number>,
        conceptMastery: conceptMastery.map(cm => ({
          conceptId: cm.conceptId,
          conceptName: cm.conceptName,
          masteryLevel: cm.masteryLevel,
          confidence: cm.confidence,
          totalAttempts: cm.totalAttempts,
          correctCount: cm.correctCount
        }))
      },
      preferences: {
        learningStyle: memory.learningStyle,
        pace: memory.preferredPace,
        bloomPreference: memory.bloomPreference,
        difficultyLevel: memory.difficultyLevel
      },
      history: {
        recentSessions: this.groupBySession(recentInteractions),
        totalSessions: memory.totalSessions,
        totalQuestions: memory.totalQuestions,
        correctAnswers: memory.correctAnswers,
        averageSessionLength: memory.averageSessionLength
      },
      progress: {
        coursesStarted: memory.coursesStarted,
        coursesCompleted: memory.coursesCompleted,
        engagementScore: memory.engagementScore,
        completionRate: memory.completionRate
      },
      metadata: {
        lastInteractionAt: memory.lastInteractionAt,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt
      }
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, profile, { ttl: 300 });

    return profile;
  }

  async updateFromInteraction(
    userId: string,
    interaction: InteractionData
  ): Promise<void> {
    // Record interaction
    await this.db.interactionHistory.create({
      data: {
        userId,
        sessionId: interaction.sessionId,
        questionAsked: interaction.question,
        responseGiven: interaction.response,
        conceptsCovered: interaction.concepts,
        bloomLevel: interaction.bloomLevel,
        difficulty: interaction.difficulty,
        wasHelpful: interaction.wasHelpful,
        studentRating: interaction.rating,
        timeSpent: interaction.timeSpent,
        courseId: interaction.courseId,
        chapterId: interaction.chapterId,
        sectionId: interaction.sectionId
      }
    });

    // Update concept mastery
    for (const conceptId of interaction.concepts) {
      await this.updateConceptMastery(
        userId,
        conceptId,
        interaction.wasCorrect ?? false
      );
    }

    // Update memory aggregates
    await this.updateMemoryAggregates(userId, interaction);

    // Detect and update preferences
    await this.detectPreferences(userId);

    // Invalidate cache
    await this.cache.delete(`memory:${userId}`);
  }

  private async updateConceptMastery(
    userId: string,
    conceptId: string,
    correct: boolean
  ): Promise<void> {
    const existing = await this.db.conceptMastery.findUnique({
      where: {
        userId_conceptId: { userId, conceptId }
      }
    });

    if (existing) {
      // Update using Item Response Theory (IRT)
      const newMastery = this.calculateIRTMastery(
        existing.masteryLevel,
        existing.totalAttempts,
        correct
      );

      await this.db.conceptMastery.update({
        where: { id: existing.id },
        data: {
          masteryLevel: newMastery,
          totalAttempts: existing.totalAttempts + 1,
          correctCount: existing.correctCount + (correct ? 1 : 0),
          lastPracticedAt: new Date()
        }
      });
    } else {
      // Create new mastery entry
      await this.db.conceptMastery.create({
        data: {
          userId,
          conceptId,
          conceptName: await this.getConceptName(conceptId),
          masteryLevel: correct ? 0.6 : 0.3,
          confidence: 0.5,
          totalAttempts: 1,
          correctCount: correct ? 1 : 0,
          firstSeenAt: new Date(),
          lastPracticedAt: new Date(),
          prerequisites: [],
          relatedConcepts: []
        }
      });
    }
  }

  private calculateIRTMastery(
    currentMastery: number,
    totalAttempts: number,
    correct: boolean
  ): number {
    // Simplified IRT model
    const learningRate = 0.1 / Math.sqrt(totalAttempts + 1);
    const adjustment = correct ? learningRate : -learningRate;
    const newMastery = currentMastery + adjustment;

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, newMastery));
  }

  private async updateMemoryAggregates(
    userId: string,
    interaction: InteractionData
  ): Promise<void> {
    const memory = await this.db.studentMemory.findUnique({
      where: { userId }
    });

    if (!memory) return;

    // Update statistics
    await this.db.studentMemory.update({
      where: { userId },
      data: {
        totalQuestions: memory.totalQuestions + 1,
        correctAnswers: memory.correctAnswers + (interaction.wasCorrect ? 1 : 0),
        lastInteractionAt: new Date()
      }
    });
  }

  private async detectPreferences(userId: string): Promise<void> {
    // Analyze recent interactions to detect learning preferences
    const recentInteractions = await this.db.interactionHistory.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    if (recentInteractions.length < 10) {
      return; // Not enough data
    }

    // Detect learning style preference
    const styleScores = this.detectLearningStyle(recentInteractions);
    const preferredStyle = Object.entries(styleScores)
      .sort(([, a], [, b]) => b - a)[0][0] as LearningStyle;

    // Detect Bloom level preference
    const bloomCounts = this.countBloomLevels(recentInteractions);
    const preferredBloom = Object.entries(bloomCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as BloomLevel;

    // Detect pace preference
    const avgTimePerQuestion = recentInteractions.reduce((sum, i) => sum + i.timeSpent, 0)
      / recentInteractions.length;
    const pace = this.determinePace(avgTimePerQuestion);

    // Update preferences
    await this.db.studentMemory.update({
      where: { userId },
      data: {
        learningStyle: preferredStyle,
        bloomPreference: preferredBloom,
        preferredPace: pace
      }
    });
  }

  private detectLearningStyle(interactions: any[]): Record<string, number> {
    // Analyze content patterns to infer learning style
    const scores = {
      VISUAL: 0,
      AUDITORY: 0,
      READING: 0,
      KINESTHETIC: 0,
      BALANCED: 0
    };

    for (const interaction of interactions) {
      const content = interaction.questionAsked + ' ' + interaction.responseGiven;

      // Simple heuristics (can be enhanced with ML)
      if (/diagram|chart|graph|visual|image/.test(content)) {
        scores.VISUAL++;
      }
      if (/listen|hear|sound|explain|tell/.test(content)) {
        scores.AUDITORY++;
      }
      if (/read|text|article|document/.test(content)) {
        scores.READING++;
      }
      if (/practice|hands-on|try|do|example/.test(content)) {
        scores.KINESTHETIC++;
      }
    }

    return scores;
  }

  private countBloomLevels(interactions: any[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const interaction of interactions) {
      const level = interaction.bloomLevel;
      counts[level] = (counts[level] || 0) + 1;
    }

    return counts;
  }

  private determinePace(avgTimePerQuestion: number): Pace {
    if (avgTimePerQuestion < 30) return 'FAST';
    if (avgTimePerQuestion > 120) return 'SLOW';
    return 'NORMAL';
  }

  private groupBySession(interactions: any[]): SessionSummary[] {
    const sessions = new Map<string, any[]>();

    for (const interaction of interactions) {
      const existing = sessions.get(interaction.sessionId) || [];
      existing.push(interaction);
      sessions.set(interaction.sessionId, existing);
    }

    return Array.from(sessions.entries()).map(([sessionId, interactions]) => ({
      sessionId,
      startTime: interactions[0].timestamp,
      endTime: interactions[interactions.length - 1].timestamp,
      questionCount: interactions.length,
      conceptsCovered: [...new Set(interactions.flatMap(i => i.conceptsCovered))],
      avgRating: interactions
        .filter(i => i.studentRating)
        .reduce((sum, i) => sum + i.studentRating, 0) / interactions.length || null
    }));
  }

  private async getConceptName(conceptId: string): Promise<string> {
    // Fetch concept name from course data
    // Simplified - implement proper lookup
    return `Concept ${conceptId}`;
  }

  async getPersonalizationContext(userId: string): Promise<PersonalizationContext> {
    const memory = await this.getStudentMemory(userId);

    return {
      // Known strengths
      strengths: memory.knowledgeState.conceptMastery
        .filter(c => c.masteryLevel > 0.8)
        .map(c => c.conceptName),

      // Current struggles
      struggles: memory.knowledgeState.conceptMastery
        .filter(c => c.masteryLevel < 0.5 && c.totalAttempts > 2)
        .map(c => c.conceptName),

      // Recommended difficulty
      recommendedDifficulty: this.recommendDifficulty(memory),

      // Learning preferences
      preferences: memory.preferences,

      // Recent context
      recentConcepts: memory.history.recentSessions[0]?.conceptsCovered || [],

      // Engagement signals
      isEngaged: memory.progress.engagementScore > 0.7,
      needsEncouragement: memory.progress.completionRate < 0.5
    };
  }

  private recommendDifficulty(memory: StudentMemoryProfile): Difficulty {
    const avgMastery = memory.knowledgeState.conceptMastery
      .reduce((sum, c) => sum + c.masteryLevel, 0) /
      (memory.knowledgeState.conceptMastery.length || 1);

    if (avgMastery > 0.8) return 'HARD';
    if (avgMastery < 0.5) return 'EASY';
    return 'MEDIUM';
  }
}

export interface StudentMemoryProfile {
  userId: string;
  knowledgeState: {
    knownConcepts: Record<string, number>;
    strugglingConcepts: Record<string, number>;
    skillLevels: Record<string, number>;
    conceptMastery: ConceptMasteryInfo[];
  };
  preferences: {
    learningStyle: LearningStyle;
    pace: Pace;
    bloomPreference: BloomLevel;
    difficultyLevel: Difficulty;
  };
  history: {
    recentSessions: SessionSummary[];
    totalSessions: number;
    totalQuestions: number;
    correctAnswers: number;
    averageSessionLength: number;
  };
  progress: {
    coursesStarted: string[];
    coursesCompleted: string[];
    engagementScore: number;
    completionRate: number;
  };
  metadata: {
    lastInteractionAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface PersonalizationContext {
  strengths: string[];
  struggles: string[];
  recommendedDifficulty: Difficulty;
  preferences: {
    learningStyle: LearningStyle;
    pace: Pace;
    bloomPreference: BloomLevel;
    difficultyLevel: Difficulty;
  };
  recentConcepts: string[];
  isEngaged: boolean;
  needsEncouragement: boolean;
}

interface InteractionData {
  sessionId: string;
  question: string;
  response: string;
  concepts: string[];
  bloomLevel: BloomLevel;
  difficulty: Difficulty;
  wasHelpful?: boolean;
  wasCorrect?: boolean;
  rating?: number;
  timeSpent: number;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
}

interface SessionSummary {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  questionCount: number;
  conceptsCovered: string[];
  avgRating: number | null;
}

interface ConceptMasteryInfo {
  conceptId: string;
  conceptName: string;
  masteryLevel: number;
  confidence: number;
  totalAttempts: number;
  correctCount: number;
}
```

### Integration with SAM Engines

```typescript
// sam-ai-tutor/engines/base/sam-base-engine.ts (updated)

export abstract class SAMBaseEngine {
  protected memoryManager: StudentMemoryManager;

  async generatePersonalized(params: {
    userId: string;
    query: string;
    courseId: string;
  }): Promise<PersonalizedResponse> {
    // Get student memory
    const memory = await this.memoryManager.getStudentMemory(params.userId);
    const context = await this.memoryManager.getPersonalizationContext(params.userId);

    // Build personalized system prompt
    const systemPrompt = this.buildPersonalizedPrompt(memory, context);

    // Generate with RAG + Memory
    const response = await this.generateWithRAG({
      query: params.query,
      courseId: params.courseId,
      systemPrompt
    });

    // Record interaction
    await this.memoryManager.updateFromInteraction(params.userId, {
      sessionId: this.sessionId,
      question: params.query,
      response: response.answer,
      concepts: this.extractConcepts(response.answer),
      bloomLevel: this.detectBloomLevel(params.query),
      difficulty: context.recommendedDifficulty,
      timeSpent: 0, // Will be updated by frontend
      courseId: params.courseId
    });

    return {
      ...response,
      personalization: {
        wasPersonalized: true,
        adaptedTo: context.preferences.learningStyle,
        difficulty: context.recommendedDifficulty,
        encouragement: context.needsEncouragement
      }
    };
  }

  private buildPersonalizedPrompt(
    memory: StudentMemoryProfile,
    context: PersonalizationContext
  ): string {
    return `You are SAM, an AI tutor personalized for this student.

# Student Profile

**Learning Style**: ${context.preferences.learningStyle}
- Adapt explanations to match this learning style

**Current Level**: ${context.recommendedDifficulty}
- Adjust difficulty accordingly

**Recent Struggles**: ${context.struggles.join(', ') || 'None identified'}
- Provide extra support on these topics

**Strengths**: ${context.strengths.join(', ') || 'Building foundation'}
- Acknowledge and build on these strengths

**Engagement**: ${context.isEngaged ? 'Highly engaged' : 'Needs motivation'}
${context.needsEncouragement ? '- Provide encouragement and positive reinforcement' : ''}

# Personalization Instructions

1. Match the student's learning style in your explanations
2. Adjust difficulty to their current level
3. Reference their known concepts when explaining new ones
4. Be patient with struggling areas
5. ${context.needsEncouragement ? 'Include encouragement and celebrate progress' : 'Maintain supportive tone'}
6. Build on recent session context when relevant

Remember: This student is unique. Tailor your response specifically for them.`;
  }

  private extractConcepts(text: string): string[] {
    // Extract mentioned concepts (simplified - enhance with NLP)
    const concepts: string[] = [];
    // Implementation
    return concepts;
  }

  private detectBloomLevel(query: string): BloomLevel {
    const lower = query.toLowerCase();
    if (/create|design|build|develop/.test(lower)) return 'CREATE';
    if (/evaluate|judge|critique|assess/.test(lower)) return 'EVALUATE';
    if (/analyze|compare|contrast|why/.test(lower)) return 'ANALYZE';
    if (/apply|solve|use|demonstrate/.test(lower)) return 'APPLY';
    if (/explain|describe|summarize/.test(lower)) return 'UNDERSTAND';
    return 'REMEMBER';
  }
}
```

---

## 📝 Implementation Plan

### Week 17: Database & Core Implementation

#### Day 1-2: Database Setup
- [ ] Create Prisma schema additions
- [ ] Run database migrations
- [ ] Add indexes for performance
- [ ] Test schema with sample data

#### Day 3-5: Memory Manager
- [ ] Implement `StudentMemoryManager` class
- [ ] Implement `getStudentMemory()`
- [ ] Implement `updateFromInteraction()`
- [ ] Implement concept mastery tracking
- [ ] Unit tests

### Week 18: Personalization & Integration

#### Day 6-7: Preference Detection
- [ ] Implement learning style detection
- [ ] Implement pace detection
- [ ] Implement Bloom level preference
- [ ] Test accuracy of detection

#### Day 8-10: SAM Integration
- [ ] Update SAM engines with memory integration
- [ ] Build personalized system prompts
- [ ] Test personalization quality
- [ ] A/B test personalized vs non-personalized

#### Day 11-12: UI & API
- [ ] Create student profile API endpoints
- [ ] Build student progress dashboard
- [ ] Add "My Learning Journey" UI
- [ ] Test end-to-end flow

#### Day 13-14: Testing & Deployment
- [ ] Load testing
- [ ] Privacy compliance review
- [ ] Deploy to staging
- [ ] Production rollout
- [ ] Monitor memory accuracy

---

## 🧪 Testing Strategy

### Memory Recall Tests

```typescript
// __tests__/memory/recall-accuracy.test.ts

describe('Memory Recall Accuracy', () => {
  it('should recall student strengths with >90% accuracy', async () => {
    const userId = 'test-user';

    // Record 10 interactions where student excels at algebra
    for (let i = 0; i < 10; i++) {
      await memoryManager.updateFromInteraction(userId, {
        sessionId: 'session-1',
        question: 'Solve algebraic equation',
        response: 'Correct!',
        concepts: ['algebra'],
        bloomLevel: 'APPLY',
        difficulty: 'MEDIUM',
        wasCorrect: true,
        timeSpent: 60
      });
    }

    const context = await memoryManager.getPersonalizationContext(userId);

    expect(context.strengths).toContain('algebra');
  });

  it('should detect struggling concepts', async () => {
    const userId = 'test-user-2';

    // Record struggles with calculus
    for (let i = 0; i < 5; i++) {
      await memoryManager.updateFromInteraction(userId, {
        sessionId: 'session-2',
        question: 'Explain derivatives',
        response: 'Let me help...',
        concepts: ['calculus', 'derivatives'],
        bloomLevel: 'UNDERSTAND',
        difficulty: 'HARD',
        wasCorrect: false,
        timeSpent: 180
      });
    }

    const context = await memoryManager.getPersonalizationContext(userId);

    expect(context.struggles).toContain('calculus');
  });
});
```

### Personalization Quality Tests

```typescript
// __tests__/memory/personalization-quality.test.ts

describe('Personalization Quality', () => {
  it('should adapt to visual learner', async () => {
    const userId = 'visual-learner';

    // Set up visual learner profile
    await setupLearnerProfile(userId, {
      learningStyle: 'VISUAL'
    });

    const response = await samEngine.generatePersonalized({
      userId,
      query: 'Explain binary search',
      courseId: 'cs-101'
    });

    // Response should include visual aids
    expect(response.answer).toMatch(/diagram|visual|chart|graph/i);
    expect(response.personalization.adaptedTo).toBe('VISUAL');
  });
});
```

---

## 💰 Cost Analysis

### Engineering Costs
- Senior Backend Engineer (1.5 weeks): $12,000
- ML/AI Engineer (0.5 week): $4,000
- **Total Engineering**: $16,000

### Infrastructure Costs
- Database storage growth: ~$50/month
- **Total Infrastructure**: $150 (3 months)

### Contingency (20%): $3,230

**Total Budget**: ~$28,000 (within budget)

---

## ✅ Acceptance Criteria

- [ ] Database schema deployed
- [ ] Memory manager implemented
- [ ] Memory recall accuracy >90%
- [ ] Preference detection accuracy >85%
- [ ] Personalization working in all engines
- [ ] Student profile API deployed
- [ ] Privacy compliance verified
- [ ] Performance <50ms p95
- [ ] Production deployment successful
- [ ] User satisfaction increase verified

---

## 📚 References

- [Item Response Theory](https://en.wikipedia.org/wiki/Item_response_theory)
- [Learning Styles](https://en.wikipedia.org/wiki/Learning_styles)
- [Bloom's Taxonomy](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy)
- [Personalized Learning](https://www.edutopia.org/topic/personalized-learning)

---

**Status**: Ready for Implementation
**Previous**: [RAG Pipeline](./01-rag-pipeline-implementation.md)
**Next**: [Conversation Summarization](./03-conversation-summarization.md)
