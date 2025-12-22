# Phase 4: Analytics & Progress System

## Overview

Phase 4 implements a comprehensive unified analytics system for the Taxomind platform, designed around the **unified user model** where any user can be both a learner and a course creator simultaneously.

### Key Design Principles

- **Unified User Model**: No separate teacher/student roles - users can learn courses AND create courses to share with others
- **Real-Time Data**: All analytics are calculated from actual database records (enrollments, progress, exam attempts)
- **Cognitive Tracking**: Bloom's Taxonomy integration for measuring learning depth
- **AI-Powered Insights**: Personalized recommendations using Claude AI
- **Dual Analytics View**: Personal learning analytics + Course creator analytics

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Unified Analytics System                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  Learner View    │    │  Creator View    │                   │
│  │                  │    │                  │                   │
│  │ • Progress       │    │ • Enrollments    │                   │
│  │ • Cognitive Level│    │ • Completions    │                   │
│  │ • Exam Scores    │    │ • Ratings        │                   │
│  │ • Study Streak   │    │ • Trends         │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       │                                          │
│           ┌───────────▼───────────┐                              │
│           │  Unified Analytics    │                              │
│           │       API             │                              │
│           │  /api/analytics/      │                              │
│           │      unified          │                              │
│           └───────────┬───────────┘                              │
│                       │                                          │
│           ┌───────────▼───────────┐                              │
│           │   AI Insights API     │                              │
│           │  /api/analytics/      │                              │
│           │    ai-insights        │                              │
│           └───────────────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Routes

### 1. Unified Analytics API

**Endpoint**: `GET /api/analytics/unified`

Provides both learner and creator analytics in a single request.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `view` | `all` \| `learner` \| `creator` | `all` | Which analytics view to return |
| `timeRange` | `week` \| `month` \| `quarter` \| `year` | `month` | Time period for analytics |
| `courseId` | `string` | - | Optional: Filter to specific course |

#### Response Structure

```typescript
interface UnifiedAnalyticsResponse {
  success: boolean;
  analytics: {
    learner?: LearnerAnalytics;
    creator?: CreatorAnalytics;
    summary: {
      isLearner: boolean;
      isCreator: boolean;
      lastUpdated: string;
    };
  };
}
```

#### Learner Analytics Fields

```typescript
interface LearnerAnalytics {
  overview: {
    totalCoursesEnrolled: number;
    coursesCompleted: number;
    coursesInProgress: number;
    overallProgress: number;        // Percentage
    totalTimeSpent: number;         // Minutes
    studyStreak: number;            // Days
    averageScore: number | null;    // Exam average
  };
  cognitiveProgress: {
    bloomsLevel: string;            // Current Bloom's level
    cognitiveScore: number;         // 0-100
    skillsAcquired: string[];
    growthTrend: Array<{ date: string; score: number }>;
  };
  examPerformance: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    recentExams: Array<{
      examId: string;
      examTitle: string;
      score: number;
      passed: boolean;
      date: string;
    }>;
  };
  weeklyActivity: Array<{
    date: string;
    timeSpent: number;
    sectionsCompleted: number;
  }>;
  recentProgress: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    lastAccessed: string;
  }>;
}
```

#### Creator Analytics Fields

```typescript
interface CreatorAnalytics {
  overview: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalEnrollments: number;
    totalCompletions: number;
    overallCompletionRate: number;
    averageRating: number;
    totalReviews: number;
  };
  coursePerformance: Array<{
    courseId: string;
    courseTitle: string;
    enrollments: number;
    completions: number;
    completionRate: number;
    averageRating: number;
    reviews: number;
    lastEnrollment: string | null;
  }>;
  enrollmentTrend: Array<{
    date: string;
    enrollments: number;
    completions: number;
  }>;
  learnerInsights: {
    activelearners: number;
    averageTimeSpent: number;
    dropoffPoints: Array<{
      courseId: string;
      sectionTitle: string;
      dropoffRate: number;
    }>;
  };
  topPerformingCourses: Array<{
    courseId: string;
    courseTitle: string;
    score: number;
    metric: string;
  }>;
}
```

---

### 2. AI Insights API

**Endpoint**: `GET /api/analytics/ai-insights`

Generates AI-powered personalized learning insights.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `view` | `all` \| `learner` \| `creator` | `all` | Insights focus area |
| `focusArea` | `progress` \| `performance` \| `engagement` \| `cognitive` \| `recommendations` | - | Specific focus |

#### Response Structure

```typescript
interface AIInsightsResponse {
  success: boolean;
  insights: AIInsight[];
  metadata: {
    userId: string;
    generatedAt: string;
    view: string;
    focusArea?: string;
    hasLearningData: boolean;
    hasCreatorData: boolean;
  };
}

interface AIInsight {
  id: string;
  type: 'strength' | 'improvement' | 'recommendation' | 'warning' | 'achievement';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: {
    label: string;
    href: string;
  };
  metric?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  };
}
```

---

## React Hooks

### 1. useUnifiedAnalytics

Main hook for fetching unified analytics data.

```typescript
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

function MyComponent() {
  const {
    data,           // Full unified analytics
    learnerData,    // Learner-specific data
    creatorData,    // Creator-specific data
    isLearner,      // Has learning activity
    isCreator,      // Has created courses
    loading,
    error,
    refetch,
    setTimeRange,
    setView,
  } = useUnifiedAnalytics({
    view: 'all',
    timeRange: 'month',
    autoFetch: true,
  });
}
```

### 2. useLearnerAnalytics

Convenience hook for learner-only analytics.

```typescript
import { useLearnerAnalytics } from '@/hooks/use-unified-analytics';

function LearnerDashboard() {
  const { data, loading, error, refetch } = useLearnerAnalytics('month');

  // data.overview, data.cognitiveProgress, etc.
}
```

### 3. useCreatorAnalytics

Convenience hook for creator-only analytics.

```typescript
import { useCreatorAnalytics } from '@/hooks/use-unified-analytics';

function CreatorDashboard() {
  const { data, loading, error, refetch } = useCreatorAnalytics('month');

  // data.overview, data.coursePerformance, etc.
}
```

### 4. useAIAnalyticsInsights

Hook for fetching AI-powered insights.

```typescript
import { useAIAnalyticsInsights } from '@/hooks/use-ai-analytics-insights';

function InsightsPanel() {
  const {
    insights,
    metadata,
    loading,
    error,
    refetch,
    getInsightsByType,
    getHighPriorityInsights,
  } = useAIAnalyticsInsights({
    view: 'all',
    focusArea: 'recommendations',
  });
}
```

---

## React Components

### 1. PersonalLearningProgress

Displays comprehensive personal learning analytics.

```tsx
import { PersonalLearningProgress } from '@/components/analytics/personal-learning-progress';

// Full view
<PersonalLearningProgress />

// Compact view
<PersonalLearningProgress compact />
```

#### Features
- Courses enrolled/completed/in-progress stats
- Study streak tracking
- Cognitive level (Bloom's Taxonomy) visualization
- Exam performance metrics
- Weekly activity chart
- Recent course progress

---

### 2. AIInsightsPanel

Displays AI-powered personalized insights.

```tsx
import { AIInsightsPanel } from '@/components/analytics/ai-insights-panel';

// Full view with all insights
<AIInsightsPanel view="all" />

// Compact view with max 4 insights
<AIInsightsPanel compact maxInsights={4} />

// Learner-focused insights only
<AIInsightsPanel view="learner" />
```

#### Insight Types

| Type | Description | Color |
|------|-------------|-------|
| `strength` | Things user is doing well | Green |
| `improvement` | Areas needing attention | Amber |
| `recommendation` | Actionable suggestions | Blue |
| `warning` | Critical issues | Red |
| `achievement` | Milestones reached | Purple |

---

### 3. CourseShareDialog

Comprehensive course sharing component.

```tsx
import { CourseShareDialog, CourseShareButton } from '@/components/course/course-share-dialog';

// Full dialog with all options
<CourseShareDialog
  courseId={course.id}
  courseTitle={course.title}
  courseSlug={course.slug}
  isPublished={course.isPublished}
/>

// Custom trigger
<CourseShareDialog
  courseId={course.id}
  courseTitle={course.title}
  isPublished={true}
  trigger={<Button>Share This Course</Button>}
/>

// Simple share button (copies link)
<CourseShareButton courseId={course.id} />
```

#### Visibility Options

| Option | Description |
|--------|-------------|
| `public` | Anyone can discover and view |
| `link-only` | Only people with the link can access |
| `private` | Only enrolled users can view |

#### Social Sharing
- Twitter
- Facebook
- LinkedIn
- WhatsApp
- Email
- Native device share (mobile)

---

## Bloom's Taxonomy Integration

The system tracks cognitive development using Bloom's Taxonomy levels:

```
┌─────────────────────────────────────────────────┐
│                    CREATE                        │  90%+
│              (Design, Construct)                 │
├─────────────────────────────────────────────────┤
│                   EVALUATE                       │  75-89%
│            (Judge, Critique, Assess)             │
├─────────────────────────────────────────────────┤
│                    ANALYZE                       │  60-74%
│          (Differentiate, Organize)               │
├─────────────────────────────────────────────────┤
│                     APPLY                        │  45-59%
│            (Execute, Implement)                  │
├─────────────────────────────────────────────────┤
│                  UNDERSTAND                      │  30-44%
│           (Interpret, Summarize)                 │
├─────────────────────────────────────────────────┤
│                   REMEMBER                       │  0-29%
│             (Recall, Recognize)                  │
└─────────────────────────────────────────────────┘
```

### Cognitive Score Calculation

```typescript
cognitiveScore = (averageExamScore * 0.6) + (overallProgress * 0.4)
```

---

## Database Models Used

### Learner Analytics Data Sources

| Model | Data Used |
|-------|-----------|
| `Enrollment` | Course enrollments, enrollment dates |
| `user_progress` | Section completion, time spent, streaks |
| `UserExamAttempt` | Exam scores, pass/fail, attempt dates |

### Creator Analytics Data Sources

| Model | Data Used |
|-------|-----------|
| `Course` | Created courses, publish status |
| `Enrollment` | Learner enrollments per course |
| `CourseReview` | Ratings, review counts |
| `user_progress` | Learner progress, completion rates |

---

## File Structure

```
├── app/api/analytics/
│   ├── unified/
│   │   └── route.ts              # Unified analytics API
│   └── ai-insights/
│       └── route.ts              # AI insights API
│
├── hooks/
│   ├── use-unified-analytics.ts  # Unified analytics hook
│   └── use-ai-analytics-insights.ts  # AI insights hook
│
├── components/
│   ├── analytics/
│   │   ├── personal-learning-progress.tsx  # Learning analytics
│   │   └── ai-insights-panel.tsx           # AI insights display
│   └── course/
│       └── course-share-dialog.tsx         # Course sharing
```

---

## Integration Examples

### Adding Analytics to Dashboard

```tsx
import { PersonalLearningProgress } from '@/components/analytics/personal-learning-progress';
import { AIInsightsPanel } from '@/components/analytics/ai-insights-panel';

export function DashboardPage() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <PersonalLearningProgress />
      <AIInsightsPanel view="learner" compact />
    </div>
  );
}
```

### Adding Share Button to Course Card

```tsx
import { CourseShareDialog } from '@/components/course/course-share-dialog';

export function CourseCard({ course }) {
  return (
    <div className="course-card">
      <h3>{course.title}</h3>
      <CourseShareDialog
        courseId={course.id}
        courseTitle={course.title}
        isPublished={course.isPublished}
      />
    </div>
  );
}
```

---

## Existing Integration Points

The analytics system integrates with existing pages:

| Page | Integration |
|------|-------------|
| `/my-courses` | Links to `/my-courses/analytics` for creator analytics |
| `/my-courses/analytics` | Course Creator Dashboard (already exists) |
| `/analytics/user` | EnterpriseUnifiedAnalytics component |

---

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live analytics
2. **Export Functionality**: Download analytics as PDF/CSV
3. **Goal Setting**: Allow users to set and track learning goals
4. **Comparative Analytics**: Compare performance with peers (anonymized)
5. **Predictive Learning Paths**: AI-suggested next courses based on progress
6. **Advanced Visualizations**: Interactive charts and graphs
7. **Email Reports**: Weekly/monthly analytics summaries via email

---

## Related Documentation

- [SAM AI Evaluation Engine](./sam-ai-system/SAM_EVALUATION_ENGINE.md)
- [Exam Evaluation System](./EXAM_EVALUATION_SYSTEM_PLAN.md)
- [Course Creator Dashboard](../implementation/DASHBOARD_IMPLEMENTATION_COMPLETE.md)

---

*Last Updated: December 2024*
*Phase: 4 - Analytics & Progress*
*Status: Complete*
