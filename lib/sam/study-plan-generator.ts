/**
 * Study Plan Generator
 *
 * AI-powered study plan generation that creates personalized daily tasks
 * based on course content, user preferences, and learning goals.
 */

import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { addDays, format, differenceInDays, parseISO } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface StudyPlanInput {
  // Course info
  courseId?: string;
  courseTitle?: string;
  newCourse?: {
    title: string;
    description: string;
    platform: string;
    url: string;
  };
  courseType: 'enrolled' | 'new';

  // Learning profile
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  learningStyles: string[];
  priorKnowledge: string[];
  primaryGoal: 'complete' | 'master' | 'certify' | 'project';
  targetMastery: 'familiar' | 'competent' | 'proficient' | 'expert';
  motivation: string;

  // Schedule
  startDate: string;
  targetEndDate: string;
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening' | 'flexible';
  dailyStudyHours: number;
  studyDays: string[];

  // Preferences
  includePractice: boolean;
  includeAssessments: boolean;
  includeProjects: boolean;
}

export interface GeneratedTask {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  type: 'LEARN' | 'PRACTICE' | 'ASSESS' | 'REVIEW' | 'PROJECT';
  estimatedMinutes: number;
  scheduledDate: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  contentLinks: { url?: string; title?: string }[];
}

export interface GeneratedWeek {
  weekNumber: number;
  title: string;
  tasks: GeneratedTask[];
}

export interface Milestone {
  afterWeek: number;
  title: string;
  description?: string;
}

export interface GeneratedPlan {
  planTitle: string;
  totalWeeks: number;
  totalTasks: number;
  estimatedHours: number;
  weeks: GeneratedWeek[];
  milestones: Milestone[];
}

// ============================================================================
// COURSE STRUCTURE ANALYSIS
// ============================================================================

interface CourseChapter {
  id: string;
  title: string;
  position: number;
  sections: {
    id: string;
    title: string;
    position: number;
  }[];
}

async function analyzeCourseStructure(courseId: string): Promise<CourseChapter[]> {
  try {
    const chapters = await db.chapter.findMany({
      where: { courseId },
      orderBy: { position: 'asc' },
      include: {
        sections: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            position: true,
          },
        },
      },
    });

    return chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      position: ch.position,
      sections: ch.sections,
    }));
  } catch (error) {
    logger.error('[StudyPlanGenerator] Error analyzing course structure:', error);
    return [];
  }
}

// ============================================================================
// SCHEDULE CALCULATION
// ============================================================================

interface StudySchedule {
  totalDays: number;
  studyDaysCount: number;
  studyDates: Date[];
  weeksCount: number;
}

function calculateStudySchedule(input: {
  startDate: string;
  endDate: string;
  studyDays: string[];
  dailyHours: number;
}): StudySchedule {
  const start = parseISO(input.startDate);
  const end = parseISO(input.endDate);
  const totalDays = differenceInDays(end, start) + 1;

  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const activeDayNumbers = input.studyDays.map((d) => dayMap[d.toLowerCase()]);
  const studyDates: Date[] = [];

  for (let i = 0; i < totalDays; i++) {
    const currentDate = addDays(start, i);
    const dayOfWeek = currentDate.getDay();
    if (activeDayNumbers.includes(dayOfWeek)) {
      studyDates.push(currentDate);
    }
  }

  const weeksCount = Math.ceil(studyDates.length / Math.max(input.studyDays.length, 1));

  return {
    totalDays,
    studyDaysCount: studyDates.length,
    studyDates,
    weeksCount: Math.max(1, weeksCount),
  };
}

// ============================================================================
// TASK GENERATION
// ============================================================================

function getTaskTypeDistribution(preferences: {
  includePractice: boolean;
  includeAssessments: boolean;
  includeProjects: boolean;
  primaryGoal: string;
}): Record<GeneratedTask['type'], number> {
  const base = { LEARN: 50, PRACTICE: 20, ASSESS: 10, REVIEW: 15, PROJECT: 5 };

  if (preferences.primaryGoal === 'master') {
    base.LEARN = 40;
    base.PRACTICE = 30;
    base.REVIEW = 20;
  } else if (preferences.primaryGoal === 'certify') {
    base.LEARN = 35;
    base.ASSESS = 25;
    base.REVIEW = 25;
  } else if (preferences.primaryGoal === 'project') {
    base.LEARN = 30;
    base.PROJECT = 30;
    base.PRACTICE = 25;
  }

  if (!preferences.includePractice) {
    base.LEARN += base.PRACTICE;
    base.PRACTICE = 0;
  }
  if (!preferences.includeAssessments) {
    base.LEARN += base.ASSESS;
    base.ASSESS = 0;
  }
  if (!preferences.includeProjects) {
    base.LEARN += base.PROJECT;
    base.PROJECT = 0;
  }

  return base;
}

function getDifficultyForSkillLevel(
  skillLevel: string,
  progression: number
): 'EASY' | 'MEDIUM' | 'HARD' {
  // progression is 0-1 indicating how far into the plan we are
  if (skillLevel === 'beginner') {
    if (progression < 0.4) return 'EASY';
    if (progression < 0.7) return 'MEDIUM';
    return 'HARD';
  } else if (skillLevel === 'intermediate') {
    if (progression < 0.3) return 'EASY';
    if (progression < 0.6) return 'MEDIUM';
    return 'HARD';
  } else {
    if (progression < 0.2) return 'MEDIUM';
    return 'HARD';
  }
}

function generateTasksForWeek(
  weekNumber: number,
  studyDates: Date[],
  courseStructure: CourseChapter[],
  input: StudyPlanInput,
  startDayIndex: number
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  const dailyMinutes = Math.round(input.dailyStudyHours * 60);
  const typeDistribution = getTaskTypeDistribution(input);
  const totalWeeks = Math.ceil(studyDates.length / input.studyDays.length);

  // Get days for this week
  const weekDays = studyDates.slice(startDayIndex, startDayIndex + input.studyDays.length);
  const progression = weekNumber / totalWeeks;

  weekDays.forEach((date, dayIndex) => {
    const dayNumber = startDayIndex + dayIndex + 1;
    const difficulty = getDifficultyForSkillLevel(input.skillLevel, progression);

    // Calculate which chapter/section we should be on
    const chapterIndex = Math.min(
      Math.floor((dayNumber - 1) / 3),
      courseStructure.length - 1
    );
    const chapter = courseStructure[chapterIndex] || {
      title: `Module ${chapterIndex + 1}`,
      sections: [],
    };
    const sectionIndex = (dayNumber - 1) % Math.max(1, chapter.sections.length);
    const section = chapter.sections[sectionIndex];

    // Determine task type based on day pattern
    let taskType: GeneratedTask['type'];
    const dayPatternIndex = dayIndex % 5;
    if (dayPatternIndex === 0 || dayPatternIndex === 1) {
      taskType = 'LEARN';
    } else if (dayPatternIndex === 2 && input.includePractice) {
      taskType = 'PRACTICE';
    } else if (dayPatternIndex === 3 && input.includeAssessments) {
      taskType = 'ASSESS';
    } else if (dayPatternIndex === 4) {
      taskType = 'REVIEW';
    } else {
      taskType = 'LEARN';
    }

    // Override with PROJECT if it's end of week and projects are enabled
    if (
      input.includeProjects &&
      dayIndex === weekDays.length - 1 &&
      weekNumber % 2 === 0
    ) {
      taskType = 'PROJECT';
    }

    const taskTitles: Record<GeneratedTask['type'], string> = {
      LEARN: section
        ? `Study: ${section.title}`
        : `Learn ${chapter.title} Fundamentals`,
      PRACTICE: section
        ? `Practice: ${section.title} Exercises`
        : `Hands-on Practice - ${chapter.title}`,
      ASSESS: `Knowledge Check: ${chapter.title}`,
      REVIEW: `Review & Consolidate Week ${weekNumber} Material`,
      PROJECT: `Mini-Project: Apply ${chapter.title} Concepts`,
    };

    const taskDescriptions: Record<GeneratedTask['type'], string> = {
      LEARN: `Study the key concepts and theories. Take notes and highlight important points.`,
      PRACTICE: `Work through practical exercises and coding challenges to reinforce learning.`,
      ASSESS: `Complete a self-assessment quiz to test your understanding.`,
      REVIEW: `Review your notes and revisit challenging concepts from this week.`,
      PROJECT: `Build a small project applying what you've learned this week.`,
    };

    tasks.push({
      id: randomUUID(),
      dayNumber,
      title: taskTitles[taskType],
      description: taskDescriptions[taskType],
      type: taskType,
      estimatedMinutes: dailyMinutes,
      scheduledDate: format(date, 'yyyy-MM-dd'),
      difficulty,
      contentLinks: section
        ? [{ title: section.title }]
        : chapter.id
        ? [{ title: chapter.title }]
        : [],
    });
  });

  return tasks;
}

function generateWeekTitle(weekNumber: number, totalWeeks: number): string {
  if (weekNumber === 1) return 'Foundation Week';
  if (weekNumber === totalWeeks) return 'Mastery Week';
  if (weekNumber === Math.floor(totalWeeks / 2)) return 'Midpoint Review';
  if (weekNumber <= 2) return 'Building Basics';
  if (weekNumber >= totalWeeks - 1) return 'Advanced Application';
  return `Deep Dive Week ${weekNumber}`;
}

function generateMilestones(
  totalWeeks: number,
  primaryGoal: string
): Milestone[] {
  const milestones: Milestone[] = [];

  if (totalWeeks >= 2) {
    milestones.push({
      afterWeek: Math.floor(totalWeeks * 0.25),
      title: 'Foundation Complete',
      description: 'Core concepts mastered',
    });
  }

  if (totalWeeks >= 4) {
    milestones.push({
      afterWeek: Math.floor(totalWeeks * 0.5),
      title: 'Midpoint Assessment',
      description: 'Halfway through the course',
    });
  }

  if (totalWeeks >= 6) {
    milestones.push({
      afterWeek: Math.floor(totalWeeks * 0.75),
      title: 'Advanced Skills Unlocked',
      description: 'Ready for complex applications',
    });
  }

  milestones.push({
    afterWeek: totalWeeks,
    title:
      primaryGoal === 'certify'
        ? 'Certification Ready'
        : primaryGoal === 'project'
        ? 'Project Complete'
        : 'Course Complete',
    description: 'Goal achieved!',
  });

  return milestones;
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

export async function generateStudyPlan(
  input: StudyPlanInput
): Promise<GeneratedPlan> {
  logger.info('[StudyPlanGenerator] Generating study plan', {
    courseType: input.courseType,
    courseId: input.courseId,
    skillLevel: input.skillLevel,
    primaryGoal: input.primaryGoal,
  });

  // 1. Analyze course structure if enrolled course
  let courseStructure: CourseChapter[] = [];
  if (input.courseId) {
    courseStructure = await analyzeCourseStructure(input.courseId);
  }

  // If no structure found, create generic modules
  if (courseStructure.length === 0) {
    const moduleTitles = [
      'Introduction & Setup',
      'Core Fundamentals',
      'Essential Concepts',
      'Intermediate Topics',
      'Advanced Techniques',
      'Practical Applications',
      'Best Practices',
      'Final Review',
    ];
    courseStructure = moduleTitles.slice(0, 6).map((title, i) => ({
      id: `generic-${i}`,
      title,
      position: i,
      sections: [
        { id: `section-${i}-1`, title: `${title} - Part 1`, position: 0 },
        { id: `section-${i}-2`, title: `${title} - Part 2`, position: 1 },
      ],
    }));
  }

  // 2. Calculate study schedule
  const schedule = calculateStudySchedule({
    startDate: input.startDate,
    endDate: input.targetEndDate,
    studyDays: input.studyDays,
    dailyHours: input.dailyStudyHours,
  });

  // 3. Generate weekly tasks
  const weeks: GeneratedWeek[] = [];
  let dayIndex = 0;

  for (let w = 1; w <= schedule.weeksCount && dayIndex < schedule.studyDaysCount; w++) {
    const weekTasks = generateTasksForWeek(
      w,
      schedule.studyDates,
      courseStructure,
      input,
      dayIndex
    );

    weeks.push({
      weekNumber: w,
      title: generateWeekTitle(w, schedule.weeksCount),
      tasks: weekTasks,
    });

    dayIndex += input.studyDays.length;
  }

  // 4. Calculate totals
  const totalTasks = weeks.reduce((sum, w) => sum + w.tasks.length, 0);
  const estimatedHours =
    weeks.reduce(
      (sum, w) => sum + w.tasks.reduce((s, t) => s + t.estimatedMinutes, 0),
      0
    ) / 60;

  // 5. Generate milestones
  const milestones = generateMilestones(schedule.weeksCount, input.primaryGoal);

  // 6. Build plan title
  const courseTitle =
    input.courseTitle || input.newCourse?.title || 'Learning Journey';
  const planTitle = `${courseTitle} - ${schedule.weeksCount} Week Study Plan`;

  logger.info('[StudyPlanGenerator] Plan generated', {
    totalWeeks: schedule.weeksCount,
    totalTasks,
    estimatedHours: estimatedHours.toFixed(1),
  });

  return {
    planTitle,
    totalWeeks: schedule.weeksCount,
    totalTasks,
    estimatedHours,
    weeks,
    milestones,
  };
}
