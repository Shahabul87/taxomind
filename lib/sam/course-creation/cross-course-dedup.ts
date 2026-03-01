/**
 * Cross-Course Content Deduplication
 *
 * Searches existing course content via vector search to identify
 * overlapping topics and provides differentiation guidance to the
 * course planner.
 *
 * Gated behind ENABLE_RAG_RETRIEVAL env var (same as RAG system).
 */

import { searchContent } from '@/lib/sam/agentic-vector-search';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const RAG_ENABLED = process.env.ENABLE_RAG_RETRIEVAL === 'true';

// ============================================================================
// Types
// ============================================================================

export interface OverlappingCourse {
  courseId: string;
  courseTitle: string;
  matchedTopics: string[];
  highestSimilarity: number;
}

export interface DedupResult {
  hasOverlap: boolean;
  overlappingCourses: OverlappingCourse[];
  promptBlock: string;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Find overlapping course content for a proposed course.
 * Uses vector search to identify similar topics across existing courses.
 *
 * Returns a DedupResult with:
 * - overlappingCourses: List of courses with similar content
 * - promptBlock: Pre-formatted text to inject into the planner prompt
 *
 * When ENABLE_RAG_RETRIEVAL is false, returns a no-op result.
 *
 * @param courseTitle - Title of the course being planned
 * @param courseDescription - Description of the course
 * @param objectives - Learning objectives
 * @param userId - Creator's user ID (for filtering out their own courses)
 */
export async function findOverlappingCourseContent(
  courseTitle: string,
  courseDescription: string,
  objectives: string[],
  userId: string,
): Promise<DedupResult> {
  if (!RAG_ENABLED) {
    return { hasOverlap: false, overlappingCourses: [], promptBlock: '' };
  }

  try {
    // Build search query from course title + objectives
    const searchQuery = `${courseTitle}. ${objectives.slice(0, 3).join('. ')}`;

    const results = await searchContent(searchQuery, {
      topK: 20,
      minScore: 0.75,
      sourceTypes: ['course_chapter', 'course_section'],
    });

    if (results.length === 0) {
      return { hasOverlap: false, overlappingCourses: [], promptBlock: '' };
    }

    // Group results by course ID
    const courseMap = new Map<string, { topics: string[]; highestScore: number }>();
    for (const result of results) {
      const courseId = result.metadata?.courseId as string | undefined;
      if (!courseId) continue;

      const existing = courseMap.get(courseId) ?? { topics: [], highestScore: 0 };
      const topic = (result.metadata?.title as string) ?? result.content.slice(0, 80);
      if (!existing.topics.includes(topic)) {
        existing.topics.push(topic);
      }
      existing.highestScore = Math.max(existing.highestScore, result.score);
      courseMap.set(courseId, existing);
    }

    if (courseMap.size === 0) {
      return { hasOverlap: false, overlappingCourses: [], promptBlock: '' };
    }

    // Fetch course titles
    const courseIds = [...courseMap.keys()];
    const courses = await db.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true, userId: true },
    });

    const overlappingCourses: OverlappingCourse[] = courses
      .filter(c => c.userId !== userId) // Exclude creator's own courses
      .map(c => {
        const data = courseMap.get(c.id);
        return {
          courseId: c.id,
          courseTitle: c.title ?? 'Untitled Course',
          matchedTopics: data?.topics ?? [],
          highestSimilarity: data?.highestScore ?? 0,
        };
      })
      .filter(c => c.matchedTopics.length > 0)
      .sort((a, b) => b.highestSimilarity - a.highestSimilarity)
      .slice(0, 5); // Top 5 overlapping courses

    if (overlappingCourses.length === 0) {
      return { hasOverlap: false, overlappingCourses: [], promptBlock: '' };
    }

    // Build prompt block for differentiation guidance
    const courseLines = overlappingCourses.map(c =>
      `- "${c.courseTitle}" (${Math.round(c.highestSimilarity * 100)}% similarity): covers ${c.matchedTopics.slice(0, 3).join(', ')}`
    ).join('\n');

    const promptBlock = `
## EXISTING COURSE OVERLAP DETECTED
The following existing courses cover similar topics:
${courseLines}

DIFFERENTIATION GUIDANCE:
- Ensure this new course offers a UNIQUE ANGLE, perspective, or depth level
- Avoid duplicating the same examples, activities, or content structure
- Consider a different pedagogical approach, target audience, or application domain
- If overlap is high, emphasize what makes THIS course distinct in chapter titles and goals`;

    logger.info('[cross-course-dedup] Overlap detected', {
      courseTitle,
      overlappingCount: overlappingCourses.length,
      topSimilarity: overlappingCourses[0]?.highestSimilarity,
    });

    return {
      hasOverlap: true,
      overlappingCourses,
      promptBlock,
    };
  } catch (error) {
    logger.warn('[cross-course-dedup] Dedup check failed, proceeding without', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { hasOverlap: false, overlappingCourses: [], promptBlock: '' };
  }
}
