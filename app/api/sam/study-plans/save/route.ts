import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { getGoalStores } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const GeneratedTaskSchema = z.object({
  id: z.string(),
  dayNumber: z.number(),
  title: z.string(),
  description: z.string(),
  type: z.enum(['LEARN', 'PRACTICE', 'ASSESS', 'REVIEW', 'PROJECT']),
  estimatedMinutes: z.number(),
  scheduledDate: z.string(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  contentLinks: z.array(
    z.object({
      url: z.string().optional(),
      title: z.string().optional(),
    })
  ),
});

const GeneratedWeekSchema = z.object({
  weekNumber: z.number(),
  title: z.string(),
  tasks: z.array(GeneratedTaskSchema),
});

const MilestoneSchema = z.object({
  afterWeek: z.number(),
  title: z.string(),
  description: z.string().optional(),
});

const GeneratedPlanSchema = z.object({
  planTitle: z.string(),
  totalWeeks: z.number(),
  totalTasks: z.number(),
  estimatedHours: z.number(),
  weeks: z.array(GeneratedWeekSchema),
  milestones: z.array(MilestoneSchema),
});

const SaveStudyPlanSchema = z.object({
  plan: GeneratedPlanSchema,
  courseId: z.string().optional(),
  courseType: z.enum(['enrolled', 'new']),
  newCourse: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      platform: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
  skillLevel: z.string(),
  learningStyles: z.array(z.string()),
  targetMastery: z.string(),
  motivation: z.string(),
  startDate: z.string(),
  targetEndDate: z.string(),
});

// ============================================================================
// POST - Save Study Plan
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = SaveStudyPlanSchema.parse(body);
    const { plan } = validated;

    logger.info('[API] Saving study plan', {
      userId: session.user.id,
      planTitle: plan.planTitle,
      totalTasks: plan.totalTasks,
    });

    // Get goal stores from TaxomindContext
    const { goal: goalStore, subGoal: subGoalStore } = getGoalStores();

    // Map target mastery to store format
    const masteryMap: Record<string, 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'> = {
      familiar: 'beginner',
      competent: 'intermediate',
      proficient: 'advanced',
      expert: 'expert',
    };

    // Map skill level to current mastery
    const skillLevelMap: Record<string, 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'> = {
      beginner: 'novice',
      intermediate: 'intermediate',
      advanced: 'advanced',
    };

    // Create the main SAMLearningGoal (Study Plan container)
    const learningGoal = await goalStore.create({
      userId: session.user.id,
      title: plan.planTitle,
      description: `AI-generated study plan with ${plan.totalTasks} daily tasks across ${plan.totalWeeks} weeks. Estimated ${Math.round(plan.estimatedHours)} hours total.`,
      priority: 'high',
      status: 'active',
      targetDate: new Date(validated.targetEndDate),
      context: {
        courseId: validated.courseId,
      },
      currentMastery: skillLevelMap[validated.skillLevel] || 'beginner',
      targetMastery: masteryMap[validated.targetMastery] || 'intermediate',
      tags: ['study-plan', 'ai-generated', ...validated.learningStyles],
      metadata: {
        planType: 'study_plan',
        totalWeeks: plan.totalWeeks,
        totalTasks: plan.totalTasks,
        estimatedHours: plan.estimatedHours,
        milestones: plan.milestones,
        preferences: {
          learningStyles: validated.learningStyles,
          motivation: validated.motivation,
          startDate: validated.startDate,
          targetEndDate: validated.targetEndDate,
        },
        newCourse: validated.newCourse,
      },
    });

    logger.info('[API] Created learning goal', {
      goalId: learningGoal.id,
      title: learningGoal.title,
    });

    // Create SAMSubGoals for each daily task
    let taskOrder = 0;
    const createdSubGoals = [];

    for (const week of plan.weeks) {
      for (const task of week.tasks) {
        // Map task type to subgoal type
        const typeMap: Record<string, 'learn' | 'practice' | 'assess' | 'review'> = {
          LEARN: 'learn',
          PRACTICE: 'practice',
          ASSESS: 'assess',
          REVIEW: 'review',
          PROJECT: 'practice', // Map project to practice
        };

        // Map difficulty
        const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
          EASY: 'easy',
          MEDIUM: 'medium',
          HARD: 'hard',
        };

        const subGoal = await subGoalStore.create({
          goalId: learningGoal.id,
          title: task.title,
          description: task.description,
          type: typeMap[task.type] || 'learn',
          order: taskOrder,
          estimatedMinutes: task.estimatedMinutes,
          difficulty: difficultyMap[task.difficulty] || 'medium',
          status: 'pending',
          prerequisites: [], // First tasks have no prerequisites
          successCriteria: [
            `Complete the ${task.type.toLowerCase()} activity`,
            'Review and take notes',
          ],
          metadata: {
            weekNumber: week.weekNumber,
            weekTitle: week.title,
            dayNumber: task.dayNumber,
            scheduledDate: task.scheduledDate,
            taskType: task.type.toLowerCase(),
            contentLinks: task.contentLinks,
            originalTaskId: task.id,
          },
        });

        createdSubGoals.push(subGoal);
        taskOrder++;
      }
    }

    logger.info('[API] Created subgoals', {
      goalId: learningGoal.id,
      subGoalCount: createdSubGoals.length,
    });

    // Return success with created data
    return NextResponse.json({
      success: true,
      data: {
        goalId: learningGoal.id,
        goalTitle: learningGoal.title,
        subGoalCount: createdSubGoals.length,
        message: 'Study plan saved successfully! View it in your Goals tab.',
      },
    });
  } catch (error) {
    logger.error('[API] Error saving study plan:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SAVE_FAILED',
          message: 'Failed to save study plan',
        },
      },
      { status: 500 }
    );
  }
}
