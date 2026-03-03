import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  MILESTONE_HOURS,
} from '@/lib/sam/stores/prisma-skill-mastery-10k-store';
import { SkillMastery10K } from '@prisma/client';

// Get milestone hours as sorted array for finding next milestone
const MILESTONE_HOURS_ARRAY = Object.values(MILESTONE_HOURS).sort((a, b) => a - b);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetMasteryQuerySchema = z.object({
  courseId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['qualityHours', 'totalRawHours', 'lastPracticedAt', 'proficiencyLevel']).optional().default('qualityHours'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// GET - List all user skill masteries
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetMasteryQuerySchema.parse({
      courseId: searchParams.get('courseId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    });

    // Get all masteries for the user
    const masteries: SkillMastery10K[] = await db.skillMastery10K.findMany({
      where: { userId: session.user.id },
      take: 200,
    });

    // Get skill definitions for enrichment
    const skillIds = masteries.map((m: SkillMastery10K) => m.skillId);
    const skills = await db.skillBuildDefinition.findMany({
      where: { id: { in: skillIds } },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
      },
      take: 200,
    });

    const skillsById = new Map(skills.map((s) => [s.id, s]));

    // Enrich masteries with skill data
    const enrichedMasteries = masteries.map((mastery: SkillMastery10K) => ({
      ...mastery,
      skill: skillsById.get(mastery.skillId) ?? null,
      progressTo10K: Math.min((mastery.totalQualityHours / 10000) * 100, 100),
      nextMilestone: MILESTONE_HOURS_ARRAY.find((h) => h > mastery.totalQualityHours) ?? 10000,
      proficiencyInfo: {
        level: mastery.proficiencyLevel,
        description: getProficiencyDescription(mastery.proficiencyLevel),
      },
    }));

    // Sort the results
    enrichedMasteries.sort((a: typeof enrichedMasteries[0], b: typeof enrichedMasteries[0]) => {
      const order = query.sortOrder === 'asc' ? 1 : -1;
      switch (query.sortBy) {
        case 'totalRawHours':
          return (a.totalRawHours - b.totalRawHours) * order;
        case 'lastPracticedAt':
          const aDate = a.lastPracticedAt ? new Date(a.lastPracticedAt).getTime() : 0;
          const bDate = b.lastPracticedAt ? new Date(b.lastPracticedAt).getTime() : 0;
          return (aDate - bDate) * order;
        case 'proficiencyLevel':
          return (getProficiencyOrder(a.proficiencyLevel) - getProficiencyOrder(b.proficiencyLevel)) * order;
        case 'qualityHours':
        default:
          return (a.totalQualityHours - b.totalQualityHours) * order;
      }
    });

    // Apply pagination
    const paginatedMasteries = enrichedMasteries.slice(
      query.offset,
      query.offset + query.limit
    );

    // Calculate aggregated stats
    const totalQualityHours = masteries.reduce((sum: number, m: SkillMastery10K) => sum + m.totalQualityHours, 0);
    const totalRawHours = masteries.reduce((sum: number, m: SkillMastery10K) => sum + m.totalRawHours, 0);
    const totalSessions = masteries.reduce((sum: number, m: SkillMastery10K) => sum + m.sessionsCount, 0);
    const bestStreak = masteries.length > 0 ? Math.max(...masteries.map((m: SkillMastery10K) => m.longestStreak)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        masteries: paginatedMasteries,
        aggregated: {
          totalSkills: masteries.length,
          totalQualityHours,
          totalRawHours,
          totalSessions,
          bestStreak,
          overallProgress: (totalQualityHours / 10000) * 100,
        },
        milestoneHours: MILESTONE_HOURS,
        pagination: {
          total: masteries.length,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < masteries.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching skill masteries:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch skill masteries' },
      { status: 500 }
    );
  }
}

// Helper functions
function getProficiencyDescription(level: string): string {
  const descriptions: Record<string, string> = {
    BEGINNER: 'Just starting out (0-100 hours)',
    NOVICE: 'Building foundations (100-500 hours)',
    INTERMEDIATE: 'Developing competence (500-1,000 hours)',
    COMPETENT: 'Solid skills (1,000-2,500 hours)',
    PROFICIENT: 'High proficiency (2,500-5,000 hours)',
    ADVANCED: 'Expert-level (5,000-7,500 hours)',
    EXPERT: 'Near mastery (7,500-10,000 hours)',
    MASTER: '10,000 hours achieved!',
  };
  return descriptions[level] ?? 'Unknown level';
}

function getProficiencyOrder(level: string): number {
  const order: Record<string, number> = {
    BEGINNER: 1,
    NOVICE: 2,
    INTERMEDIATE: 3,
    COMPETENT: 4,
    PROFICIENT: 5,
    ADVANCED: 6,
    EXPERT: 7,
    MASTER: 8,
  };
  return order[level] ?? 0;
}
