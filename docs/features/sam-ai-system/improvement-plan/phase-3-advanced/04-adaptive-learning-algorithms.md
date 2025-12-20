# Initiative 4: Adaptive Learning Algorithms

**Timeline**: Weeks 32-33 (2 weeks)
**Priority**: 🟡 High
**Budget**: $38,000
**Status**: Not Started

---

## 📋 Overview

**The Problem**: Current SAM delivers static difficulty and content regardless of student performance:
- Difficulty doesn't adjust based on student's actual performance
- No spaced repetition for long-term retention
- Ignores forgetting curve (knowledge decay over time)
- Content pacing doesn't adapt to learning velocity
- No personalized review scheduling

**The Solution**: Implement adaptive learning algorithms using Item Response Theory (IRT), spaced repetition, and forgetting curve modeling to automatically adjust difficulty, schedule reviews, and optimize learning pace in real-time.

**Impact**:
- **Optimal Challenge**: 85%+ of time in "just right" difficulty zone
- **Learning Efficiency**: 40% improvement
- **Mastery Time**: 30% reduction
- **Retention Rate**: 60% improvement at 30 days

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Difficulty adjustment latency <200ms
- ✅ IRT theta estimation accuracy >90%
- ✅ Spaced repetition scheduling precision >85%
- ✅ Forgetting curve prediction accuracy >80%

### Learning Metrics
- ✅ Optimal difficulty targeting >85% (Goldilocks zone)
- ✅ Learning velocity tracking accuracy >90%
- ✅ Retention improvement by 60% at 30 days
- ✅ Time to mastery reduction by 30%

### User Experience Metrics
- ✅ "Just right difficulty" rating >85%
- ✅ Student engagement increase by 50%
- ✅ Frustration rate reduction by 70%
- ✅ Boredom rate reduction by 60%

### Business Metrics
- ✅ Course completion rate increase by 40%
- ✅ Knowledge retention at 30 days >80%
- ✅ Student success rate increase by 35%

---

## 🏗️ Architecture Design

### Adaptive Learning Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│              Adaptive Learning System                        │
└─────────────────────────────────────────────────────────────┘

Student Interaction → Performance Tracking
                             │
                             ▼
                ┌────────────────────────┐
                │   IRT Theta Update     │
                │   (Student Ability)    │
                └────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Difficulty  │  │   Spaced     │  │  Forgetting  │
    │  Adaptation  │  │  Repetition  │  │    Curve     │
    │   (IRT)      │  │  Scheduler   │  │   Modeling   │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │  Learning Velocity     │
                │  Tracking & Pacing     │
                └────────────────────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │  Personalized Content  │
                │  • Difficulty level    │
                │  • Review schedule     │
                │  • Pacing adjustments  │
                └────────────────────────┘
                             │
                             ▼
                    Adapted Learning Experience
```

### Adaptive Learning Models

**Item Response Theory (IRT)**:
```
P(correct) = 1 / (1 + e^(-a(θ - b)))

Where:
θ (theta)   = Student ability (-3 to +3)
b (beta)    = Item difficulty (-3 to +3)
a (alpha)   = Item discrimination (0.5 to 2.5)
P(correct)  = Probability of correct answer (0 to 1)

Optimal difficulty: θ ≈ b (50% success rate)
```

**Spaced Repetition (SM-2 Algorithm)**:
```
Interval calculation:
- First review: 1 day
- Second review: 6 days
- Subsequent: Interval × EF (Easiness Factor)

EF = EF + (0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02))

Where quality = student's self-assessment (0-5)
```

**Forgetting Curve (Ebbinghaus)**:
```
R(t) = e^(-t/S)

Where:
R(t) = Retention at time t
t    = Time since learning
S    = Stability (strength of memory)

Personalized: S varies by concept and student
```

---

## 🔧 Implementation Plan

### Week 32: IRT & Difficulty Adaptation

#### Day 1-3: IRT Engine

**File: `lib/sam/adaptive/irt-engine.ts`**

```typescript
interface IRTParameters {
  theta: number;        // Student ability (-3 to +3)
  alpha: number;        // Item discrimination (0.5 to 2.5)
  beta: number;         // Item difficulty (-3 to +3)
}

interface IRTUpdate {
  newTheta: number;
  confidence: number;
  optimalDifficulty: number;
}

export class IRTEngine {
  /**
   * Calculate probability of correct response
   */
  calculateProbability(theta: number, beta: number, alpha: number = 1.0): number {
    const exponent = -alpha * (theta - beta);
    return 1 / (1 + Math.exp(exponent));
  }

  /**
   * Update student ability (theta) based on response
   */
  updateTheta(
    currentTheta: number,
    itemDifficulty: number,
    correct: boolean,
    alpha: number = 1.0
  ): IRTUpdate {
    // Expected probability of correct response
    const expectedP = this.calculateProbability(currentTheta, itemDifficulty, alpha);

    // Actual outcome (0 or 1)
    const actualP = correct ? 1 : 0;

    // Error (difference between expected and actual)
    const error = actualP - expectedP;

    // Learning rate (Fisher information)
    const learningRate = alpha * expectedP * (1 - expectedP);

    // Update theta using gradient ascent
    const thetaAdjustment = error / Math.max(learningRate, 0.1);
    const newTheta = currentTheta + 0.3 * thetaAdjustment; // 0.3 is step size

    // Bound theta to reasonable range
    const boundedTheta = Math.max(-3, Math.min(3, newTheta));

    // Calculate confidence (based on number of responses)
    const confidence = this.calculateConfidence(boundedTheta);

    // Optimal difficulty for next question (match student ability)
    const optimalDifficulty = boundedTheta;

    return {
      newTheta: boundedTheta,
      confidence,
      optimalDifficulty,
    };
  }

  /**
   * Calculate confidence in theta estimate
   */
  private calculateConfidence(theta: number): number {
    // Simplified confidence based on distance from extremes
    const distanceFromCenter = Math.abs(theta);
    return Math.max(0.5, 1 - (distanceFromCenter / 3) * 0.3);
  }

  /**
   * Recommend next difficulty level
   */
  recommendDifficulty(
    currentTheta: number,
    recentPerformance: boolean[],
    targetSuccessRate: number = 0.7
  ): number {
    // Analyze recent performance
    const recentSuccessRate = recentPerformance.filter(p => p).length / recentPerformance.length;

    // Adjust based on performance
    let difficulty = currentTheta;

    if (recentSuccessRate > targetSuccessRate + 0.1) {
      // Too easy - increase difficulty
      difficulty += 0.5;
    } else if (recentSuccessRate < targetSuccessRate - 0.1) {
      // Too hard - decrease difficulty
      difficulty -= 0.5;
    }

    return Math.max(-3, Math.min(3, difficulty));
  }

  /**
   * Map IRT difficulty to student level
   */
  mapToStudentLevel(beta: number): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' {
    if (beta < -1.5) return 'BEGINNER';
    if (beta < 0) return 'INTERMEDIATE';
    if (beta < 1.5) return 'ADVANCED';
    return 'EXPERT';
  }
}
```

**File: `lib/sam/adaptive/difficulty-adapter.ts`**

```typescript
import { db } from '@/lib/db';
import { IRTEngine } from './irt-engine';

export class DifficultyAdapter {
  private irtEngine: IRTEngine;

  constructor() {
    this.irtEngine = new IRTEngine();
  }

  /**
   * Adapt difficulty based on student performance
   */
  async adaptDifficulty(
    userId: string,
    conceptId: string,
    responseCorrect: boolean,
    questionDifficulty: number
  ): Promise<{
    newTheta: number;
    recommendedDifficulty: number;
    studentLevel: string;
  }> {
    // Get current student ability (theta)
    const currentMastery = await db.conceptMastery.findUnique({
      where: {
        userId_conceptId: { userId, conceptId },
      },
    });

    const currentTheta = this.masteryToTheta(currentMastery?.masteryLevel || 0.5);

    // Get recent performance (last 10 attempts)
    const recentAttempts = await db.learningAttempt.findMany({
      where: { userId, conceptId },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    const recentPerformance = recentAttempts.map(a => a.correct);

    // Update theta using IRT
    const irtUpdate = this.irtEngine.updateTheta(
      currentTheta,
      questionDifficulty,
      responseCorrect
    );

    // Recommend next difficulty
    const recommendedDifficulty = this.irtEngine.recommendDifficulty(
      irtUpdate.newTheta,
      recentPerformance
    );

    // Map to student level
    const studentLevel = this.irtEngine.mapToStudentLevel(irtUpdate.newTheta);

    // Update mastery in database
    await db.conceptMastery.upsert({
      where: {
        userId_conceptId: { userId, conceptId },
      },
      update: {
        masteryLevel: this.thetaToMastery(irtUpdate.newTheta),
        totalAttempts: { increment: 1 },
        correctCount: responseCorrect ? { increment: 1 } : undefined,
      },
      create: {
        userId,
        conceptId,
        masteryLevel: this.thetaToMastery(irtUpdate.newTheta),
        totalAttempts: 1,
        correctCount: responseCorrect ? 1 : 0,
      },
    });

    return {
      newTheta: irtUpdate.newTheta,
      recommendedDifficulty,
      studentLevel,
    };
  }

  /**
   * Convert mastery (0-1) to theta (-3 to +3)
   */
  private masteryToTheta(mastery: number): number {
    return (mastery - 0.5) * 6; // Scale [0,1] to [-3,+3]
  }

  /**
   * Convert theta (-3 to +3) to mastery (0-1)
   */
  private thetaToMastery(theta: number): number {
    return (theta + 3) / 6; // Scale [-3,+3] to [0,1]
  }
}
```

#### Day 4-5: Spaced Repetition Scheduler

**File: `lib/sam/adaptive/spaced-repetition.ts`**

```typescript
import { db } from '@/lib/db';

interface ReviewSchedule {
  conceptId: string;
  nextReviewDate: Date;
  interval: number;        // Days until next review
  easinessFactor: number;  // 1.3 to 2.5
  repetitionNumber: number;
}

export class SpacedRepetitionScheduler {
  /**
   * Calculate next review using SM-2 algorithm
   */
  calculateNextReview(
    repetitionNumber: number,
    easinessFactor: number,
    quality: number  // 0-5 (student's response quality)
  ): {
    nextInterval: number;
    newEasinessFactor: number;
  } {
    // Update easiness factor
    let newEF = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Bound EF to reasonable range
    newEF = Math.max(1.3, newEF);

    // Calculate interval based on repetition number
    let interval: number;

    if (repetitionNumber === 0) {
      interval = 1; // First review: 1 day
    } else if (repetitionNumber === 1) {
      interval = 6; // Second review: 6 days
    } else {
      // Subsequent reviews: multiply by EF
      const previousInterval = this.getPreviousInterval(repetitionNumber - 1, easinessFactor);
      interval = Math.round(previousInterval * newEF);
    }

    return {
      nextInterval: interval,
      newEasinessFactor: newEF,
    };
  }

  /**
   * Get previous interval (recursive helper)
   */
  private getPreviousInterval(repetitionNumber: number, ef: number): number {
    if (repetitionNumber === 0) return 1;
    if (repetitionNumber === 1) return 6;
    return Math.round(this.getPreviousInterval(repetitionNumber - 1, ef) * ef);
  }

  /**
   * Schedule review for a concept
   */
  async scheduleReview(
    userId: string,
    conceptId: string,
    responseQuality: number  // 0-5
  ): Promise<ReviewSchedule> {
    // Get current review data
    const existingReview = await db.reviewSchedule.findUnique({
      where: {
        userId_conceptId: { userId, conceptId },
      },
    });

    const repetitionNumber = (existingReview?.repetitionNumber || 0) + 1;
    const currentEF = existingReview?.easinessFactor || 2.5;

    // Calculate next review
    const { nextInterval, newEasinessFactor } = this.calculateNextReview(
      repetitionNumber - 1,
      currentEF,
      responseQuality
    );

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

    // Update database
    await db.reviewSchedule.upsert({
      where: {
        userId_conceptId: { userId, conceptId },
      },
      update: {
        nextReviewDate,
        interval: nextInterval,
        easinessFactor: newEasinessFactor,
        repetitionNumber,
        lastReviewDate: new Date(),
      },
      create: {
        userId,
        conceptId,
        nextReviewDate,
        interval: nextInterval,
        easinessFactor: newEasinessFactor,
        repetitionNumber,
        lastReviewDate: new Date(),
      },
    });

    return {
      conceptId,
      nextReviewDate,
      interval: nextInterval,
      easinessFactor: newEasinessFactor,
      repetitionNumber,
    };
  }

  /**
   * Get concepts due for review
   */
  async getDueReviews(userId: string): Promise<ReviewSchedule[]> {
    const now = new Date();

    const dueReviews = await db.reviewSchedule.findMany({
      where: {
        userId,
        nextReviewDate: { lte: now },
      },
      orderBy: {
        nextReviewDate: 'asc',
      },
    });

    return dueReviews.map(r => ({
      conceptId: r.conceptId,
      nextReviewDate: r.nextReviewDate,
      interval: r.interval,
      easinessFactor: r.easinessFactor,
      repetitionNumber: r.repetitionNumber,
    }));
  }
}
```

### Week 33: Forgetting Curve & Learning Velocity

**File: `lib/sam/adaptive/forgetting-curve.ts`**

```typescript
interface RetentionPrediction {
  conceptId: string;
  currentRetention: number;  // 0-1
  predictedRetention: number; // 0-1 at future date
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendReview: boolean;
}

export class ForgettingCurveModel {
  /**
   * Calculate retention using Ebbinghaus forgetting curve
   */
  calculateRetention(
    timeSinceLearning: number,  // in days
    stability: number            // memory strength (days)
  ): number {
    // R(t) = e^(-t/S)
    const retention = Math.exp(-timeSinceLearning / stability);
    return Math.max(0, Math.min(1, retention));
  }

  /**
   * Estimate stability based on learning history
   */
  estimateStability(
    totalAttempts: number,
    correctCount: number,
    daysSinceFirstLearned: number
  ): number {
    // Base stability
    let stability = 1.0;

    // Increase with successful repetitions
    const successRate = correctCount / Math.max(1, totalAttempts);
    stability *= (1 + successRate * 2);

    // Increase with time (consolidation)
    const consolidationFactor = Math.log(daysSinceFirstLearned + 1) / Math.log(30);
    stability *= (1 + consolidationFactor);

    // Bound to reasonable range (1-90 days)
    return Math.max(1, Math.min(90, stability));
  }

  /**
   * Predict retention and recommend review
   */
  async predictRetention(
    userId: string,
    conceptId: string
  ): Promise<RetentionPrediction> {
    // Get mastery data
    const mastery = await db.conceptMastery.findUnique({
      where: {
        userId_conceptId: { userId, conceptId },
      },
    });

    if (!mastery) {
      return {
        conceptId,
        currentRetention: 0,
        predictedRetention: 0,
        urgency: 'HIGH',
        recommendReview: true,
      };
    }

    // Calculate time since last interaction
    const timeSinceLearning = this.daysSince(mastery.updatedAt);

    // Estimate stability
    const stability = this.estimateStability(
      mastery.totalAttempts,
      mastery.correctCount,
      this.daysSince(mastery.createdAt)
    );

    // Calculate current retention
    const currentRetention = this.calculateRetention(timeSinceLearning, stability);

    // Predict retention in 7 days
    const predictedRetention = this.calculateRetention(timeSinceLearning + 7, stability);

    // Determine urgency
    const urgency = this.determineUrgency(currentRetention, predictedRetention);

    // Recommend review if retention dropping
    const recommendReview = currentRetention < 0.7 || predictedRetention < 0.6;

    return {
      conceptId,
      currentRetention,
      predictedRetention,
      urgency,
      recommendReview,
    };
  }

  /**
   * Calculate days since date
   */
  private daysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff / (1000 * 60 * 60 * 24);
  }

  /**
   * Determine review urgency
   */
  private determineUrgency(
    current: number,
    predicted: number
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (current < 0.6 || predicted < 0.5) return 'HIGH';
    if (current < 0.8 || predicted < 0.7) return 'MEDIUM';
    return 'LOW';
  }
}
```

**File: `lib/sam/adaptive/learning-velocity-tracker.ts`**

```typescript
interface LearningVelocity {
  conceptsPerHour: number;
  averageAttempts: number;
  paceRecommendation: 'SLOW_DOWN' | 'MAINTAIN' | 'SPEED_UP';
}

export class LearningVelocityTracker {
  /**
   * Calculate learning velocity
   */
  async calculateVelocity(
    userId: string,
    timeWindowDays: number = 7
  ): Promise<LearningVelocity> {
    const since = new Date();
    since.setDate(since.getDate() - timeWindowDays);

    // Get learning attempts in time window
    const attempts = await db.learningAttempt.findMany({
      where: {
        userId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (attempts.length === 0) {
      return {
        conceptsPerHour: 0,
        averageAttempts: 0,
        paceRecommendation: 'MAINTAIN',
      };
    }

    // Calculate time span
    const firstAttempt = attempts[0].timestamp;
    const lastAttempt = attempts[attempts.length - 1].timestamp;
    const timeSpanHours = (lastAttempt.getTime() - firstAttempt.getTime()) / (1000 * 60 * 60);

    // Count unique concepts
    const uniqueConcepts = new Set(attempts.map(a => a.conceptId)).size;

    // Calculate velocity
    const conceptsPerHour = uniqueConcepts / Math.max(1, timeSpanHours);

    // Calculate average attempts per concept
    const averageAttempts = attempts.length / uniqueConcepts;

    // Calculate success rate
    const successRate = attempts.filter(a => a.correct).length / attempts.length;

    // Recommend pace adjustment
    const paceRecommendation = this.recommendPace(
      conceptsPerHour,
      averageAttempts,
      successRate
    );

    return {
      conceptsPerHour,
      averageAttempts,
      paceRecommendation,
    };
  }

  /**
   * Recommend pace adjustment
   */
  private recommendPace(
    velocity: number,
    avgAttempts: number,
    successRate: number
  ): 'SLOW_DOWN' | 'MAINTAIN' | 'SPEED_UP' {
    // Too fast if: high velocity + low success rate
    if (velocity > 2 && successRate < 0.6) {
      return 'SLOW_DOWN';
    }

    // Too slow if: low velocity + high success rate
    if (velocity < 0.5 && successRate > 0.8) {
      return 'SPEED_UP';
    }

    return 'MAINTAIN';
  }
}
```

**File: `lib/sam/adaptive/adaptive-orchestrator.ts`**

```typescript
import { DifficultyAdapter } from './difficulty-adapter';
import { SpacedRepetitionScheduler } from './spaced-repetition';
import { ForgettingCurveModel } from './forgetting-curve';
import { LearningVelocityTracker } from './learning-velocity-tracker';

export class AdaptiveOrchestrator {
  private difficultyAdapter: DifficultyAdapter;
  private spacedRepetition: SpacedRepetitionScheduler;
  private forgettingCurve: ForgettingCurveModel;
  private velocityTracker: LearningVelocityTracker;

  constructor() {
    this.difficultyAdapter = new DifficultyAdapter();
    this.spacedRepetition = new SpacedRepetitionScheduler();
    this.forgettingCurve = new ForgettingCurveModel();
    this.velocityTracker = new LearningVelocityTracker();
  }

  /**
   * Get comprehensive adaptive recommendations
   */
  async getAdaptiveRecommendations(userId: string): Promise<{
    difficulty: any;
    reviews: any[];
    velocity: LearningVelocity;
    priorityConcepts: string[];
  }> {
    // Get due reviews
    const reviews = await this.spacedRepetition.getDueReviews(userId);

    // Get learning velocity
    const velocity = await this.velocityTracker.calculateVelocity(userId);

    // Get priority concepts (retention dropping)
    const priorityConcepts = await this.getPriorityConcepts(userId);

    return {
      difficulty: { recommendedLevel: 'INTERMEDIATE' }, // Placeholder
      reviews,
      velocity,
      priorityConcepts,
    };
  }

  /**
   * Get concepts needing urgent review
   */
  private async getPriorityConcepts(userId: string): Promise<string[]> {
    const masteries = await db.conceptMastery.findMany({
      where: { userId },
      select: { conceptId: true },
    });

    const priorities: string[] = [];

    for (const mastery of masteries) {
      const prediction = await this.forgettingCurve.predictRetention(
        userId,
        mastery.conceptId
      );

      if (prediction.urgency === 'HIGH') {
        priorities.push(mastery.conceptId);
      }
    }

    return priorities;
  }
}
```

---

## 📊 Metrics & Monitoring

```typescript
export const adaptiveMetrics = {
  optimalDifficultyRate: new client.Gauge({
    name: 'sam_optimal_difficulty_rate',
    help: 'Percentage of content at optimal difficulty',
  }),

  learningVelocity: new client.Gauge({
    name: 'sam_learning_velocity',
    help: 'Concepts learned per hour',
    labelNames: ['user_id'],
  }),

  retentionRate: new client.Histogram({
    name: 'sam_retention_rate_30d',
    help: 'Knowledge retention at 30 days',
    buckets: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  }),
};
```

---

## ✅ Acceptance Criteria

- [ ] Adjustment latency <200ms
- [ ] IRT accuracy >90%
- [ ] Spaced repetition precision >85%
- [ ] Forgetting curve accuracy >80%
- [ ] Optimal difficulty >85%
- [ ] Retention improvement +60%

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Owner**: ML/AI Engineering Team
