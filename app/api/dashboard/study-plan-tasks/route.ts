import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { format } from 'date-fns';

/**
 * GET /api/dashboard/study-plan-tasks
 *
 * Fetches study plan tasks for the current user that are scheduled for today.
 * These come from SAM learning goals with subgoals that have scheduledDate metadata.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    // Use provided date or today
    const targetDate = dateParam ?? format(new Date(), 'yyyy-MM-dd');

    // Get all active goals for the user that are study plans
    const allGoals = await db.sAMLearningGoal.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        metadata: true,
      },
    });

    // Filter to only study plan type goals
    const goals = allGoals.filter((g) => {
      const metadata = g.metadata as Record<string, unknown> | null;
      return metadata?.planType === 'study_plan';
    });

    const hasStudyPlans = goals.length > 0;

    // Get subgoals scheduled for the target date
    const subGoals = await db.sAMSubGoal.findMany({
      where: {
        goalId: { in: goals.map((g) => g.id) },
      },
      select: {
        id: true,
        goalId: true,
        title: true,
        status: true,
        type: true,
        estimatedMinutes: true,
        difficulty: true,
        completedAt: true,
        metadata: true,
        order: true,
      },
      orderBy: { order: 'asc' },
    });

    // Filter subgoals that are scheduled for the target date
    const todaysTasks = subGoals.filter((sg) => {
      const metadata = sg.metadata as Record<string, unknown> | null;
      const scheduledDate = metadata?.scheduledDate as string | undefined;
      return scheduledDate === targetDate;
    });

    // Build goal map for quick lookup
    const goalMap = new Map(goals.map((g) => [g.id, g]));

    // Format the response
    const formattedTasks = todaysTasks.map((task) => {
      const goal = goalMap.get(task.goalId);
      const metadata = task.metadata as Record<string, unknown> | null;

      return {
        id: task.id,
        goalId: task.goalId,
        title: task.title,
        status: task.status?.toLowerCase() ?? 'pending',
        type: metadata?.taskType ?? task.type ?? 'study',
        estimatedMinutes: task.estimatedMinutes ?? 120,
        difficulty: task.difficulty ?? 'medium',
        completedAt: task.completedAt?.toISOString() ?? null,
        dayNumber: metadata?.dayNumber ?? 1,
        weekNumber: metadata?.weekNumber ?? 1,
        weekTitle: metadata?.weekTitle ?? 'Week 1',
        scheduledDate: metadata?.scheduledDate ?? targetDate,
        // Parent goal info
        studyPlan: goal ? {
          id: goal.id,
          title: goal.title,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedTasks,
      meta: {
        date: targetDate,
        total: formattedTasks.length,
        completed: formattedTasks.filter((t) => t.status === 'completed').length,
        hasStudyPlans,
        studyPlanCount: goals.length,
      },
    });
  } catch (error) {
    console.error('[STUDY_PLAN_TASKS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch study plan tasks' },
      { status: 500 }
    );
  }
}
