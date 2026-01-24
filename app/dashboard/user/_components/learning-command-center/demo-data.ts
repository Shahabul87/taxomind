/**
 * Placeholder data for Learning Command Center
 *
 * IMPORTANT: This file provides EMPTY placeholder data by default.
 * The UI components should display proper empty states when no real data is available.
 *
 * Previously, this file contained hardcoded course names like "React Hooks Deep Dive",
 * "Advanced React", etc., which was confusing for users who weren't enrolled in those courses.
 *
 * Now components should:
 * 1. First try to fetch real data from APIs
 * 2. Show loading states while fetching
 * 3. Show empty states with CTAs when no data exists
 * 4. Only use this placeholder data for development/testing purposes
 */

import type {
  LearningActivity,
  LearningTask,
  LearningGoal,
  DailyAgenda,
  WeeklyTimelineDay,
  LearningGanttItem,
  PlannedVsAccomplished,
  GanttCourseInfo,
  GanttResponse,
} from './types';

// Helper to get today's date - called lazily to avoid hydration mismatch
const getToday = (): Date => new Date();

// ============================================
// EMPTY PLACEHOLDER DATA (Default)
// ============================================

/**
 * Returns empty activities array - UI should show empty state
 */
export const getDemoActivities = (): LearningActivity[] => {
  return [];
};

/**
 * Returns empty tasks array - UI should show empty state
 */
export const getDemoTasks = (): LearningTask[] => {
  return [];
};

/**
 * Returns empty goals array - UI should show empty state
 */
export const getDemoGoals = (): LearningGoal[] => {
  return [];
};

// Backward compatible exports - call the functions
export const demoActivities = getDemoActivities();
export const demoTasks = getDemoTasks();
export const demoGoals = getDemoGoals();

// Weekly Timeline Data - shows the structure with no activity
export const generateWeeklyTimeline = (): WeeklyTimelineDay[] => {
  const today = getToday();
  const days: WeeklyTimelineDay[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Start from beginning of the week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const isToday = date.toDateString() === today.toDateString();

    days.push({
      date,
      dayName: dayNames[date.getDay()],
      plannedHours: 0,
      actualHours: 0,
      isToday,
    });
  }

  return days;
};

// Get greeting based on time of day
export const getGreeting = (name: string): string => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return `Good morning, ${name}! Ready to start your learning journey?`;
  } else if (hour < 17) {
    return `Good afternoon, ${name}! Great time to learn something new.`;
  } else {
    return `Good evening, ${name}! Every moment is a chance to grow.`;
  }
};

// Generate empty daily agenda - prompts user to add activities
export const generateDailyAgenda = (userName: string = 'Learner'): DailyAgenda => {
  const today = getToday();

  return {
    date: today,
    dayOfWeek: today.toLocaleDateString('en-US', { weekday: 'long' }),
    greeting: getGreeting(userName),
    userName,
    motivationalQuote: 'The expert in anything was once a beginner.',
    stats: {
      streak: 0,
      plannedHours: 0,
      completedHours: 0,
      completionRate: 0,
      totalActivities: 0,
      completedActivities: 0,
      totalPlannedMinutes: 0,
      totalCompletedMinutes: 0,
      weeklyProgress: {
        current: 0,
        target: 20,
        percentage: 0,
      },
    },
    // Legacy properties for backward compatibility
    summary: {
      streak: 0,
      plannedHours: 0,
      completedHours: 0,
      completionRate: 0,
      totalActivities: 0,
      completedActivities: 0,
      totalPlannedMinutes: 0,
      totalCompletedMinutes: 0,
      weeklyProgress: {
        current: 0,
        target: 20,
        percentage: 0,
      },
    },
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      current: 0,
      longest: 0,
      todayCompleted: false,
      atRisk: false,
    },
    weeklyProgress: {
      current: 0,
      target: 20,
      percentage: 0,
      hoursPlanned: 0,
      hoursCompleted: 0,
      goalHours: 20,
      percentComplete: 0,
    },
    schedule: {
      morning: [],
      afternoon: [],
      evening: [],
      unscheduled: [],
    },
    todos: [],
    activeGoals: [],
  };
};

// ============================================
// Learning Gantt Placeholder Data
// ============================================

// Placeholder course colors for when data is available
const COURSE_COLORS = {
  primary: '#3B82F6', // Blue
  secondary: '#8B5CF6', // Purple
  tertiary: '#10B981', // Green
  quaternary: '#F59E0B', // Amber
};

// Returns empty Gantt courses - UI should show empty state
export const getDemoGanttCourses = (): GanttCourseInfo[] => {
  return [];
};

// Returns empty Gantt items - UI should show empty state
export const getDemoGanttItems = (): LearningGanttItem[] => {
  return [];
};

// Generate empty Gantt summary
export const getDemoGanttSummary = (): PlannedVsAccomplished => {
  const today = getToday();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return {
    period: {
      start: startOfWeek,
      end: endOfWeek,
      label: 'This Week',
    },
    planned: {
      totalHours: 0,
      activities: 0,
      courses: 0,
    },
    accomplished: {
      totalHours: 0,
      activities: 0,
      courses: 0,
    },
    variance: {
      hours: 0,
      percentage: 0,
      status: 'ON_TRACK',
    },
    dailyBreakdown: dayNames.map((dayName, idx) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + idx);

      return {
        date: date.toISOString().split('T')[0],
        dayName,
        plannedHours: 0,
        actualHours: 0,
        activities: 0,
      };
    }),
  };
};

// Generate complete empty Gantt response
export const getDemoGanttResponse = (): GanttResponse => {
  return {
    items: getDemoGanttItems(),
    summary: getDemoGanttSummary(),
    courses: getDemoGanttCourses(),
  };
};

// ============================================
// DEVELOPMENT SAMPLE DATA (For Testing Only)
// ============================================

/**
 * Use these functions ONLY for development/testing purposes.
 * They return sample data with generic placeholders.
 * In production, always use the empty placeholder functions above.
 */

export const getTestActivities = (): LearningActivity[] => {
  const today = getToday();
  return [
    {
      id: 'test-1',
      type: 'STUDY_SESSION',
      title: 'Sample Study Session',
      description: 'This is placeholder data for testing',
      scheduledDate: today,
      startTime: '09:00',
      endTime: '10:00',
      estimatedDuration: 60,
      status: 'NOT_STARTED',
      progress: 0,
      courseName: 'Your Enrolled Course',
      chapterName: 'Current Chapter',
      priority: 'MEDIUM',
      tags: ['sample'],
    },
  ];
};

export const getTestTasks = (): LearningTask[] => {
  return [
    {
      id: 'test-t1',
      title: 'Sample Task',
      description: 'This is placeholder data for testing',
      completed: false,
      priority: 'MEDIUM',
      tags: ['sample'],
    },
  ];
};

export const getTestGoals = (): LearningGoal[] => {
  const today = getToday();
  return [
    {
      id: 'test-g1',
      title: 'Sample Learning Goal',
      type: 'CUSTOM',
      targetDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'ON_TRACK',
      milestones: [],
    },
  ];
};
