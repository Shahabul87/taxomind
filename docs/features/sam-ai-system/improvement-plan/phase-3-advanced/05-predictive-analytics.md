# Initiative 5: Predictive Analytics

**Timeline**: Weeks 34-35 (2 weeks)
**Priority**: 🟢 Important
**Budget**: $30,000
**Status**: Not Started

---

## 📋 Overview

**The Problem**: Current SAM is reactive, responding only after students struggle:
- No early warning for at-risk students
- Can't predict learning outcomes
- No proactive intervention recommendations
- Doesn't forecast concept mastery timeline
- Missing opportunity for preventive support

**The Solution**: Implement predictive analytics using machine learning models to forecast student success, identify at-risk learners early, predict concept mastery timelines, and recommend proactive interventions.

**Impact**:
- **Prediction Accuracy**: >80% for learning outcomes
- **Early Detection**: Identify at-risk students 2-3 weeks early
- **Intervention Success**: >75% of interventions prevent failure
- **Student Success Rate**: +25% improvement

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Prediction model accuracy >80%
- ✅ At-risk detection precision >85% (low false positives)
- ✅ At-risk detection recall >75% (catches most at-risk students)
- ✅ Prediction latency <500ms

### Prediction Quality Metrics
- ✅ Concept mastery ETA accuracy ±3 days
- ✅ Course completion prediction accuracy >80%
- ✅ Success probability calibration error <10%
- ✅ Model confidence alignment >90%

### User Experience Metrics
- ✅ Early intervention acceptance rate >70%
- ✅ Teacher satisfaction with predictions >85%
- ✅ Student appreciation of proactive help >80%
- ✅ Reduced "I didn't see this coming" feedback by 80%

### Business Metrics
- ✅ Student success rate increase by 25%
- ✅ Course completion rate increase by 20%
- ✅ Teacher intervention efficiency +50%
- ✅ Student retention increase by 15%

---

## 🏗️ Architecture Design

### Predictive Analytics Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│              Predictive Analytics System                     │
└─────────────────────────────────────────────────────────────┘

Student Learning Data → Feature Engineering
                              │
                              ▼
                  ┌────────────────────────┐
                  │  Feature Extraction    │
                  │  • Performance metrics │
                  │  • Engagement patterns │
                  │  • Learning velocity   │
                  │  • Retention rates     │
                  └────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  At-Risk     │  │  Concept     │  │   Course     │
    │  Detection   │  │  Mastery ETA │  │  Completion  │
    │   Model      │  │   Predictor  │  │  Forecaster  │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │  Intervention Engine   │
                  │  • Generate actions    │
                  │  • Prioritize urgency  │
                  │  • Route to stakeholder│
                  └────────────────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │  Teacher Dashboard     │
                  │  • At-risk students    │
                  │  • Recommended actions │
                  │  • Priority ordering   │
                  └────────────────────────┘
```

### Prediction Models

**At-Risk Detection (Binary Classification)**:
```
Input Features:
- Performance metrics (accuracy, attempts)
- Engagement (time spent, consistency)
- Learning velocity (concepts/hour)
- Retention (forgetting curve)

Output:
- At-risk probability (0-1)
- Risk level (LOW/MEDIUM/HIGH)
- Contributing factors
```

**Concept Mastery ETA (Regression)**:
```
Input Features:
- Current mastery level
- Learning velocity
- Recent performance trend
- Concept difficulty

Output:
- Days until mastery (ETA)
- Confidence interval
- Recommended path
```

**Course Completion Forecast (Classification + Regression)**:
```
Input Features:
- Progress to date
- Engagement patterns
- Performance trajectory
- Time investment

Output:
- Completion probability (0-1)
- Estimated completion date
- Bottleneck concepts
```

---

## 🔧 Implementation Plan

### Week 34: Core Prediction Models

#### Day 1-2: Feature Engineering

**File: `lib/sam/predictive/feature-extractor.ts`**

```typescript
import { db } from '@/lib/db';

interface StudentFeatures {
  // Performance metrics
  overallAccuracy: number;
  recentAccuracy: number;
  performanceTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';

  // Engagement metrics
  avgTimePerConcept: number;
  sessionsPerWeek: number;
  consistencyScore: number;

  // Learning velocity
  conceptsPerHour: number;
  learningVelocityTrend: 'ACCELERATING' | 'STABLE' | 'SLOWING';

  // Retention metrics
  retentionRate: number;
  forgettingRate: number;

  // Difficulty adaptation
  currentDifficultyLevel: number;
  optimalDifficultyMatch: number;
}

export class FeatureExtractor {
  /**
   * Extract features for a student
   */
  async extractFeatures(
    userId: string,
    courseId: string,
    timeWindowDays: number = 14
  ): Promise<StudentFeatures> {
    const since = new Date();
    since.setDate(since.getDate() - timeWindowDays);

    // Get learning attempts
    const attempts = await db.learningAttempt.findMany({
      where: {
        userId,
        courseId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (attempts.length === 0) {
      return this.getDefaultFeatures();
    }

    // Calculate performance metrics
    const overallAccuracy = this.calculateAccuracy(attempts);
    const recentAccuracy = this.calculateRecentAccuracy(attempts, 10);
    const performanceTrend = this.detectTrend(attempts);

    // Calculate engagement metrics
    const sessions = this.groupBySessions(attempts);
    const avgTimePerConcept = this.calculateAvgTime(attempts);
    const sessionsPerWeek = (sessions.length / timeWindowDays) * 7;
    const consistencyScore = this.calculateConsistency(sessions);

    // Calculate learning velocity
    const conceptsPerHour = this.calculateVelocity(attempts);
    const learningVelocityTrend = this.detectVelocityTrend(attempts);

    // Calculate retention metrics
    const retentionRate = await this.calculateRetention(userId, courseId);
    const forgettingRate = 1 - retentionRate;

    // Get difficulty metrics
    const masteries = await db.conceptMastery.findMany({
      where: { userId },
    });

    const avgDifficulty = this.calculateAvgDifficulty(masteries);
    const optimalMatch = this.calculateOptimalMatch(attempts);

    return {
      overallAccuracy,
      recentAccuracy,
      performanceTrend,
      avgTimePerConcept,
      sessionsPerWeek,
      consistencyScore,
      conceptsPerHour,
      learningVelocityTrend,
      retentionRate,
      forgettingRate,
      currentDifficultyLevel: avgDifficulty,
      optimalDifficultyMatch: optimalMatch,
    };
  }

  /**
   * Calculate overall accuracy
   */
  private calculateAccuracy(attempts: any[]): number {
    const correct = attempts.filter(a => a.correct).length;
    return correct / attempts.length;
  }

  /**
   * Calculate recent accuracy (last N attempts)
   */
  private calculateRecentAccuracy(attempts: any[], n: number): number {
    const recent = attempts.slice(-n);
    return this.calculateAccuracy(recent);
  }

  /**
   * Detect performance trend
   */
  private detectTrend(attempts: any[]): 'IMPROVING' | 'STABLE' | 'DECLINING' {
    if (attempts.length < 10) return 'STABLE';

    const first50 = attempts.slice(0, Math.floor(attempts.length / 2));
    const last50 = attempts.slice(Math.floor(attempts.length / 2));

    const firstAccuracy = this.calculateAccuracy(first50);
    const lastAccuracy = this.calculateAccuracy(last50);

    const diff = lastAccuracy - firstAccuracy;

    if (diff > 0.1) return 'IMPROVING';
    if (diff < -0.1) return 'DECLINING';
    return 'STABLE';
  }

  /**
   * Group attempts into sessions (>30min gap = new session)
   */
  private groupBySessions(attempts: any[]): any[][] {
    const sessions: any[][] = [];
    let currentSession: any[] = [];

    for (let i = 0; i < attempts.length; i++) {
      if (currentSession.length === 0) {
        currentSession.push(attempts[i]);
      } else {
        const lastTime = currentSession[currentSession.length - 1].timestamp.getTime();
        const currentTime = attempts[i].timestamp.getTime();
        const gapMinutes = (currentTime - lastTime) / (1000 * 60);

        if (gapMinutes > 30) {
          sessions.push(currentSession);
          currentSession = [attempts[i]];
        } else {
          currentSession.push(attempts[i]);
        }
      }
    }

    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  /**
   * Calculate average time per concept
   */
  private calculateAvgTime(attempts: any[]): number {
    const conceptTimes = new Map<string, number[]>();

    for (let i = 1; i < attempts.length; i++) {
      const conceptId = attempts[i].conceptId;
      const timeDiff = (attempts[i].timestamp.getTime() - attempts[i - 1].timestamp.getTime()) / 1000;

      if (timeDiff < 600) { // Less than 10 minutes
        if (!conceptTimes.has(conceptId)) {
          conceptTimes.set(conceptId, []);
        }
        conceptTimes.get(conceptId)!.push(timeDiff);
      }
    }

    let totalTime = 0;
    let count = 0;

    for (const times of conceptTimes.values()) {
      totalTime += times.reduce((a, b) => a + b, 0);
      count += times.length;
    }

    return count > 0 ? totalTime / count : 0;
  }

  /**
   * Calculate session consistency (regularity)
   */
  private calculateConsistency(sessions: any[][]): number {
    if (sessions.length < 2) return 0;

    const gaps: number[] = [];

    for (let i = 1; i < sessions.length; i++) {
      const gap = (sessions[i][0].timestamp.getTime() - sessions[i - 1][sessions[i - 1].length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24);
      gaps.push(gap);
    }

    const avgGap = gaps.reduce((a, b) => a + b) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);

    // Lower std dev = more consistent (higher score)
    return Math.max(0, 1 - (stdDev / avgGap));
  }

  /**
   * Calculate learning velocity
   */
  private calculateVelocity(attempts: any[]): number {
    if (attempts.length < 2) return 0;

    const timeSpan = (attempts[attempts.length - 1].timestamp.getTime() - attempts[0].timestamp.getTime()) / (1000 * 60 * 60);
    const uniqueConcepts = new Set(attempts.map(a => a.conceptId)).size;

    return uniqueConcepts / Math.max(1, timeSpan);
  }

  /**
   * Detect velocity trend
   */
  private detectVelocityTrend(attempts: any[]): 'ACCELERATING' | 'STABLE' | 'SLOWING' {
    if (attempts.length < 20) return 'STABLE';

    const first = attempts.slice(0, Math.floor(attempts.length / 2));
    const last = attempts.slice(Math.floor(attempts.length / 2));

    const firstVelocity = this.calculateVelocity(first);
    const lastVelocity = this.calculateVelocity(last);

    const diff = lastVelocity - firstVelocity;

    if (diff > 0.2) return 'ACCELERATING';
    if (diff < -0.2) return 'SLOWING';
    return 'STABLE';
  }

  /**
   * Calculate retention rate
   */
  private async calculateRetention(userId: string, courseId: string): Promise<number> {
    const masteries = await db.conceptMastery.findMany({
      where: { userId },
    });

    if (masteries.length === 0) return 0;

    const avgMastery = masteries.reduce((sum, m) => sum + m.masteryLevel, 0) / masteries.length;
    return avgMastery;
  }

  /**
   * Calculate average difficulty level
   */
  private calculateAvgDifficulty(masteries: any[]): number {
    if (masteries.length === 0) return 0;

    const avgMastery = masteries.reduce((sum, m) => sum + m.masteryLevel, 0) / masteries.length;
    return (avgMastery - 0.5) * 6; // Convert to theta scale
  }

  /**
   * Calculate optimal difficulty match
   */
  private calculateOptimalMatch(attempts: any[]): number {
    const accuracies = attempts.map(a => a.correct ? 1 : 0);
    const avgAccuracy = accuracies.reduce((a, b) => a + b) / accuracies.length;

    // Optimal is 70% accuracy
    return 1 - Math.abs(avgAccuracy - 0.7);
  }

  /**
   * Get default features for new students
   */
  private getDefaultFeatures(): StudentFeatures {
    return {
      overallAccuracy: 0.5,
      recentAccuracy: 0.5,
      performanceTrend: 'STABLE',
      avgTimePerConcept: 0,
      sessionsPerWeek: 0,
      consistencyScore: 0,
      conceptsPerHour: 0,
      learningVelocityTrend: 'STABLE',
      retentionRate: 0,
      forgettingRate: 1,
      currentDifficultyLevel: 0,
      optimalDifficultyMatch: 0,
    };
  }
}
```

#### Day 3-4: At-Risk Detection Model

**File: `lib/sam/predictive/at-risk-detector.ts`**

```typescript
import { FeatureExtractor, StudentFeatures } from './feature-extractor';

interface AtRiskPrediction {
  userId: string;
  atRiskProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  contributingFactors: string[];
  recommendedActions: string[];
}

export class AtRiskDetector {
  private featureExtractor: FeatureExtractor;

  constructor() {
    this.featureExtractor = new FeatureExtractor();
  }

  /**
   * Predict if student is at risk
   */
  async predict(userId: string, courseId: string): Promise<AtRiskPrediction> {
    // Extract features
    const features = await this.featureExtractor.extractFeatures(userId, courseId);

    // Calculate risk score using weighted model
    const riskScore = this.calculateRiskScore(features);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(riskScore);

    // Identify contributing factors
    const contributingFactors = this.identifyContributingFactors(features);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendations(features, riskLevel);

    return {
      userId,
      atRiskProbability: riskScore,
      riskLevel,
      contributingFactors,
      recommendedActions,
    };
  }

  /**
   * Calculate risk score (0-1, higher = more at risk)
   */
  private calculateRiskScore(features: StudentFeatures): number {
    let score = 0;

    // Poor performance (weight: 0.30)
    if (features.recentAccuracy < 0.5) {
      score += 0.30 * (1 - features.recentAccuracy);
    }

    // Declining trend (weight: 0.20)
    if (features.performanceTrend === 'DECLINING') {
      score += 0.20;
    }

    // Low engagement (weight: 0.20)
    if (features.sessionsPerWeek < 2) {
      score += 0.20 * (1 - features.sessionsPerWeek / 2);
    }

    // Low consistency (weight: 0.15)
    score += 0.15 * (1 - features.consistencyScore);

    // Poor retention (weight: 0.15)
    if (features.retentionRate < 0.6) {
      score += 0.15 * (1 - features.retentionRate);
    }

    return Math.min(1, score);
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score > 0.7) return 'HIGH';
    if (score > 0.4) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Identify contributing factors
   */
  private identifyContributingFactors(features: StudentFeatures): string[] {
    const factors: string[] = [];

    if (features.recentAccuracy < 0.5) {
      factors.push('Low recent accuracy');
    }

    if (features.performanceTrend === 'DECLINING') {
      factors.push('Declining performance trend');
    }

    if (features.sessionsPerWeek < 2) {
      factors.push('Infrequent study sessions');
    }

    if (features.consistencyScore < 0.5) {
      factors.push('Inconsistent study schedule');
    }

    if (features.retentionRate < 0.6) {
      factors.push('Poor knowledge retention');
    }

    if (features.learningVelocityTrend === 'SLOWING') {
      factors.push('Slowing learning velocity');
    }

    return factors;
  }

  /**
   * Generate recommended actions
   */
  private generateRecommendations(
    features: StudentFeatures,
    riskLevel: string
  ): string[] {
    const actions: string[] = [];

    if (riskLevel === 'HIGH') {
      actions.push('Schedule immediate 1-on-1 intervention');
      actions.push('Review foundational concepts');
    }

    if (features.recentAccuracy < 0.5) {
      actions.push('Reduce difficulty level temporarily');
      actions.push('Provide additional practice problems');
    }

    if (features.sessionsPerWeek < 2) {
      actions.push('Send engagement reminder');
      actions.push('Recommend shorter, more frequent sessions');
    }

    if (features.retentionRate < 0.6) {
      actions.push('Increase spaced repetition reviews');
      actions.push('Focus on concept reinforcement');
    }

    if (actions.length === 0) {
      actions.push('Continue monitoring progress');
    }

    return actions;
  }
}
```

#### Day 5: Concept Mastery & Course Completion Predictors

**File: `lib/sam/predictive/mastery-eta-predictor.ts`**

```typescript
export class MasteryETAPredictor {
  /**
   * Predict days until concept mastery
   */
  async predictETA(
    userId: string,
    conceptId: string
  ): Promise<{
    estimatedDays: number;
    confidenceInterval: [number, number];
    recommendedPath: string[];
  }> {
    // Get current mastery
    const mastery = await db.conceptMastery.findUnique({
      where: { userId_conceptId: { userId, conceptId } },
    });

    const currentMastery = mastery?.masteryLevel || 0;

    // Calculate learning rate (mastery per day)
    const learningRate = await this.calculateLearningRate(userId, conceptId);

    // Calculate days to 0.8 mastery
    const masteryGap = 0.8 - currentMastery;
    const estimatedDays = Math.max(1, Math.ceil(masteryGap / Math.max(0.01, learningRate)));

    // Calculate confidence interval (±30%)
    const confidenceInterval: [number, number] = [
      Math.max(1, Math.floor(estimatedDays * 0.7)),
      Math.ceil(estimatedDays * 1.3),
    ];

    // Generate recommended path
    const recommendedPath = await this.generateLearningPath(userId, conceptId);

    return {
      estimatedDays,
      confidenceInterval,
      recommendedPath,
    };
  }

  /**
   * Calculate learning rate
   */
  private async calculateLearningRate(userId: string, conceptId: string): Promise<number> {
    const attempts = await db.learningAttempt.findMany({
      where: { userId, conceptId },
      orderBy: { timestamp: 'asc' },
      take: 20,
    });

    if (attempts.length < 2) return 0.05; // Default

    const firstMastery = attempts[0].masteryAfter || 0;
    const lastMastery = attempts[attempts.length - 1].masteryAfter || 0;

    const timeSpan = (attempts[attempts.length - 1].timestamp.getTime() - attempts[0].timestamp.getTime()) / (1000 * 60 * 60 * 24);

    return (lastMastery - firstMastery) / Math.max(1, timeSpan);
  }

  /**
   * Generate learning path
   */
  private async generateLearningPath(userId: string, conceptId: string): Promise<string[]> {
    // Get prerequisites
    const concept = await db.concept.findUnique({
      where: { id: conceptId },
      include: {
        incomingEdges: {
          where: { relationshipType: 'PREREQUISITE' },
          include: { source: true },
        },
      },
    });

    const path: string[] = [];

    // Add prerequisites not yet mastered
    for (const edge of concept?.incomingEdges || []) {
      const prereqMastery = await db.conceptMastery.findUnique({
        where: {
          userId_conceptId: { userId, conceptId: edge.source.id },
        },
      });

      if (!prereqMastery || prereqMastery.masteryLevel < 0.7) {
        path.push(edge.source.name);
      }
    }

    // Add target concept
    path.push(concept?.name || 'Target concept');

    return path;
  }
}
```

### Week 35: Integration & Dashboard

**File: `lib/sam/predictive/predictive-orchestrator.ts`**

```typescript
import { AtRiskDetector } from './at-risk-detector';
import { MasteryETAPredictor } from './mastery-eta-predictor';

export class PredictiveOrchestrator {
  private atRiskDetector: AtRiskDetector;
  private masteryPredictor: MasteryETAPredictor;

  constructor() {
    this.atRiskDetector = new AtRiskDetector();
    this.masteryPredictor = new MasteryETAPredictor();
  }

  /**
   * Get comprehensive predictions for a course
   */
  async getCourseAnalytics(courseId: string): Promise<{
    atRiskStudents: any[];
    conceptBottlenecks: any[];
    completionForecast: any;
  }> {
    // Get all enrolled students
    const enrollments = await db.enrollment.findMany({
      where: { courseId },
      include: { User: true },
    });

    // Predict at-risk students
    const atRiskPredictions = await Promise.all(
      enrollments.map(e =>
        this.atRiskDetector.predict(e.userId, courseId)
      )
    );

    const atRiskStudents = atRiskPredictions
      .filter(p => p.riskLevel !== 'LOW')
      .sort((a, b) => b.atRiskProbability - a.atRiskProbability);

    return {
      atRiskStudents,
      conceptBottlenecks: [],
      completionForecast: {},
    };
  }
}
```

---

## 📊 Metrics & Monitoring

```typescript
export const predictiveMetrics = {
  predictionAccuracy: new client.Gauge({
    name: 'sam_prediction_accuracy',
    help: 'Accuracy of outcome predictions',
    labelNames: ['model_type'],
  }),

  atRiskDetectionRate: new client.Gauge({
    name: 'sam_at_risk_detection_rate',
    help: 'Percentage of at-risk students detected',
  }),

  interventionSuccessRate: new client.Gauge({
    name: 'sam_intervention_success_rate',
    help: 'Percentage of successful interventions',
  }),
};
```

---

## ✅ Acceptance Criteria

- [ ] Prediction accuracy >80%
- [ ] At-risk precision >85%
- [ ] At-risk recall >75%
- [ ] Prediction latency <500ms
- [ ] Mastery ETA accuracy ±3 days
- [ ] Intervention success >75%

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Owner**: ML/AI Engineering Team
