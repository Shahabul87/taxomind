/**
 * Skill Roadmap List + Detail API
 *
 * GET /api/sam/skill-roadmap - List all user roadmaps
 * GET /api/sam/skill-roadmap?id=xxx - Get specific roadmap detail
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

/**
 * Extract display data from targetOutcome JSON.
 * Handles both old format (targetSkills array) and new format (top-level currentLevel/targetLevel).
 * Sanitizes internal DB type names so they never leak into the UI.
 */
function parseTargetOutcome(raw: unknown): {
  skillName: string;
  currentLevel: string;
  targetLevel: string;
} {
  const outcome = raw as Record<string, unknown> | null;
  if (!outcome) return { skillName: '', currentLevel: '', targetLevel: '' };

  // Skill name: try targetName first, but reject internal DB type names
  const rawName = (outcome.targetName as string) ?? '';
  const skillName = isInternalName(rawName) ? '' : rawName;

  // Levels: try top-level first (new format), then targetSkills[0] (old format)
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

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roadmapId = searchParams.get('id');

    // Detail view
    if (roadmapId) {
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
    }

    // List view
    const roadmaps = await db.skillBuildRoadmap.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        milestones: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      take: 20,
    });

    const roadmapSummaries = roadmaps.map(r => {
      const parsed = parseTargetOutcome(r.targetOutcome);
      // Derive display name: skillName > meaningful title > 'Untitled'
      const displayName = parsed.skillName
        || (r.title && !r.title.includes('SKILL_SET') ? r.title : '')
        || 'Untitled Roadmap';
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        completionPercentage: r.completionPercentage,
        skillName: displayName,
        currentLevel: parsed.currentLevel,
        targetLevel: parsed.targetLevel,
        milestoneCount: r.milestones.length,
        completedMilestones: r.milestones.filter(m => m.status === 'COMPLETED').length,
        totalEstimatedHours: r.totalEstimatedHours,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return NextResponse.json({ success: true, data: roadmapSummaries });
  } catch (error) {
    logger.error('[SkillRoadmap] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve roadmaps' },
      { status: 500 }
    );
  }
}
