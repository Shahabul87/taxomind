# Taxomind Dashboard Enhancement Plan

**Target Page:** `/dashboard/user` (http://localhost:3000/dashboard/user)

## Executive Summary

Transform the Taxomind user dashboard into an intelligent **Learning Command Center** that shows learners their daily learning agenda, tracks what they **PLANNED vs ACCOMPLISHED**, syncs with Google Calendar, and provides AI-powered insights to optimize their learning journey.

---

## Your Core Requirements

Based on your request, here's what we're building:

| Requirement | Solution |
|-------------|----------|
| Show plans for a specific day | **Daily Learning Agenda** - All activities for selected date |
| Todos | **Learning Tasks Panel** - Quick tasks with priorities |
| Current date with related things | **Today's Focus** - Hero section with date and context |
| Notifications (user preference) | **Smart Learning Alerts** - Configurable reminders |
| Google Calendar sync | **Two-Way Calendar Sync** - OAuth integration |
| Gantt chart: Planned vs Accomplished | **Learning Journey Timeline** - Visual progress tracker |

---

## Current State Analysis

### ✅ What We Already Have
| Feature | Status | Location |
|---------|--------|----------|
| Study Plans CRUD | ✅ | `/api/dashboard/study-plans` |
| Course Plans CRUD | ✅ | `/api/dashboard/course-plans` |
| Sessions CRUD | ✅ | `/api/dashboard/sessions` |
| Todos CRUD | ✅ | `/api/dashboard/todos` |
| Goals with Milestones | ✅ | `/api/dashboard/goals` |
| Notifications API | ✅ | `/api/notifications` |
| Calendar Events API | ✅ | `/api/calendar` |
| Quick Create Menu | ✅ | `SmartHeader` component |

### ❌ What's Missing for LMS Excellence
| Feature | Priority | Why It Matters |
|---------|----------|----------------|
| **Daily Learning Agenda** | 🔴 Critical | Learners need to see "What do I study today?" |
| **Planned vs Accomplished View** | 🔴 Critical | Visual motivation and accountability |
| **Learning Progress Gantt** | 🔴 Critical | Course journey visualization |
| **Real Google Calendar Sync** | 🟡 High | External schedule integration |
| **Smart Learning Notifications** | 🟡 High | Timely reminders for learning |
| **Study Streak Visualization** | 🟡 High | Gamification and motivation |
| **Learning Analytics Dashboard** | 🟢 Medium | Data-driven insights |
| **AI Study Recommendations** | 🟢 Medium | Personalized learning paths |

---

## Phase 1: Daily Learning Agenda (Core Feature)

### 1.1 The "Today's Learning" Dashboard

This is the **primary view** when users open `/dashboard/user`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📅 Today: Monday, January 6, 2025          [◀ Prev] [Today] [Next ▶]│   │
│  │                                                                      │   │
│  │  "Good morning, Shahab! You have 4 learning activities planned."    │   │
│  │                                                                      │   │
│  │  🔥 7-day streak   |   ⏱️ 2.5 hrs planned   |   📊 68% weekly goal   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  TODAY'S SCHEDULE                                          [+ Add]   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  ⏰ 08:00 - 09:30  │ 📚 Study Session                               │   │
│  │  ──────────────────┼────────────────────────────────────────────────│   │
│  │  ✅ COMPLETED      │ React Hooks Deep Dive                          │   │
│  │                    │ Course: Advanced React • Chapter 5              │   │
│  │                    │ Duration: 1h 30m • [View Notes] [Continue →]   │   │
│  │                                                                      │   │
│  │  ⏰ 10:00 - 10:30  │ 📝 Quiz                                        │   │
│  │  ──────────────────┼────────────────────────────────────────────────│   │
│  │  🟡 IN PROGRESS    │ React State Management Quiz                    │   │
│  │                    │ Course: Advanced React • 15 questions           │   │
│  │                    │ Time limit: 30 min • [Resume Quiz →]           │   │
│  │                                                                      │   │
│  │  ⏰ 14:00 - 15:00  │ 📖 Reading Assignment                          │   │
│  │  ──────────────────┼────────────────────────────────────────────────│   │
│  │  ⬜ NOT STARTED    │ TypeScript Generics Documentation              │   │
│  │                    │ Course: TypeScript Mastery • Est: 1 hour        │   │
│  │                    │ [Start Reading →] [Reschedule]                 │   │
│  │                                                                      │   │
│  │  ⏰ 16:00          │ 🎯 Goal Milestone                              │   │
│  │  ──────────────────┼────────────────────────────────────────────────│   │
│  │  ⚠️ DUE TODAY     │ Complete React Fundamentals Course             │   │
│  │                    │ Progress: 85% • 2 lessons remaining            │   │
│  │                    │ [View Course →] [Extend Deadline]              │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐   │
│  │  📋 TODAY'S TASKS            │  │  🎯 ACTIVE GOALS                 │   │
│  ├──────────────────────────────┤  ├──────────────────────────────────┤   │
│  │  ☑️ Review lecture notes     │  │  Complete 5 courses this month   │   │
│  │  ☐ Practice React exercises  │  │  ████████░░ 80% (4/5)            │   │
│  │  ☐ Submit assignment draft   │  │                                  │   │
│  │  ☐ Join study group (7 PM)   │  │  Study 20 hours this week        │   │
│  │                              │  │  ██████░░░░ 60% (12/20 hrs)      │   │
│  │  [+ Add Task]                │  │                                  │   │
│  └──────────────────────────────┘  └──────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 LMS-Specific Activity Types

```typescript
// types/learning-activities.ts

type LearningActivityType =
  | 'STUDY_SESSION'      // Scheduled study time for a course/chapter
  | 'VIDEO_LESSON'       // Watch a video lesson
  | 'READING'            // Read course material or documentation
  | 'QUIZ'               // Take a quiz or assessment
  | 'ASSIGNMENT'         // Complete an assignment
  | 'PROJECT'            // Work on a project
  | 'PRACTICE'           // Practice exercises or coding challenges
  | 'LIVE_CLASS'         // Attend a live class/webinar
  | 'DISCUSSION'         // Participate in course discussion
  | 'REVIEW'             // Review/revise previous material
  | 'EXAM'               // Take an exam
  | 'CERTIFICATION'      // Complete certification requirements
  | 'GOAL_MILESTONE';    // Goal deadline

type ActivityStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'SKIPPED'
  | 'RESCHEDULED';

interface DailyLearningActivity {
  id: string;
  type: LearningActivityType;
  title: string;
  description?: string;

  // Timing
  scheduledDate: Date;
  startTime?: string;        // "08:00"
  endTime?: string;          // "09:30"
  estimatedDuration: number; // minutes
  actualDuration?: number;   // minutes (after completion)

  // Status & Progress
  status: ActivityStatus;
  progress: number;          // 0-100
  completedAt?: Date;

  // Course Context
  courseId?: string;
  courseName?: string;
  chapterId?: string;
  chapterName?: string;
  lessonId?: string;
  lessonName?: string;

  // Metadata
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isRecurring: boolean;
  recurringPattern?: string;
  tags: string[];
  notes?: string;

  // Sync
  googleCalendarEventId?: string;
  syncedToCalendar: boolean;
}
```

### 1.3 Daily Aggregator API

**File:** `app/api/dashboard/daily/route.ts`

```typescript
// GET /api/dashboard/daily?date=2025-01-06

interface DailyLearningAgenda {
  date: string;
  dayOfWeek: string;
  greeting: string;  // AI-generated contextual greeting

  // Summary Stats
  summary: {
    totalActivities: number;
    completedActivities: number;
    totalPlannedMinutes: number;
    totalCompletedMinutes: number;
    completionRate: number;  // percentage
  };

  // Streak Info
  streak: {
    current: number;
    longest: number;
    todayCompleted: boolean;
    atRisk: boolean;  // true if streak might break today
  };

  // Weekly Progress
  weeklyProgress: {
    hoursPlanned: number;
    hoursCompleted: number;
    goalHours: number;
    percentComplete: number;
  };

  // Activities by Time
  schedule: {
    morning: DailyLearningActivity[];   // 6 AM - 12 PM
    afternoon: DailyLearningActivity[]; // 12 PM - 6 PM
    evening: DailyLearningActivity[];   // 6 PM - 12 AM
    unscheduled: DailyLearningActivity[]; // No specific time
  };

  // Quick Access
  todos: Todo[];
  activeGoals: GoalWithProgress[];
  upcomingDeadlines: Deadline[];

  // AI Insights
  aiInsights: {
    recommendation: string;
    optimalStudyTime?: string;
    focusArea?: string;
  };
}
```

### 1.4 Database Schema for Daily Tracking

```prisma
// Add to prisma/schema.prisma

model DailyLearningLog {
  id                  String   @id @default(cuid())
  userId              String
  date                DateTime @db.Date

  // Planned vs Actual
  plannedMinutes      Int      @default(0)
  actualMinutes       Int      @default(0)
  plannedActivities   Int      @default(0)
  completedActivities Int      @default(0)

  // Activity Breakdown (JSON for flexibility)
  activityBreakdown   Json     @default("{}")
  // {
  //   "STUDY_SESSION": { planned: 2, completed: 2, minutes: 90 },
  //   "QUIZ": { planned: 1, completed: 0, minutes: 0 },
  //   ...
  // }

  // Learning Quality Metrics
  focusScore          Float?   // 0-100, based on session quality
  retentionScore      Float?   // 0-100, based on quiz performance
  engagementScore     Float?   // 0-100, based on interaction

  // Notes
  dailyReflection     String?  // User's end-of-day notes
  aiSummary           String?  // AI-generated day summary

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId, date])
}

model LearningActivity {
  id                  String   @id @default(cuid())
  userId              String

  // Activity Details
  type                String   // LearningActivityType
  title               String
  description         String?

  // Scheduling
  scheduledDate       DateTime @db.Date
  startTime           String?  // "HH:mm"
  endTime             String?  // "HH:mm"
  estimatedDuration   Int      // minutes
  actualDuration      Int?     // minutes

  // Status
  status              String   @default("NOT_STARTED")
  progress            Int      @default(0) // 0-100
  completedAt         DateTime?

  // Course Context
  courseId            String?
  chapterId           String?
  lessonId            String?

  // Metadata
  priority            String   @default("MEDIUM")
  isRecurring         Boolean  @default(false)
  recurringPattern    String?
  tags                String[] @default([])
  notes               String?

  // External Sync
  googleEventId       String?
  syncedToCalendar    Boolean  @default(false)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course              Course?  @relation(fields: [courseId], references: [id])

  @@index([userId, scheduledDate])
  @@index([userId, status])
  @@index([courseId])
}
```

---

## Phase 2: Planned vs Accomplished Gantt Chart

### 2.1 Learning Journey Timeline

This is the **key differentiator** - showing what was PLANNED vs what was actually ACCOMPLISHED:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📊 LEARNING JOURNEY: Planned vs Accomplished                                   │
│                                                                                 │
│  View: [Day] [Week] [Month] [Course]     Filter: [All Courses ▼] [All Types ▼] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  LEGEND:  ▓▓▓ Planned  ███ Completed  ░░░ Remaining  ◆ Milestone  ⚠️ Overdue   │
│                                                                                 │
│                 │ Mon 6  │ Tue 7  │ Wed 8  │ Thu 9  │ Fri 10 │ Sat 11 │ Sun 12 │
│  ───────────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│                 │        │        │        │        │        │        │        │
│  📚 REACT COURSE                                                               │
│  ───────────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│  Planned        │▓▓▓▓▓▓▓▓│▓▓▓▓▓▓▓▓│▓▓▓▓▓▓▓▓│▓▓▓▓░░░░│░░░░░░░░│        │        │
│  Accomplished   │████████│████████│██████░░│        │        │        │        │
│                 │ 2 hrs  │ 2 hrs  │ 1.5 hrs│        │        │        │        │
│                 │ ✅     │ ✅     │ 🔄     │        │        │        │        │
│  └─ Ch.5 Hooks  │████────│────────│────────│────────│────────│────────│────────│
│  └─ Ch.6 State  │────────│████────│────────│────────│────────│────────│────────│
│  └─ Quiz        │────────│────────│────────│◆───────│────────│────────│────────│
│                 │        │        │        │        │        │        │        │
│  📘 TYPESCRIPT COURSE                                                          │
│  ───────────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│  Planned        │        │        │▓▓▓▓▓▓▓▓│▓▓▓▓▓▓▓▓│▓▓▓▓▓▓▓▓│▓▓▓▓▓▓▓▓│        │
│  Accomplished   │        │        │████████│██░░░░░░│        │        │        │
│                 │        │        │ 2 hrs  │ 0.5 hrs│        │        │        │
│                 │        │        │ ✅     │ ⚠️     │        │        │        │
│                 │        │        │        │        │        │        │        │
│  🎯 GOALS                                                                      │
│  ───────────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│  Complete React │●───────│────────│────────│────────│────────│────────│○───────│
│  Course         │ Start  │        │  60%   │        │        │        │ Target │
│                 │        │        │   ◐    │        │        │        │        │
│                 │        │        │        │        │        │        │        │
│  Study 20 hrs   │────────│────────│────────│────────│────────│────────│○───────│
│  this week      │ 4 hrs  │ 8 hrs  │ 11.5hrs│        │        │        │ 20 hrs │
│                 │ ▓▓     │ ▓▓▓▓   │ ▓▓▓▓▓▓ │        │        │        │ Target │
│                 │        │        │        │        │        │        │        │
└─────────────────────────────────────────────────────────────────────────────────┘
│                                                                                 │
│  📈 WEEKLY SUMMARY                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Planned: 14 hours  │  Accomplished: 11.5 hours  │  Completion: 82%     │   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │  ████████████░░░░░░░░░░   │  ████████░░          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Gantt Chart Data Structure

```typescript
// types/learning-gantt.ts

interface LearningGanttItem {
  id: string;
  type: 'COURSE' | 'CHAPTER' | 'LESSON' | 'STUDY_PLAN' | 'GOAL' | 'MILESTONE';
  title: string;

  // Timeline
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;

  // Progress Tracking
  plannedHours: number;
  actualHours: number;
  plannedProgress: number;  // Where should we be by today? (0-100)
  actualProgress: number;   // Where are we actually? (0-100)

  // Visual
  color: string;
  icon: string;

  // Hierarchy
  parentId?: string;
  children?: LearningGanttItem[];

  // Status
  status: 'NOT_STARTED' | 'ON_TRACK' | 'AHEAD' | 'BEHIND' | 'COMPLETED' | 'OVERDUE';

  // Milestones within this item
  milestones: {
    id: string;
    title: string;
    date: Date;
    completed: boolean;
  }[];
}

interface GanttViewConfig {
  view: 'day' | 'week' | 'month' | 'quarter';
  startDate: Date;
  endDate: Date;
  showPlanned: boolean;
  showActual: boolean;
  showMilestones: boolean;
  groupBy: 'course' | 'type' | 'goal';
  courseFilter?: string[];
}

interface PlannedVsAccomplished {
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  planned: {
    totalHours: number;
    activities: number;
    courses: number;
  };
  accomplished: {
    totalHours: number;
    activities: number;
    courses: number;
  };
  variance: {
    hours: number;      // positive = ahead, negative = behind
    percentage: number;
    status: 'AHEAD' | 'ON_TRACK' | 'BEHIND';
  };
  dailyBreakdown: {
    date: string;
    plannedHours: number;
    actualHours: number;
  }[];
}
```

### 2.3 Gantt API Endpoints

```typescript
// GET /api/dashboard/gantt?view=week&start=2025-01-06&end=2025-01-12

interface GanttResponse {
  items: LearningGanttItem[];
  summary: PlannedVsAccomplished;
  courses: {
    id: string;
    title: string;
    color: string;
    totalProgress: number;
  }[];
}

// GET /api/dashboard/gantt/course/:courseId
// Returns Gantt data for a specific course with chapter breakdown
```

---

## Phase 3: Smart Learning Notifications

### 3.1 LMS-Specific Notification Types

```typescript
type LearningNotificationType =
  // Time-Based
  | 'SESSION_STARTING'        // "Your React study session starts in 15 minutes"
  | 'SESSION_REMINDER'        // "Don't forget your 2 PM study session"
  | 'DEADLINE_APPROACHING'    // "Quiz due in 2 hours"
  | 'DEADLINE_TODAY'          // "Assignment due today at 11:59 PM"
  | 'DEADLINE_OVERDUE'        // "You missed the deadline for..."

  // Progress-Based
  | 'STREAK_AT_RISK'          // "Study today to keep your 7-day streak!"
  | 'STREAK_ACHIEVED'         // "🎉 You've reached a 10-day streak!"
  | 'GOAL_PROGRESS'           // "You're 80% toward your monthly goal"
  | 'GOAL_ACHIEVED'           // "🎉 Goal completed: Learn React"
  | 'COURSE_MILESTONE'        // "You've completed 50% of React course"
  | 'COURSE_COMPLETED'        // "🎉 Congratulations! Course completed"

  // AI-Powered
  | 'OPTIMAL_STUDY_TIME'      // "Based on your patterns, now is a good time to study"
  | 'LEARNING_RECOMMENDATION' // "You haven't studied TypeScript in 3 days"
  | 'PACE_WARNING'            // "You're falling behind on your React course"
  | 'PERFORMANCE_INSIGHT'     // "Your quiz scores improved 15% this week"

  // Social/Engagement
  | 'NEW_COURSE_CONTENT'      // "New lesson available in React course"
  | 'DISCUSSION_REPLY'        // "Someone replied to your question"
  | 'CERTIFICATE_READY'       // "Your certificate is ready to download"
  | 'WEEKLY_SUMMARY';         // "Your weekly learning summary is ready"
```

### 3.2 Notification Preferences UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔔 Learning Notification Preferences                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DELIVERY CHANNELS                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ☑️ In-App Notifications                                            │   │
│  │  ☑️ Email Notifications                                             │   │
│  │  ☐ Browser Push Notifications     [Enable]                          │   │
│  │  ☐ Mobile Push (coming soon)                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  QUIET HOURS (No notifications during these times)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ☑️ Enable Quiet Hours                                              │   │
│  │  From: [22:00 ▼]  To: [08:00 ▼]  Timezone: [Asia/Dhaka ▼]          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  NOTIFICATION TYPES                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  📅 SCHEDULE REMINDERS                           In-App    Email    │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  Study session starting                           ☑️        ☐       │   │
│  │    Remind me: [15 minutes ▼] before                                 │   │
│  │  Assignment/Quiz deadlines                        ☑️        ☑️      │   │
│  │    Remind me: [24 hours ▼] and [1 hour ▼] before                   │   │
│  │                                                                      │   │
│  │  🔥 STREAK & GOALS                               In-App    Email    │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  Streak at risk                                   ☑️        ☑️      │   │
│  │  Goal progress updates                            ☑️        ☐       │   │
│  │  Goal achievements                                ☑️        ☑️      │   │
│  │                                                                      │   │
│  │  🤖 AI RECOMMENDATIONS                           In-App    Email    │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  Optimal study time suggestions                   ☑️        ☐       │   │
│  │  Learning pace warnings                           ☑️        ☑️      │   │
│  │  Course recommendations                           ☑️        ☐       │   │
│  │                                                                      │   │
│  │  📊 PROGRESS & ACHIEVEMENTS                      In-App    Email    │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  Course milestones (25%, 50%, 75%, 100%)          ☑️        ☐       │   │
│  │  Weekly learning summary                          ☑️        ☑️      │   │
│  │  Certificate ready                                ☑️        ☑️      │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Save Preferences]                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Database Schema for Notifications

```prisma
model LearningNotificationPreference {
  id                    String   @id @default(cuid())
  userId                String   @unique

  // Channels
  inAppEnabled          Boolean  @default(true)
  emailEnabled          Boolean  @default(true)
  pushEnabled           Boolean  @default(false)

  // Quiet Hours
  quietHoursEnabled     Boolean  @default(false)
  quietHoursStart       String?  // "HH:mm"
  quietHoursEnd         String?  // "HH:mm"
  timezone              String   @default("UTC")

  // Granular Settings (JSON)
  notificationSettings  Json     @default("{}")
  // {
  //   "SESSION_STARTING": {
  //     "enabled": true,
  //     "channels": ["IN_APP"],
  //     "advanceMinutes": 15
  //   },
  //   "DEADLINE_APPROACHING": {
  //     "enabled": true,
  //     "channels": ["IN_APP", "EMAIL"],
  //     "advanceHours": [24, 1]
  //   },
  //   "STREAK_AT_RISK": {
  //     "enabled": true,
  //     "channels": ["IN_APP", "EMAIL"]
  //   }
  // }

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model LearningNotification {
  id                String   @id @default(cuid())
  userId            String

  type              String   // LearningNotificationType
  title             String
  message           String

  // Context
  courseId          String?
  activityId        String?
  goalId            String?

  // Status
  read              Boolean  @default(false)
  readAt            DateTime?
  dismissed         Boolean  @default(false)

  // Actions
  actionUrl         String?
  actionLabel       String?

  // Scheduling
  scheduledFor      DateTime?
  sentAt            DateTime?
  expiresAt         DateTime?

  createdAt         DateTime @default(now())

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@index([userId, type])
  @@index([scheduledFor])
}
```

---

## Phase 4: Google Calendar Integration

### 4.1 What Syncs to Google Calendar

| Taxomind Item | Google Calendar Event |
|---------------|----------------------|
| Study Session | Event with course name, chapter, duration |
| Quiz/Exam | Event with deadline, link to quiz |
| Assignment Due | All-day event or timed event |
| Goal Milestone | Event with progress reminder |
| Live Class | Event with meeting link |

### 4.2 Sync Settings UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📅 Google Calendar Sync                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CONNECTION STATUS                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ✅ Connected to: shahab@gmail.com                                   │   │
│  │  Last synced: 5 minutes ago                                          │   │
│  │                                                                      │   │
│  │  [🔄 Sync Now]    [⚙️ Change Account]    [❌ Disconnect]            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  SYNC SETTINGS                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Which calendar to use:                                              │   │
│  │  [📅 Taxomind Learning ▼]    [+ Create New Calendar]                │   │
│  │                                                                      │   │
│  │  What to sync:                                                       │   │
│  │  ☑️ Study Sessions                                                   │   │
│  │  ☑️ Quizzes & Exams (with deadlines)                                │   │
│  │  ☑️ Assignment Due Dates                                             │   │
│  │  ☑️ Goal Milestones                                                  │   │
│  │  ☐ Daily Learning Todos                                              │   │
│  │  ☑️ Live Classes & Webinars                                          │   │
│  │                                                                      │   │
│  │  Sync direction:                                                     │   │
│  │  ◉ Two-way (changes in either app sync to the other)                │   │
│  │  ○ Taxomind → Google only                                           │   │
│  │  ○ Google → Taxomind only                                           │   │
│  │                                                                      │   │
│  │  Auto-sync frequency:                                                │   │
│  │  [Every 15 minutes ▼]                                               │   │
│  │                                                                      │   │
│  │  Event colors:                                                       │   │
│  │  Study Sessions: [🔵 Blue ▼]                                        │   │
│  │  Quizzes/Exams:  [🔴 Red ▼]                                         │   │
│  │  Assignments:    [🟡 Yellow ▼]                                      │   │
│  │  Goals:          [🟢 Green ▼]                                       │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Save Settings]                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Google Calendar API Integration

```typescript
// lib/google-calendar.ts

interface TaxomindCalendarSync {
  // OAuth
  initiateOAuth(): string;  // Returns OAuth URL
  handleCallback(code: string): Promise<GoogleTokens>;
  refreshToken(userId: string): Promise<void>;

  // Sync Operations
  syncStudySession(session: StudySession): Promise<string>;  // Returns Google Event ID
  syncQuizDeadline(quiz: Quiz): Promise<string>;
  syncAssignment(assignment: Assignment): Promise<string>;
  syncGoalMilestone(milestone: GoalMilestone): Promise<string>;

  // Batch Sync
  syncAllPending(userId: string): Promise<SyncResult>;

  // Two-Way Sync
  pullGoogleEvents(userId: string, dateRange: DateRange): Promise<GoogleEvent[]>;
  reconcileChanges(userId: string): Promise<ReconcileResult>;

  // Management
  deleteEvent(googleEventId: string): Promise<void>;
  updateEvent(googleEventId: string, updates: Partial<CalendarEvent>): Promise<void>;
}

interface SyncResult {
  synced: number;
  failed: number;
  errors: { id: string; error: string }[];
  lastSyncAt: Date;
}
```

---

## Phase 5: Learning Analytics & Insights

### 5.1 Study Time Heatmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Study Activity - 2025                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│       Jan        Feb        Mar        Apr        May        Jun           │
│  Mon  ░░▓▓░░▓   ░▓▓▓░░▓   ░░░▓▓▓░   ░▓░░░▓░   ░░▓▓▓░░   ░░░░▓▓░          │
│  Tue  ░▓▓▓▓░░   ▓▓▓░░▓▓   ░▓▓░░▓▓   ▓▓░▓▓░░   ░▓░░▓▓░   ░▓▓▓░░░          │
│  Wed  ▓▓░░▓▓▓   ░░▓▓▓░░   ▓▓▓▓░░▓   ░░▓▓░▓▓   ▓▓░░░▓▓   ▓░░▓▓▓░          │
│  Thu  ░▓▓▓░░▓   ▓▓░░▓▓░   ░░▓░▓▓▓   ▓▓▓░░░▓   ░▓▓▓░░▓   ░▓▓░░▓▓          │
│  Fri  ▓░░▓▓▓░   ░▓▓▓░░▓   ▓▓░▓▓░░   ░░▓▓▓░░   ▓░░▓▓▓░   ▓▓░▓░░░          │
│  Sat  ░░▓░░░░   ░░░▓░░░   ░░░░▓░░   ░░░░░▓░   ░░░░░░▓   ░░░░░░░          │
│  Sun  ░░░░░░░   ░░░░░░░   ░░░░░░░   ░░░░░░░   ░░░░░░░   ░░░░░░░          │
│                                                                             │
│  Legend: ░ No study  ▒ <1 hr  ▓ 1-2 hrs  █ 3+ hrs                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Total: 247 hrs  |  Active Days: 156  |  Streak: 23 days (longest)  │   │
│  │  Avg Daily: 1.6 hrs  |  Most Active: Tuesday  |  Best Time: 9-11 AM │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Course Progress Analytics

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📈 Course Progress Overview                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ACTIVE COURSES (3)                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Advanced React                                     85% Complete     │   │
│  │  ████████████████████████████████████░░░░░░        Target: Jan 12   │   │
│  │  Planned: 75%  |  Actual: 85%  |  ✅ AHEAD BY 10%                   │   │
│  │                                                                      │   │
│  │  TypeScript Mastery                                 45% Complete     │   │
│  │  ██████████████████░░░░░░░░░░░░░░░░░░░░░           Target: Jan 20   │   │
│  │  Planned: 50%  |  Actual: 45%  |  ⚠️ BEHIND BY 5%                   │   │
│  │                                                                      │   │
│  │  Node.js Fundamentals                               20% Complete     │   │
│  │  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░            Target: Feb 1    │   │
│  │  Planned: 20%  |  Actual: 20%  |  ✅ ON TRACK                       │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  COMPLETION VELOCITY                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Lessons/Week:  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  12 (avg)                     │   │
│  │  Quizzes/Week:  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░   4 (avg)                     │   │
│  │  Study Hours:   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  14 hrs/week                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 AI-Powered SAM Insights

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🤖 SAM Learning Insights                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  💡 PERSONALIZED RECOMMENDATIONS                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Based on your learning patterns:                                    │   │
│  │                                                                      │   │
│  │  "You're most productive between 9-11 AM on weekdays. Your          │   │
│  │   TypeScript course is falling behind - consider moving your        │   │
│  │   morning sessions to focus on TypeScript this week."               │   │
│  │                                                                      │   │
│  │  [Reschedule My Sessions]    [Adjust Goals]    [Ignore]             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ⚠️ ATTENTION NEEDED                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • TypeScript quiz deadline in 2 days (currently scoring 72%)       │   │
│  │  • You haven't practiced React hooks in 5 days                      │   │
│  │  • Weekly goal at 60% with 2 days remaining                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  📊 LEARNING PATTERNS                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Best focus time:     9:00 AM - 11:00 AM                            │   │
│  │  Peak retention:      Video lessons (85% quiz scores)               │   │
│  │  Needs improvement:   Reading comprehension (68% avg)                │   │
│  │  Strength:            Practical exercises (92% completion)           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  🎯 SUGGESTED NEXT ACTIONS                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. Complete TypeScript Chapter 4 (35 min) → [Start Now]            │   │
│  │  2. Review React Hooks notes (15 min) → [Open Notes]                │   │
│  │  3. Practice coding exercise (20 min) → [Begin Exercise]            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 6: Engagement, Personalization & Accessibility

### 6.1 Gamification System

This is **critical for learner motivation** - gamification increases engagement by 60%+ according to LMS industry research.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🏆 ACHIEVEMENTS & REWARDS                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  YOUR LEVEL                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ⭐ Level 12 - Rising Scholar                                            │   │
│  │  ████████████████████████████████░░░░░░░░░░  1,250 / 1,500 XP           │   │
│  │  250 XP to Level 13 (Learning Expert)                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  RECENT ACHIEVEMENTS                                              [View All →] │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  🥇 UNLOCKED TODAY                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │   │
│  │  │     🔥       │  │     📚       │  │     🎯       │                   │   │
│  │  │  Week Warrior│  │  Bookworm    │  │  Quiz Master │                   │   │
│  │  │  7-day streak│  │  50 lessons  │  │  90%+ score  │                   │   │
│  │  │  +100 XP     │  │  +150 XP     │  │  +75 XP      │                   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │   │
│  │                                                                          │   │
│  │  🔒 NEXT TO UNLOCK                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │   │
│  │  │     🌟       │  │     💎       │  │     🚀       │                   │   │
│  │  │  Night Owl   │  │  Perfectionist│  │  Speed Learner│                  │   │
│  │  │  Study after │  │  100% on 5   │  │  Complete    │                   │   │
│  │  │  10 PM (3/5) │  │  quizzes(3/5)│  │  course <1wk │                   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  LEADERBOARD (Optional - Opt-in)                          [⚙️ Privacy Settings]│
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  This Week's Top Learners                                               │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  🥇 1. Sarah M.        2,450 XP   │  🥈 2. John D.       2,180 XP      │   │
│  │  🥉 3. Alex K.         1,950 XP   │  📍 12. You          1,250 XP      │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  ☐ Hide me from leaderboard   ☐ Show only friends                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1.1 Achievement Categories

```typescript
// types/gamification.ts

type AchievementCategory =
  | 'STREAK'           // Consecutive days of learning
  | 'COMPLETION'       // Completing courses, chapters, lessons
  | 'MASTERY'          // High quiz scores, perfect completions
  | 'ENGAGEMENT'       // Discussion participation, notes, bookmarks
  | 'SPEED'            // Fast completions, early finishes
  | 'DEDICATION'       // Study time milestones
  | 'SOCIAL'           // Helping others, group activities
  | 'SPECIAL';         // Limited time, seasonal, hidden

type AchievementRarity =
  | 'COMMON'           // Easy to get (gray border)
  | 'UNCOMMON'         // Moderate effort (green border)
  | 'RARE'             // Significant effort (blue border)
  | 'EPIC'             // Major milestone (purple border)
  | 'LEGENDARY';       // Exceptional achievement (gold border)

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;              // Emoji or icon name
  category: AchievementCategory;
  rarity: AchievementRarity;

  // Unlock Criteria
  criteria: {
    type: 'COUNT' | 'STREAK' | 'PERCENTAGE' | 'TIME' | 'COMPOUND';
    target: number;
    metric: string;          // e.g., 'lessons_completed', 'quiz_score'
    conditions?: {
      field: string;
      operator: '=' | '>' | '<' | '>=' | '<=';
      value: string | number;
    }[];
  };

  // Rewards
  xpReward: number;
  badgeUrl?: string;
  unlockMessage: string;

  // Progress Tracking
  isHidden: boolean;         // Hidden achievements (surprise!)
  isRepeatable: boolean;     // Can be earned multiple times
  maxRepeats?: number;

  // Metadata
  createdAt: Date;
  isActive: boolean;
}

interface UserAchievement {
  id: string;
  odod: string;
  achievementId: string;

  // Progress
  currentProgress: number;
  targetProgress: number;
  progressPercentage: number;

  // Status
  unlockedAt?: Date;
  timesEarned: number;

  // Display
  isNew: boolean;            // Show "NEW" badge
  isPinned: boolean;         // User pinned to profile
}

interface XPTransaction {
  id: string;
  userId: string;
  amount: number;            // Can be negative for penalties
  source: 'ACHIEVEMENT' | 'LESSON' | 'QUIZ' | 'COURSE' | 'STREAK' | 'BONUS' | 'ADMIN';
  sourceId?: string;
  description: string;
  createdAt: Date;
}

interface UserLevel {
  level: number;
  title: string;             // "Rising Scholar", "Learning Expert", etc.
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressToNextLevel: number; // percentage
}

// Level Titles
const LEVEL_TITLES: Record<number, string> = {
  1: 'Curious Beginner',
  5: 'Eager Learner',
  10: 'Rising Scholar',
  15: 'Learning Expert',
  20: 'Knowledge Seeker',
  25: 'Dedicated Student',
  30: 'Master Learner',
  40: 'Grand Scholar',
  50: 'Legendary Mind',
  75: 'Enlightened One',
  100: 'Supreme Sage',
};

// XP Required per Level (exponential growth)
const calculateXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};
```

### 6.1.2 Pre-built Achievement Library

```typescript
// lib/achievements/default-achievements.ts

const DEFAULT_ACHIEVEMENTS: Partial<Achievement>[] = [
  // STREAK Achievements
  {
    name: 'First Steps',
    description: 'Complete your first day of learning',
    icon: '👣',
    category: 'STREAK',
    rarity: 'COMMON',
    criteria: { type: 'STREAK', target: 1, metric: 'learning_days' },
    xpReward: 10,
  },
  {
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    category: 'STREAK',
    rarity: 'UNCOMMON',
    criteria: { type: 'STREAK', target: 7, metric: 'learning_days' },
    xpReward: 100,
  },
  {
    name: 'Month Master',
    description: 'Maintain a 30-day learning streak',
    icon: '🏆',
    category: 'STREAK',
    rarity: 'RARE',
    criteria: { type: 'STREAK', target: 30, metric: 'learning_days' },
    xpReward: 500,
  },
  {
    name: 'Century Learner',
    description: 'Maintain a 100-day learning streak',
    icon: '💯',
    category: 'STREAK',
    rarity: 'LEGENDARY',
    criteria: { type: 'STREAK', target: 100, metric: 'learning_days' },
    xpReward: 2000,
  },

  // COMPLETION Achievements
  {
    name: 'Lesson One',
    description: 'Complete your first lesson',
    icon: '📖',
    category: 'COMPLETION',
    rarity: 'COMMON',
    criteria: { type: 'COUNT', target: 1, metric: 'lessons_completed' },
    xpReward: 15,
  },
  {
    name: 'Bookworm',
    description: 'Complete 50 lessons',
    icon: '📚',
    category: 'COMPLETION',
    rarity: 'UNCOMMON',
    criteria: { type: 'COUNT', target: 50, metric: 'lessons_completed' },
    xpReward: 150,
  },
  {
    name: 'Course Conqueror',
    description: 'Complete your first course',
    icon: '🎓',
    category: 'COMPLETION',
    rarity: 'UNCOMMON',
    criteria: { type: 'COUNT', target: 1, metric: 'courses_completed' },
    xpReward: 200,
  },
  {
    name: 'Polymath',
    description: 'Complete 10 courses',
    icon: '🧠',
    category: 'COMPLETION',
    rarity: 'EPIC',
    criteria: { type: 'COUNT', target: 10, metric: 'courses_completed' },
    xpReward: 1000,
  },

  // MASTERY Achievements
  {
    name: 'Quiz Master',
    description: 'Score 90% or higher on a quiz',
    icon: '🎯',
    category: 'MASTERY',
    rarity: 'UNCOMMON',
    criteria: { type: 'PERCENTAGE', target: 90, metric: 'quiz_score' },
    xpReward: 75,
  },
  {
    name: 'Perfectionist',
    description: 'Score 100% on 5 quizzes',
    icon: '💎',
    category: 'MASTERY',
    rarity: 'RARE',
    criteria: { type: 'COUNT', target: 5, metric: 'perfect_quizzes' },
    xpReward: 300,
  },
  {
    name: 'Flawless Victory',
    description: 'Complete a course with 100% on all quizzes',
    icon: '👑',
    category: 'MASTERY',
    rarity: 'EPIC',
    criteria: { type: 'COMPOUND', target: 1, metric: 'perfect_course' },
    xpReward: 750,
  },

  // DEDICATION Achievements
  {
    name: 'Hour of Power',
    description: 'Study for 1 hour in a single session',
    icon: '⏰',
    category: 'DEDICATION',
    rarity: 'COMMON',
    criteria: { type: 'TIME', target: 60, metric: 'session_minutes' },
    xpReward: 25,
  },
  {
    name: 'Marathon Learner',
    description: 'Accumulate 100 hours of study time',
    icon: '🏃',
    category: 'DEDICATION',
    rarity: 'RARE',
    criteria: { type: 'TIME', target: 6000, metric: 'total_minutes' },
    xpReward: 500,
  },
  {
    name: 'Night Owl',
    description: 'Study after 10 PM five times',
    icon: '🦉',
    category: 'DEDICATION',
    rarity: 'UNCOMMON',
    criteria: {
      type: 'COUNT',
      target: 5,
      metric: 'late_sessions',
      conditions: [{ field: 'session_hour', operator: '>=', value: 22 }]
    },
    xpReward: 50,
  },
  {
    name: 'Early Bird',
    description: 'Study before 7 AM five times',
    icon: '🐦',
    category: 'DEDICATION',
    rarity: 'UNCOMMON',
    criteria: {
      type: 'COUNT',
      target: 5,
      metric: 'early_sessions',
      conditions: [{ field: 'session_hour', operator: '<', value: 7 }]
    },
    xpReward: 50,
  },

  // SPEED Achievements
  {
    name: 'Speed Learner',
    description: 'Complete a course in under 1 week',
    icon: '🚀',
    category: 'SPEED',
    rarity: 'RARE',
    criteria: { type: 'TIME', target: 7, metric: 'course_days' },
    xpReward: 250,
  },
  {
    name: 'Quick Quiz',
    description: 'Complete a quiz in under 5 minutes with 80%+ score',
    icon: '⚡',
    category: 'SPEED',
    rarity: 'UNCOMMON',
    criteria: { type: 'COMPOUND', target: 1, metric: 'fast_quiz_pass' },
    xpReward: 50,
  },

  // ENGAGEMENT Achievements
  {
    name: 'Note Taker',
    description: 'Create 10 notes',
    icon: '📝',
    category: 'ENGAGEMENT',
    rarity: 'COMMON',
    criteria: { type: 'COUNT', target: 10, metric: 'notes_created' },
    xpReward: 30,
  },
  {
    name: 'Collector',
    description: 'Bookmark 25 lessons',
    icon: '🔖',
    category: 'ENGAGEMENT',
    rarity: 'UNCOMMON',
    criteria: { type: 'COUNT', target: 25, metric: 'bookmarks_created' },
    xpReward: 40,
  },
  {
    name: 'Conversationalist',
    description: 'Post 10 discussion comments',
    icon: '💬',
    category: 'ENGAGEMENT',
    rarity: 'UNCOMMON',
    criteria: { type: 'COUNT', target: 10, metric: 'discussion_posts' },
    xpReward: 60,
  },

  // SOCIAL Achievements
  {
    name: 'Helpful Hand',
    description: 'Have your answer marked as helpful 5 times',
    icon: '🤝',
    category: 'SOCIAL',
    rarity: 'RARE',
    criteria: { type: 'COUNT', target: 5, metric: 'helpful_answers' },
    xpReward: 150,
  },
  {
    name: 'Study Buddy',
    description: 'Join a study group',
    icon: '👥',
    category: 'SOCIAL',
    rarity: 'COMMON',
    criteria: { type: 'COUNT', target: 1, metric: 'groups_joined' },
    xpReward: 25,
  },

  // SPECIAL/HIDDEN Achievements
  {
    name: 'Weekend Warrior',
    description: 'Study on both Saturday and Sunday',
    icon: '🎮',
    category: 'SPECIAL',
    rarity: 'UNCOMMON',
    criteria: { type: 'COMPOUND', target: 1, metric: 'weekend_complete' },
    xpReward: 75,
    isHidden: true,
  },
  {
    name: 'Comeback Kid',
    description: 'Return after 30+ days away and complete a lesson',
    icon: '🔄',
    category: 'SPECIAL',
    rarity: 'RARE',
    criteria: { type: 'COMPOUND', target: 1, metric: 'comeback_lesson' },
    xpReward: 100,
    isHidden: true,
  },
];
```

### 6.1.3 Gamification Database Schema

```prisma
// Add to prisma/schema.prisma

model Achievement {
  id                String   @id @default(cuid())
  name              String
  description       String
  icon              String
  category          String   // AchievementCategory
  rarity            String   // AchievementRarity

  // Criteria (JSON for flexibility)
  criteria          Json

  // Rewards
  xpReward          Int      @default(0)
  badgeUrl          String?
  unlockMessage     String?

  // Settings
  isHidden          Boolean  @default(false)
  isRepeatable      Boolean  @default(false)
  maxRepeats        Int?
  isActive          Boolean  @default(true)

  // Ordering
  displayOrder      Int      @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  userAchievements  UserAchievement[]

  @@index([category])
  @@index([rarity])
  @@index([isActive])
}

model UserAchievement {
  id                String   @id @default(cuid())
  odod            String
  achievementId     String

  // Progress
  currentProgress   Int      @default(0)
  targetProgress    Int

  // Status
  unlockedAt        DateTime?
  timesEarned       Int      @default(0)

  // Display
  isNew             Boolean  @default(true)
  isPinned          Boolean  @default(false)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement       Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@index([userId])
  @@index([achievementId])
  @@index([unlockedAt])
}

model UserXP {
  id                String   @id @default(cuid())
  odod            String   @unique

  totalXP           Int      @default(0)
  currentLevel      Int      @default(1)
  xpToNextLevel     Int      @default(100)

  // Stats
  totalAchievements Int      @default(0)
  currentStreak     Int      @default(0)
  longestStreak     Int      @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions      XPTransaction[]
}

model XPTransaction {
  id                String   @id @default(cuid())
  userXPId          String

  amount            Int
  source            String   // 'ACHIEVEMENT' | 'LESSON' | 'QUIZ' | etc.
  sourceId          String?
  description       String

  // Balance tracking
  balanceBefore     Int
  balanceAfter      Int

  createdAt         DateTime @default(now())

  userXP            UserXP   @relation(fields: [userXPId], references: [id], onDelete: Cascade)

  @@index([userXPId])
  @@index([source])
  @@index([createdAt])
}

model LeaderboardEntry {
  id                String   @id @default(cuid())
  odod            String

  // Weekly stats (reset every Monday)
  weeklyXP          Int      @default(0)
  weeklyRank        Int?
  weekStartDate     DateTime @db.Date

  // Monthly stats (reset on 1st)
  monthlyXP         Int      @default(0)
  monthlyRank       Int?
  monthStartDate    DateTime @db.Date

  // All-time
  allTimeRank       Int?

  // Privacy
  isVisible         Boolean  @default(true)
  showOnlyToFriends Boolean  @default(false)

  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, weekStartDate])
  @@index([weeklyXP])
  @@index([monthlyXP])
}
```

---

### 6.2 Quick Access Hub (Bookmarks, Notes, Downloads)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📌 QUICK ACCESS                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [🔖 Bookmarks]  [📝 Notes]  [📥 Downloads]  [⭐ Favorites]                     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🔖 BOOKMARKED LESSONS (12)                              [View All →]   │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  📚 React Hooks Deep Dive                          Advanced React        │   │
│  │  Bookmarked: 2 hours ago                           [Continue →] [✕]     │   │
│  │                                                                          │   │
│  │  📚 TypeScript Generics                            TypeScript Mastery    │   │
│  │  Bookmarked: Yesterday                             [Continue →] [✕]     │   │
│  │                                                                          │   │
│  │  📚 Node.js Event Loop                             Node.js Fundamentals  │   │
│  │  Bookmarked: 3 days ago                            [Continue →] [✕]     │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📝 RECENT NOTES (8)                                     [View All →]   │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  "useEffect cleanup is crucial for..."              React Hooks          │   │
│  │  Created: Today at 10:30 AM                        [Open] [Edit]        │   │
│  │                                                                          │   │
│  │  "Generics allow type parameters..."                TypeScript           │   │
│  │  Created: Yesterday at 3:45 PM                     [Open] [Edit]        │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📥 DOWNLOADED CONTENT (3)                               [Manage →]     │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  📹 Advanced React Course              │  2.4 GB  │  ✅ Available       │   │
│  │  📹 TypeScript Ch. 1-5                 │  890 MB  │  ✅ Available       │   │
│  │  📄 Node.js Cheat Sheet                │  2.1 MB  │  ✅ Available       │   │
│  │                                                                          │   │
│  │  💾 Total: 3.3 GB / 10 GB limit                    [Clear Cache]        │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2.1 Quick Access Types

```typescript
// types/quick-access.ts

interface Bookmark {
  id: string;
  odod: string;

  // Target
  targetType: 'LESSON' | 'CHAPTER' | 'COURSE' | 'RESOURCE' | 'DISCUSSION';
  targetId: string;

  // Display
  title: string;
  description?: string;
  thumbnailUrl?: string;

  // Context
  courseName?: string;
  chapterName?: string;
  progress?: number;

  // Organization
  folderId?: string;
  tags: string[];
  color?: string;

  // Metadata
  createdAt: Date;
  lastAccessedAt?: Date;
}

interface Note {
  id: string;
  odod: string;

  // Content
  title?: string;
  content: string;          // Rich text or markdown
  plainText: string;        // For search

  // Context
  lessonId?: string;
  lessonName?: string;
  courseId?: string;
  courseName?: string;
  timestamp?: number;       // Video timestamp in seconds

  // Organization
  folderId?: string;
  tags: string[];
  color?: string;
  isPinned: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface DownloadedContent {
  id: string;
  odod: string;

  // Content
  contentType: 'COURSE' | 'CHAPTER' | 'LESSON' | 'RESOURCE';
  contentId: string;
  title: string;

  // Storage
  filePath: string;
  fileSize: number;         // bytes
  mimeType: string;

  // Status
  status: 'DOWNLOADING' | 'AVAILABLE' | 'EXPIRED' | 'ERROR';
  progress?: number;        // 0-100 for downloads
  errorMessage?: string;

  // Expiry
  downloadedAt: Date;
  expiresAt?: Date;
  lastAccessedAt?: Date;
}

interface QuickAccessSummary {
  bookmarks: {
    total: number;
    recent: Bookmark[];
  };
  notes: {
    total: number;
    recent: Note[];
  };
  downloads: {
    total: number;
    totalSize: number;
    storageLimit: number;
    items: DownloadedContent[];
  };
  favorites: {
    courses: number;
    lessons: number;
  };
}
```

### 6.2.2 Quick Access Database Schema

```prisma
// Add to prisma/schema.prisma

model Bookmark {
  id                String   @id @default(cuid())
  odod            String

  // Target
  targetType        String   // 'LESSON' | 'CHAPTER' | 'COURSE' | 'RESOURCE'
  targetId          String

  // Display
  title             String
  description       String?
  thumbnailUrl      String?

  // Organization
  folderId          String?
  tags              String[] @default([])
  color             String?

  // Metadata
  createdAt         DateTime @default(now())
  lastAccessedAt    DateTime?

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  folder            BookmarkFolder? @relation(fields: [folderId], references: [id])

  @@unique([userId, targetType, targetId])
  @@index([userId])
  @@index([targetType, targetId])
  @@index([folderId])
}

model BookmarkFolder {
  id                String   @id @default(cuid())
  odod            String

  name              String
  color             String?
  icon              String?
  parentId          String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent            BookmarkFolder? @relation("FolderHierarchy", fields: [parentId], references: [id])
  children          BookmarkFolder[] @relation("FolderHierarchy")
  bookmarks         Bookmark[]

  @@index([userId])
  @@index([parentId])
}

model Note {
  id                String   @id @default(cuid())
  odod            String

  // Content
  title             String?
  content           String   @db.Text
  plainText         String   @db.Text

  // Context
  lessonId          String?
  courseId          String?
  timestamp         Int?     // Video timestamp in seconds

  // Organization
  folderId          String?
  tags              String[] @default([])
  color             String?
  isPinned          Boolean  @default(false)

  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson            Lesson?  @relation(fields: [lessonId], references: [id])
  course            Course?  @relation(fields: [courseId], references: [id])
  folder            NoteFolder? @relation(fields: [folderId], references: [id])

  @@index([userId])
  @@index([lessonId])
  @@index([courseId])
  @@index([folderId])
  @@index([isPinned])
}

model NoteFolder {
  id                String   @id @default(cuid())
  odod            String

  name              String
  color             String?
  icon              String?
  parentId          String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent            NoteFolder? @relation("NoteFolderHierarchy", fields: [parentId], references: [id])
  children          NoteFolder[] @relation("NoteFolderHierarchy")
  notes             Note[]

  @@index([userId])
  @@index([parentId])
}

model DownloadedContent {
  id                String   @id @default(cuid())
  odod            String

  // Content Reference
  contentType       String   // 'COURSE' | 'CHAPTER' | 'LESSON' | 'RESOURCE'
  contentId         String
  title             String

  // Storage Info
  fileSize          BigInt   // bytes
  mimeType          String

  // Status
  status            String   @default("AVAILABLE")
  progress          Int?
  errorMessage      String?

  // Expiry
  downloadedAt      DateTime @default(now())
  expiresAt         DateTime?
  lastAccessedAt    DateTime?

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, contentType, contentId])
  @@index([userId])
  @@index([status])
}
```

---

### 6.3 Productivity Tools (Focus Mode & Pomodoro)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ⏱️ FOCUS & PRODUCTIVITY                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │                         🍅 POMODORO TIMER                                │   │
│  │                                                                          │   │
│  │                           ┌─────────┐                                    │   │
│  │                           │  25:00  │                                    │   │
│  │                           └─────────┘                                    │   │
│  │                                                                          │   │
│  │                    [▶️ Start]  [⏸️ Pause]  [🔄 Reset]                     │   │
│  │                                                                          │   │
│  │        Session: [25 min ▼]   Break: [5 min ▼]   Long Break: [15 min ▼]  │   │
│  │                                                                          │   │
│  │  ───────────────────────────────────────────────────────────────────    │   │
│  │                                                                          │   │
│  │  Today's Sessions:  ●●●●○○○○  4 of 8 completed                          │   │
│  │  Focus Time:        1h 40m                                               │   │
│  │  Break Time:        20m                                                  │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  🔕 FOCUS MODE                                              [OFF →]     │   │
│  │                                                                          │   │
│  │  When enabled:                                                           │   │
│  │  • Mute all notifications except urgent                                  │   │
│  │  • Hide sidebar distractions                                             │   │
│  │  • Full-screen lesson view                                               │   │
│  │  • Block specified websites (browser extension)                          │   │
│  │                                                                          │   │
│  │  ☐ Auto-enable during Pomodoro sessions                                  │   │
│  │  ☐ Auto-enable during scheduled study time                               │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  📊 SCREEN TIME ANALYTICS                           [This Week ▼]       │   │
│  │                                                                          │   │
│  │  Daily Average: 2h 15m                                                   │   │
│  │                                                                          │   │
│  │  Mon  ████████████████████████  2h 45m                                  │   │
│  │  Tue  ██████████████████░░░░░░  2h 10m                                  │   │
│  │  Wed  ████████████████████████  2h 30m                                  │   │
│  │  Thu  ██████████████░░░░░░░░░░  1h 45m                                  │   │
│  │  Fri  ████████████████████████  2h 20m                                  │   │
│  │  Sat  ████████░░░░░░░░░░░░░░░░  1h 00m                                  │   │
│  │  Sun  ████████████░░░░░░░░░░░░  1h 30m (Today)                          │   │
│  │                                                                          │   │
│  │  Peak Hours:  9-11 AM (most productive)                                  │   │
│  │  Suggestion:  Schedule important lessons during peak hours              │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.3.1 Productivity Types

```typescript
// types/productivity.ts

interface PomodoroSettings {
  sessionMinutes: number;      // Default: 25
  shortBreakMinutes: number;   // Default: 5
  longBreakMinutes: number;    // Default: 15
  sessionsBeforeLongBreak: number; // Default: 4
  autoStartBreaks: boolean;
  autoStartSessions: boolean;
  soundEnabled: boolean;
  soundVolume: number;         // 0-100
  notificationsEnabled: boolean;
}

interface PomodoroSession {
  id: string;
  odod: string;

  // Session Info
  type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  plannedDuration: number;     // minutes
  actualDuration: number;      // minutes

  // Context
  courseId?: string;
  lessonId?: string;
  taskDescription?: string;

  // Status
  status: 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED' | 'SKIPPED';
  interruptionReason?: string;

  // Timestamps
  startedAt: Date;
  endedAt?: Date;
  pausedAt?: Date;
  pausedDuration: number;      // total paused time in minutes
}

interface FocusModeSettings {
  isEnabled: boolean;

  // Triggers
  autoEnableDuringPomodoro: boolean;
  autoEnableDuringScheduled: boolean;

  // Blocking
  muteNotifications: boolean;
  hideSidebar: boolean;
  fullscreenLessons: boolean;
  blockedWebsites: string[];   // For browser extension

  // Exceptions
  allowUrgentNotifications: boolean;
  urgentTypes: string[];       // e.g., ['DEADLINE_TODAY', 'EXAM_STARTING']
}

interface ScreenTimeStats {
  period: 'DAY' | 'WEEK' | 'MONTH';

  totalMinutes: number;
  averageMinutes: number;

  byDay: {
    date: string;
    minutes: number;
    sessions: number;
  }[];

  byHour: {
    hour: number;
    minutes: number;
    sessions: number;
  }[];

  peakHours: number[];         // Most productive hours

  comparison: {
    previousPeriod: number;
    changePercent: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
  };
}

interface DailyProductivitySummary {
  date: string;

  // Pomodoro
  pomodoroSessions: {
    completed: number;
    interrupted: number;
    totalFocusMinutes: number;
    totalBreakMinutes: number;
  };

  // Screen Time
  screenTime: {
    totalMinutes: number;
    activeMinutes: number;    // Actual interaction time
    idleMinutes: number;
  };

  // Focus Mode
  focusMode: {
    timesEnabled: number;
    totalMinutes: number;
  };

  // Productivity Score (0-100)
  productivityScore: number;
  scoreBreakdown: {
    focusTime: number;
    taskCompletion: number;
    streakBonus: number;
    consistency: number;
  };
}
```

### 6.3.2 Productivity Database Schema

```prisma
// Add to prisma/schema.prisma

model PomodoroSettings {
  id                        String   @id @default(cuid())
  odod                    String   @unique

  sessionMinutes            Int      @default(25)
  shortBreakMinutes         Int      @default(5)
  longBreakMinutes          Int      @default(15)
  sessionsBeforeLongBreak   Int      @default(4)

  autoStartBreaks           Boolean  @default(false)
  autoStartSessions         Boolean  @default(false)
  soundEnabled              Boolean  @default(true)
  soundVolume               Int      @default(50)
  notificationsEnabled      Boolean  @default(true)

  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  user                      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model PomodoroSession {
  id                String   @id @default(cuid())
  odod            String

  type              String   // 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'
  plannedDuration   Int      // minutes
  actualDuration    Int      @default(0)

  // Context
  courseId          String?
  lessonId          String?
  taskDescription   String?

  // Status
  status            String   @default("ACTIVE")
  interruptionReason String?

  // Timestamps
  startedAt         DateTime @default(now())
  endedAt           DateTime?
  pausedAt          DateTime?
  pausedDuration    Int      @default(0) // minutes

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course            Course?  @relation(fields: [courseId], references: [id])
  lesson            Lesson?  @relation(fields: [lessonId], references: [id])

  @@index([userId])
  @@index([startedAt])
  @@index([status])
}

model FocusModeSettings {
  id                          String   @id @default(cuid())
  odod                      String   @unique

  isEnabled                   Boolean  @default(false)

  autoEnableDuringPomodoro    Boolean  @default(true)
  autoEnableDuringScheduled   Boolean  @default(false)

  muteNotifications           Boolean  @default(true)
  hideSidebar                 Boolean  @default(false)
  fullscreenLessons           Boolean  @default(false)
  blockedWebsites             String[] @default([])

  allowUrgentNotifications    Boolean  @default(true)
  urgentTypes                 String[] @default([])

  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt

  user                        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ScreenTimeLog {
  id                String   @id @default(cuid())
  odod            String
  date              DateTime @db.Date

  // Aggregated daily stats
  totalMinutes      Int      @default(0)
  activeMinutes     Int      @default(0)
  sessionsCount     Int      @default(0)

  // Hourly breakdown (JSON)
  hourlyBreakdown   Json     @default("{}") // { "9": 45, "10": 60, ... }

  // Activity breakdown (JSON)
  activityBreakdown Json     @default("{}") // { "video": 30, "reading": 20, ... }

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId, date])
}
```

---

### 6.4 Certificate Showcase

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📜 MY CERTIFICATES                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🎓 EARNED CERTIFICATES (5)                             [View All →]    │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐ │   │
│  │  │  ╔══════════════╗  │  │  ╔══════════════╗  │  │  ╔══════════════╗  │ │   │
│  │  │  ║  CERTIFICATE ║  │  │  ║  CERTIFICATE ║  │  │  ║  CERTIFICATE ║  │ │   │
│  │  │  ║  OF COMPLETION║  │  │  ║  OF COMPLETION║  │  │  ║  OF MASTERY  ║  │ │   │
│  │  │  ║              ║  │  │  ║              ║  │  │  ║              ║  │ │   │
│  │  │  ║ Advanced     ║  │  │  ║ TypeScript   ║  │  │  ║ React        ║  │ │   │
│  │  │  ║ React        ║  │  │  ║ Mastery      ║  │  │  ║ Expert       ║  │ │   │
│  │  │  ║              ║  │  │  ║              ║  │  │  ║              ║  │ │   │
│  │  │  ║ [QR CODE]    ║  │  │  ║ [QR CODE]    ║  │  │  ║ [QR CODE]    ║  │ │   │
│  │  │  ╚══════════════╝  │  │  ╚══════════════╝  │  │  ╚══════════════╝  │ │   │
│  │  │                    │  │                    │  │                    │ │   │
│  │  │  Jan 2, 2025       │  │  Dec 15, 2024      │  │  Nov 28, 2024      │ │   │
│  │  │                    │  │                    │  │                    │ │   │
│  │  │  [📥 PDF] [🔗 Share]│  │  [📥 PDF] [🔗 Share]│  │  [📥 PDF] [🔗 Share]│ │   │
│  │  │  [LinkedIn] [✉️]   │  │  [LinkedIn] [✉️]   │  │  [LinkedIn] [✉️]   │ │   │
│  │  └────────────────────┘  └────────────────────┘  └────────────────────┘ │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🎯 IN PROGRESS                                                          │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  Node.js Fundamentals                                                    │   │
│  │  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░  45% complete           │   │
│  │  Complete course + pass final exam (70%+) to earn certificate           │   │
│  │                                                                          │   │
│  │  Python for Data Science                                                 │   │
│  │  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  20% complete           │   │
│  │  Complete course + submit capstone project to earn certificate          │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📊 CERTIFICATE STATS                                                    │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  Total Earned: 5          │  Avg Score: 92%        │  Shared: 3         │   │
│  │  Verified: 5              │  LinkedIn Added: 2     │  Downloaded: 8     │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.4.1 Certificate Types

```typescript
// types/certificates.ts

type CertificateType =
  | 'COMPLETION'      // Course completed
  | 'MASTERY'         // Course completed with high score
  | 'SPECIALIZATION'  // Multiple related courses
  | 'PROFESSIONAL'    // Industry-recognized
  | 'ACHIEVEMENT';    // Special achievements

interface Certificate {
  id: string;
  odod: string;
  courseId: string;

  // Certificate Details
  type: CertificateType;
  title: string;
  description: string;
  issueDate: Date;
  expiryDate?: Date;

  // Verification
  certificateNumber: string;  // Unique ID for verification
  verificationUrl: string;
  qrCodeUrl: string;

  // Performance
  finalScore?: number;
  grade?: string;            // A, B, C, etc.
  hoursCompleted: number;

  // Files
  pdfUrl: string;
  thumbnailUrl: string;

  // Sharing
  isPublic: boolean;
  shareableUrl?: string;
  linkedInAdded: boolean;
  timesShared: number;
  timesDownloaded: number;
  timesViewed: number;

  // Metadata
  instructorName?: string;
  organizationName: string;
  skills: string[];          // Skills validated by certificate
}

interface CertificateProgress {
  courseId: string;
  courseName: string;

  // Requirements
  requirements: {
    type: 'COURSE_COMPLETION' | 'EXAM_PASS' | 'PROJECT_SUBMIT' | 'ATTENDANCE';
    description: string;
    completed: boolean;
    progress?: number;
  }[];

  // Overall
  overallProgress: number;
  estimatedCompletion?: Date;
}

interface CertificateVerification {
  isValid: boolean;
  certificate?: Certificate;
  holderName: string;
  verifiedAt: Date;
  issuerVerified: boolean;
}
```

---

### 6.5 Dashboard Customization

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ CUSTOMIZE YOUR DASHBOARD                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  WIDGET VISIBILITY & ORDER                                     [Reset Default] │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Drag to reorder • Toggle to show/hide                                   │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  ☰  ☑️ Today's Learning Agenda              [Full Width ▼]              │   │
│  │  ☰  ☑️ Quick Access Hub                     [Half Width ▼]              │   │
│  │  ☰  ☑️ Active Goals                         [Half Width ▼]              │   │
│  │  ☰  ☑️ Learning Journey Gantt               [Full Width ▼]              │   │
│  │  ☰  ☑️ Achievements & XP                    [Half Width ▼]              │   │
│  │  ☰  ☑️ Certificates                         [Half Width ▼]              │   │
│  │  ☰  ☐ Study Heatmap                         [Full Width ▼]  (Hidden)    │   │
│  │  ☰  ☐ SAM AI Insights                       [Full Width ▼]  (Hidden)    │   │
│  │  ☰  ☑️ Pomodoro Timer                       [Quarter ▼]                 │   │
│  │  ☰  ☐ Leaderboard                           [Quarter ▼]     (Hidden)    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  THEME & APPEARANCE                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Color Theme:     ◉ Light    ○ Dark    ○ System                         │   │
│  │                                                                          │   │
│  │  Accent Color:    🔵 🟢 🟣 🔴 🟡 🟠 ⚫                                   │   │
│  │                   [Blue selected]                                        │   │
│  │                                                                          │   │
│  │  Compact Mode:    ☐ Enable (reduces spacing, smaller text)              │   │
│  │                                                                          │   │
│  │  Animations:      ☑️ Enable smooth transitions                           │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  DEFAULT LANDING PAGE                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  When I open the dashboard, show:                                        │   │
│  │                                                                          │   │
│  │  ◉ Today's Agenda (recommended)                                         │   │
│  │  ○ Continue Learning (last course)                                       │   │
│  │  ○ My Courses                                                            │   │
│  │  ○ Analytics Overview                                                    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [Save Preferences]                              [Preview Changes]              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.5.1 Dashboard Customization Types

```typescript
// types/dashboard-customization.ts

type WidgetId =
  | 'DAILY_AGENDA'
  | 'QUICK_ACCESS'
  | 'ACTIVE_GOALS'
  | 'LEARNING_GANTT'
  | 'ACHIEVEMENTS'
  | 'CERTIFICATES'
  | 'STUDY_HEATMAP'
  | 'SAM_INSIGHTS'
  | 'POMODORO'
  | 'LEADERBOARD'
  | 'UPCOMING_DEADLINES'
  | 'RECENT_ACTIVITY'
  | 'COURSE_PROGRESS';

type WidgetWidth = 'QUARTER' | 'HALF' | 'FULL';

interface WidgetConfig {
  id: WidgetId;
  isVisible: boolean;
  width: WidgetWidth;
  order: number;

  // Widget-specific settings
  settings?: Record<string, unknown>;
}

interface DashboardLayout {
  odod: string;

  // Widgets
  widgets: WidgetConfig[];

  // Appearance
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  accentColor: string;        // Hex color
  compactMode: boolean;
  animationsEnabled: boolean;

  // Behavior
  defaultLandingPage: 'AGENDA' | 'CONTINUE' | 'COURSES' | 'ANALYTICS';

  // Quick Actions
  quickActionsEnabled: boolean;
  pinnedQuickActions: string[];

  updatedAt: Date;
}

interface ThemePreset {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  isDark: boolean;
}
```

### 6.5.2 Dashboard Customization Schema

```prisma
// Add to prisma/schema.prisma

model DashboardLayout {
  id                    String   @id @default(cuid())
  odod                String   @unique

  // Widget configuration (JSON array)
  widgets               Json     @default("[]")

  // Appearance
  theme                 String   @default("SYSTEM")
  accentColor           String   @default("#3B82F6")
  compactMode           Boolean  @default(false)
  animationsEnabled     Boolean  @default(true)

  // Behavior
  defaultLandingPage    String   @default("AGENDA")

  // Quick Actions
  quickActionsEnabled   Boolean  @default(true)
  pinnedQuickActions    String[] @default([])

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

### 6.6 Accessibility Features

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ♿ ACCESSIBILITY SETTINGS                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  VISUAL                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  High Contrast Mode:      ☐ Enable                                       │   │
│  │  (Increases contrast for better visibility)                              │   │
│  │                                                                          │   │
│  │  Text Size:               [Medium ▼]                                     │   │
│  │                           Small | Medium | Large | Extra Large           │   │
│  │                                                                          │   │
│  │  Line Spacing:            [Normal ▼]                                     │   │
│  │                           Compact | Normal | Relaxed                     │   │
│  │                                                                          │   │
│  │  Reduce Motion:           ☐ Minimize animations                          │   │
│  │  (Helpful for vestibular disorders)                                      │   │
│  │                                                                          │   │
│  │  Color Blind Mode:        [None ▼]                                       │   │
│  │                           None | Protanopia | Deuteranopia | Tritanopia  │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  AUDIO & SPEECH                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Screen Reader Optimized: ☑️ Enable                                      │   │
│  │  (Optimizes content for NVDA, JAWS, VoiceOver)                          │   │
│  │                                                                          │   │
│  │  Text-to-Speech:          ☐ Enable for lesson content                    │   │
│  │                           Voice: [Default ▼]  Speed: [1.0x ▼]           │   │
│  │                                                                          │   │
│  │  Auto-play Captions:      ☑️ Always show captions on videos              │   │
│  │                                                                          │   │
│  │  Audio Descriptions:      ☐ Enable for video content                     │   │
│  │  (Describes visual elements for blind users)                             │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  NAVIGATION                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Keyboard Navigation:     ☑️ Enable full keyboard control                │   │
│  │                                                                          │   │
│  │  Focus Indicators:        ☑️ High visibility focus rings                 │   │
│  │                                                                          │   │
│  │  Skip Links:              ☑️ Show "Skip to content" links                │   │
│  │                                                                          │   │
│  │  Tab Order Hints:         ☐ Show tab order numbers                       │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  KEYBOARD SHORTCUTS                                                [View All →]│
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ⌘/Ctrl + K    →  Quick search                                          │   │
│  │  ⌘/Ctrl + D    →  Toggle dark mode                                      │   │
│  │  ⌘/Ctrl + P    →  Start/pause Pomodoro                                  │   │
│  │  ⌘/Ctrl + B    →  Bookmark current lesson                               │   │
│  │  ⌘/Ctrl + N    →  Create new note                                       │   │
│  │  Space         →  Play/pause video                                       │   │
│  │  ← / →         →  Seek video 10 seconds                                  │   │
│  │  Esc           →  Exit focus mode / close modal                          │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [Save Settings]                                    [Reset to Defaults]         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.6.1 Accessibility Types

```typescript
// types/accessibility.ts

type ColorBlindMode = 'NONE' | 'PROTANOPIA' | 'DEUTERANOPIA' | 'TRITANOPIA';
type TextSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';
type LineSpacing = 'COMPACT' | 'NORMAL' | 'RELAXED';

interface AccessibilitySettings {
  odod: string;

  // Visual
  highContrastMode: boolean;
  textSize: TextSize;
  lineSpacing: LineSpacing;
  reduceMotion: boolean;
  colorBlindMode: ColorBlindMode;

  // Audio & Speech
  screenReaderOptimized: boolean;
  textToSpeechEnabled: boolean;
  textToSpeechVoice: string;
  textToSpeechSpeed: number;      // 0.5 - 2.0
  autoPlayCaptions: boolean;
  audioDescriptions: boolean;

  // Navigation
  keyboardNavigationEnabled: boolean;
  highVisibilityFocus: boolean;
  skipLinksEnabled: boolean;
  tabOrderHints: boolean;

  // Custom shortcuts (JSON)
  customShortcuts: Record<string, string>;

  updatedAt: Date;
}

// Keyboard shortcut definitions
interface KeyboardShortcut {
  id: string;
  action: string;
  description: string;
  defaultKey: string;
  customKey?: string;
  category: 'NAVIGATION' | 'MEDIA' | 'ACTIONS' | 'ACCESSIBILITY';
  isCustomizable: boolean;
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { id: 'search', action: 'OPEN_SEARCH', description: 'Quick search', defaultKey: 'Ctrl+K', category: 'NAVIGATION', isCustomizable: true },
  { id: 'darkMode', action: 'TOGGLE_DARK_MODE', description: 'Toggle dark mode', defaultKey: 'Ctrl+D', category: 'ACCESSIBILITY', isCustomizable: true },
  { id: 'pomodoro', action: 'TOGGLE_POMODORO', description: 'Start/pause Pomodoro', defaultKey: 'Ctrl+P', category: 'ACTIONS', isCustomizable: true },
  { id: 'bookmark', action: 'BOOKMARK_LESSON', description: 'Bookmark current lesson', defaultKey: 'Ctrl+B', category: 'ACTIONS', isCustomizable: true },
  { id: 'note', action: 'CREATE_NOTE', description: 'Create new note', defaultKey: 'Ctrl+N', category: 'ACTIONS', isCustomizable: true },
  { id: 'playPause', action: 'MEDIA_PLAY_PAUSE', description: 'Play/pause video', defaultKey: 'Space', category: 'MEDIA', isCustomizable: false },
  { id: 'seekBack', action: 'MEDIA_SEEK_BACK', description: 'Seek back 10s', defaultKey: 'ArrowLeft', category: 'MEDIA', isCustomizable: false },
  { id: 'seekForward', action: 'MEDIA_SEEK_FORWARD', description: 'Seek forward 10s', defaultKey: 'ArrowRight', category: 'MEDIA', isCustomizable: false },
  { id: 'escape', action: 'CLOSE_MODAL', description: 'Exit focus mode / close modal', defaultKey: 'Escape', category: 'NAVIGATION', isCustomizable: false },
];
```

### 6.6.2 Accessibility Database Schema

```prisma
// Add to prisma/schema.prisma

model AccessibilitySettings {
  id                        String   @id @default(cuid())
  odod                    String   @unique

  // Visual
  highContrastMode          Boolean  @default(false)
  textSize                  String   @default("MEDIUM")
  lineSpacing               String   @default("NORMAL")
  reduceMotion              Boolean  @default(false)
  colorBlindMode            String   @default("NONE")

  // Audio & Speech
  screenReaderOptimized     Boolean  @default(false)
  textToSpeechEnabled       Boolean  @default(false)
  textToSpeechVoice         String   @default("default")
  textToSpeechSpeed         Float    @default(1.0)
  autoPlayCaptions          Boolean  @default(true)
  audioDescriptions         Boolean  @default(false)

  // Navigation
  keyboardNavigationEnabled Boolean  @default(true)
  highVisibilityFocus       Boolean  @default(false)
  skipLinksEnabled          Boolean  @default(true)
  tabOrderHints             Boolean  @default(false)

  // Custom shortcuts (JSON)
  customShortcuts           Json     @default("{}")

  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  user                      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Implementation Roadmap

### Phase 1: Daily Learning Agenda (Week 1-2)
- [ ] `DailyLearningLog` and `LearningActivity` database models
- [ ] `/api/dashboard/daily` aggregator endpoint
- [ ] `DailyLearningAgenda` component with date navigation
- [ ] Timeline view with activity cards
- [ ] Today's tasks and active goals panels
- [ ] Quick add activity functionality

### Phase 2: Planned vs Accomplished Gantt (Week 2-3)
- [ ] Gantt data transformation utilities
- [ ] `/api/dashboard/gantt` endpoint
- [ ] `LearningGanttChart` component
- [ ] Dual-bar visualization (planned vs actual)
- [ ] Course/chapter hierarchy display
- [ ] Progress status indicators
- [ ] Week/month/quarter view toggles

### Phase 3: Smart Notifications (Week 3-4)
- [ ] `LearningNotificationPreference` database model
- [ ] Notification preferences UI
- [ ] `/api/notifications/learning` endpoint
- [ ] Notification scheduler (cron jobs)
- [ ] In-app notification bell with dropdown
- [ ] Email notification templates
- [ ] Streak and deadline reminders

### Phase 4: Google Calendar Sync (Week 4-5)
- [ ] Google OAuth flow implementation
- [ ] `GoogleCalendarIntegration` database model
- [ ] Calendar sync settings UI
- [ ] Two-way sync logic
- [ ] Event color coding by activity type
- [ ] Conflict detection and resolution

### Phase 5: Analytics & Insights (Week 5-6)
- [ ] Study time heatmap component
- [ ] Course progress analytics
- [ ] `/api/dashboard/heatmap` endpoint
- [ ] SAM AI insights integration
- [ ] Weekly summary generation
- [ ] Learning pattern analysis

### Phase 6: Engagement, Personalization & Accessibility (Week 7-9)

#### 6.1 Gamification System (Week 7)
- [ ] `Achievement`, `UserAchievement`, `UserXP` database models
- [ ] `XPTransaction` and `LeaderboardEntry` models
- [ ] `/api/gamification/achievements` CRUD endpoints
- [ ] `/api/gamification/xp` transaction endpoints
- [ ] `/api/gamification/leaderboard` endpoint
- [ ] Achievement unlock logic and event triggers
- [ ] XP calculation and level progression system
- [ ] Achievement notification integration
- [ ] `AchievementsWidget` dashboard component
- [ ] `LeaderboardWidget` with privacy controls
- [ ] `LevelProgressBar` component
- [ ] Pre-built achievement library seeder

#### 6.2 Quick Access Hub (Week 7-8)
- [ ] `Bookmark`, `BookmarkFolder` database models
- [ ] `Note`, `NoteFolder` database models
- [ ] `DownloadedContent` database model
- [ ] `/api/bookmarks` CRUD endpoints
- [ ] `/api/notes` CRUD with rich text support
- [ ] `/api/downloads` management endpoints
- [ ] `QuickAccessHub` tabbed component
- [ ] `BookmarksList` with folder organization
- [ ] `NotesList` with search and tagging
- [ ] `DownloadsManager` with storage tracking
- [ ] Video timestamp linking for notes

#### 6.3 Productivity Tools (Week 8)
- [ ] `PomodoroSettings`, `PomodoroSession` database models
- [ ] `FocusModeSettings`, `ScreenTimeLog` database models
- [ ] `/api/pomodoro` session tracking endpoints
- [ ] `/api/focus-mode` settings endpoints
- [ ] `/api/screen-time` analytics endpoints
- [ ] `PomodoroTimer` component with customization
- [ ] `FocusModeToggle` with auto-triggers
- [ ] `ScreenTimeChart` weekly analytics
- [ ] Browser notification integration
- [ ] Sound effects for timer events
- [ ] Productivity score calculation

#### 6.4 Certificate Showcase (Week 8-9)
- [ ] Certificate generation PDF templates
- [ ] `/api/certificates` listing endpoint
- [ ] `/api/certificates/verify/:id` public verification
- [ ] `/api/certificates/share` social sharing
- [ ] `CertificateShowcase` gallery component
- [ ] `CertificateCard` with download/share actions
- [ ] `CertificateProgress` tracking component
- [ ] QR code generation for verification
- [ ] LinkedIn share integration
- [ ] Certificate stats dashboard

#### 6.5 Dashboard Customization (Week 9)
- [ ] `DashboardLayout` database model
- [ ] `/api/dashboard/layout` preferences endpoint
- [ ] Drag-and-drop widget reordering
- [ ] Widget visibility toggles
- [ ] Widget width configuration
- [ ] Theme color picker
- [ ] Compact mode toggle
- [ ] Default landing page selection
- [ ] `DashboardCustomizer` settings modal
- [ ] Layout persistence and sync

#### 6.6 Accessibility Features (Week 9)
- [ ] `AccessibilitySettings` database model
- [ ] `/api/accessibility` settings endpoint
- [ ] High contrast mode CSS variables
- [ ] Text size scaling system
- [ ] Reduce motion media query support
- [ ] Color blind mode filters
- [ ] Screen reader optimization (ARIA labels)
- [ ] Text-to-speech integration
- [ ] Keyboard navigation enhancements
- [ ] Focus indicator improvements
- [ ] Skip links implementation
- [ ] Keyboard shortcuts system
- [ ] `AccessibilitySettingsPanel` component

---

## File Structure

```
app/
├── api/
│   ├── dashboard/
│   │   ├── daily/route.ts                    # Daily learning agenda
│   │   ├── gantt/route.ts                    # Gantt chart data
│   │   ├── heatmap/route.ts                  # Study heatmap
│   │   ├── analytics/route.ts                # Learning analytics
│   │   ├── layout/route.ts                   # Dashboard customization
│   │   └── sync/
│   │       └── google-calendar/route.ts      # Google Calendar sync
│   │
│   ├── gamification/
│   │   ├── achievements/route.ts             # Achievements CRUD
│   │   ├── xp/route.ts                       # XP transactions
│   │   └── leaderboard/route.ts              # Leaderboard data
│   │
│   ├── bookmarks/
│   │   ├── route.ts                          # Bookmarks CRUD
│   │   └── folders/route.ts                  # Bookmark folders
│   │
│   ├── notes/
│   │   ├── route.ts                          # Notes CRUD
│   │   └── folders/route.ts                  # Note folders
│   │
│   ├── downloads/route.ts                    # Downloaded content
│   │
│   ├── pomodoro/
│   │   ├── settings/route.ts                 # Pomodoro settings
│   │   └── sessions/route.ts                 # Session tracking
│   │
│   ├── focus-mode/route.ts                   # Focus mode settings
│   │
│   ├── screen-time/route.ts                  # Screen time analytics
│   │
│   ├── certificates/
│   │   ├── route.ts                          # User certificates
│   │   ├── verify/[id]/route.ts              # Public verification
│   │   └── share/route.ts                    # Social sharing
│   │
│   └── accessibility/route.ts                # Accessibility settings
│
├── dashboard/user/
│   ├── page.tsx                              # Main dashboard
│   └── _components/
│       ├── daily-learning-agenda/
│       │   ├── index.tsx
│       │   ├── date-navigator.tsx
│       │   ├── timeline-view.tsx
│       │   ├── activity-card.tsx
│       │   ├── tasks-panel.tsx
│       │   └── goals-panel.tsx
│       │
│       ├── learning-gantt/
│       │   ├── index.tsx
│       │   ├── gantt-row.tsx
│       │   ├── gantt-bar.tsx
│       │   ├── progress-bar.tsx
│       │   ├── milestone-marker.tsx
│       │   └── gantt-controls.tsx
│       │
│       ├── study-heatmap/
│       │   ├── index.tsx
│       │   └── heatmap-cell.tsx
│       │
│       ├── notification-center/
│       │   ├── index.tsx
│       │   ├── notification-item.tsx
│       │   └── notification-preferences.tsx
│       │
│       ├── sam-insights/
│       │   ├── index.tsx
│       │   ├── recommendation-card.tsx
│       │   └── pattern-analysis.tsx
│       │
│       ├── gamification/
│       │   ├── index.tsx                     # Main gamification widget
│       │   ├── achievements-widget.tsx       # Achievements display
│       │   ├── achievement-card.tsx          # Individual achievement
│       │   ├── level-progress-bar.tsx        # XP/Level progress
│       │   ├── leaderboard-widget.tsx        # Leaderboard display
│       │   ├── xp-notification.tsx           # XP gain toast
│       │   └── achievement-unlock-modal.tsx  # Achievement celebration
│       │
│       ├── quick-access/
│       │   ├── index.tsx                     # Quick access hub
│       │   ├── bookmarks-list.tsx            # Bookmarks tab
│       │   ├── bookmark-card.tsx             # Individual bookmark
│       │   ├── notes-list.tsx                # Notes tab
│       │   ├── note-card.tsx                 # Individual note
│       │   ├── note-editor.tsx               # Rich text note editor
│       │   ├── downloads-manager.tsx         # Downloads tab
│       │   ├── download-item.tsx             # Individual download
│       │   └── folder-tree.tsx               # Folder organization
│       │
│       ├── productivity/
│       │   ├── index.tsx                     # Productivity section
│       │   ├── pomodoro-timer.tsx            # Pomodoro timer
│       │   ├── pomodoro-settings.tsx         # Timer customization
│       │   ├── focus-mode-toggle.tsx         # Focus mode control
│       │   ├── focus-mode-settings.tsx       # Focus mode options
│       │   ├── screen-time-chart.tsx         # Weekly screen time
│       │   └── productivity-score.tsx        # Daily score display
│       │
│       ├── certificates/
│       │   ├── index.tsx                     # Certificate showcase
│       │   ├── certificate-card.tsx          # Individual certificate
│       │   ├── certificate-preview.tsx       # Full certificate view
│       │   ├── certificate-progress.tsx      # In-progress certificates
│       │   ├── certificate-share.tsx         # Share modal
│       │   └── certificate-stats.tsx         # Statistics display
│       │
│       ├── customization/
│       │   ├── dashboard-customizer.tsx      # Customization modal
│       │   ├── widget-list.tsx               # Draggable widget list
│       │   ├── theme-picker.tsx              # Color theme selection
│       │   └── layout-preview.tsx            # Preview changes
│       │
│       └── accessibility/
│           ├── accessibility-settings.tsx    # Settings panel
│           ├── keyboard-shortcuts.tsx        # Shortcuts reference
│           └── skip-links.tsx                # Skip navigation

lib/
├── google-calendar/
│   ├── client.ts                             # Google API client
│   ├── sync.ts                               # Sync logic
│   └── types.ts                              # TypeScript types
│
├── notifications/
│   ├── scheduler.ts                          # Notification scheduler
│   ├── templates.ts                          # Email templates
│   └── learning-alerts.ts                    # Learning-specific alerts
│
├── analytics/
│   ├── learning-patterns.ts                  # Pattern analysis
│   └── heatmap-generator.ts                  # Heatmap data
│
├── gamification/
│   ├── achievement-engine.ts                 # Achievement unlock logic
│   ├── xp-calculator.ts                      # XP calculation
│   ├── level-system.ts                       # Level progression
│   ├── leaderboard-service.ts                # Leaderboard ranking
│   └── default-achievements.ts               # Pre-built achievements
│
├── productivity/
│   ├── pomodoro-service.ts                   # Pomodoro session logic
│   ├── focus-mode-service.ts                 # Focus mode management
│   └── screen-time-tracker.ts                # Screen time aggregation
│
├── certificates/
│   ├── generator.ts                          # PDF generation
│   ├── templates/                            # Certificate templates
│   ├── qr-code.ts                            # QR code generation
│   └── share-service.ts                      # Social sharing logic
│
└── accessibility/
    ├── theme-manager.ts                      # Theme/contrast management
    ├── text-to-speech.ts                     # TTS integration
    └── keyboard-manager.ts                   # Shortcut handling

hooks/
├── use-achievements.ts                       # Achievement state
├── use-xp.ts                                 # XP/level state
├── use-bookmarks.ts                          # Bookmarks CRUD
├── use-notes.ts                              # Notes CRUD
├── use-pomodoro.ts                           # Pomodoro timer
├── use-focus-mode.ts                         # Focus mode toggle
├── use-screen-time.ts                        # Screen time data
├── use-certificates.ts                       # Certificate data
├── use-dashboard-layout.ts                   # Layout preferences
└── use-accessibility.ts                      # Accessibility settings

types/
├── learning-activities.ts
├── learning-gantt.ts
├── learning-notifications.ts
├── learning-analytics.ts
├── gamification.ts                           # Achievement, XP, Leaderboard
├── quick-access.ts                           # Bookmarks, Notes, Downloads
├── productivity.ts                           # Pomodoro, Focus, ScreenTime
├── certificates.ts                           # Certificate types
├── dashboard-customization.ts                # Layout, Theme types
└── accessibility.ts                          # Accessibility settings
```

---

## Summary: What Makes This LMS-Specific

| Generic Dashboard | Our LMS Dashboard |
|-------------------|-------------------|
| Tasks & Projects | Learning Activities (lessons, quizzes, assignments) |
| Deadlines | Course Milestones & Quiz Deadlines |
| Generic Gantt | **Planned vs Accomplished** Learning Timeline |
| Work notifications | **Learning-specific** alerts (streaks, pace, retention) |
| Calendar sync | **Course schedule** sync with color-coded activity types |
| Analytics | **Learning patterns**, focus time, retention scores |
| AI assistant | **SAM AI Mentor** with pedagogical recommendations |
| Basic progress | **Gamification** with XP, levels, achievements, leaderboards |
| File manager | **Quick Access Hub** (bookmarks, notes, downloads) |
| Generic timer | **Pomodoro** + Focus Mode + Screen Time Analytics |
| Completion badges | **Certificate Showcase** with verification & LinkedIn sharing |
| Fixed layout | **Dashboard Customization** with drag-drop widgets |
| Standard UI | **Full Accessibility** (WCAG 2.1 AA compliant) |

---

## Feature Comparison: Before vs After Phase 6

| Feature | Before | After Phase 6 |
|---------|--------|---------------|
| **Motivation System** | Basic streak counter | Full gamification (XP, levels, 25+ achievements, leaderboards) |
| **Content Organization** | Scattered across pages | Centralized Quick Access Hub with folders |
| **Note-Taking** | None | Rich text notes linked to lessons with timestamps |
| **Offline Access** | Not tracked | Download manager with storage limits |
| **Study Sessions** | Manual tracking | Built-in Pomodoro with auto-tracking |
| **Focus Tools** | None | Focus mode with notification muting |
| **Time Insights** | Basic analytics | Detailed screen time with peak hour analysis |
| **Certificates** | Hidden in profile | Prominent showcase with sharing & verification |
| **Personalization** | Fixed dashboard | Customizable widgets, themes, layouts |
| **Accessibility** | Basic | WCAG 2.1 AA with screen reader, keyboard, high contrast |

---

## Total Feature Count

| Phase | Features | Components | API Endpoints | Database Models |
|-------|----------|------------|---------------|-----------------|
| Phase 1 | Daily Learning Agenda | 6 | 1 | 2 |
| Phase 2 | Planned vs Accomplished | 6 | 2 | 0 |
| Phase 3 | Smart Notifications | 7 | 2 | 2 |
| Phase 4 | Google Calendar Sync | 6 | 3 | 1 |
| Phase 5 | Analytics & Insights | 6 | 2 | 0 |
| **Phase 6** | **Engagement & Accessibility** | **40+** | **15** | **15** |
| **TOTAL** | | **70+** | **25** | **20** |

---

## Questions for You

1. **Daily View Priority**: Should the daily agenda be the **default landing page** when users open the dashboard?

2. **Activity Granularity**: Should we track at the **lesson level** or **chapter level** for the Gantt chart?

3. **Notification Frequency**: What's the right balance? Too many = annoying, too few = users miss deadlines.

4. **Google Calendar**: Create a **dedicated "Taxomind Learning"** calendar or use user's primary calendar?

5. **Mobile Priority**: Should this be fully responsive or are we building a separate mobile experience later?

6. **SAM Integration Depth**: Should SAM proactively suggest schedule changes, or only when asked?

7. **Gamification Balance**: How aggressive should the XP rewards be? Too much = inflation, too little = not motivating.

8. **Leaderboard Privacy**: Should leaderboards be opt-in by default, or visible with opt-out option?

9. **Pomodoro Integration**: Should Pomodoro sessions automatically track toward course progress?

10. **Accessibility Priority**: Which accessibility features should be implemented first?

---

*Document Version: 3.0*
*Target: /dashboard/user*
*Created: January 6, 2025*
*Last Updated: January 6, 2025*
*Author: Claude Code Assistant*

## Changelog

### v3.0 (January 6, 2025)
- Added Phase 6: Engagement, Personalization & Accessibility
  - 6.1 Gamification System (XP, Levels, Achievements, Leaderboards)
  - 6.2 Quick Access Hub (Bookmarks, Notes, Downloads)
  - 6.3 Productivity Tools (Pomodoro, Focus Mode, Screen Time)
  - 6.4 Certificate Showcase
  - 6.5 Dashboard Customization
  - 6.6 Accessibility Features
- Updated Implementation Roadmap (now 9 weeks)
- Expanded File Structure with 70+ new components
- Added 15 new database models
- Added 15 new API endpoints
- Added Feature Comparison table
- Added Total Feature Count summary

### v2.0 (January 6, 2025)
- Initial comprehensive plan
- Phases 1-5 defined
- Core LMS features specified
