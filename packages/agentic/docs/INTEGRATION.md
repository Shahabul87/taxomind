# Integration Guide

How to integrate @sam-ai/agentic with SAM AI Mentor and the Taxomind LMS.

## Overview

The @sam-ai/agentic package provides autonomous capabilities for SAM AI. This guide covers:

1. [Quick Integration](#quick-integration)
2. [Full Integration](#full-integration)
3. [API Route Integration](#api-route-integration)
4. [Database Integration](#database-integration)
5. [Frontend Integration](#frontend-integration)

---

## Quick Integration

### Using the SAM Agentic Bridge

The fastest way to integrate is using the pre-built bridge:

```typescript
// lib/sam/agentic-bridge.ts is already provided
import { createSAMAgenticBridge } from '@/lib/sam/agentic-bridge';

export async function processStudentMessage(
  userId: string,
  message: string,
  courseId?: string
) {
  // Create bridge instance
  const bridge = createSAMAgenticBridge({
    userId,
    courseId,
    enableGoalPlanning: true,
    enableSelfEvaluation: true,
    enableLearningAnalytics: true,
  });

  // Record the learning session
  await bridge.recordSession({
    topicId: 'current-topic',
    duration: 5,
    questionsAnswered: 1,
    correctAnswers: 1,
  });

  // Get recommendations
  const recommendations = await bridge.getRecommendations({
    availableTime: 30,
  });

  // Score AI response confidence
  const aiResponse = await generateAIResponse(message);
  const confidence = await bridge.scoreConfidence(aiResponse);

  return {
    response: aiResponse,
    confidence: confidence.level,
    recommendations: recommendations.recommendations,
  };
}
```

---

## Full Integration

### Step 1: Install Dependencies

The package is already part of the monorepo:

```bash
# From project root
pnpm install

# Or specifically in a package
cd packages/api
pnpm add @sam-ai/agentic
```

### Step 2: Import Components

```typescript
import {
  // Goal Planning
  createGoalManager,
  createPlanExecutor,
  GoalStatus,
  PlanStatus,

  // Self-Evaluation
  createConfidenceScorer,
  createResponseVerifier,
  ConfidenceLevel,

  // Learning Analytics
  createProgressAnalyzer,
  createSkillAssessor,
  createRecommendationEngine,
  MasteryLevel,
  TimePeriod,

  // Proactive Interventions
  createBehaviorMonitor,
  createCheckInScheduler,
  InterventionType,

  // Utilities
  CAPABILITIES,
  hasCapability,
} from '@sam-ai/agentic';
```

### Step 3: Initialize Components

```typescript
// Create singletons for your application
let progressAnalyzer: ProgressAnalyzer | null = null;
let skillAssessor: SkillAssessor | null = null;
let confidenceScorer: ConfidenceScorer | null = null;

export function getProgressAnalyzer() {
  if (!progressAnalyzer) {
    progressAnalyzer = createProgressAnalyzer({
      // Custom configuration
      logger: console,
    });
  }
  return progressAnalyzer;
}

export function getSkillAssessor() {
  if (!skillAssessor) {
    skillAssessor = createSkillAssessor();

    // Register your course skills
    registerCourseSkills(skillAssessor);
  }
  return skillAssessor;
}

export function getConfidenceScorer() {
  if (!confidenceScorer) {
    confidenceScorer = createConfidenceScorer({
      minConfidenceThreshold: 0.7,
    });
  }
  return confidenceScorer;
}
```

---

## API Route Integration

### Existing Agentic Routes

The following routes are already set up in `app/api/sam/agentic/`:

| Route | Method | Description |
|-------|--------|-------------|
| `/agentic/goals` | GET | List user goals |
| `/agentic/goals` | POST | Create new goal |
| `/agentic/goals/[id]/decompose` | POST | Decompose goal |
| `/agentic/plans` | GET | List execution plans |
| `/agentic/plans` | POST | Create plan from goal |
| `/agentic/plans/[id]/start` | POST | Start plan execution |
| `/agentic/plans/[id]/pause` | POST | Pause plan |
| `/agentic/plans/[id]/resume` | POST | Resume plan |

### Adding New Routes

#### Learning Analytics Route

```typescript
// app/api/sam/agentic/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createProgressAnalyzer, TimePeriod } from '@sam-ai/agentic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') as TimePeriod || TimePeriod.WEEKLY;

  const analyzer = createProgressAnalyzer();
  const report = await analyzer.generateReport(session.user.id, period);

  return NextResponse.json({
    success: true,
    data: report,
  });
}
```

#### Skill Assessment Route

```typescript
// app/api/sam/agentic/skills/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createSkillAssessor, AssessmentSource } from '@sam-ai/agentic';
import { z } from 'zod';

const AssessSkillSchema = z.object({
  skillId: z.string(),
  score: z.number().min(0).max(100),
  source: z.enum(['quiz', 'exercise', 'project', 'self_assessment']),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const validated = AssessSkillSchema.parse(body);

  const assessor = createSkillAssessor();
  const assessment = await assessor.assessSkill({
    userId: session.user.id,
    skillId: validated.skillId,
    score: validated.score,
    source: AssessmentSource[validated.source.toUpperCase() as keyof typeof AssessmentSource],
  });

  return NextResponse.json({
    success: true,
    data: assessment,
  });
}
```

#### Recommendations Route

```typescript
// app/api/sam/agentic/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createRecommendationEngine, LearningStyle } from '@sam-ai/agentic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const availableTime = parseInt(searchParams.get('time') ?? '60');
  const style = searchParams.get('style') as LearningStyle | undefined;

  const engine = createRecommendationEngine();
  const batch = await engine.generateRecommendations({
    userId: session.user.id,
    availableTime,
    learningStyle: style,
  });

  return NextResponse.json({
    success: true,
    data: batch,
  });
}
```

---

## Database Integration

### Using Prisma Stores

Create custom stores that persist to your database:

```typescript
// lib/sam/stores/prisma-progress-store.ts
import { db } from '@/lib/db';
import type { LearningSessionStore, LearningSession } from '@sam-ai/agentic';

export class PrismaLearningSessionStore implements LearningSessionStore {
  async create(session: Omit<LearningSession, 'id'>): Promise<LearningSession> {
    const created = await db.sAMLearningSession.create({
      data: {
        userId: session.userId,
        topicId: session.topicId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        activitiesCompleted: session.activitiesCompleted,
        questionsAnswered: session.questionsAnswered,
        correctAnswers: session.correctAnswers,
        conceptsCovered: session.conceptsCovered,
        focusScore: session.focusScore,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      topicId: created.topicId,
      startTime: created.startTime,
      endTime: created.endTime ?? undefined,
      duration: created.duration,
      activitiesCompleted: created.activitiesCompleted,
      questionsAnswered: created.questionsAnswered,
      correctAnswers: created.correctAnswers,
      conceptsCovered: created.conceptsCovered,
      focusScore: created.focusScore ?? undefined,
    };
  }

  async get(id: string): Promise<LearningSession | null> {
    const session = await db.sAMLearningSession.findUnique({
      where: { id },
    });

    if (!session) return null;

    return {
      id: session.id,
      userId: session.userId,
      topicId: session.topicId,
      startTime: session.startTime,
      endTime: session.endTime ?? undefined,
      duration: session.duration,
      activitiesCompleted: session.activitiesCompleted,
      questionsAnswered: session.questionsAnswered,
      correctAnswers: session.correctAnswers,
      conceptsCovered: session.conceptsCovered,
      focusScore: session.focusScore ?? undefined,
    };
  }

  async getByUser(userId: string, limit?: number): Promise<LearningSession[]> {
    const sessions = await db.sAMLearningSession.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      take: limit,
    });

    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      topicId: s.topicId,
      startTime: s.startTime,
      endTime: s.endTime ?? undefined,
      duration: s.duration,
      activitiesCompleted: s.activitiesCompleted,
      questionsAnswered: s.questionsAnswered,
      correctAnswers: s.correctAnswers,
      conceptsCovered: s.conceptsCovered,
      focusScore: s.focusScore ?? undefined,
    }));
  }

  async getByUserAndTopic(userId: string, topicId: string): Promise<LearningSession[]> {
    const sessions = await db.sAMLearningSession.findMany({
      where: { userId, topicId },
      orderBy: { startTime: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      topicId: s.topicId,
      startTime: s.startTime,
      endTime: s.endTime ?? undefined,
      duration: s.duration,
      activitiesCompleted: s.activitiesCompleted,
      questionsAnswered: s.questionsAnswered,
      correctAnswers: s.correctAnswers,
      conceptsCovered: s.conceptsCovered,
      focusScore: s.focusScore ?? undefined,
    }));
  }

  async getByPeriod(userId: string, start: Date, end: Date): Promise<LearningSession[]> {
    const sessions = await db.sAMLearningSession.findMany({
      where: {
        userId,
        startTime: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      topicId: s.topicId,
      startTime: s.startTime,
      endTime: s.endTime ?? undefined,
      duration: s.duration,
      activitiesCompleted: s.activitiesCompleted,
      questionsAnswered: s.questionsAnswered,
      correctAnswers: s.correctAnswers,
      conceptsCovered: s.conceptsCovered,
      focusScore: s.focusScore ?? undefined,
    }));
  }

  async update(id: string, updates: Partial<LearningSession>): Promise<LearningSession> {
    const updated = await db.sAMLearningSession.update({
      where: { id },
      data: updates,
    });

    return {
      id: updated.id,
      userId: updated.userId,
      topicId: updated.topicId,
      startTime: updated.startTime,
      endTime: updated.endTime ?? undefined,
      duration: updated.duration,
      activitiesCompleted: updated.activitiesCompleted,
      questionsAnswered: updated.questionsAnswered,
      correctAnswers: updated.correctAnswers,
      conceptsCovered: updated.conceptsCovered,
      focusScore: updated.focusScore ?? undefined,
    };
  }
}
```

### Using Custom Stores

```typescript
import { createProgressAnalyzer } from '@sam-ai/agentic';
import { PrismaLearningSessionStore } from '@/lib/sam/stores/prisma-progress-store';

const analyzer = createProgressAnalyzer({
  sessionStore: new PrismaLearningSessionStore(),
});
```

---

## Frontend Integration

### React Hooks

```typescript
// hooks/use-learning-analytics.ts
import { useState, useEffect, useCallback } from 'react';
import type { ProgressReport, RecommendationBatch } from '@sam-ai/agentic';

export function useLearningAnalytics() {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationBatch | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async (period = 'weekly') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sam/agentic/analytics?period=${period}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecommendations = useCallback(async (availableTime = 60) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sam/agentic/recommendations?time=${availableTime}`);
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    report,
    recommendations,
    loading,
    fetchReport,
    fetchRecommendations,
  };
}
```

### Component Example

```tsx
// components/sam/learning-dashboard.tsx
'use client';

import { useLearningAnalytics } from '@/hooks/use-learning-analytics';
import { useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function LearningDashboard() {
  const { report, recommendations, loading, fetchReport, fetchRecommendations } = useLearningAnalytics();

  useEffect(() => {
    fetchReport('weekly');
    fetchRecommendations(60);
  }, [fetchReport, fetchRecommendations]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Weekly Progress</h3>
        </CardHeader>
        <CardContent>
          {report && (
            <div className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Overall Mastery</span>
                <Progress value={report.summary.overallMastery} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Time Spent</span>
                  <p className="font-medium">{report.summary.totalTimeSpent} min</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Topics Completed</span>
                  <p className="font-medium">{report.summary.topicsCompleted}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recommendations</h3>
        </CardHeader>
        <CardContent>
          {recommendations && (
            <ul className="space-y-2">
              {recommendations.recommendations.slice(0, 5).map((rec) => (
                <li key={rec.id} className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {rec.priority}
                  </span>
                  <span>{rec.title}</span>
                  <span className="text-muted-foreground ml-auto">
                    {rec.estimatedDuration} min
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Best Practices

### 1. Use Singletons for Components

```typescript
// Create once, reuse everywhere
const analyzer = createProgressAnalyzer();

// Bad: Creating new instances
async function handler() {
  const analyzer = createProgressAnalyzer(); // Creates new instance each time
}
```

### 2. Handle Errors Gracefully

```typescript
try {
  const assessment = await assessor.assessSkill(input);
} catch (error) {
  if (error.code === 'SKILL_NOT_FOUND') {
    // Handle missing skill
    await assessor.registerSkill(skillDefinition);
  }
}
```

### 3. Batch Operations

```typescript
// Good: Batch multiple operations
const [report, recommendations, skillMap] = await Promise.all([
  analyzer.generateReport(userId),
  engine.generateRecommendations({ userId }),
  assessor.getSkillMap(userId),
]);

// Bad: Sequential operations
const report = await analyzer.generateReport(userId);
const recommendations = await engine.generateRecommendations({ userId });
const skillMap = await assessor.getSkillMap(userId);
```

### 4. Use Type Guards

```typescript
import { MasteryLevel } from '@sam-ai/agentic';

function getLevelColor(level: MasteryLevel): string {
  switch (level) {
    case MasteryLevel.EXPERT:
      return 'green';
    case MasteryLevel.PROFICIENT:
      return 'blue';
    case MasteryLevel.INTERMEDIATE:
      return 'yellow';
    case MasteryLevel.BEGINNER:
      return 'orange';
    case MasteryLevel.NOVICE:
      return 'red';
  }
}
```

---

## Troubleshooting

### Common Issues

1. **"Module not found"**
   - Ensure @sam-ai/agentic is installed
   - Check tsconfig paths are correct

2. **"Store not initialized"**
   - Create store instances before using analyzers
   - Use factory functions consistently

3. **"Type errors"**
   - Import types from @sam-ai/agentic
   - Use strict TypeScript mode

### Debug Mode

Enable debug logging:

```typescript
const analyzer = createProgressAnalyzer({
  logger: {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  },
});
```

---

## Next Steps

1. Review the [API Documentation](./API.md)
2. Check the [README](../README.md) for examples
3. Explore the source code in `packages/agentic/src/`
