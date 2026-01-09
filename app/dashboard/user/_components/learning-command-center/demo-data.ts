// Demo data for Learning Command Center

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

const getTime = (hours: number, minutes: number = 0): Date => {
  const date = getToday();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Demo Activities for Today - generated lazily
export const getDemoActivities = (): LearningActivity[] => {
  const today = getToday();
  return [
    {
      id: '1',
      type: 'STUDY_SESSION',
      title: 'React Hooks Deep Dive',
      description: 'Understanding useEffect, useCallback, and useMemo',
      scheduledDate: today,
      startTime: '08:00',
      endTime: '09:30',
      estimatedDuration: 90,
      actualDuration: 90,
      status: 'COMPLETED',
      progress: 100,
      completedAt: getTime(9, 30),
      courseName: 'Advanced React',
      chapterName: 'Chapter 5: Hooks',
      priority: 'HIGH',
      tags: ['react', 'javascript'],
    },
    {
      id: '2',
      type: 'QUIZ',
      title: 'React State Management Quiz',
      description: '15 questions covering useState, useReducer, and Context',
      scheduledDate: today,
      startTime: '10:00',
      endTime: '10:30',
      estimatedDuration: 30,
      status: 'IN_PROGRESS',
      progress: 60,
      courseName: 'Advanced React',
      chapterName: 'Chapter 5: Hooks',
      priority: 'HIGH',
      tags: ['quiz', 'react'],
    },
    {
      id: '3',
      type: 'READING',
      title: 'TypeScript Generics Documentation',
      description: 'Official TypeScript handbook section on generics',
      scheduledDate: today,
      startTime: '14:00',
      endTime: '15:00',
      estimatedDuration: 60,
      status: 'NOT_STARTED',
      progress: 0,
      courseName: 'TypeScript Mastery',
      chapterName: 'Chapter 8: Advanced Types',
      priority: 'MEDIUM',
      tags: ['typescript', 'reading'],
    },
    {
      id: '4',
      type: 'GOAL_MILESTONE',
      title: 'Complete React Fundamentals Course',
      description: 'Finish remaining 2 lessons to complete the course',
      scheduledDate: today,
      startTime: '16:00',
      estimatedDuration: 45,
      status: 'NOT_STARTED',
      progress: 85,
      courseName: 'React Fundamentals',
      priority: 'URGENT',
      tags: ['milestone', 'course-completion'],
    },
    {
      id: '5',
      type: 'PRACTICE',
      title: 'Coding Challenge: Array Methods',
      description: 'Practice map, filter, reduce with real-world examples',
      scheduledDate: today,
      startTime: '17:00',
      endTime: '18:00',
      estimatedDuration: 60,
      status: 'NOT_STARTED',
      progress: 0,
      courseName: 'JavaScript Fundamentals',
      priority: 'LOW',
      tags: ['practice', 'javascript'],
    },
    {
      id: '6',
      type: 'VIDEO_LESSON',
      title: 'Node.js Event Loop Explained',
      scheduledDate: today,
      startTime: '19:00',
      endTime: '19:45',
      estimatedDuration: 45,
      status: 'NOT_STARTED',
      progress: 0,
      courseName: 'Node.js Fundamentals',
      chapterName: 'Chapter 3: Async Programming',
      priority: 'MEDIUM',
      tags: ['video', 'nodejs'],
    },
  ];
};

// Demo Tasks - generated lazily
export const getDemoTasks = (): LearningTask[] => {
  const today = getToday();
  return [
    {
      id: 't1',
      title: 'Review lecture notes from yesterday',
      completed: true,
      priority: 'MEDIUM',
      tags: ['review'],
      courseName: 'Advanced React',
    },
    {
      id: 't2',
      title: 'Practice React exercises',
      description: 'Complete 5 exercises from the practice section',
      completed: false,
      priority: 'HIGH',
      tags: ['practice', 'react'],
      courseName: 'Advanced React',
    },
    {
      id: 't3',
      title: 'Submit assignment draft',
      dueDate: today,
      completed: false,
      priority: 'URGENT',
      tags: ['assignment'],
      courseName: 'TypeScript Mastery',
    },
    {
      id: 't4',
      title: 'Join study group session at 7 PM',
      completed: false,
      priority: 'LOW',
      tags: ['social', 'group'],
    },
    {
      id: 't5',
      title: 'Update learning journal',
      completed: false,
      priority: 'LOW',
      tags: ['reflection'],
    },
  ];
};

// Demo Goals - generated lazily
export const getDemoGoals = (): LearningGoal[] => {
  const today = getToday();
  return [
    {
      id: 'g1',
      title: 'Complete 5 courses this month',
      type: 'COURSE',
      targetDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      progress: 80,
      status: 'ON_TRACK',
      milestones: [
        { id: 'm1', title: 'React Fundamentals', targetDate: new Date(), completed: true },
        { id: 'm2', title: 'TypeScript Basics', targetDate: new Date(), completed: true },
        { id: 'm3', title: 'Node.js Intro', targetDate: new Date(), completed: true },
        { id: 'm4', title: 'Advanced React', targetDate: new Date(), completed: true },
        { id: 'm5', title: 'TypeScript Mastery', targetDate: new Date(), completed: false },
      ],
    },
    {
      id: 'g2',
      title: 'Study 20 hours this week',
      type: 'CUSTOM',
      targetDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      progress: 60,
      status: 'BEHIND',
      milestones: [],
    },
    {
      id: 'g3',
      title: 'Earn React Developer Certification',
      type: 'CERTIFICATION',
      targetDate: new Date(today.getFullYear(), today.getMonth() + 2, 15),
      progress: 45,
      status: 'ON_TRACK',
      milestones: [
        { id: 'm6', title: 'Complete all modules', targetDate: new Date(), completed: true },
        { id: 'm7', title: 'Pass practice exam', targetDate: new Date(), completed: false },
        { id: 'm8', title: 'Schedule certification', targetDate: new Date(), completed: false },
      ],
    },
  ];
};

// Backward compatible exports - call the functions
export const demoActivities = getDemoActivities();
export const demoTasks = getDemoTasks();
export const demoGoals = getDemoGoals();

// Weekly Timeline Data
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
    const isPast = date < today && !isToday;

    days.push({
      date,
      dayName: dayNames[date.getDay()],
      plannedHours: [2.5, 2, 2.5, 2, 2.5, 1.5, 1][i],
      actualHours: isPast ? [2.5, 2, 1.5, 2, 0, 0, 0][i] : isToday ? 1.5 : 0,
      isToday,
    });
  }

  return days;
};

// Get greeting based on time of day
export const getGreeting = (name: string): string => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return `Good morning, ${name}! Ready to learn something amazing today?`;
  } else if (hour < 17) {
    return `Good afternoon, ${name}! Keep up the great momentum!`;
  } else {
    return `Good evening, ${name}! Time to wrap up your learning goals.`;
  }
};

// Generate full daily agenda
export const generateDailyAgenda = (userName: string = 'Learner'): DailyAgenda => {
  const today = getToday();
  const activities = getDemoActivities();
  const tasks = getDemoTasks();
  const goals = getDemoGoals();

  const morningActivities = activities.filter(a => {
    const hour = parseInt(a.startTime?.split(':')[0] || '0');
    return hour >= 6 && hour < 12;
  });

  const afternoonActivities = activities.filter(a => {
    const hour = parseInt(a.startTime?.split(':')[0] || '0');
    return hour >= 12 && hour < 18;
  });

  const eveningActivities = activities.filter(a => {
    const hour = parseInt(a.startTime?.split(':')[0] || '0');
    return hour >= 18 || hour < 6;
  });

  const completedActivities = activities.filter(a => a.status === 'COMPLETED');
  const totalMinutes = activities.reduce((sum, a) => sum + a.estimatedDuration, 0);
  const completedMinutes = completedActivities.reduce((sum, a) => sum + (a.actualDuration || a.estimatedDuration), 0);
  const plannedHours = Math.round((totalMinutes / 60) * 10) / 10;
  const completedHours = Math.round((completedMinutes / 60) * 10) / 10;

  return {
    date: today,
    dayOfWeek: today.toLocaleDateString('en-US', { weekday: 'long' }),
    greeting: getGreeting(userName),
    userName,
    motivationalQuote: 'The expert in anything was once a beginner.',
    stats: {
      streak: 7,
      plannedHours,
      completedHours,
      completionRate: Math.round((completedActivities.length / activities.length) * 100),
      totalActivities: activities.length,
      completedActivities: completedActivities.length,
      totalPlannedMinutes: totalMinutes,
      totalCompletedMinutes: completedMinutes,
      weeklyProgress: {
        current: 8.5,
        target: 20,
        percentage: 42.5,
      },
    },
    // Legacy properties for backward compatibility
    summary: {
      streak: 7,
      plannedHours,
      completedHours,
      completionRate: Math.round((completedActivities.length / activities.length) * 100),
      totalActivities: activities.length,
      completedActivities: completedActivities.length,
      totalPlannedMinutes: totalMinutes,
      totalCompletedMinutes: completedMinutes,
      weeklyProgress: {
        current: 8.5,
        target: 20,
        percentage: 42.5,
      },
    },
    streak: {
      currentStreak: 7,
      longestStreak: 23,
      current: 7,
      longest: 23,
      todayCompleted: completedActivities.length > 0,
      atRisk: false,
    },
    weeklyProgress: {
      current: 8.5,
      target: 20,
      percentage: 42.5,
      hoursPlanned: 14,
      hoursCompleted: 8.5,
      goalHours: 20,
      percentComplete: 42.5,
    },
    schedule: {
      morning: morningActivities,
      afternoon: afternoonActivities,
      evening: eveningActivities,
      unscheduled: [],
    },
    todos: tasks,
    activeGoals: goals,
  };
};

// ============================================
// Learning Gantt Demo Data (Phase 2)
// ============================================

// Demo course colors
const COURSE_COLORS = {
  react: '#3B82F6',     // Blue
  typescript: '#8B5CF6', // Purple
  nodejs: '#10B981',    // Green
  python: '#F59E0B',    // Amber
};

// Generate demo Gantt courses
export const getDemoGanttCourses = (): GanttCourseInfo[] => {
  return [
    {
      id: 'course-react',
      title: 'Advanced React',
      color: COURSE_COLORS.react,
      totalProgress: 65,
      totalHours: 20,
      completedHours: 13,
      chaptersCount: 8,
      lessonsCount: 32,
    },
    {
      id: 'course-typescript',
      title: 'TypeScript Mastery',
      color: COURSE_COLORS.typescript,
      totalProgress: 40,
      totalHours: 15,
      completedHours: 6,
      chaptersCount: 6,
      lessonsCount: 24,
    },
    {
      id: 'course-nodejs',
      title: 'Node.js Fundamentals',
      color: COURSE_COLORS.nodejs,
      totalProgress: 25,
      totalHours: 12,
      completedHours: 3,
      chaptersCount: 5,
      lessonsCount: 20,
    },
  ];
};

// Generate demo Gantt items
export const getDemoGanttItems = (): LearningGanttItem[] => {
  const today = getToday();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
  };

  return [
    // React Course
    {
      id: 'gantt-react',
      type: 'COURSE',
      title: 'Advanced React',
      description: 'Master React hooks, patterns, and performance optimization',
      plannedStart: addDays(startOfWeek, 0),
      plannedEnd: addDays(startOfWeek, 10),
      actualStart: addDays(startOfWeek, 0),
      actualEnd: undefined,
      plannedHours: 20,
      actualHours: 13,
      plannedProgress: 70,
      actualProgress: 65,
      color: COURSE_COLORS.react,
      status: 'ON_TRACK',
      courseId: 'course-react',
      courseName: 'Advanced React',
      milestones: [
        {
          id: 'ms-react-quiz',
          title: 'Hooks Quiz',
          date: addDays(startOfWeek, 4),
          completed: true,
          type: 'quiz',
        },
        {
          id: 'ms-react-project',
          title: 'Final Project Due',
          date: addDays(startOfWeek, 10),
          completed: false,
          type: 'assignment',
        },
      ],
      children: [
        {
          id: 'gantt-react-ch5',
          type: 'CHAPTER',
          title: 'Chapter 5: React Hooks',
          plannedStart: addDays(startOfWeek, 0),
          plannedEnd: addDays(startOfWeek, 3),
          actualStart: addDays(startOfWeek, 0),
          actualEnd: addDays(startOfWeek, 2),
          plannedHours: 6,
          actualHours: 6,
          plannedProgress: 100,
          actualProgress: 100,
          color: COURSE_COLORS.react,
          status: 'COMPLETED',
          courseId: 'course-react',
          courseName: 'Advanced React',
          parentId: 'gantt-react',
          milestones: [],
        },
        {
          id: 'gantt-react-ch6',
          type: 'CHAPTER',
          title: 'Chapter 6: State Management',
          plannedStart: addDays(startOfWeek, 3),
          plannedEnd: addDays(startOfWeek, 6),
          actualStart: addDays(startOfWeek, 3),
          actualEnd: undefined,
          plannedHours: 8,
          actualHours: 5,
          plannedProgress: 75,
          actualProgress: 62,
          color: COURSE_COLORS.react,
          status: 'BEHIND',
          courseId: 'course-react',
          courseName: 'Advanced React',
          parentId: 'gantt-react',
          milestones: [],
        },
        {
          id: 'gantt-react-ch7',
          type: 'CHAPTER',
          title: 'Chapter 7: Performance',
          plannedStart: addDays(startOfWeek, 6),
          plannedEnd: addDays(startOfWeek, 10),
          actualStart: undefined,
          actualEnd: undefined,
          plannedHours: 6,
          actualHours: 2,
          plannedProgress: 25,
          actualProgress: 33,
          color: COURSE_COLORS.react,
          status: 'AHEAD',
          courseId: 'course-react',
          courseName: 'Advanced React',
          parentId: 'gantt-react',
          milestones: [],
        },
      ],
    },
    // TypeScript Course
    {
      id: 'gantt-typescript',
      type: 'COURSE',
      title: 'TypeScript Mastery',
      description: 'Learn advanced TypeScript patterns and type system',
      plannedStart: addDays(startOfWeek, 2),
      plannedEnd: addDays(startOfWeek, 12),
      actualStart: addDays(startOfWeek, 2),
      actualEnd: undefined,
      plannedHours: 15,
      actualHours: 6,
      plannedProgress: 50,
      actualProgress: 40,
      color: COURSE_COLORS.typescript,
      status: 'BEHIND',
      courseId: 'course-typescript',
      courseName: 'TypeScript Mastery',
      milestones: [
        {
          id: 'ms-ts-cert',
          title: 'Certification Exam',
          date: addDays(startOfWeek, 12),
          completed: false,
          type: 'exam',
        },
      ],
      children: [
        {
          id: 'gantt-ts-ch8',
          type: 'CHAPTER',
          title: 'Chapter 8: Advanced Types',
          plannedStart: addDays(startOfWeek, 2),
          plannedEnd: addDays(startOfWeek, 5),
          actualStart: addDays(startOfWeek, 2),
          actualEnd: addDays(startOfWeek, 4),
          plannedHours: 5,
          actualHours: 5,
          plannedProgress: 100,
          actualProgress: 100,
          color: COURSE_COLORS.typescript,
          status: 'COMPLETED',
          courseId: 'course-typescript',
          courseName: 'TypeScript Mastery',
          parentId: 'gantt-typescript',
          milestones: [],
        },
        {
          id: 'gantt-ts-ch9',
          type: 'CHAPTER',
          title: 'Chapter 9: Generics',
          plannedStart: addDays(startOfWeek, 5),
          plannedEnd: addDays(startOfWeek, 8),
          actualStart: addDays(startOfWeek, 5),
          actualEnd: undefined,
          plannedHours: 5,
          actualHours: 1,
          plannedProgress: 60,
          actualProgress: 20,
          color: COURSE_COLORS.typescript,
          status: 'BEHIND',
          courseId: 'course-typescript',
          courseName: 'TypeScript Mastery',
          parentId: 'gantt-typescript',
          milestones: [],
        },
      ],
    },
    // Weekly Goal
    {
      id: 'gantt-goal-weekly',
      type: 'GOAL',
      title: 'Study 20 hours this week',
      description: 'Weekly learning goal',
      plannedStart: addDays(startOfWeek, 0),
      plannedEnd: addDays(startOfWeek, 6),
      actualStart: addDays(startOfWeek, 0),
      actualEnd: undefined,
      plannedHours: 20,
      actualHours: 11.5,
      plannedProgress: 71,
      actualProgress: 57,
      color: '#F97316', // Orange
      status: 'BEHIND',
      milestones: [
        {
          id: 'ms-goal-halfway',
          title: 'Halfway Point',
          date: addDays(startOfWeek, 3),
          completed: true,
          type: 'custom',
        },
      ],
    },
  ];
};

// Generate demo Gantt summary
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
      totalHours: 14,
      activities: 12,
      courses: 3,
    },
    accomplished: {
      totalHours: 11.5,
      activities: 8,
      courses: 2,
    },
    variance: {
      hours: -2.5,
      percentage: -18,
      status: 'BEHIND',
    },
    dailyBreakdown: dayNames.map((dayName, idx) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + idx);
      const isPast = date < today;
      const isToday = date.toDateString() === today.toDateString();

      return {
        date: date.toISOString().split('T')[0],
        dayName,
        plannedHours: [2.5, 2, 2.5, 2, 2.5, 1.5, 1][idx],
        actualHours: isPast ? [2.5, 2, 1.5, 2, 0, 0, 0][idx] : isToday ? 1.5 : 0,
        activities: isPast ? [3, 2, 2, 2, 0, 0, 0][idx] : isToday ? 1 : 0,
      };
    }),
  };
};

// Generate complete Gantt response
export const getDemoGanttResponse = (): GanttResponse => {
  return {
    items: getDemoGanttItems(),
    summary: getDemoGanttSummary(),
    courses: getDemoGanttCourses(),
  };
};
