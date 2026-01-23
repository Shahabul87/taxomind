# Dashboard Unification Plan

## Executive Summary

This plan consolidates the fragmented dashboard experience by:
1. **Merging `/dashboard/user/analytics` INTO `/dashboard/user`** as a tab
2. **Unifying duplicate components** across both pages
3. **Consolidating API endpoints** under a unified structure
4. **Creating a single source of truth** for goals, notifications, and analytics

---

## Phase 1: Tab Structure Unification

### Current State (FRAGMENTED)

**Main Dashboard (`/dashboard/user`)** - 9 tabs:
```
learning | skills | practice | gamification | gaps | innovation | discover | create | assess
```

**Analytics Page (`/dashboard/user/analytics`)** - 5 tabs:
```
learning | detailed | advanced | recommendations | ai-insights
```

**Sidebar Links:**
- Dashboard
- Analytics (separate page)
- Goals (separate page)

### Target State (UNIFIED)

**Single Dashboard (`/dashboard/user`)** - 10 tabs:
```
learning | analytics | skills | practice | gamification | goals | gaps | innovation | discover | create
```

### Tab Mapping

| Old Location | New Location | Notes |
|--------------|--------------|-------|
| `/dashboard/user` (learning tab) | `learning` tab | Keep as-is |
| `/dashboard/user/analytics` (all tabs) | `analytics` tab | Merge entire page as sub-tabs |
| `/dashboard/user` (skills tab) | `skills` tab | Keep as-is |
| `/dashboard/user` (practice tab) | `practice` tab | Keep as-is |
| `/dashboard/user` (gamification tab) | `gamification` tab | Keep as-is |
| `/dashboard/user/goals` page | `goals` tab | Move from separate page |
| `/dashboard/user` (gaps tab) | `gaps` tab | Keep as-is |
| `/dashboard/user` (innovation tab) | `innovation` tab | Keep as-is |
| `/dashboard/user` (discover tab) | `discover` tab | Keep as-is |
| `/dashboard/user` (create tab) | `create` tab | Keep as-is |
| `/dashboard/user` (assess tab) | Remove | Merge into `analytics` |

---

## Phase 2: Component Deduplication

### 2.1 Analytics Components (CONSOLIDATE)

| Duplicate Component | Used In | Action |
|---------------------|---------|--------|
| `LearningAnalyticsDashboard` | Both pages | **Keep in analytics tab only** |
| `StudyHeatmap` | Both pages | **Single instance in analytics** |
| `CourseProgressAnalytics` | Both pages | **Single instance in analytics** |
| `SAMInsights` | Both pages | **Single instance in analytics** |
| `GoalsProgress` | Both pages | **Move to goals tab** |
| `BehaviorPredictions` | Both pages | **Single instance in analytics** |

### 2.2 Knowledge & Quality Components (CONSOLIDATE)

| Component | Current Location | New Location |
|-----------|------------------|--------------|
| `KnowledgeGraphBrowser` | skills + analytics | `skills` tab only |
| `QualityScoreDashboard` | skills + analytics | `analytics` sub-tab |
| `ConfidenceCalibrationWidget` | gamification + analytics | `analytics` sub-tab |

### 2.3 Goals Components (UNIFY)

**Current State (4 entry points):**
1. Header `QuickCreateMenu` → Opens `SetGoalModal`
2. `LearningCommandCenter` → `GoalPlanner`
3. Analytics page → `GoalsProgress`
4. Sidebar → `/dashboard/user/goals` page

**Target State (1 entry point):**
- **`goals` tab** - Contains unified `GoalPlanner` + `GoalsProgress`
- Header `QuickCreateMenu` → Opens goal creation in `goals` tab
- Remove `/dashboard/user/goals` as separate page (redirect to tab)

### 2.4 Notifications (UNIFY)

**Current State (2 systems):**
1. `LearningNotificationBell` (header)
2. `NotificationsWidget` (NewDashboard)

**Target State (1 system):**
- **Keep `LearningNotificationBell`** in header
- **Remove `NotificationsWidget`** from dashboard content
- All notifications flow through single bell

### 2.5 Create/Quick Actions (CLARIFY)

**Current State (3 overlapping):**
1. Header `QuickCreateMenu` (+) - Study Plan, Course Plan, Blog Plan, Session, Todo, Goal
2. `SAMQuickActionsSafe` - AI learning actions (explain, practice, quiz)
3. `LearningPlanWizard` button - AI-powered weekly schedule

**Target State (2 distinct purposes):**
1. **Header `QuickCreateMenu`** - User-initiated creation (plans, todos, sessions)
2. **`SAMQuickActionsSafe`** - AI-assisted learning actions (stays in learning tab)
3. **Remove `LearningPlanWizard` button** - Merge into `QuickCreateMenu` as "AI Learning Plan"

---

## Phase 3: API Endpoint Consolidation

### 3.1 Current API Structure (FRAGMENTED)

```
/api/dashboard/
├── activities/
├── analytics/
│   ├── course-progress/
│   └── sam-insights/
├── blog-plans/
├── course-plans/
├── daily/
├── gantt/
├── goals/
├── heatmap/
├── learning-activities/
├── learning-notifications/
├── notes/
├── notifications/          # DUPLICATE with learning-notifications
├── preferences/
├── reminders/
├── sessions/
├── streak/
├── study-plans/
├── todos/
└── user/
    ├── activity/
    ├── analytics/
    └── performance/

/api/sam/
├── agentic/
│   ├── goals/              # DUPLICATE with /api/dashboard/goals
│   ├── behavior/
│   ├── journey/
│   ├── plans/
│   └── recommendations/
├── mentor/
├── gamification/
└── ... (many more)
```

### 3.2 Target API Structure (UNIFIED)

```
/api/v2/dashboard/
├── unified/
│   ├── overview/           # Single endpoint for dashboard overview
│   ├── stats/              # Quick stats (study hours, streak, etc.)
│   └── refresh/            # Refresh all dashboard data
│
├── analytics/
│   ├── overview/           # Combined analytics overview
│   ├── heatmap/
│   ├── course-progress/
│   ├── exam-analytics/
│   ├── behavior/
│   └── insights/           # SAM insights
│
├── goals/                  # SINGLE source for all goals
│   ├── route.ts            # GET all, POST create
│   ├── [id]/route.ts       # GET, PUT, DELETE single goal
│   ├── progress/           # Goal progress tracking
│   └── ai-decompose/       # AI goal decomposition
│
├── plans/
│   ├── study/
│   ├── course/
│   ├── blog/
│   └── ai-generate/        # AI-powered plan generation
│
├── schedule/
│   ├── daily/
│   ├── weekly/
│   ├── gantt/
│   └── sessions/
│
├── tasks/                  # Unified todos/tasks
│   ├── route.ts
│   └── [id]/
│
├── notifications/          # SINGLE notification system
│   ├── route.ts
│   ├── [id]/
│   ├── preferences/
│   └── mark-read/
│
└── activity/
    ├── learning/
    ├── streak/
    └── log/
```

### 3.3 API Migration Map

| Old Endpoint | New Endpoint | Breaking Change |
|--------------|--------------|-----------------|
| `/api/dashboard/goals` | `/api/v2/dashboard/goals` | Yes - new structure |
| `/api/sam/agentic/goals` | `/api/v2/dashboard/goals` | Yes - merge into unified |
| `/api/dashboard/notifications` | `/api/v2/dashboard/notifications` | Yes |
| `/api/dashboard/learning-notifications` | `/api/v2/dashboard/notifications` | Yes - merge |
| `/api/dashboard/todos` | `/api/v2/dashboard/tasks` | Yes - rename |
| `/api/dashboard/study-plans` | `/api/v2/dashboard/plans/study` | Yes |
| `/api/dashboard/course-plans` | `/api/v2/dashboard/plans/course` | Yes |
| `/api/dashboard/blog-plans` | `/api/v2/dashboard/plans/blog` | Yes |
| `/api/dashboard/heatmap` | `/api/v2/dashboard/analytics/heatmap` | Yes |
| `/api/dashboard/analytics/course-progress` | `/api/v2/dashboard/analytics/course-progress` | No |
| `/api/dashboard/analytics/sam-insights` | `/api/v2/dashboard/analytics/insights` | Yes |
| `/api/dashboard/daily` | `/api/v2/dashboard/schedule/daily` | Yes |
| `/api/dashboard/gantt` | `/api/v2/dashboard/schedule/gantt` | Yes |
| `/api/dashboard/sessions` | `/api/v2/dashboard/schedule/sessions` | Yes |
| `/api/dashboard/streak` | `/api/v2/dashboard/activity/streak` | Yes |

---

## Phase 4: State Management Unification

### 4.1 Create Unified Dashboard Context

```typescript
// lib/contexts/unified-dashboard-context.tsx

interface UnifiedDashboardState {
  // Active view
  activeTab: DashboardView;
  activeAnalyticsSubTab: AnalyticsSubTab;

  // Data
  overview: DashboardOverview | null;
  goals: Goal[];
  tasks: Task[];
  notifications: Notification[];
  analytics: AnalyticsData | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;

  // Actions
  setActiveTab: (tab: DashboardView) => void;
  refreshDashboard: () => Promise<void>;
  createGoal: (data: GoalInput) => Promise<Goal>;
  createTask: (data: TaskInput) => Promise<Task>;
  markNotificationRead: (id: string) => Promise<void>;
}
```

### 4.2 Unified Hooks

```typescript
// hooks/use-unified-dashboard.ts
export function useUnifiedDashboard() {
  // Single hook for all dashboard data
  // Replaces: useDailyAgenda, useLearningActivities, useWeeklyTimeline, etc.
}

// hooks/use-unified-goals.ts
export function useUnifiedGoals() {
  // Single hook for goals
  // Replaces: useGoals from GoalsClient, GoalPlanner state, etc.
}

// hooks/use-unified-analytics.ts
export function useUnifiedAnalytics() {
  // Single hook for analytics
  // Replaces: useLearningAnalytics, useDashboardAnalytics, etc.
}
```

---

## Phase 5: Implementation Steps

### Step 1: Create New Tab Structure (Week 1)

1. **Update `TabNavigation.tsx`**
   - Add `analytics` tab
   - Add `goals` tab
   - Remove `assess` tab (merge into analytics)

2. **Update `NewDashboard.tsx`**
   - Add analytics tab content (move from analytics page)
   - Add goals tab content (move from goals page)

3. **Create redirects**
   - `/dashboard/user/analytics` → `/dashboard/user?tab=analytics`
   - `/dashboard/user/goals` → `/dashboard/user?tab=goals`

### Step 2: Create Unified API Endpoints (Week 2)

1. **Create `/api/v2/dashboard/` structure**
2. **Implement unified endpoints**
3. **Add backward compatibility layer** (old endpoints proxy to new)

### Step 3: Create Unified Context & Hooks (Week 3)

1. **Create `UnifiedDashboardContext`**
2. **Create unified hooks**
3. **Migrate components to use new hooks**

### Step 4: Component Deduplication (Week 4)

1. **Remove duplicate components**
2. **Update imports across codebase**
3. **Remove old pages**

### Step 5: Testing & Cleanup (Week 5)

1. **End-to-end testing**
2. **Remove deprecated API endpoints**
3. **Update documentation**

---

## Phase 6: Files to Modify/Delete

### Files to DELETE:

```
app/dashboard/user/analytics/page.tsx          # Merge into main dashboard
app/dashboard/user/goals/page.tsx              # Merge into main dashboard
app/dashboard/user/goals/_components/          # Merge into main dashboard
```

### Files to MODIFY:

```
components/dashboard/unified-header/components/TabNavigation.tsx   # Add new tabs
app/dashboard/user/_components/NewDashboard.tsx                    # Add new tab content
app/dashboard/user/_components/DashboardClient.tsx                 # Update state management
components/dashboard/smart-sidebar.tsx                             # Update nav links
```

### Files to CREATE:

```
app/api/v2/dashboard/unified/route.ts
app/api/v2/dashboard/goals/route.ts
app/api/v2/dashboard/analytics/route.ts
lib/contexts/unified-dashboard-context.tsx
hooks/use-unified-dashboard.ts
hooks/use-unified-goals.ts
hooks/use-unified-analytics.ts
```

---

## Phase 7: URL Structure After Unification

### Main Routes:

| URL | Description |
|-----|-------------|
| `/dashboard/user` | Main dashboard (default: learning tab) |
| `/dashboard/user?tab=learning` | Learning tab |
| `/dashboard/user?tab=analytics` | Analytics tab (replaces /analytics page) |
| `/dashboard/user?tab=skills` | Skills tab |
| `/dashboard/user?tab=practice` | Practice tab |
| `/dashboard/user?tab=gamification` | Gamification tab |
| `/dashboard/user?tab=goals` | Goals tab (replaces /goals page) |
| `/dashboard/user?tab=gaps` | Gaps tab |
| `/dashboard/user?tab=innovation` | Innovation tab |
| `/dashboard/user?tab=discover` | Discover tab |
| `/dashboard/user?tab=create` | Create tab |

### Analytics Sub-tabs (within analytics tab):

| URL | Description |
|-----|-------------|
| `/dashboard/user?tab=analytics&sub=overview` | Overview |
| `/dashboard/user?tab=analytics&sub=exams` | Exam analytics |
| `/dashboard/user?tab=analytics&sub=progress` | Course progress |
| `/dashboard/user?tab=analytics&sub=insights` | SAM insights |
| `/dashboard/user?tab=analytics&sub=quality` | Quality scores |
| `/dashboard/user?tab=analytics&sub=conversations` | SAM history |
| `/dashboard/user?tab=analytics&sub=knowledge` | Knowledge graph |
| `/dashboard/user?tab=analytics&sub=heatmap` | Activity heatmap |

---

## Quick Reference: Duplicate Components

| Component | Location 1 | Location 2 | Keep In |
|-----------|------------|------------|---------|
| `LearningAnalyticsDashboard` | NewDashboard | analytics page | analytics tab |
| `StudyHeatmap` | LearningCommandCenter | analytics page | analytics tab |
| `SAMInsights` | NewDashboard | analytics page | analytics tab |
| `GoalsProgress` | LearningCommandCenter | analytics page | goals tab |
| `CourseProgressAnalytics` | NewDashboard | analytics page | analytics tab |
| `BehaviorPredictions` | NewDashboard | analytics page | analytics tab |
| `KnowledgeGraphBrowser` | skills tab | analytics page | skills tab |
| `QualityScoreDashboard` | skills tab | analytics page | analytics tab |
| `ConfidenceCalibrationWidget` | gamification tab | analytics page | analytics tab |
| `NotificationsWidget` | NewDashboard | header bell | header only |
| `GoalPlanner` | LearningCommandCenter | goals page | goals tab |

---

## Success Metrics

1. **Single page load** for all dashboard functionality
2. **No duplicate components** rendered
3. **Single API call** for dashboard overview (with lazy-loading for tabs)
4. **Unified URL structure** with query params for tabs
5. **Single notification system** with one unread count
6. **Single goals management** location

---

## Risk Mitigation

1. **Backward compatibility**: Keep old API endpoints working (proxy to new)
2. **URL redirects**: Old URLs redirect to new tab-based URLs
3. **Feature flags**: Roll out gradually with feature flags
4. **Analytics**: Track usage before removing old pages

---

*Created: January 2025*
*Completed: January 2025*
*Status: COMPLETED ✅*
*Priority: HIGH*

---

## Implementation Summary

### Phase 1: Tab Structure ✅
- Added `analytics` and `goals` tabs to TabNavigation
- Updated NewDashboard with tab content
- Added URL parameter sync with useSearchParams

### Phase 2: API Consolidation ✅
- Created `/api/v2/dashboard/unified/overview`
- Created `/api/v2/dashboard/goals`
- Created `/api/v2/dashboard/notifications`
- Created `/api/v2/dashboard/analytics/overview`
- Added backward compatibility layer

### Phase 3: Unified Context & Hooks ✅
- Created `UnifiedDashboardContext` provider
- Created `useUnifiedDashboard`, `useUnifiedGoals`, `useUnifiedAnalytics`, `useUnifiedNotifications` hooks
- Integrated with DashboardClient

### Phase 4: Component Deduplication ✅
- Removed `NotificationsWidget` from learning tab (header only)
- Removed `StudyPlanningHub` from learning tab (goals tab only)
- Moved `QualityScoreDashboard` to analytics tab
- Moved `ConfidenceCalibrationWidget` to analytics tab

### Phase 5: Testing & Cleanup ✅
- Removed `/dashboard/user/analytics` page (redirected)
- Removed `/dashboard/user/goals` page (redirected)
- Permanent redirects in next.config.js
- Build verification passed
