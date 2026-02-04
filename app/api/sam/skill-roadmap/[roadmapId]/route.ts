/**
 * Skill Roadmap Detail API
 *
 * GET  /api/sam/skill-roadmap/[roadmapId] - Full roadmap detail with milestones + matched courses
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

/** Internal DB type/enum names that should never appear as display names. */
const INTERNAL_NAMES = ['SKILL_SET', 'SKILL_DEFINITION', 'UNTITLED', 'UNDEFINED', 'NULL'];

function isInternalName(value: string | undefined | null): boolean {
  if (!value) return true;
  return INTERNAL_NAMES.some(n => value.toUpperCase().includes(n));
}

/** Extract display data from targetOutcome JSON (handles old + new formats) */
function parseTargetOutcome(raw: unknown): {
  skillName: string;
  currentLevel: string;
  targetLevel: string;
} {
  const outcome = raw as Record<string, unknown> | null;
  if (!outcome) return { skillName: '', currentLevel: '', targetLevel: '' };

  const rawName = (outcome.targetName as string) ?? '';
  const skillName = isInternalName(rawName) ? '' : rawName;
  let currentLevel = (outcome.currentLevel as string) ?? '';
  let targetLevel = (outcome.targetLevel as string) ?? '';

  if (!currentLevel || !targetLevel) {
    const skills = outcome.targetSkills as Array<Record<string, unknown>> | undefined;
    if (skills && skills.length > 0) {
      currentLevel = currentLevel || ((skills[0].currentLevel as string) ?? '');
      targetLevel = targetLevel || ((skills[0].targetLevel as string) ?? '');
    }
  }

  return { skillName, currentLevel, targetLevel };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roadmapId } = await params;

    const roadmap = await db.skillBuildRoadmap.findFirst({
      where: {
        id: roadmapId,
        userId: session.user.id,
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    // Fetch matched courses for each milestone
    const allCourseIds = roadmap.milestones.flatMap(m => m.matchedCourseIds);
    const uniqueCourseIds = [...new Set(allCourseIds)];

    const matchedCourses = uniqueCourseIds.length > 0
      ? await db.course.findMany({
          where: { id: { in: uniqueCourseIds } },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            isPublished: true,
          },
          take: 100,
        })
      : [];

    const courseMap = new Map(matchedCourses.map(c => [c.id, c]));

    // Calculate stats
    const completedMilestones = roadmap.milestones.filter(m => m.status === 'COMPLETED').length;
    const totalHoursCompleted = roadmap.milestones
      .filter(m => m.status === 'COMPLETED')
      .reduce((sum, m) => sum + (m.actualHours ?? m.estimatedHours), 0);

    // Normalize targetOutcome for the client
    const parsed = parseTargetOutcome(roadmap.targetOutcome);
    const normalizedOutcome = {
      type: (roadmap.targetOutcome as Record<string, unknown>)?.type ?? 'SKILL_SET',
      targetName: parsed.skillName,
      currentLevel: parsed.currentLevel,
      targetLevel: parsed.targetLevel,
      skillDefId: (roadmap.targetOutcome as Record<string, unknown>)?.skillDefId ?? null,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...roadmap,
        targetOutcome: normalizedOutcome,
        matchedCourses: Object.fromEntries(courseMap),
        stats: {
          completedMilestones,
          totalMilestones: roadmap.milestones.length,
          totalHoursCompleted,
          totalHoursEstimated: roadmap.totalEstimatedHours,
        },
      },
    });
  } catch (error) {
    logger.error('[SkillRoadmap] Detail GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve roadmap' },
      { status: 500 }
    );
  }
}
