# Dashboard Redesign - Comprehensive Implementation Plan

**Project**: TaxoMind Learning Dashboard Redesign  
**Inspired By**: Canvas LMS Activity Stream  
**Date**: November 2025  
**Status**: Planning Phase

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current vs New Dashboard](#current-vs-new-dashboard)
3. [Core Features](#core-features)
4. [UI/UX Design Specifications](#uiux-design-specifications)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Component Architecture](#component-architecture)
8. [Google Calendar Integration](#google-calendar-integration)
9. [Implementation Phases](#implementation-phases)
10. [Technical Stack](#technical-stack)
11. [Security & Performance](#security--performance)
12. [Testing Strategy](#testing-strategy)

---

## 1. Executive Summary

### Vision
Transform the TaxoMind dashboard into an activity-centric command center that surfaces the most relevant information at a glance, inspired by Canvas LMS's clean, scannable design.

### Key Objectives
- **Focus**: Shift from static stats to dynamic activity streams
- **Simplicity**: Remove clutter, show only actionable items
- **Integration**: Google Calendar for schedule management
- **Flexibility**: Multiple view modes (Grid/List) and infinite scroll
- **Real-time**: Live notifications and activity updates

### Success Metrics
- Dashboard load time < 1.5s
- 80% user engagement with activity items
- 50% reduction in navigation clicks to reach tasks
- Google Calendar sync < 5s latency

---

## 2. Current vs New Dashboard

### Current Dashboard (Problems)
```
❌ Shows mock data (fake stats)
❌ Static cards with no interactivity
❌ Multiple tabs (Learning, Teaching, Affiliate) - confusing
❌ No calendar integration
❌ No activity timeline
❌ Separate courses page - redundant navigation
```

### New Dashboard (Solutions)
```
✅ Real-time activity stream (today → future → past)
✅ Quick action menu (+ icon) for creating tasks
✅ Smart notifications (done, missed, upcoming)
✅ Grid/List view modes
✅ Infinite scroll timeline
✅ Google Calendar integration
✅ Contextual course cards in activity stream
```

---

## 3. Core Features

### 3.1 Top Action Bar

#### A. Today Selector
```typescript
interface TodaySelector {
  defaultView: 'today' | 'week' | 'month';
  quickJump: {
    today: Date;
    tomorrow: Date;
    nextWeek: Date;
    custom: DatePicker;
  };
  resetToToday: () => void;
}
```

**Features**:
- Click to show date picker
- Keyboard shortcut: `T` (jump to today)
- Shows current date prominently
- Quick jump to common dates

---

#### B. Quick Create Menu (+ Icon)

```typescript
interface QuickCreateMenu {
  studyPlan: {
    title: string;
    courses: Course[];
    duration: number; // weeks
    targetDate: Date;
    weeklyGoal: number; // hours
  };
  schedule: {
    type: 'class' | 'study' | 'exam' | 'meeting';
    title: string;
    date: Date;
    duration: number; // minutes
    googleCalendarSync: boolean;
    reminder: number; // minutes before
  };
  todo: {
    title: string;
    description?: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    linkedCourse?: string; // courseId
    estimatedTime?: number; // minutes
  };
  goal: {
    title: string;
    type: 'course_completion' | 'skill_mastery' | 'time_milestone' | 'custom';
    targetDate: Date;
    milestones: Milestone[];
  };
  note: {
    title: string;
    content: string;
    tags: string[];
    linkedActivity?: string; // activityId
  };
}
```

**Menu Items**:
1. **📚 Create Study Plan**
   - AI-suggested study plans based on enrolled courses
   - Weekly time commitment slider
   - Auto-distribute study sessions

2. **📅 Add to Schedule**
   - Google Calendar integration
   - Recurring events support
   - Smart conflict detection

3. **✅ Add Todo**
   - Quick add with natural language ("Study React tomorrow 2pm")
   - Priority levels with color coding
   - Link to courses/chapters

4. **🎯 Set Goal**
   - SMART goal framework
   - Progress tracking
   - Milestone celebrations

5. **📝 Quick Note**
   - Markdown support
   - Attach to any activity
   - Voice-to-text option

6. **🔔 Set Reminder**
   - One-time or recurring
   - Multi-channel (email, push, in-app)

---

#### C. Notifications Panel

```typescript
interface NotificationPanel {
  categories: {
    done: Activity[]; // Completed today
    missed: Activity[]; // Overdue items
    upcoming: Activity[]; // Due within 24h
    achievements: Achievement[]; // New badges, milestones
  };
  filters: {
    timeRange: '24h' | '7d' | '30d' | 'all';
    type: ActivityType[];
    read: boolean;
  };
  actions: {
    markAllRead: () => void;
    clearAll: () => void;
    snooze: (id: string, duration: number) => void;
  };
}
```

**Notification Types**:
```typescript
type NotificationItem = {
  id: string;
  type: 'done' | 'missed' | 'upcoming' | 'achievement' | 'reminder';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata: {
    courseId?: string;
    courseName?: string;
    points?: number;
    icon: string;
    color: string;
  };
};
```

**Sections**:

1. **✅ Done Today** (Green zone)
   - Completed assignments
   - Finished lessons
   - Checked-off todos
   - Study sessions completed

2. **❌ Missed** (Red zone)
   - Overdue assignments
   - Missed classes
   - Expired deadlines
   - Broken study streaks

3. **🔔 Upcoming** (Yellow zone)
   - Due within 24 hours
   - Tomorrow's schedule
   - Approaching deadlines

4. **🏆 Achievements** (Purple zone)
   - New badges earned
   - Streaks milestones
   - Course completions
   - Skill masteries

**Smart Features**:
- Badge count on bell icon
- Color-coded urgency
- Swipe to dismiss
- Undo actions
- Priority sorting

---

#### D. View Mode Toggle

```typescript
type ViewMode = 'grid' | 'list';

interface ViewModeConfig {
  grid: {
    columns: 1 | 2 | 3 | 4; // Responsive
    cardSize: 'compact' | 'comfortable' | 'spacious';
    showPreview: boolean;
  };
  list: {
    density: 'compact' | 'comfortable';
    showDescription: boolean;
    groupBy: 'date' | 'course' | 'type' | 'priority';
  };
}
```

**Grid View**:
- Pinterest-style masonry layout
- Course cards with progress bars
- Visual thumbnails
- Hover for quick actions

**List View** (Default):
- Dense information display
- Grouped by date (Today, Tomorrow, This Week, Later)
- Checkbox for completion
- Inline editing

---

### 3.2 Activity Stream

#### Activity Card Structure

```typescript
interface ActivityCard {
  id: string;
  type: ActivityType;
  course: {
    id: string;
    code: string; // e.g., "APST 467.667.1001"
    name: string;
    color: string; // Course theme color
  };
  activity: {
    type: 'assignment' | 'quiz' | 'exam' | 'reading' | 'video' | 'discussion';
    title: string;
    description?: string;
    points: number;
    dueDate: Date;
    status: 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'overdue';
  };
  actions: {
    primary: { label: string; onClick: () => void };
    secondary?: { label: string; onClick: () => void };
  };
  metadata: {
    timeRemaining: string; // "2 hours", "3 days"
    urgency: 'low' | 'medium' | 'high' | 'critical';
    completionEstimate?: number; // minutes
  };
}
```

**Card Components**:
```tsx
<ActivityCard>
  {/* Left: Course Color Strip + Checkbox */}
  <CourseIdentifier color={course.color} code={course.code} />
  <CompletionCheckbox checked={status === 'submitted'} />

  {/* Center: Activity Details */}
  <ActivityDetails>
    <CourseCode>{course.code} {course.name}</CourseCode>
    <ActivityTitle>{activity.title}</ActivityTitle>
    <ActivityType>{activity.type}</ActivityType>
  </ActivityDetails>

  {/* Right: Points + Due Date */}
  <ActivityMeta>
    <Points>{activity.points} PTS</Points>
    <DueDate urgent={metadata.urgency}>
      DUE: {formatDueDate(activity.dueDate)}
    </DueDate>
  </ActivityMeta>
</ActivityCard>
```

---

#### Date Grouping

```typescript
interface DateGroup {
  label: string; // "Today", "Tomorrow", "Nov 11-13"
  date: Date;
  activities: ActivityCard[];
  emptyState?: {
    illustration: string;
    message: string;
  };
}

const groupActivities = (activities: Activity[]): DateGroup[] => {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  
  return [
    {
      label: 'Today',
      date: today,
      activities: activities.filter(a => isSameDay(a.dueDate, today)),
    },
    {
      label: 'Tomorrow, November 10',
      date: tomorrow,
      activities: activities.filter(a => isSameDay(a.dueDate, tomorrow)),
    },
    {
      label: 'November 11 to November 13',
      date: addDays(today, 2),
      activities: activities.filter(a => 
        isWithinInterval(a.dueDate, {
          start: addDays(today, 2),
          end: addDays(today, 4)
        })
      ),
      emptyState: {
        illustration: '/empty-states/nothing-planned.svg',
        message: 'Nothing Planned Yet'
      }
    }
  ];
};
```

---

#### Infinite Scroll

```typescript
interface InfiniteScrollConfig {
  initialLoad: 30; // activities
  loadMoreThreshold: 5; // activities from bottom
  batchSize: 20;
  maxCache: 100; // Keep in memory
  prefetch: {
    pastDays: 7;
    futureDays: 14;
  };
}

const useInfiniteActivityStream = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 7),
    end: addDays(new Date(), 14)
  });

  const loadMore = useCallback(async (direction: 'past' | 'future') => {
    if (direction === 'past') {
      const newStart = subDays(dateRange.start, 7);
      const pastActivities = await fetchActivities(newStart, dateRange.start);
      setActivities(prev => [...pastActivities, ...prev]);
      setDateRange(prev => ({ ...prev, start: newStart }));
    } else {
      const newEnd = addDays(dateRange.end, 7);
      const futureActivities = await fetchActivities(dateRange.end, newEnd);
      setActivities(prev => [...prev, ...futureActivities]);
      setDateRange(prev => ({ ...prev, end: newEnd }));
    }
  }, [dateRange]);

  return { activities, loadMore, dateRange };
};
```

---

### 3.3 Empty States

```typescript
const EmptyStates = {
  noActivitiesPlanned: {
    illustration: '/illustrations/camping.svg', // Trees, hammock, mountains
    title: 'Nothing Planned Yet',
    description: 'Time to relax or plan your next learning adventure',
    actions: [
      { label: 'Browse Courses', href: '/courses' },
      { label: 'Create Study Plan', onClick: () => openQuickCreate('studyPlan') }
    ]
  },
  allCaughtUp: {
    illustration: '/illustrations/celebration.svg',
    title: 'You\'re All Caught Up! 🎉',
    description: 'No pending tasks. Great work!',
    actions: [
      { label: 'Start New Course', href: '/courses' },
      { label: 'Review Past Work', onClick: () => navigateToPast() }
    ]
  },
  noUpcomingDeadlines: {
    illustration: '/illustrations/peaceful.svg',
    title: 'Clear Horizon Ahead',
    description: 'No upcoming deadlines in the next 7 days',
    actions: [
      { label: 'Set Learning Goals', onClick: () => openQuickCreate('goal') }
    ]
  }
};
```

---

## 4. UI/UX Design Specifications

### 4.1 Layout Grid

```css
.dashboard-layout {
  display: grid;
  grid-template-rows: 64px 1fr; /* Header + Content */
  height: 100vh;
}

.dashboard-header {
  display: grid;
  grid-template-columns: 1fr auto;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-stream {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.date-group {
  margin-bottom: 48px;
}

.date-header {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

---

### 4.2 Activity Card Design

```css
.activity-card {
  display: grid;
  grid-template-columns: 4px 40px 1fr auto;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.activity-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--border-hover);
}

.course-color-strip {
  width: 4px;
  background: var(--course-color);
  border-radius: 2px;
}

.activity-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-medium);
  border-radius: 4px;
  cursor: pointer;
}

.activity-checkbox:checked {
  background: var(--success-color);
  border-color: var(--success-color);
}

.activity-details {
  flex: 1;
}

.course-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.activity-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.activity-type {
  font-size: 14px;
  color: var(--text-tertiary);
}

.activity-meta {
  text-align: right;
}

.points-badge {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.due-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.due-date.urgent {
  color: var(--error-color);
  font-weight: 600;
}
```

---

### 4.3 Color System

```typescript
const colorSystem = {
  // Course Colors (for left strip)
  courses: [
    '#D97706', // Amber (APST)
    '#0284C7', // Sky Blue (STAT)
    '#059669', // Emerald (CS)
    '#DC2626', // Red (MATH)
    '#7C3AED', // Violet (PHYS)
  ],

  // Status Colors
  status: {
    notStarted: '#94A3B8',     // Slate
    inProgress: '#3B82F6',     // Blue
    submitted: '#10B981',      // Green
    graded: '#8B5CF6',         // Purple
    overdue: '#EF4444',        // Red
  },

  // Urgency Colors
  urgency: {
    low: '#10B981',            // Green
    medium: '#F59E0B',         // Amber
    high: '#F97316',           // Orange
    critical: '#DC2626',       // Red
  },

  // UI Colors
  ui: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    borderHover: '#CBD5E1',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
  }
};
```

---

### 4.4 Responsive Breakpoints

```typescript
const breakpoints = {
  mobile: '640px',      // Single column, stacked actions
  tablet: '768px',      // 2 columns grid view
  desktop: '1024px',    // 3 columns grid view
  wide: '1280px',       // 4 columns grid view, max-width content
};

const responsiveRules = `
  @media (max-width: 640px) {
    .activity-card {
      grid-template-columns: 4px 1fr;
      gap: 12px;
    }
    
    .activity-checkbox {
      display: none;
    }
    
    .activity-meta {
      grid-column: 2;
      text-align: left;
      margin-top: 8px;
    }
  }
`;
```

---

## 5. Database Schema

### 5.1 New Models

```prisma
// ==========================================
// Activity Stream Models
// ==========================================

model Activity {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type            ActivityType
  title           String
  description     String?
  
  courseId        String?
  course          Course?      @relation(fields: [courseId], references: [id], onDelete: SetNull)
  
  dueDate         DateTime?
  completedAt     DateTime?
  status          ActivityStatus @default(NOT_STARTED)
  
  points          Int          @default(0)
  priority        Priority     @default(MEDIUM)
  
  // Google Calendar Integration
  googleEventId   String?      @unique
  calendarSynced  Boolean      @default(false)
  lastSyncedAt    DateTime?
  
  // Metadata
  estimatedMinutes Int?
  actualMinutes   Int?
  tags            String[]
  
  // Relations
  reminders       Reminder[]
  notes           Note[]
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([userId, dueDate])
  @@index([userId, status])
  @@index([courseId])
}

enum ActivityType {
  ASSIGNMENT
  QUIZ
  EXAM
  READING
  VIDEO
  DISCUSSION
  STUDY_SESSION
  PROJECT
  PRESENTATION
  CUSTOM
}

enum ActivityStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  GRADED
  OVERDUE
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

// ==========================================
// Study Plan
// ==========================================

model StudyPlan {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title           String
  description     String?
  
  startDate       DateTime
  endDate         DateTime
  weeklyHoursGoal Int          @default(10)
  
  status          PlanStatus   @default(ACTIVE)
  
  // AI Generated
  aiGenerated     Boolean      @default(false)
  aiPrompt        String?
  
  courses         Course[]
  sessions        StudySession[]
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([userId, status])
}

enum PlanStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

model StudySession {
  id              String       @id @default(cuid())
  
  studyPlanId     String?
  studyPlan       StudyPlan?   @relation(fields: [studyPlanId], references: [id], onDelete: SetNull)
  
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  courseId        String?
  course          Course?      @relation(fields: [courseId], references: [id], onDelete: SetNull)
  
  title           String
  startTime       DateTime
  endTime         DateTime
  
  actualStartTime DateTime?
  actualEndTime   DateTime?
  
  status          SessionStatus @default(PLANNED)
  
  // Google Calendar
  googleEventId   String?      @unique
  calendarSynced  Boolean      @default(false)
  
  notes           String?
  productivity    Int?         @default(0) // 0-100 rating
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([userId, startTime])
  @@index([courseId])
}

enum SessionStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  MISSED
}

// ==========================================
// Todos
// ==========================================

model Todo {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title           String
  description     String?
  
  completed       Boolean      @default(false)
  completedAt     DateTime?
  
  dueDate         DateTime?
  priority        Priority     @default(MEDIUM)
  
  courseId        String?
  course          Course?      @relation(fields: [courseId], references: [id], onDelete: SetNull)
  
  activityId      String?      @unique
  activity        Activity?    @relation(fields: [activityId], references: [id], onDelete: SetNull)
  
  estimatedMinutes Int?
  tags            String[]
  
  position        Int          @default(0) // For ordering
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([userId, completed])
  @@index([userId, dueDate])
}

// ==========================================
// Goals
// ==========================================

model Goal {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title           String
  description     String?
  
  type            GoalType
  targetDate      DateTime
  
  status          GoalStatus   @default(ACTIVE)
  progress        Int          @default(0) // 0-100
  
  courseId        String?
  course          Course?      @relation(fields: [courseId], references: [id], onDelete: SetNull)
  
  milestones      Milestone[]
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([userId, status])
}

enum GoalType {
  COURSE_COMPLETION
  SKILL_MASTERY
  TIME_MILESTONE
  GRADE_TARGET
  CERTIFICATION
  CUSTOM
}

enum GoalStatus {
  ACTIVE
  ACHIEVED
  ABANDONED
  OVERDUE
}

model Milestone {
  id              String       @id @default(cuid())
  
  goalId          String
  goal            Goal         @relation(fields: [goalId], references: [id], onDelete: Cascade)
  
  title           String
  targetDate      DateTime
  
  completed       Boolean      @default(false)
  completedAt     DateTime?
  
  position        Int          @default(0)
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([goalId, position])
}

// ==========================================
// Notifications
// ==========================================

model DashboardNotification {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type            NotificationType
  category        NotificationCategory
  
  title           String
  description     String?
  
  read            Boolean      @default(false)
  readAt          DateTime?
  
  actionable      Boolean      @default(false)
  actionUrl       String?
  actionLabel     String?
  
  metadata        Json?        // Extra data (courseId, points, etc.)
  
  expiresAt       DateTime?
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([userId, read])
  @@index([userId, category])
}

enum NotificationType {
  ACTIVITY_DUE
  ACTIVITY_GRADED
  ACTIVITY_COMPLETED
  DEADLINE_APPROACHING
  DEADLINE_MISSED
  ACHIEVEMENT_UNLOCKED
  STREAK_MILESTONE
  COURSE_UPDATE
  REMINDER
  SYSTEM
}

enum NotificationCategory {
  DONE
  MISSED
  UPCOMING
  ACHIEVEMENT
}

// ==========================================
// Reminders
// ==========================================

model Reminder {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  activityId      String?
  activity        Activity?    @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  title           String
  description     String?
  
  remindAt        DateTime
  reminded        Boolean      @default(false)
  remindedAt      DateTime?
  
  recurring       Boolean      @default(false)
  recurringPattern String?     // cron-like pattern
  
  channels        ReminderChannel[]
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([userId, remindAt])
  @@index([remindAt, reminded])
}

enum ReminderChannel {
  EMAIL
  PUSH
  IN_APP
  SMS
}

// ==========================================
// Notes
// ==========================================

model Note {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title           String
  content         String       @db.Text
  
  activityId      String?
  activity        Activity?    @relation(fields: [activityId], references: [id], onDelete: SetNull)
  
  courseId        String?
  course          Course?      @relation(fields: [courseId], references: [id], onDelete: SetNull)
  
  tags            String[]
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([userId])
  @@index([activityId])
}

// ==========================================
// Google Calendar Integration
// ==========================================

model GoogleCalendarConnection {
  id              String       @id @default(cuid())
  userId          String       @unique
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  accessToken     String       @db.Text
  refreshToken    String       @db.Text
  expiresAt       DateTime
  
  calendarId      String       // Primary calendar ID
  calendarName    String
  
  syncEnabled     Boolean      @default(true)
  lastSyncedAt    DateTime?
  
  syncSettings    Json?        // What to sync, how often, etc.
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

// ==========================================
// View Preferences
// ==========================================

model DashboardPreferences {
  id              String       @id @default(cuid())
  userId          String       @unique
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  viewMode        ViewMode     @default(LIST)
  gridColumns     Int          @default(3)
  listDensity     Density      @default(COMFORTABLE)
  
  groupBy         GroupBy      @default(DATE)
  sortBy          SortBy       @default(DUE_DATE)
  
  showCompleted   Boolean      @default(false)
  showCancelled   Boolean      @default(false)
  
  defaultDateRange Int         @default(14) // days ahead
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

enum ViewMode {
  GRID
  LIST
}

enum Density {
  COMPACT
  COMFORTABLE
  SPACIOUS
}

enum GroupBy {
  DATE
  COURSE
  TYPE
  PRIORITY
}

enum SortBy {
  DUE_DATE
  CREATED_DATE
  PRIORITY
  POINTS
}
```

### 5.2 Updated User Model

```prisma
model User {
  // ... existing fields ...
  
  // New Relations
  activities                Activity[]
  studyPlans                StudyPlan[]
  studySessions             StudySession[]
  todos                     Todo[]
  goals                     Goal[]
  dashboardNotifications    DashboardNotification[]
  reminders                 Reminder[]
  notes                     Note[]
  googleCalendar            GoogleCalendarConnection?
  dashboardPreferences      DashboardPreferences?
}
```

---

## 6. API Endpoints

### 6.1 Activity Stream

```typescript
// GET /api/dashboard/activities
interface GetActivitiesParams {
  startDate: string; // ISO date
  endDate: string;   // ISO date
  status?: ActivityStatus[];
  courseId?: string;
  limit?: number;
  offset?: number;
}

interface GetActivitiesResponse {
  activities: ActivityCard[];
  pagination: {
    total: number;
    hasMore: boolean;
    nextOffset: number;
  };
  metadata: {
    completedCount: number;
    overdueCount: number;
    upcomingCount: number;
  };
}

// POST /api/dashboard/activities
interface CreateActivityBody {
  type: ActivityType;
  title: string;
  description?: string;
  courseId?: string;
  dueDate?: string;
  points?: number;
  priority?: Priority;
  estimatedMinutes?: number;
  googleCalendarSync?: boolean;
}

// PATCH /api/dashboard/activities/:id
interface UpdateActivityBody {
  title?: string;
  description?: string;
  status?: ActivityStatus;
  completedAt?: string;
  actualMinutes?: number;
}

// DELETE /api/dashboard/activities/:id
```

---

### 6.2 Study Plans

```typescript
// GET /api/dashboard/study-plans
interface GetStudyPlansResponse {
  plans: StudyPlan[];
  activeCount: number;
}

// POST /api/dashboard/study-plans
interface CreateStudyPlanBody {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  weeklyHoursGoal: number;
  courseIds: string[];
  aiGenerate?: boolean; // Use AI to create schedule
}

// POST /api/dashboard/study-plans/:id/generate-sessions
interface GenerateSessionsResponse {
  sessions: StudySession[];
  googleCalendarEvents?: GoogleCalendarEvent[];
}
```

---

### 6.3 Todos

```typescript
// GET /api/dashboard/todos
interface GetTodosParams {
  completed?: boolean;
  courseId?: string;
  priority?: Priority[];
}

// POST /api/dashboard/todos
interface CreateTodoBody {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  courseId?: string;
  estimatedMinutes?: number;
  naturalLanguage?: string; // "Study React tomorrow at 2pm"
}

// PATCH /api/dashboard/todos/:id/toggle
```

---

### 6.4 Notifications

```typescript
// GET /api/dashboard/notifications
interface GetNotificationsParams {
  category?: NotificationCategory;
  timeRange?: '24h' | '7d' | '30d' | 'all';
  read?: boolean;
  limit?: number;
}

interface GetNotificationsResponse {
  notifications: DashboardNotification[];
  counts: {
    done: number;
    missed: number;
    upcoming: number;
    achievements: number;
    unread: number;
  };
}

// PATCH /api/dashboard/notifications/mark-all-read

// DELETE /api/dashboard/notifications/clear-all
```

---

### 6.5 Google Calendar Integration

```typescript
// POST /api/integrations/google-calendar/connect
interface ConnectGoogleCalendarBody {
  authCode: string; // OAuth code from Google
}

interface ConnectGoogleCalendarResponse {
  success: boolean;
  calendar: {
    id: string;
    name: string;
  };
}

// POST /api/integrations/google-calendar/sync
interface SyncCalendarResponse {
  synced: number;
  created: number;
  updated: number;
  deleted: number;
}

// POST /api/integrations/google-calendar/disconnect

// GET /api/integrations/google-calendar/events
interface GetCalendarEventsParams {
  startDate: string;
  endDate: string;
}
```

---

## 7. Component Architecture

### 7.1 Component Tree

```
DashboardPage
├── DashboardHeader
│   ├── TodaySelector
│   ├── QuickCreateMenu
│   │   ├── StudyPlanDialog
│   │   ├── ScheduleDialog (Google Calendar)
│   │   ├── TodoDialog
│   │   ├── GoalDialog
│   │   └── NoteDialog
│   ├── NotificationsPanel
│   │   ├── NotificationList
│   │   └── NotificationFilters
│   └── ViewModeToggle
├── ActivityStream
│   ├── DateGroup
│   │   ├── DateHeader
│   │   ├── ActivityList
│   │   │   └── ActivityCard
│   │   │       ├── CourseIdentifier
│   │   │       ├── CompletionCheckbox
│   │   │       ├── ActivityDetails
│   │   │       └── ActivityMeta
│   │   └── EmptyState
│   └── InfiniteScrollTrigger
└── DashboardSidebar (optional)
    ├── UpcomingWidget
    ├── StreakWidget
    └── QuickStatsWidget
```

---

### 7.2 Key Components Code

#### DashboardHeader.tsx

```typescript
"use client";

import { useState } from "react";
import { Calendar, Plus, Bell, Grid3x3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TodaySelector } from "./TodaySelector";
import { QuickCreateMenu } from "./QuickCreateMenu";
import { NotificationsPanel } from "./NotificationsPanel";
import { ViewMode } from "@prisma/client";

interface DashboardHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  notificationCount: number;
}

export function DashboardHeader({
  viewMode,
  onViewModeChange,
  selectedDate,
  onDateChange,
  notificationCount,
}: DashboardHeaderProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Left: Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Today Selector */}
          <TodaySelector
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />

          {/* Quick Create Menu */}
          <DropdownMenu open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <QuickCreateMenu onClose={() => setQuickCreateOpen(false)} />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <NotificationsPanel />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border">
            <Button
              variant={viewMode === "GRID" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("GRID")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "LIST" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("LIST")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* User Menu (existing) */}
        </div>
      </div>
    </header>
  );
}
```

#### ActivityCard.tsx

```typescript
"use client";

import { useState } from "react";
import { Check, Clock, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface ActivityCardProps {
  activity: {
    id: string;
    type: string;
    title: string;
    course: {
      code: string;
      name: string;
      color: string;
    };
    points: number;
    dueDate: Date;
    status: string;
    urgency: "low" | "medium" | "high" | "critical";
  };
  onStatusChange: (id: string, status: string) => Promise<void>;
}

export function ActivityCard({ activity, onStatusChange }: ActivityCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCompleted = activity.status === "SUBMITTED" || activity.status === "GRADED";

  const handleToggleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onStatusChange(
        activity.id,
        isCompleted ? "NOT_STARTED" : "SUBMITTED"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const urgencyColors = {
    low: "border-l-green-500",
    medium: "border-l-amber-500",
    high: "border-l-orange-500",
    critical: "border-l-red-500",
  };

  const timeRemaining = formatDistanceToNow(activity.dueDate, {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "group relative grid grid-cols-[4px_40px_1fr_auto] gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-all hover:shadow-md",
        "border-l-4",
        urgencyColors[activity.urgency],
        isCompleted && "opacity-60"
      )}
    >
      {/* Course Color Strip (handled by border-l-4) */}

      {/* Checkbox */}
      <div className="flex items-start pt-1">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggleComplete}
          disabled={isSubmitting}
          className="h-5 w-5"
        />
      </div>

      {/* Activity Details */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {activity.course.code} {activity.course.name}
        </div>
        <div className="text-base font-medium text-slate-900">
          {activity.title}
        </div>
        <div className="text-sm text-slate-600">{activity.type}</div>
      </div>

      {/* Meta */}
      <div className="flex flex-col items-end gap-1 text-right">
        <div className="text-sm font-semibold text-slate-900">
          {activity.points} PTS
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-xs",
            activity.urgency === "critical" && "font-semibold text-red-600",
            activity.urgency === "high" && "text-orange-600",
            activity.urgency === "medium" && "text-amber-600",
            activity.urgency === "low" && "text-slate-500"
          )}
        >
          <Clock className="h-3 w-3" />
          {timeRemaining}
        </div>
      </div>

      {/* Actions (hover) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
            <MoreVertical className="h-4 w-4 text-slate-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Add to Calendar</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

#### InfiniteActivityStream.tsx

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { ActivityCard } from "./ActivityCard";
import { EmptyState } from "./EmptyState";
import { Loader2 } from "lucide-react";

interface InfiniteActivityStreamProps {
  initialActivities: Activity[];
  dateRange: { start: Date; end: Date };
}

export function InfiniteActivityStream({
  initialActivities,
  dateRange,
}: InfiniteActivityStreamProps) {
  const [activities, setActivities] = useState(initialActivities);
  const [isLoadingPast, setIsLoadingPast] = useState(false);
  const [isLoadingFuture, setIsLoadingFuture] = useState(false);
  const [currentRange, setCurrentRange] = useState(dateRange);

  const { ref: topRef, inView: topInView } = useInView({ threshold: 0 });
  const { ref: bottomRef, inView: bottomInView } = useInView({ threshold: 0 });

  // Load past activities
  useEffect(() => {
    if (topInView && !isLoadingPast) {
      loadPastActivities();
    }
  }, [topInView]);

  // Load future activities
  useEffect(() => {
    if (bottomInView && !isLoadingFuture) {
      loadFutureActivities();
    }
  }, [bottomInView]);

  const loadPastActivities = async () => {
    setIsLoadingPast(true);
    const newStart = subDays(currentRange.start, 7);
    
    const response = await fetch(
      `/api/dashboard/activities?startDate=${newStart.toISOString()}&endDate=${currentRange.start.toISOString()}`
    );
    const data = await response.json();

    setActivities((prev) => [...data.activities, ...prev]);
    setCurrentRange((prev) => ({ ...prev, start: newStart }));
    setIsLoadingPast(false);
  };

  const loadFutureActivities = async () => {
    setIsLoadingFuture(true);
    const newEnd = addDays(currentRange.end, 7);
    
    const response = await fetch(
      `/api/dashboard/activities?startDate=${currentRange.end.toISOString()}&endDate=${newEnd.toISOString()}`
    );
    const data = await response.json();

    setActivities((prev) => [...prev, ...data.activities]);
    setCurrentRange((prev) => ({ ...prev, end: newEnd }));
    setIsLoadingFuture(false);
  };

  // Group activities by date
  const groupedActivities = groupByDate(activities);

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      {/* Top loader */}
      <div ref={topRef} className="flex justify-center py-4">
        {isLoadingPast && <Loader2 className="h-6 w-6 animate-spin" />}
      </div>

      {/* Activity groups */}
      {groupedActivities.map((group) => (
        <div key={group.label} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{group.label}</h2>
          
          {group.activities.length > 0 ? (
            <div className="space-y-3">
              {group.activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <EmptyState
              illustration={group.emptyState?.illustration}
              message={group.emptyState?.message}
            />
          )}
        </div>
      ))}

      {/* Bottom loader */}
      <div ref={bottomRef} className="flex justify-center py-4">
        {isLoadingFuture && <Loader2 className="h-6 w-6 animate-spin" />}
      </div>
    </div>
  );
}
```

---

## 8. Google Calendar Integration

### 8.1 OAuth Setup

```typescript
// lib/google-calendar/config.ts
export const GOOGLE_CALENDAR_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`,
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
};

// Generate OAuth URL
export function getGoogleAuthUrl(userId: string): string {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CALENDAR_CONFIG.clientId,
    GOOGLE_CALENDAR_CONFIG.clientSecret,
    GOOGLE_CALENDAR_CONFIG.redirectUri
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_CALENDAR_CONFIG.scopes,
    state: userId, // Pass userId for callback
  });

  return url;
}
```

### 8.2 Calendar Service

```typescript
// lib/google-calendar/calendar-service.ts
import { google } from 'googleapis';
import { db } from '@/lib/db';

export class GoogleCalendarService {
  private oauth2Client: any;

  constructor(private userId: string) {}

  async initialize() {
    const connection = await db.googleCalendarConnection.findUnique({
      where: { userId: this.userId },
    });

    if (!connection) {
      throw new Error('Google Calendar not connected');
    }

    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CALENDAR_CONFIG.clientId,
      GOOGLE_CALENDAR_CONFIG.clientSecret,
      GOOGLE_CALENDAR_CONFIG.redirectUri
    );

    this.oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
    });

    // Check if token expired
    if (new Date() > connection.expiresAt) {
      await this.refreshAccessToken();
    }
  }

  async createEvent(activity: Activity): Promise<string> {
    await this.initialize();

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const event = {
      summary: activity.title,
      description: activity.description,
      start: {
        dateTime: activity.dueDate.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: addHours(activity.dueDate, 1).toISOString(),
        timeZone: 'America/New_York',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data.id!;
  }

  async updateEvent(googleEventId: string, activity: Activity): Promise<void> {
    await this.initialize();

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    await calendar.events.patch({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: {
        summary: activity.title,
        description: activity.description,
        start: {
          dateTime: activity.dueDate.toISOString(),
        },
        end: {
          dateTime: addHours(activity.dueDate, 1).toISOString(),
        },
      },
    });
  }

  async deleteEvent(googleEventId: string): Promise<void> {
    await this.initialize();

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });
  }

  async syncFromGoogle(): Promise<{ created: number; updated: number }> {
    await this.initialize();

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    let created = 0;
    let updated = 0;

    for (const event of events) {
      // Check if event already exists in our DB
      const existing = await db.activity.findFirst({
        where: { googleEventId: event.id },
      });

      if (existing) {
        // Update
        await db.activity.update({
          where: { id: existing.id },
          data: {
            title: event.summary || '',
            description: event.description,
            dueDate: new Date(event.start?.dateTime || event.start?.date || ''),
          },
        });
        updated++;
      } else {
        // Create
        await db.activity.create({
          data: {
            userId: this.userId,
            type: 'CUSTOM',
            title: event.summary || '',
            description: event.description,
            dueDate: new Date(event.start?.dateTime || event.start?.date || ''),
            googleEventId: event.id,
            calendarSynced: true,
            status: 'NOT_STARTED',
          },
        });
        created++;
      }
    }

    return { created, updated };
  }

  private async refreshAccessToken(): Promise<void> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    await db.googleCalendarConnection.update({
      where: { userId: this.userId },
      data: {
        accessToken: credentials.access_token!,
        expiresAt: new Date(credentials.expiry_date!),
      },
    });

    this.oauth2Client.setCredentials(credentials);
  }
}
```

### 8.3 Webhook for Real-time Sync

```typescript
// app/api/integrations/google-calendar/webhook/route.ts
import { db } from '@/lib/db';
import { GoogleCalendarService } from '@/lib/google-calendar/calendar-service';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Google sends webhook when calendar changes
  const { resourceId, channelId } = body;

  // Find user by channel ID
  const connection = await db.googleCalendarConnection.findFirst({
    where: { /* match channelId */ },
  });

  if (!connection) {
    return new Response('Not found', { status: 404 });
  }

  // Trigger sync
  const service = new GoogleCalendarService(connection.userId);
  await service.syncFromGoogle();

  return new Response('OK');
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Basic dashboard structure with mock data

- [ ] Set up new database schema
- [ ] Create migration files
- [ ] Build DashboardHeader component
- [ ] Build ActivityCard component
- [ ] Implement basic activity stream
- [ ] Add date grouping logic
- [ ] Test with mock data

**Deliverables**:
- Dashboard shows hardcoded activities
- Header has all UI elements (non-functional)
- Activities grouped by date
- Basic styling matches Canvas LMS

---

### Phase 2: Quick Actions (Week 3)
**Goal**: Quick create menu functionality

- [ ] Build QuickCreateMenu component
- [ ] Create StudyPlanDialog
- [ ] Create ScheduleDialog
- [ ] Create TodoDialog
- [ ] Create GoalDialog
- [ ] Implement form validation (Zod)
- [ ] Connect to API endpoints
- [ ] Add optimistic updates

**Deliverables**:
- Users can create activities from + menu
- Forms have proper validation
- Activities appear in stream immediately

---

### Phase 3: Real Data Integration (Week 4)
**Goal**: Replace all mock data with real database queries

- [ ] Create API endpoint: GET /api/dashboard/activities
- [ ] Create API endpoint: POST /api/dashboard/activities
- [ ] Create API endpoint: PATCH /api/dashboard/activities/:id
- [ ] Implement infinite scroll logic
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test with real user data

**Deliverables**:
- Dashboard shows real user activities
- Infinite scroll works smoothly
- Loading states provide feedback
- Errors handled gracefully

---

### Phase 4: Notifications (Week 5)
**Goal**: Smart notification system

- [ ] Build NotificationsPanel component
- [ ] Create notification generation system
- [ ] Implement notification categories (done, missed, upcoming, achievements)
- [ ] Add real-time updates (polling or WebSocket)
- [ ] Create notification preferences
- [ ] Add mark as read/unread
- [ ] Test notification timing

**Deliverables**:
- Users see relevant notifications
- Badge count updates in real-time
- Notifications categorized correctly
- Action buttons work

---

### Phase 5: Google Calendar (Week 6-7)
**Goal**: Full Google Calendar integration

- [ ] Set up Google OAuth
- [ ] Create connection flow
- [ ] Implement calendar service
- [ ] Build sync logic (both directions)
- [ ] Add conflict detection
- [ ] Implement webhook for real-time updates
- [ ] Create settings page for calendar preferences
- [ ] Test with various calendar scenarios

**Deliverables**:
- Users can connect Google Calendar
- Activities sync to Google Calendar
- Google Calendar events appear in dashboard
- Bi-directional sync works
- Conflicts handled properly

---

### Phase 6: View Modes (Week 8)
**Goal**: Grid and List views

- [ ] Build Grid view component
- [ ] Build List view component
- [ ] Implement view mode toggle
- [ ] Add view preferences to user settings
- [ ] Optimize for performance (virtualization)
- [ ] Test responsiveness

**Deliverables**:
- Users can switch between Grid and List
- Preference saved
- Both views performant
- Mobile-friendly

---

### Phase 7: Polish & Optimization (Week 9-10)
**Goal**: Production-ready quality

- [ ] Add empty states
- [ ] Implement skeleton loaders
- [ ] Add animations (Framer Motion)
- [ ] Optimize bundle size
- [ ] Add analytics tracking
- [ ] Conduct user testing
- [ ] Fix bugs
- [ ] Write documentation

**Deliverables**:
- Smooth animations
- Fast load times
- No bugs
- User-tested

---

## 10. Technical Stack

### Frontend
```json
{
  "framework": "Next.js 15",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "components": "Radix UI",
  "animations": "Framer Motion",
  "date": "date-fns",
  "forms": "React Hook Form + Zod",
  "state": "Zustand (for global dashboard state)",
  "icons": "Lucide React"
}
```

### Backend
```json
{
  "runtime": "Node.js",
  "framework": "Next.js API Routes",
  "database": "PostgreSQL",
  "ORM": "Prisma",
  "auth": "NextAuth.js v5",
  "calendar": "Google Calendar API (googleapis)",
  "validation": "Zod",
  "jobs": "node-cron (for notifications)"
}
```

### Infrastructure
```json
{
  "hosting": "Railway / Vercel",
  "database": "Railway PostgreSQL",
  "file storage": "Cloudinary / S3",
  "monitoring": "Sentry",
  "analytics": "Posthog"
}
```

---

## 11. Security & Performance

### Security Checklist
- [ ] Validate all user inputs (Zod)
- [ ] Sanitize data before display (XSS prevention)
- [ ] Implement rate limiting on API routes
- [ ] Encrypt Google Calendar tokens at rest
- [ ] Use HTTPS only
- [ ] Implement CSRF protection
- [ ] Audit log for sensitive actions
- [ ] Regular dependency updates

### Performance Targets
- [ ] Dashboard load: < 1.5s
- [ ] Activity card render: < 50ms each
- [ ] Infinite scroll: < 100ms response
- [ ] Google Calendar sync: < 5s
- [ ] Bundle size: < 200kb initial JS
- [ ] Lighthouse score: > 90

### Optimization Strategies
```typescript
// 1. Virtualization for long lists
import { useVirtualizer } from '@tanstack/react-virtual';

// 2. Lazy loading for dialogs
const StudyPlanDialog = dynamic(() => import('./StudyPlanDialog'));

// 3. Optimistic updates
const { mutate } = useMutation({
  onMutate: async (newActivity) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['activities'] });
    
    // Snapshot previous value
    const previousActivities = queryClient.getQueryData(['activities']);
    
    // Optimistically update
    queryClient.setQueryData(['activities'], (old) => [...old, newActivity]);
    
    return { previousActivities };
  },
  onError: (err, newActivity, context) => {
    // Rollback on error
    queryClient.setQueryData(['activities'], context.previousActivities);
  },
});

// 4. Debounce search/filters
import { useDebouncedValue } from '@/hooks/use-debounced-value';

// 5. Prefetch next page
const prefetchNextPage = () => {
  queryClient.prefetchQuery({
    queryKey: ['activities', nextPage],
    queryFn: () => fetchActivities(nextPage),
  });
};
```

---

## 12. Testing Strategy

### Unit Tests
```typescript
// __tests__/components/ActivityCard.test.tsx
describe('ActivityCard', () => {
  it('renders activity details correctly', () => {
    render(<ActivityCard activity={mockActivity} />);
    expect(screen.getByText('Graduate Assignment 3')).toBeInTheDocument();
  });

  it('toggles completion status', async () => {
    const onStatusChange = jest.fn();
    render(<ActivityCard activity={mockActivity} onStatusChange={onStatusChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);
    
    expect(onStatusChange).toHaveBeenCalledWith(mockActivity.id, 'SUBMITTED');
  });

  it('shows correct urgency color', () => {
    const urgentActivity = { ...mockActivity, urgency: 'critical' };
    const { container } = render(<ActivityCard activity={urgentActivity} />);
    
    expect(container.firstChild).toHaveClass('border-l-red-500');
  });
});
```

### Integration Tests
```typescript
// __tests__/api/dashboard/activities.test.ts
describe('GET /api/dashboard/activities', () => {
  it('returns activities within date range', async () => {
    const response = await fetch('/api/dashboard/activities?startDate=2025-11-01&endDate=2025-11-30');
    const data = await response.json();
    
    expect(data.activities).toHaveLength(expect.any(Number));
    expect(data.activities[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      dueDate: expect.any(String),
    });
  });

  it('requires authentication', async () => {
    // Without auth
    const response = await fetch('/api/dashboard/activities');
    expect(response.status).toBe(401);
  });
});
```

### E2E Tests
```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('shows activity stream', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Dashboard');
    await expect(page.locator('[data-testid="activity-card"]').first()).toBeVisible();
  });

  test('can create todo from quick menu', async ({ page }) => {
    await page.click('[aria-label="Quick create"]');
    await page.click('text=Add Todo');
    await page.fill('[name="title"]', 'Test Todo');
    await page.click('button:has-text("Create")');
    
    await expect(page.locator('text=Test Todo')).toBeVisible();
  });

  test('infinite scroll loads more activities', async ({ page }) => {
    const initialCount = await page.locator('[data-testid="activity-card"]').count();
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    const newCount = await page.locator('[data-testid="activity-card"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });
});
```

---

## 13. Rollout Plan

### Alpha (Internal Testing)
- [ ] Deploy to staging environment
- [ ] Test with 5-10 internal users
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Duration: 1 week

### Beta (Limited Release)
- [ ] Enable for 10% of users
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] A/B test against old dashboard
- [ ] Duration: 2 weeks

### General Availability
- [ ] Gradual rollout (25% → 50% → 100%)
- [ ] Monitor error rates
- [ ] Provide migration guide
- [ ] Keep old dashboard accessible for 1 month
- [ ] Duration: 1 month

---

## 14. Success Metrics

### User Engagement
- Daily active users on dashboard: +40%
- Average time on dashboard: +25%
- Activity completion rate: +30%
- Return rate: +20%

### Performance
- Dashboard load time: < 1.5s (p95)
- API response time: < 200ms (p95)
- Zero critical bugs
- 99.9% uptime

### User Satisfaction
- NPS score: > 50
- User satisfaction: > 4.5/5
- Feature adoption: > 60% use quick create menu
- Google Calendar connection: > 40% of users

---

## Appendix A: File Structure

```
app/
├── dashboard/
│   ├── page.tsx (new)
│   ├── layout.tsx
│   └── _components/
│       ├── DashboardHeader.tsx
│       ├── TodaySelector.tsx
│       ├── QuickCreateMenu.tsx
│       │   ├── StudyPlanDialog.tsx
│       │   ├── ScheduleDialog.tsx
│       │   ├── TodoDialog.tsx
│       │   ├── GoalDialog.tsx
│       │   └── NoteDialog.tsx
│       ├── NotificationsPanel.tsx
│       │   ├── NotificationList.tsx
│       │   └── NotificationFilters.tsx
│       ├── ViewModeToggle.tsx
│       ├── ActivityStream.tsx
│       ├── DateGroup.tsx
│       ├── ActivityCard.tsx
│       ├── EmptyState.tsx
│       └── InfiniteScrollTrigger.tsx
├── api/
│   ├── dashboard/
│   │   ├── activities/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── study-plans/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── generate-sessions/route.ts
│   │   ├── todos/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── toggle/route.ts
│   │   ├── goals/route.ts
│   │   ├── notifications/
│   │   │   ├── route.ts
│   │   │   ├── mark-all-read/route.ts
│   │   │   └── clear-all/route.ts
│   │   └── preferences/route.ts
│   └── integrations/
│       └── google-calendar/
│           ├── connect/route.ts
│           ├── callback/route.ts
│           ├── sync/route.ts
│           ├── disconnect/route.ts
│           ├── events/route.ts
│           └── webhook/route.ts

lib/
├── google-calendar/
│   ├── config.ts
│   ├── calendar-service.ts
│   └── types.ts
├── dashboard/
│   ├── activity-utils.ts
│   ├── date-grouping.ts
│   └── notification-generator.ts
└── hooks/
    ├── use-infinite-activities.ts
    ├── use-dashboard-preferences.ts
    └── use-google-calendar.ts

prisma/
└── domains/
    └── 18-dashboard.prisma (new)
```

---

## Appendix B: Environment Variables

```bash
# .env.local

# Google Calendar Integration
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# App URL (for OAuth redirect)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Feature Flags
NEXT_PUBLIC_ENABLE_GOOGLE_CALENDAR=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Approve database schema** changes
3. **Set up Google OAuth** credentials
4. **Create project board** with all tasks
5. **Assign Phase 1** to developers
6. **Schedule design review** for UI mockups
7. **Set up staging environment**
8. **Begin implementation**

---

**End of Plan**
