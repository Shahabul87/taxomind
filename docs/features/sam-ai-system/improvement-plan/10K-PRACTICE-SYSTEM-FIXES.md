# 10K Practice System - Comprehensive Fix Plan

## Executive Summary

This plan addresses **11 critical issues** in the 10K practice system:
- 6 API/UI shape mismatches causing broken UX
- 2 missing system integrations (SkillBuildTrack sync)
- 3 missing features (rolling averages, custom targets, trends UI)

**Estimated Changes**: 15 files, ~800 LOC modifications

---

## Phase 1: API/UI Shape Mismatches (Critical)

### 1.1 Streak Data Shape Fix

**Problem**: UI expects `current/longest`, API returns `currentBest/longestEver`

**Files to Modify**:
| File | Action | Lines |
|------|--------|-------|
| `app/api/sam/practice/mastery/overview/route.ts` | Rename fields, add `lastPracticeAt` | ~10 |

**Before** (lines 142-145):
```typescript
streaks: {
  currentBest: masteries.length > 0 ? Math.max(...masteries.map((m) => m.currentStreak)) : 0,
  longestEver: masteries.length > 0 ? Math.max(...masteries.map((m) => m.longestStreak)) : 0,
}
```

**After**:
```typescript
streaks: {
  current: masteries.length > 0 ? Math.max(...masteries.map((m) => m.currentStreak)) : 0,
  longest: masteries.length > 0 ? Math.max(...masteries.map((m) => m.longestStreak)) : 0,
},
lastPracticeAt: masteries.length > 0
  ? masteries.reduce((latest, m) =>
      m.lastPracticedAt && (!latest || m.lastPracticedAt > latest)
        ? m.lastPracticedAt
        : latest,
      null as Date | null
    )?.toISOString() ?? null
  : null,
```

---

### 1.2 Heatmap Data Shape Fix

**Problem**: UI expects `totalQualityHours/sessionsCount/avgQualityMultiplier`, API returns `hours/count`

**Files to Modify**:
| File | Action | Lines |
|------|--------|-------|
| `lib/sam/stores/prisma-daily-practice-log-store.ts` | Add missing fields to store return | ~20 |
| `app/api/sam/practice/heatmap/route.ts` | Transform to UI format | ~15 |

**Store Changes** (`prisma-daily-practice-log-store.ts`):
```typescript
// Update HeatmapData interface
export interface HeatmapData {
  date: string;
  sessionsCount: number;      // was: count
  totalRawHours: number;      // NEW
  totalQualityHours: number;  // was: hours
  avgQualityMultiplier: number; // NEW
  level: number;
}

// Update getHeatmapData method to compute new fields
```

**API Changes** (`heatmap/route.ts`):
```typescript
const enrichedHeatmapData = heatmapData.map((day) => ({
  date: day.date,
  sessionsCount: day.sessionsCount,
  totalRawHours: day.totalRawHours,
  totalQualityHours: day.totalQualityHours,
  avgQualityMultiplier: day.avgQualityMultiplier,
  intensity: getIntensityLevel(day.totalQualityHours, maxHours),
  color: getIntensityColor(day.totalQualityHours, maxHours),
}));
```

---

### 1.3 Recommendations Shape Fix

**Problem**: API uses lowercase enums + `metrics`, UI expects uppercase + `metadata`

**Files to Modify**:
| File | Action | Lines |
|------|--------|-------|
| `app/api/sam/practice/recommendations/route.ts` | Update enum case + field structure | ~50 |

**Before**:
```typescript
interface PracticeRecommendation {
  type: 'skill_focus' | 'streak_recovery' | 'milestone_push' | ...;
  priority: 'high' | 'medium' | 'low';
  metrics?: Record<string, number | string>;
}
```

**After**:
```typescript
// Align with UI expectations
const TYPE_MAPPING = {
  skill_focus: 'SKILL_FOCUS',
  streak_recovery: 'STREAK_RISK',
  milestone_push: 'MILESTONE_NEAR',
  variety: 'BALANCE',
  session_type: 'QUALITY_BOOST',
  time_of_day: 'REST',
} as const;

interface PracticeRecommendation {
  type: 'SKILL_FOCUS' | 'STREAK_RISK' | 'MILESTONE_NEAR' | 'QUALITY_BOOST' | 'REST' | 'BALANCE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  metadata?: {
    hoursToMilestone?: number;
    streakDays?: number;
    qualityGap?: number;
    suggestedDuration?: number;
  };
  skillIcon?: string;
}
```

---

### 1.4 Milestones Skill Join Fix

**Problem**: API returns `skillId` but UI needs `skill { id, name, icon }`

**Files to Modify**:
| File | Action | Lines |
|------|--------|-------|
| `app/api/sam/practice/milestones/route.ts` | Add skill include/lookup | ~25 |

**Before**:
```typescript
const milestones = await db.practiceMilestone.findMany({
  where: { userId },
  orderBy: { achievedAt: 'desc' },
});
```

**After**:
```typescript
const milestones = await db.practiceMilestone.findMany({
  where: { userId },
  orderBy: { achievedAt: 'desc' },
});

// Fetch skill details for all unique skillIds
const skillIds = [...new Set(milestones.map(m => m.skillId))];
const skills = await db.skill.findMany({
  where: { id: { in: skillIds } },
  select: { id: true, name: true, icon: true },
});
const skillMap = new Map(skills.map(s => [s.id, s]));

const enrichedMilestones = milestones.map((m) => ({
  ...m,
  skill: skillMap.get(m.skillId) ?? { id: m.skillId, name: 'Unknown Skill', icon: null },
  badgeName: MILESTONE_BADGE_NAMES[m.milestoneType] ?? m.milestoneType,
  xpReward: MILESTONE_XP_REWARDS[m.milestoneType] ?? 0,
}));
```

---

### 1.5 Pomodoro Integration Fix (Critical)

**Problem**: Component sends `skillId/duration`, API expects `sessionId`. No session tracking.

**Files to Modify**:
| File | Action | Lines |
|------|--------|-------|
| `components/practice/PomodoroTimer.tsx` | Add session state management + correct API flow | ~80 |

**Changes Required**:

1. **Add session state**:
```typescript
const [pomodoroSessionId, setPomodoroSessionId] = useState<string | null>(null);
```

2. **Start session before timer**:
```typescript
const startPomodoro = async () => {
  // Call /api/sam/practice/pomodoro/start
  const response = await fetch('/api/sam/practice/pomodoro/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      skillId,
      skillName,
      focusLevel: 'HIGH',
      pomodoroNumber: completedPomodoros + 1,
    }),
  });
  const data = await response.json();
  if (data.success) {
    setPomodoroSessionId(data.data.sessionId);
    setIsRunning(true);
  }
};
```

3. **Complete with correct params**:
```typescript
const completePomodoro = async () => {
  if (!pomodoroSessionId) return;

  const response = await fetch('/api/sam/practice/pomodoro/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: pomodoroSessionId,
      pomodoroNumber: completedPomodoros + 1,
      wasInterrupted: false,
    }),
  });

  if (response.ok) {
    setPomodoroSessionId(null);
    setCompletedPomodoros(prev => prev + 1);
  }
};
```

4. **Add skill selector** (currently missing):
```typescript
// Add SkillSelector component with courseId context
<SkillSelector
  value={skillId}
  onChange={setSkillId}
  courseId={courseId}
/>
```

---

### 1.6 PracticeTimer Missing Options

**Problem**: Timer omits ASSESSMENT, REVIEW session types and VERY_LOW focus level

**Files to Modify**:
| File | Action | Lines |
|------|--------|-------|
| `components/practice/PracticeTimer.tsx` | Add missing options | ~20 |

**Add to SESSION_TYPES**:
```typescript
const SESSION_TYPES = [
  { value: 'DELIBERATE', label: 'Deliberate Practice', multiplier: '1.5x', icon: Target },
  { value: 'POMODORO', label: 'Pomodoro Session', multiplier: '1.4x', icon: Clock },
  { value: 'GUIDED', label: 'SAM-Guided', multiplier: '1.25x', icon: Brain },
  { value: 'ASSESSMENT', label: 'Assessment', multiplier: '1.1x', icon: FileCheck }, // NEW
  { value: 'CASUAL', label: 'Casual Learning', multiplier: '1.0x', icon: Zap },
  { value: 'REVIEW', label: 'Review Session', multiplier: '0.8x', icon: RotateCcw }, // NEW
];

const FOCUS_LEVELS = [
  { value: 'DEEP_FLOW', label: 'Deep Flow', multiplier: '1.5x' },
  { value: 'HIGH', label: 'High Focus', multiplier: '1.25x' },
  { value: 'MEDIUM', label: 'Medium Focus', multiplier: '1.0x' },
  { value: 'LOW', label: 'Low Focus', multiplier: '0.75x' },
  { value: 'VERY_LOW', label: 'Distracted', multiplier: '0.5x' }, // NEW
];
```

---

## Phase 2: System Integration (SkillBuildTrack Sync)

### 2.1 Session End → SkillBuildTrack Sync

**Problem**: Practice sessions update 10K mastery but NOT SkillBuildTrack profiles

**Files to Modify**:
| File | Action | Lines |
|------|--------|-------|
| `app/api/sam/practice/sessions/[sessionId]/end/route.ts` | Add SkillBuildTrack sync | ~50 |
| `lib/practice/sync-skill-build.ts` | NEW: Create sync service | ~100 |

**New Service** (`lib/practice/sync-skill-build.ts`):
```typescript
import { createSkillBuildTrackEngine } from '@sam-ai/educational';
import { getStore } from '@/lib/sam/taxomind-context';

export interface SessionSyncData {
  userId: string;
  skillId: string;
  skillName: string;
  durationMinutes: number;
  qualityMultiplier: number;
  sessionType: string;
  focusLevel: string;
  bloomsLevel?: string;
}

export async function syncSessionToSkillBuildTrack(data: SessionSyncData) {
  const skillBuildStore = getStore('skillBuildTrack');
  const engine = createSkillBuildTrackEngine({ store: skillBuildStore });

  // Calculate normalized score (0-100) from quality multiplier and focus
  const normalizedScore = Math.min(
    (data.qualityMultiplier / 2.5) * 100 * (data.focusLevel === 'DEEP_FLOW' ? 1.2 : 1),
    100
  );

  // Record practice in SkillBuildTrack (updates decay, velocity, proficiency)
  await engine.recordPractice({
    userId: data.userId,
    skillId: data.skillId,
    skillName: data.skillName,
    duration: data.durationMinutes,
    score: normalizedScore,
    sessionType: data.sessionType,
    cognitiveLevel: data.bloomsLevel,
  });

  return { synced: true };
}
```

**Session End Route Changes**:
```typescript
// After existing 10K mastery update
import { syncSessionToSkillBuildTrack } from '@/lib/practice/sync-skill-build';

// ... existing code ...

// Sync to SkillBuildTrack
await syncSessionToSkillBuildTrack({
  userId: session.userId,
  skillId: session.skillId,
  skillName: session.skillName,
  durationMinutes: actualDuration,
  qualityMultiplier: multiplierResult.qualityMultiplier,
  sessionType: session.sessionType,
  focusLevel: session.focusLevel,
  bloomsLevel: body.bloomsLevel,
});
```

---

## Phase 3: Missing Features

### 3.1 Rolling Averages Computation

**Problem**: `avgWeeklyHours`, `avgMonthlyHours`, `estimatedDaysToGoal` are never computed

**Files to Modify**:
| File | Action | Lines |
|------|--------|-------|
| `lib/sam/stores/prisma-skill-mastery-10k-store.ts` | Add rolling average computation | ~60 |

**Add to `recordSessionToMastery` method**:
```typescript
// After updating main mastery record, compute rolling averages
private async computeRollingAverages(userId: string, skillId: string): Promise<void> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get daily logs for rolling windows
  const dailyLogs = await this.db.dailyPracticeLog.findMany({
    where: {
      userId,
      skillId,
      date: { gte: monthAgo },
    },
  });

  // Calculate weekly average
  const weeklyLogs = dailyLogs.filter(l => new Date(l.date) >= weekAgo);
  const avgWeeklyHours = weeklyLogs.reduce((sum, l) => sum + l.qualityHours, 0) / 7;

  // Calculate monthly average
  const avgMonthlyHours = dailyLogs.reduce((sum, l) => sum + l.qualityHours, 0) / 30;

  // Get current mastery for estimation
  const mastery = await this.db.skillMastery10K.findUnique({
    where: { userId_skillId: { userId, skillId } },
  });

  if (!mastery) return;

  // Calculate estimated days to goal
  const remainingHours = mastery.targetHours - mastery.totalQualityHours;
  const estimatedDaysToGoal = avgWeeklyHours > 0
    ? Math.ceil(remainingHours / (avgWeeklyHours / 7))
    : null;

  // Update mastery record
  await this.db.skillMastery10K.update({
    where: { userId_skillId: { userId, skillId } },
    data: {
      avgWeeklyHours,
      avgMonthlyHours,
      estimatedDaysToGoal,
    },
  });
}
```

---

### 3.2 Custom Target Hours API

**Problem**: `targetHours` is hardcoded to 10000 with no customization

**Files to Create/Modify**:
| File | Action | Lines |
|------|--------|-------|
| `app/api/sam/practice/mastery/[skillId]/route.ts` | Add PATCH endpoint | ~50 |
| `components/practice/SkillMasteryCard.tsx` | Add customization UI | ~40 |

**New API Endpoint** (`mastery/[skillId]/route.ts`):
```typescript
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const UpdateTargetSchema = z.object({
  targetHours: z.number().min(100).max(50000),
});

export async function PATCH(
  request: Request,
  { params }: { params: { skillId: string } }
) {
  const user = await currentUser();
  if (!user?.id) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { targetHours } = UpdateTargetSchema.parse(body);

  const mastery = await db.skillMastery10K.update({
    where: {
      userId_skillId: { userId: user.id, skillId: params.skillId }
    },
    data: {
      targetHours,
      progressPercentage: undefined, // Will be recalculated
    },
  });

  // Recalculate progress
  const progressPercentage = (mastery.totalQualityHours / targetHours) * 100;

  await db.skillMastery10K.update({
    where: { id: mastery.id },
    data: { progressPercentage },
  });

  return Response.json({
    success: true,
    data: { ...mastery, progressPercentage }
  });
}
```

---

### 3.3 Practice Trends UI

**Problem**: `/api/sam/practice/trends` exists but has no frontend

**Files to Create/Modify**:
| File | Action | Lines |
|------|--------|-------|
| `components/practice/PracticeTrendsChart.tsx` | NEW: Create trends component | ~150 |
| `app/dashboard/user/_components/NewDashboard.tsx` | Add trends to practice view | ~10 |

**New Component** (`PracticeTrendsChart.tsx`):
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Clock, Target } from 'lucide-react';

interface TrendData {
  period: string;
  qualityHours: number;
  sessionsCount: number;
  avgMultiplier: number;
}

export function PracticeTrendsChart() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      const response = await fetch('/api/sam/practice/trends?period=weekly&weeks=12');
      const data = await response.json();
      if (data.success) {
        setTrends(data.data.trends);
      }
      setLoading(false);
    }
    fetchTrends();
  }, []);

  if (loading) return <TrendsSkeletonLoader />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Practice Trends (12 Weeks)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis yAxisId="hours" orientation="left" />
            <YAxis yAxisId="sessions" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="hours"
              type="monotone"
              dataKey="qualityHours"
              stroke="#8884d8"
              name="Quality Hours"
            />
            <Line
              yAxisId="sessions"
              type="monotone"
              dataKey="sessionsCount"
              stroke="#82ca9d"
              name="Sessions"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

---

## Implementation Order

### Priority 1: Critical UX Fixes (Blocking)
1. ✅ 1.1 Streak shape fix - **5 min**
2. ✅ 1.2 Heatmap shape fix - **15 min**
3. ✅ 1.3 Recommendations shape fix - **20 min**
4. ✅ 1.4 Milestones skill join - **15 min**
5. ✅ 1.5 Pomodoro integration - **30 min**
6. ✅ 1.6 PracticeTimer options - **10 min**

### Priority 2: System Integration
7. ✅ 2.1 SkillBuildTrack sync service - **45 min**

### Priority 3: Feature Additions
8. ✅ 3.1 Rolling averages - **30 min**
9. ✅ 3.2 Custom targetHours API - **20 min**
10. ✅ 3.3 Practice trends UI - **40 min**

---

## Testing Checklist

### API Tests
- [ ] `GET /api/sam/practice/mastery/overview` returns `streaks.current/longest` + `lastPracticeAt`
- [ ] `GET /api/sam/practice/heatmap` returns `sessionsCount/totalQualityHours/avgQualityMultiplier`
- [ ] `GET /api/sam/practice/recommendations` returns uppercase types + `metadata` structure
- [ ] `GET /api/sam/practice/milestones` returns `skill { id, name, icon }` objects
- [ ] `POST /api/sam/practice/pomodoro/start` creates session and returns `sessionId`
- [ ] `POST /api/sam/practice/pomodoro/complete` accepts `sessionId` and completes correctly
- [ ] `PATCH /api/sam/practice/mastery/[skillId]` updates `targetHours`
- [ ] `GET /api/sam/practice/trends` returns weekly trend data

### UI Tests
- [ ] PracticeStreakDisplay shows current/longest streak values
- [ ] PracticeCalendarHeatmap renders with intensity colors
- [ ] PracticeRecommendations displays correct icons per type
- [ ] MilestoneTimeline shows skill names and icons
- [ ] PomodoroTimer starts session → runs timer → completes with sessionId
- [ ] PracticeTimer shows all session types including ASSESSMENT/REVIEW
- [ ] PracticeTrendsChart displays 12-week trend lines
- [ ] SkillMasteryCard allows editing target hours

### Integration Tests
- [ ] Completing practice session updates both 10K mastery AND SkillBuildTrack
- [ ] Rolling averages compute correctly after session
- [ ] Decay resets in SkillBuildTrack after practice

---

## File Summary

| File | Action | Priority |
|------|--------|----------|
| `app/api/sam/practice/mastery/overview/route.ts` | Modify | P1 |
| `lib/sam/stores/prisma-daily-practice-log-store.ts` | Modify | P1 |
| `app/api/sam/practice/heatmap/route.ts` | Modify | P1 |
| `app/api/sam/practice/recommendations/route.ts` | Modify | P1 |
| `app/api/sam/practice/milestones/route.ts` | Modify | P1 |
| `components/practice/PomodoroTimer.tsx` | Modify | P1 |
| `components/practice/PracticeTimer.tsx` | Modify | P1 |
| `lib/practice/sync-skill-build.ts` | Create | P2 |
| `app/api/sam/practice/sessions/[sessionId]/end/route.ts` | Modify | P2 |
| `lib/sam/stores/prisma-skill-mastery-10k-store.ts` | Modify | P3 |
| `app/api/sam/practice/mastery/[skillId]/route.ts` | Create | P3 |
| `components/practice/SkillMasteryCard.tsx` | Modify | P3 |
| `components/practice/PracticeTrendsChart.tsx` | Create | P3 |
| `app/dashboard/user/_components/NewDashboard.tsx` | Modify | P3 |

---

## Rollback Plan

If issues arise:
1. All changes are isolated to specific files
2. Each phase can be deployed independently
3. API shape changes are backwards-compatible (add new fields, keep old)
4. Feature flags can disable new components if needed

---

*Created: 2026-01-17*
*Status: Ready for Implementation*
