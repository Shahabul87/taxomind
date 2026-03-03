import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetSkillsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================================================
// GET - List all available skills for practice
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetSkillsQuerySchema.parse({
      category: searchParams.get('category') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    if (query.category) {
      whereClause.category = query.category;
    }

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Get skills from database
    const [skills, total] = await Promise.all([
      db.skillBuildDefinition.findMany({
        where: whereClause,
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
        skip: query.offset,
        take: query.limit,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          tags: true,
          difficultyFactor: true,
          createdAt: true,
        },
      }),
      db.skillBuildDefinition.count({ where: whereClause }),
    ]);

    // Get user's mastery info for these skills
    const skillIds = skills.map((s) => s.id);
    const userMasteries = await db.skillMastery10K.findMany({
      where: {
        userId: session.user.id,
        skillId: { in: skillIds },
      },
      select: {
        skillId: true,
        totalQualityHours: true,
        currentStreak: true,
        proficiencyLevel: true,
        lastPracticedAt: true,
      },
      take: 200,
    });

    const masteryBySkillId = new Map(
      userMasteries.map((m) => [m.skillId, m])
    );

    // Enrich skills with user's mastery data
    const enrichedSkills = skills.map((skill) => {
      const mastery = masteryBySkillId.get(skill.id);
      return {
        ...skill,
        mastery: mastery
          ? {
              totalQualityHours: mastery.totalQualityHours,
              currentStreak: mastery.currentStreak,
              proficiencyLevel: mastery.proficiencyLevel,
              lastPracticedAt: mastery.lastPracticedAt,
            }
          : null,
      };
    });

    // Get unique categories for filtering
    const categories = await db.skillBuildDefinition.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: {
        skills: enrichedSkills,
        categories: categories.map((c) => c.category).filter(Boolean),
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < total,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching skills:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}
