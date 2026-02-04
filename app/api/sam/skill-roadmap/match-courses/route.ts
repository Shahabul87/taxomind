/**
 * Course Matching API
 *
 * POST /api/sam/skill-roadmap/match-courses
 * Finds platform courses matching skill keywords with scoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

const MatchCoursesSchema = z.object({
  skillName: z.string().min(2),
  keywords: z.array(z.string()).max(10).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  limit: z.number().min(1).max(20).default(5),
});

interface CourseMatch {
  courseId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  score: number;
  matchReasons: string[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = MatchCoursesSchema.parse(body);

    const keywords = [
      validated.skillName,
      ...(validated.keywords ?? []),
    ].filter(Boolean);

    // Search courses by title/description containing keywords
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        OR: keywords.flatMap(kw => [
          { title: { contains: kw, mode: 'insensitive' as const } },
          { description: { contains: kw, mode: 'insensitive' as const } },
        ]),
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        categoryId: true,
      },
      take: 50,
    });

    // Also check CourseSkill matches
    const skillMatches = await db.courseSkill.findMany({
      where: {
        skill: {
          name: { contains: validated.skillName, mode: 'insensitive' },
        },
      },
      select: {
        courseId: true,
        level: true,
        isCoreSkill: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            isPublished: true,
          },
        },
      },
      take: 20,
    });

    // Score and deduplicate
    const scored = new Map<string, CourseMatch>();

    // Score from direct CourseSkill matches
    for (const match of skillMatches) {
      if (!match.course.isPublished) continue;
      const existing = scored.get(match.courseId);
      const baseScore = (existing?.score ?? 0) + 40;
      const reasons = existing?.matchReasons ?? [];
      reasons.push(`Direct skill match${match.isCoreSkill ? ' (core)' : ''}`);

      scored.set(match.courseId, {
        courseId: match.courseId,
        title: match.course.title,
        description: match.course.description,
        imageUrl: match.course.imageUrl,
        score: baseScore + (match.isCoreSkill ? 10 : 0),
        matchReasons: reasons,
      });
    }

    // Score from title/description matches
    for (const course of courses) {
      const existing = scored.get(course.id);
      let score = existing?.score ?? 0;
      const reasons = existing?.matchReasons ?? [];

      for (const kw of keywords) {
        const kwLower = kw.toLowerCase();
        if (course.title?.toLowerCase().includes(kwLower)) {
          score += 25;
          reasons.push(`Title contains "${kw}"`);
        }
        if (course.description?.toLowerCase().includes(kwLower)) {
          score += 15;
          reasons.push(`Description contains "${kw}"`);
        }
      }

      if (score > (existing?.score ?? 0)) {
        scored.set(course.id, {
          courseId: course.id,
          title: course.title,
          description: course.description,
          imageUrl: course.imageUrl,
          score,
          matchReasons: reasons,
        });
      }
    }

    // Sort by score and limit
    const results = Array.from(scored.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, validated.limit);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('[SkillRoadmap] Course matching error:', error);
    return NextResponse.json(
      { error: 'Failed to match courses' },
      { status: 500 }
    );
  }
}
