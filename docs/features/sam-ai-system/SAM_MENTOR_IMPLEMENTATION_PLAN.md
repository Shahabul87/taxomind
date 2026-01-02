# SAM AI Mentor System - Comprehensive Implementation Plan

**Version**: 1.0.0
**Created**: 2025-12-31
**Status**: APPROVED FOR IMPLEMENTATION

---

## Executive Summary

This document outlines the complete implementation plan for transforming SAM from a chat-based AI assistant into a full-featured AI mentor system with:

1. **Student Mentor Features** - Personalized learning plans, diagnostic assessments, spaced repetition, misconception remediation
2. **Teacher Oversight** - Risk radar, cohort analytics, intervention suggestions, rubric assistance
3. **Infrastructure Consolidation** - Unified pipeline, safety integration, stub module retirement

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Phase 1: Infrastructure Consolidation](#2-phase-1-infrastructure-consolidation)
3. [Phase 2: Student Mentor Core Loop](#3-phase-2-student-mentor-core-loop)
4. [Phase 3: Teacher Oversight Dashboard](#4-phase-3-teacher-oversight-dashboard)
5. [Database Schema Additions](#5-database-schema-additions)
6. [API Contracts](#6-api-contracts)
7. [UI/UX Flows](#7-uiux-flows)
8. [Testing Strategy](#8-testing-strategy)
9. [Implementation Timeline](#9-implementation-timeline)

---

## 1. Current Architecture Analysis

### 1.1 What Exists

| Component | Status | Location |
|-----------|--------|----------|
| Unified Pipeline | ✅ Working | `app/api/sam/unified/route.ts` |
| Streaming Pipeline | ✅ Working | `app/api/sam/unified/stream/route.ts` |
| AI Tutor Endpoints | ✅ 19 endpoints | `app/api/sam/ai-tutor/*` |
| Safety Package | ✅ Ready (not integrated) | `packages/safety/src/index.ts` |
| Memory Package | ⚠️ Partial | `packages/memory/src/index.ts` |
| Educational Engines | ✅ 30+ engines | `packages/educational/src/index.ts` |
| Quality Gates | ✅ Working | `packages/quality/src/index.ts` |
| Pedagogy Pipeline | ✅ Working | `packages/pedagogy/src/index.ts` |

### 1.2 Architecture Gaps

| Gap | Severity | Resolution |
|-----|----------|------------|
| AI Tutor endpoints bypass unified pipeline | High | Route through unified handler |
| Safety package not integrated | High | Add safety gate in response chain |
| Stub modules still referenced | Medium | Deprecate and remove |
| No mentor plan model | High | Add to Prisma schema |
| No review queue model | High | Add to Prisma schema |
| Teacher insights endpoint missing | High | Create new endpoints |

### 1.3 Stub Modules to Retire

```
lib/sam/utils/sam-contextual-intelligence.ts  → Replace with ContextEngine
lib/sam/utils/sam-memory-system.ts            → Replace with StudentProfileStore
lib/sam/hooks/use-sam-cache.ts                → Replace with React Query
```

---

## 2. Phase 1: Infrastructure Consolidation

### 2.1 Objectives

- Create unified handler for all SAM routes
- Integrate safety package into response chain
- Normalize context payloads across endpoints
- Retire stub modules

### 2.2 Implementation Tasks

#### Task 1.1: Create Unified Handler

**File**: `lib/sam/unified-handler.ts`

```typescript
import { SAMContext, OrchestratorResult } from '@sam-ai/core';
import { validateFeedbackSafety, rewriteFeedbackSafely } from '@sam-ai/safety';
import { getDefaultOrchestrator } from './adapters/sam-orchestrator-adapter';

interface UnifiedHandlerOptions {
  engines?: string[];
  skipSafety?: boolean;
  skipMemory?: boolean;
  skipPedagogy?: boolean;
}

export interface UnifiedHandlerResult {
  success: boolean;
  response: string;
  suggestions: Suggestion[];
  actions: Action[];
  insights: SAMInsights;
  safety: SafetyResult;
  memory: MemoryUpdate | null;
  metadata: ResponseMetadata;
}

export async function handleSAMRequest(
  context: SAMContext,
  message: string,
  options: UnifiedHandlerOptions = {}
): Promise<UnifiedHandlerResult> {
  const orchestrator = getDefaultOrchestrator();

  // 1. Run orchestration
  const result = await orchestrator.orchestrate(context, message, {
    engines: options.engines || ['context', 'blooms', 'response']
  });

  // 2. Safety gate (unless skipped)
  let safetyResult = { passed: true, issues: [] };
  let finalResponse = result.response;

  if (!options.skipSafety) {
    safetyResult = await validateFeedbackSafety(result.response);
    if (!safetyResult.passed) {
      finalResponse = await rewriteFeedbackSafely(result.response, safetyResult.issues);
    }
  }

  // 3. Memory update (if applicable)
  let memoryUpdate = null;
  if (!options.skipMemory && context.metadata?.pageContext) {
    memoryUpdate = await updateMemory(context, result);
  }

  // 4. Pedagogy evaluation (if applicable)
  if (!options.skipPedagogy && result.insights?.blooms) {
    result.insights.pedagogy = await evaluatePedagogy(result, context);
  }

  return {
    success: true,
    response: finalResponse,
    suggestions: result.suggestions || [],
    actions: result.actions || [],
    insights: result.insights,
    safety: safetyResult,
    memory: memoryUpdate,
    metadata: buildMetadata(result, safetyResult)
  };
}
```

#### Task 1.2: Update AI Tutor Endpoints

**Pattern for each endpoint**:

```typescript
// BEFORE (app/api/sam/ai-tutor/chat/route.ts)
const response = await runSAMChat({
  systemPrompt: buildSystemPrompt(),
  messages: [{ role: 'user', content: message }]
});

// AFTER
import { handleSAMRequest } from '@/lib/sam/unified-handler';

const result = await handleSAMRequest(samContext, message, {
  engines: ['context', 'blooms', 'response'],
  skipSafety: false,
  skipMemory: false
});
```

**Endpoints to update**:
- [ ] `/ai-tutor/chat/route.ts`
- [ ] `/ai-tutor/practice-problems/route.ts`
- [ ] `/ai-tutor/adaptive-content/route.ts`
- [ ] `/ai-tutor/assessment-engine/route.ts`
- [ ] `/ai-tutor/socratic/route.ts`

#### Task 1.3: Integrate Safety Gate

**Location**: `app/api/sam/unified/route.ts` (line ~680)

```typescript
// Add after response generation, before return
import { validateFeedbackSafety, rewriteFeedbackSafely } from '@sam-ai/safety';

// In the handler:
let safetyResult = { passed: true, issues: [], rewritten: false };

if (response && response.length > 0) {
  const validation = await validateFeedbackSafety(response);
  if (!validation.passed) {
    response = await rewriteFeedbackSafely(response, validation.issues);
    safetyResult = {
      passed: false,
      issues: validation.issues,
      rewritten: true
    };
  }
}

// Include in response
return NextResponse.json({
  success: true,
  response,
  // ... existing fields
  safety: safetyResult
});
```

#### Task 1.4: Deprecate Stub Modules

**Step 1**: Add deprecation warnings

```typescript
// lib/sam/utils/sam-contextual-intelligence.ts
/** @deprecated Use @sam-ai/core ContextEngine instead */
export class ContextualIntelligence {
  constructor() {
    console.warn('[DEPRECATED] ContextualIntelligence is deprecated. Use ContextEngine from @sam-ai/core');
  }
  // ...
}
```

**Step 2**: Find and replace usages

```bash
# Find all imports
grep -r "sam-contextual-intelligence" --include="*.ts" --include="*.tsx"
grep -r "sam-memory-system" --include="*.ts" --include="*.tsx"
grep -r "use-sam-cache" --include="*.ts" --include="*.tsx"
```

**Step 3**: Remove after migration verified

### 2.3 Acceptance Criteria

- [ ] All AI tutor endpoints use unified handler
- [ ] Safety validation runs on every response
- [ ] Stub modules marked deprecated
- [ ] No direct `runSAMChat` calls for user-facing chat
- [ ] Rate limiting applied consistently

---

## 3. Phase 2: Student Mentor Core Loop

### 3.1 Objectives

- Generate personalized learning plans
- Implement diagnostic assessments
- Create daily review queue with spaced repetition
- Detect and remediate misconceptions
- Add Socratic scaffolding with hints
- Implement confidence calibration

### 3.2 New Endpoints

#### 3.2.1 Learning Plan Generation

**Endpoint**: `POST /api/sam/mentor/plan`

**Purpose**: Generate personalized weekly learning plan based on goals, available time, and current mastery.

```typescript
// Request
{
  "userId": "user_123",
  "goal": "Master calculus fundamentals for midterm",
  "targetDate": "2025-04-15",
  "timeBudgetMinutesPerWeek": 240,
  "courseId": "course_abc", // optional - scope to course
  "preferences": {
    "sessionDurationMinutes": 30,
    "preferredDays": ["monday", "wednesday", "friday"]
  }
}

// Response
{
  "success": true,
  "planId": "plan_xyz",
  "weeklyPlan": [
    {
      "week": 1,
      "focus": ["limits", "derivatives-intro"],
      "sessions": [
        {
          "day": "monday",
          "topic": "limits",
          "duration": 30,
          "activities": ["read-concept", "practice-3", "reflect"]
        }
      ],
      "milestone": "Complete limits fundamentals"
    }
  ],
  "reviewQueuePreview": [
    { "topic": "limits", "priority": "high", "dueDate": "2025-03-05" }
  ],
  "estimatedMasteryGain": 0.25
}
```

**Implementation**:
```typescript
// app/api/sam/mentor/plan/route.ts
import { getMastery, getReviewSchedule } from '@sam-ai/memory';
import { KnowledgeGraphEngine } from '@sam-ai/educational';

export async function POST(request: NextRequest) {
  const user = await currentUser();
  const body = await request.json();

  // 1. Get current mastery levels
  const mastery = await getMastery(user.id, body.courseId);

  // 2. Get knowledge graph for topic ordering
  const kg = new KnowledgeGraphEngine();
  const prerequisites = await kg.getPrerequisites(body.goal);

  // 3. Generate plan with AI
  const planPrompt = buildPlanPrompt(mastery, prerequisites, body);
  const plan = await generatePlan(planPrompt);

  // 4. Store plan in database
  const saved = await db.sAMMentorPlan.create({ data: plan });

  return NextResponse.json({ success: true, ...saved });
}
```

#### 3.2.2 Daily Review Queue

**Endpoint**: `GET /api/sam/mentor/review-queue`

**Purpose**: Return prioritized review items based on spaced repetition schedule.

```typescript
// Response
{
  "success": true,
  "items": [
    {
      "id": "review_123",
      "topic": "derivatives-chain-rule",
      "priority": "high",
      "dueDate": "2025-03-05",
      "masteryLevel": 0.65,
      "lastReviewed": "2025-03-01",
      "suggestedActivity": "practice-problems",
      "estimatedTime": 15
    }
  ],
  "totalEstimatedTime": 45,
  "nextReviewDate": "2025-03-06"
}
```

**Implementation**:
```typescript
// app/api/sam/mentor/review-queue/route.ts
import { SpacedRepetitionScheduler } from '@sam-ai/memory';

export async function GET(request: NextRequest) {
  const user = await currentUser();
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');

  const scheduler = new SpacedRepetitionScheduler();
  const reviews = await scheduler.getReviewsForStudent(user.id, {
    courseId,
    limit: 10,
    dueBefore: new Date()
  });

  // Enrich with activity suggestions
  const enriched = await enrichReviewItems(reviews);

  return NextResponse.json({ success: true, items: enriched });
}
```

#### 3.2.3 Diagnostic Assessment

**Endpoint**: `POST /api/sam/mentor/diagnostic`

**Purpose**: Run baseline assessment, identify knowledge gaps, recommend focus areas.

```typescript
// Request
{
  "courseId": "course_abc",
  "scope": "chapter" | "course" | "topic",
  "scopeId": "chapter_xyz"
}

// Response
{
  "success": true,
  "diagnosticId": "diag_123",
  "overallScore": 0.72,
  "bloomsBreakdown": {
    "REMEMBER": 0.85,
    "UNDERSTAND": 0.70,
    "APPLY": 0.60,
    "ANALYZE": 0.45,
    "EVALUATE": 0.30,
    "CREATE": 0.20
  },
  "topicScores": [
    { "topic": "limits", "score": 0.80, "gaps": ["epsilon-delta-definition"] },
    { "topic": "derivatives", "score": 0.65, "gaps": ["chain-rule", "implicit"] }
  ],
  "misconceptions": [
    {
      "pattern": "Confuses derivative with antiderivative",
      "evidence": ["Q3", "Q7"],
      "severity": "high",
      "remediationPath": "micro-lesson-derivatives-vs-integrals"
    }
  ],
  "recommendedFocus": ["derivatives-chain-rule", "implicit-differentiation"],
  "estimatedTimeToMastery": "4-6 hours"
}
```

#### 3.2.4 Misconception Remediation

**Endpoint**: `POST /api/sam/mentor/remediation`

**Purpose**: Deliver targeted micro-lesson for detected misconception, then verify understanding.

```typescript
// Request
{
  "misconceptionId": "misc_123",
  "userId": "user_abc"
}

// Response
{
  "success": true,
  "microLesson": {
    "title": "Derivatives vs Integrals: The Key Difference",
    "content": "...", // Rich content with examples
    "duration": 5,
    "bloomsLevel": "UNDERSTAND"
  },
  "verificationQuestions": [
    {
      "id": "q1",
      "question": "Which operation finds the rate of change?",
      "options": ["Derivative", "Integral"],
      "correctAnswer": 0,
      "explanation": "..."
    }
  ],
  "nextSteps": {
    "ifPass": "practice-problems-derivatives",
    "ifFail": "deeper-remediation-calculus-fundamentals"
  }
}
```

#### 3.2.5 Socratic Scaffolding

**Endpoint**: `POST /api/sam/mentor/socratic`

**Purpose**: Multi-step Socratic dialogue with progressive hints and metacognition prompts.

```typescript
// Request
{
  "problemId": "prob_123",
  "studentAnswer": "I think the derivative is 2x",
  "currentStep": 2,
  "sessionId": "session_abc"
}

// Response
{
  "success": true,
  "isCorrect": false,
  "hint": {
    "level": 2, // 1=gentle, 2=moderate, 3=direct
    "content": "You're on the right track with the power rule. What happens when you have x^3?",
    "metacognition": "What made you think 2x? Can you trace back your reasoning?"
  },
  "nextStep": {
    "question": "Apply the power rule to x^3 step by step",
    "expectedBloomsLevel": "APPLY"
  },
  "progressInProblem": 0.4,
  "encouragement": "Great effort! You've identified the right rule to use."
}
```

#### 3.2.6 Confidence Calibration

**Endpoint**: `POST /api/sam/mentor/confidence`

**Purpose**: Track confidence vs actual performance, provide feedback on calibration.

```typescript
// Request
{
  "questionId": "q_123",
  "answer": "B",
  "confidence": 0.85, // 0-1 scale
  "timeSpent": 45 // seconds
}

// Response
{
  "success": true,
  "isCorrect": true,
  "calibration": {
    "wasOverconfident": false,
    "wasUnderconfident": false,
    "calibrationScore": 0.82, // Historical accuracy
    "feedback": "Your confidence matched your knowledge well on this one!",
    "trend": "improving" // degrading | stable | improving
  },
  "masteryUpdate": {
    "topic": "derivatives",
    "previousLevel": 0.65,
    "newLevel": 0.68
  }
}
```

### 3.3 UI Components

#### Student Mentor Home

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 Learning Goals                              [Edit Plan] │
│  ────────────────────────────────────────────────────────── │
│  Goal: Master Calculus for Midterm                          │
│  Progress: ████████░░░░ 65%           Target: Apr 15        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📅 Today's Review Queue                     [Start Review] │
│  ────────────────────────────────────────────────────────── │
│  🔴 Chain Rule (15 min) - Due today                         │
│  🟡 Integration by Parts (10 min) - Due tomorrow            │
│  🟢 Limits at Infinity (5 min) - Review                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📊 Weekly Progress                                         │
│  ────────────────────────────────────────────────────────── │
│  Sessions: 4/5 completed | Time: 2h 15m | Mastery: +12%     │
│                                                             │
│  [Mon ✓] [Tue ✓] [Wed ✓] [Thu ✓] [Fri ○] [Sat -] [Sun -]   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ Areas Needing Attention                                 │
│  ────────────────────────────────────────────────────────── │
│  • Chain Rule: 3 incorrect attempts this week               │
│    [Start Micro-Lesson]                                     │
│  • Confidence calibration: Overconfident on integrals       │
│    [Review Mistakes]                                        │
└─────────────────────────────────────────────────────────────┘
```

#### Daily Review Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Review: Chain Rule                            [1 of 3]     │
│  ────────────────────────────────────────────────────────── │
│                                                             │
│  Find the derivative of f(x) = (3x + 1)^5                   │
│                                                             │
│  Your answer: _______________                               │
│                                                             │
│  How confident are you?                                     │
│  [Very Low] [Low] [Medium] [High] [Very High]               │
│                                                             │
│  [Submit Answer]                                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  💡 Need help?                                              │
│  [Get Hint] [See Example] [Ask SAM]                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Implementation Files

| File | Purpose |
|------|---------|
| `app/api/sam/mentor/plan/route.ts` | Learning plan generation |
| `app/api/sam/mentor/review-queue/route.ts` | Spaced repetition queue |
| `app/api/sam/mentor/diagnostic/route.ts` | Baseline assessment |
| `app/api/sam/mentor/remediation/route.ts` | Misconception micro-lessons |
| `app/api/sam/mentor/socratic/route.ts` | Scaffolded dialogue |
| `app/api/sam/mentor/confidence/route.ts` | Confidence tracking |
| `components/mentor/MentorHome.tsx` | Main dashboard |
| `components/mentor/ReviewQueue.tsx` | Daily review UI |
| `components/mentor/DiagnosticWizard.tsx` | Assessment flow |
| `components/mentor/SocraticDialogue.tsx` | Socratic interaction |

---

## 4. Phase 3: Teacher Oversight Dashboard

### 4.1 Objectives

- Surface at-risk students early
- Show cohort-level mastery gaps
- Provide AI-generated intervention suggestions
- Assist with rubric-based feedback
- Analyze curriculum coverage

### 4.2 New Endpoints

#### 4.2.1 Risk Radar

**Endpoint**: `GET /api/sam/mentor/risk-radar`

```typescript
// Response
{
  "success": true,
  "atRiskStudents": [
    {
      "userId": "user_123",
      "name": "John Doe",
      "riskLevel": "high",
      "signals": [
        { "type": "engagement_drop", "severity": "high", "detail": "No activity in 5 days" },
        { "type": "mastery_decline", "severity": "medium", "detail": "Derivatives -15%" },
        { "type": "repeated_misconception", "severity": "high", "detail": "Chain rule: 5 failures" }
      ],
      "trend": "declining",
      "suggestedIntervention": "personal_message",
      "lastActive": "2025-03-01"
    }
  ],
  "summary": {
    "totalStudents": 45,
    "atRisk": 3,
    "onTrack": 38,
    "excelling": 4
  }
}
```

#### 4.2.2 Cohort Mastery Map

**Endpoint**: `GET /api/sam/mentor/mastery-map`

```typescript
// Response
{
  "success": true,
  "courseId": "course_abc",
  "topics": [
    {
      "topic": "limits",
      "averageMastery": 0.78,
      "distribution": {
        "struggling": 5, // <40%
        "developing": 12, // 40-70%
        "proficient": 20, // 70-90%
        "mastered": 8 // >90%
      },
      "bloomsDistribution": {
        "REMEMBER": 0.85,
        "UNDERSTAND": 0.72,
        "APPLY": 0.60
      }
    }
  ],
  "overallProgress": 0.72,
  "gaps": [
    {
      "topic": "implicit-differentiation",
      "severity": "high",
      "studentsAffected": 15,
      "recommendation": "Schedule review session"
    }
  ]
}
```

#### 4.2.3 Intervention Suggestions

**Endpoint**: `GET /api/sam/mentor/interventions`

```typescript
// Response
{
  "success": true,
  "interventions": [
    {
      "id": "int_123",
      "priority": "high",
      "type": "personal_message",
      "targetStudent": "user_123",
      "reason": "5-day engagement drop with declining mastery",
      "suggestedAction": {
        "template": "Hi {name}, I noticed you haven't logged in recently. Is everything okay? The chain rule section has some great practice problems that might help with the concepts you were working on.",
        "resources": ["section_xyz"],
        "deadline": "2025-03-10"
      },
      "confidence": 0.85,
      "evidence": [
        "No login since 2025-03-01",
        "Last 3 quiz scores: 65%, 58%, 52%"
      ]
    }
  ]
}
```

#### 4.2.4 Rubric Feedback Assistant

**Endpoint**: `POST /api/sam/mentor/rubric-feedback`

```typescript
// Request
{
  "submissionId": "sub_123",
  "rubricId": "rubric_abc",
  "studentWork": "...", // The submission content
  "instructorNotes": "Focus on clarity" // Optional guidance
}

// Response
{
  "success": true,
  "feedback": {
    "overallScore": 78,
    "criteriaScores": [
      {
        "criterion": "Mathematical Accuracy",
        "score": 85,
        "maxScore": 100,
        "feedback": "Your calculations are correct, but consider showing intermediate steps for the chain rule application."
      }
    ],
    "strengths": ["Clear problem setup", "Correct final answer"],
    "improvements": ["Add intermediate steps", "Explain reasoning for substitution"],
    "suggestedFeedback": "Great work on the overall approach! To strengthen your response, try adding more intermediate steps...",
    "safetyCheck": {
      "passed": true,
      "concerns": []
    }
  }
}
```

#### 4.2.5 Curriculum Quality Analysis

**Endpoint**: `GET /api/sam/mentor/curriculum-analysis`

```typescript
// Response
{
  "success": true,
  "courseId": "course_abc",
  "bloomsDistribution": {
    "REMEMBER": 25,
    "UNDERSTAND": 30,
    "APPLY": 20,
    "ANALYZE": 15,
    "EVALUATE": 7,
    "CREATE": 3
  },
  "depthAnalysis": {
    "averageDepth": 3.2,
    "recommendation": "Add more ANALYZE and EVALUATE level activities"
  },
  "coverage": {
    "complete": 85,
    "gaps": [
      { "topic": "L'Hopital's Rule", "severity": "medium" }
    ]
  },
  "suggestions": [
    "Consider adding case study exercises for EVALUATE level",
    "The CREATE level is underrepresented - add project-based assessments"
  ]
}
```

### 4.3 Teacher Dashboard UI

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Course Analytics: Calculus 101              [Export]    │
│  ────────────────────────────────────────────────────────── │
│  Students: 45 | Avg Progress: 72% | At Risk: 3              │
│                                                             │
├──────────────────────┬──────────────────────────────────────┤
│  🚨 Risk Radar       │  📈 Mastery Map                      │
│  ──────────────────  │  ────────────────────────────────    │
│  ⚠️ John D. (High)   │  Limits      ████████░░ 78%          │
│  ⚠️ Jane S. (High)   │  Derivatives ██████░░░░ 60%          │
│  ⚠️ Bob M. (Med)     │  Integrals   ████░░░░░░ 42%          │
│                      │                                      │
│  [View All]          │  [View Details]                      │
├──────────────────────┴──────────────────────────────────────┤
│  💡 Suggested Interventions                                 │
│  ────────────────────────────────────────────────────────── │
│  1. Send encouragement message to John D.       [Send]      │
│     Reason: 5-day absence, declining mastery                │
│                                                             │
│  2. Schedule review session for derivatives     [Schedule]  │
│     Reason: 15 students below proficiency                   │
│                                                             │
│  3. Add practice problems for chain rule        [Create]    │
│     Reason: Common misconception detected                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📚 Curriculum Quality                                      │
│  ────────────────────────────────────────────────────────── │
│  Bloom's: REMEMBER 25% | UNDERSTAND 30% | APPLY 20% | ...   │
│  Recommendation: Add more EVALUATE level activities         │
│                                                             │
│  [View Full Analysis]                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema Additions

### 5.1 New Models

```prisma
// Add to prisma/schema.prisma

// ============================================
// SAM MENTOR MODELS
// ============================================

model SAMMentorPlan {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId          String?
  course            Course?  @relation(fields: [courseId], references: [id], onDelete: SetNull)

  // Plan details
  goal              String
  targetDate        DateTime
  timeBudgetMinutes Int      @default(240) // per week

  // Generated plan
  weeklyPlan        Json     // Array of week objects
  status            MentorPlanStatus @default(ACTIVE)

  // Progress tracking
  currentWeek       Int      @default(1)
  completedSessions Int      @default(0)
  estimatedMasteryGain Float @default(0)
  actualMasteryGain Float   @default(0)

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  completedAt       DateTime?

  // Relations
  sessions          SAMMentorSession[]

  @@index([userId, status])
  @@index([courseId])
}

model SAMMentorSession {
  id          String   @id @default(cuid())
  planId      String
  plan        SAMMentorPlan @relation(fields: [planId], references: [id], onDelete: Cascade)

  // Session details
  topic       String
  duration    Int      // minutes
  activities  Json     // Array of activity objects
  scheduledAt DateTime

  // Completion
  status      SessionStatus @default(SCHEDULED)
  startedAt   DateTime?
  completedAt DateTime?
  actualDuration Int?

  // Results
  masteryBefore Float?
  masteryAfter  Float?
  reflection    String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([planId, scheduledAt])
}

model SAMReviewEntry {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Content reference
  topicId     String
  sectionId   String?
  courseId    String?

  // Spaced repetition data
  dueDate     DateTime
  priority    ReviewPriority @default(MEDIUM)
  interval    Int      @default(1) // days
  easeFactor  Float    @default(2.5)
  repetitions Int      @default(0)

  // History
  lastReviewed DateTime?
  nextReview   DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, dueDate])
  @@index([userId, priority])
}

model SAMMisconception {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Misconception details
  topicId     String
  pattern     String   // Description of the error pattern
  evidence    Json     // Array of evidence (question IDs, responses)
  severity    MisconceptionSeverity @default(MEDIUM)

  // Status
  status      MisconceptionStatus @default(DETECTED)
  remediationAttempts Int @default(0)

  // Resolution
  resolvedAt  DateTime?
  resolution  String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, status])
  @@index([topicId, severity])
}

model SAMConfidenceLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Question context
  questionId  String
  topicId     String

  // Confidence data
  confidence  Float    // 0-1
  isCorrect   Boolean
  timeSpent   Int      // seconds

  // Calibration
  wasOverconfident  Boolean @default(false)
  wasUnderconfident Boolean @default(false)

  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([userId, topicId])
}

model SAMTeacherIntervention {
  id          String   @id @default(cuid())
  teacherId   String
  teacher     User     @relation("TeacherInterventions", fields: [teacherId], references: [id])
  studentId   String
  student     User     @relation("StudentInterventions", fields: [studentId], references: [id])
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id])

  // Intervention details
  type        InterventionType
  priority    InterventionPriority @default(MEDIUM)

  // AI suggestion
  suggestedAction   Json
  confidence        Float
  evidence          Json

  // Status
  status      InterventionStatus @default(PENDING)
  sentAt      DateTime?
  respondedAt DateTime?
  outcome     String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([teacherId, status])
  @@index([studentId, status])
  @@index([courseId, priority])
}

// Enums
enum MentorPlanStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  ABANDONED
}

enum SessionStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  SKIPPED
  RESCHEDULED
}

enum ReviewPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum MisconceptionSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum MisconceptionStatus {
  DETECTED
  ADDRESSING
  RESOLVED
  RECURRING
}

enum InterventionPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum InterventionStatus {
  PENDING
  SENT
  ACKNOWLEDGED
  COMPLETED
  DISMISSED
}
```

### 5.2 Migration Command

```bash
# Generate migration
npx prisma migrate dev --name add_sam_mentor_models

# Apply to production (Railway)
npx prisma migrate deploy
```

---

## 6. API Contracts

### 6.1 Common Types

```typescript
// types/sam-mentor.ts

export interface MentorPlan {
  id: string;
  userId: string;
  courseId?: string;
  goal: string;
  targetDate: string;
  timeBudgetMinutes: number;
  weeklyPlan: WeekPlan[];
  status: MentorPlanStatus;
  currentWeek: number;
  estimatedMasteryGain: number;
  actualMasteryGain: number;
}

export interface WeekPlan {
  week: number;
  focus: string[];
  sessions: SessionPlan[];
  milestone: string;
}

export interface SessionPlan {
  day: string;
  topic: string;
  duration: number;
  activities: Activity[];
}

export interface ReviewItem {
  id: string;
  topic: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  masteryLevel: number;
  lastReviewed: string;
  suggestedActivity: string;
  estimatedTime: number;
}

export interface RiskSignal {
  type: 'engagement_drop' | 'mastery_decline' | 'repeated_misconception' | 'confidence_miscalibration';
  severity: 'low' | 'medium' | 'high';
  detail: string;
}

export interface Intervention {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'personal_message' | 'resource_recommendation' | 'review_session' | 'assessment';
  targetStudent: string;
  reason: string;
  suggestedAction: SuggestedAction;
  confidence: number;
  evidence: string[];
}
```

### 6.2 Request/Response Schemas

All endpoints use Zod validation. Schemas defined in:
- `lib/sam/schemas/mentor-schemas.ts`

---

## 7. UI/UX Flows

### 7.1 Student Flows

1. **Onboarding Flow**
   - Set learning goal → Take diagnostic → Review plan → Start first session

2. **Daily Review Flow**
   - Open review queue → Start item → Answer with confidence → See feedback → Update mastery → Next item

3. **Remediation Flow**
   - Misconception detected → View micro-lesson → Practice verification → Mark resolved

### 7.2 Teacher Flows

1. **Risk Monitoring Flow**
   - View dashboard → Check risk radar → Review at-risk student → Send intervention

2. **Cohort Analysis Flow**
   - View mastery map → Identify gaps → Schedule review session → Track improvement

3. **Feedback Assistance Flow**
   - Select submission → Load rubric → Review AI suggestions → Edit feedback → Send

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// packages/memory/src/__tests__/mastery-tracker.test.ts
describe('MasteryTracker', () => {
  it('should update mastery correctly after evaluation', async () => {});
  it('should decay mastery over time without review', async () => {});
  it('should not exceed 100% mastery', async () => {});
});

// packages/safety/src/__tests__/feedback-safety.test.ts
describe('FeedbackSafety', () => {
  it('should detect discouraging language', async () => {});
  it('should rewrite unsafe feedback', async () => {});
  it('should pass constructive feedback', async () => {});
});
```

### 8.2 Integration Tests

```typescript
// app/api/sam/mentor/__tests__/plan.test.ts
describe('POST /api/sam/mentor/plan', () => {
  it('should generate valid weekly plan', async () => {});
  it('should respect time budget constraints', async () => {});
  it('should order topics by prerequisites', async () => {});
});
```

### 8.3 E2E Tests

```typescript
// e2e/mentor-flow.spec.ts
test('student completes daily review flow', async ({ page }) => {
  // Navigate to mentor dashboard
  // Start review queue
  // Complete 3 review items
  // Verify mastery updates
});
```

---

## 9. Implementation Timeline

### Phase 1: Infrastructure (Week 1-2)

| Task | Days | Owner |
|------|------|-------|
| Create unified handler | 2 | Backend |
| Integrate safety gate | 1 | Backend |
| Update 5 AI tutor endpoints | 3 | Backend |
| Deprecate stub modules | 1 | Backend |
| Add rate limiting | 1 | Backend |
| Testing & validation | 2 | QA |

### Phase 2: Student Mentor (Week 3-5)

| Task | Days | Owner |
|------|------|-------|
| Database schema migration | 1 | Backend |
| Plan generation endpoint | 3 | Backend |
| Review queue endpoint | 2 | Backend |
| Diagnostic endpoint | 2 | Backend |
| Remediation endpoint | 2 | Backend |
| Socratic scaffolding | 2 | Backend |
| Confidence calibration | 1 | Backend |
| Mentor Home UI | 3 | Frontend |
| Review Queue UI | 2 | Frontend |
| Diagnostic Wizard UI | 2 | Frontend |
| Testing & iteration | 3 | Full Team |

### Phase 3: Teacher Oversight (Week 6-7)

| Task | Days | Owner |
|------|------|-------|
| Risk radar endpoint | 2 | Backend |
| Mastery map endpoint | 2 | Backend |
| Intervention suggestions | 2 | Backend |
| Rubric feedback assistant | 2 | Backend |
| Curriculum analysis | 1 | Backend |
| Teacher dashboard UI | 4 | Frontend |
| Testing & iteration | 2 | Full Team |

---

## Appendix: File Structure

```
app/api/sam/
├── unified/
│   ├── route.ts              # Main unified endpoint
│   └── stream/route.ts       # Streaming endpoint
├── mentor/
│   ├── plan/route.ts         # Learning plan
│   ├── review-queue/route.ts # Spaced repetition
│   ├── diagnostic/route.ts   # Assessment
│   ├── remediation/route.ts  # Micro-lessons
│   ├── socratic/route.ts     # Scaffolding
│   ├── confidence/route.ts   # Calibration
│   ├── risk-radar/route.ts   # Teacher: at-risk
│   ├── mastery-map/route.ts  # Teacher: cohort
│   ├── interventions/route.ts # Teacher: suggestions
│   ├── rubric-feedback/route.ts # Teacher: grading
│   └── curriculum-analysis/route.ts # Teacher: quality
└── ai-tutor/                 # Existing endpoints (to update)

lib/sam/
├── unified-handler.ts        # NEW: Shared handler
├── schemas/
│   └── mentor-schemas.ts     # NEW: Zod schemas
└── adapters/                 # Existing adapters

components/
├── mentor/
│   ├── MentorHome.tsx        # Student dashboard
│   ├── ReviewQueue.tsx       # Daily review
│   ├── DiagnosticWizard.tsx  # Assessment flow
│   ├── SocraticDialogue.tsx  # Scaffolding UI
│   └── ConfidenceSlider.tsx  # Confidence input
└── analytics/
    └── TeacherMentorDashboard.tsx # Teacher oversight

packages/
├── safety/                   # Existing (to integrate)
├── memory/                   # Existing (to extend)
└── educational/              # Existing (to leverage)
```

---

**Document Status**: Ready for Implementation
**Approved By**: [Pending]
**Next Action**: Begin Phase 1 - Create unified handler
