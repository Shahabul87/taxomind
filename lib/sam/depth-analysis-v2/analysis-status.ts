/**
 * Analysis Status Utility
 *
 * Simple utility to query the latest depth analysis for a course.
 * Used by the quality score banner on the course page.
 */

import { db } from '@/lib/db';

export interface AnalysisStatus {
  hasAnalysis: boolean;
  analysisId?: string;
  overallScore?: number;
  totalIssues?: number;
  analysisMethod?: 'ai' | 'rule-based' | 'hybrid';
  analyzedAt?: Date;
  /** Analysis is stale if course was updated after analysis */
  isStale?: boolean;
}

/**
 * Get the latest completed depth analysis for a course.
 * Returns a simple status object for UI display.
 */
export async function getLatestAnalysisForCourse(
  courseId: string,
): Promise<AnalysisStatus> {
  const analysis = await db.courseDepthAnalysisV2.findFirst({
    where: {
      courseId,
      status: 'COMPLETED',
    },
    orderBy: { analyzedAt: 'desc' },
    select: {
      id: true,
      overallScore: true,
      analysisMethod: true,
      analyzedAt: true,
      _count: {
        select: { issues: true },
      },
      course: {
        select: { updatedAt: true },
      },
    },
  });

  if (!analysis) {
    return { hasAnalysis: false };
  }

  const isStale = analysis.course.updatedAt > analysis.analyzedAt;

  return {
    hasAnalysis: true,
    analysisId: analysis.id,
    overallScore: analysis.overallScore,
    totalIssues: analysis._count.issues,
    analysisMethod: analysis.analysisMethod as 'ai' | 'rule-based' | 'hybrid',
    analyzedAt: analysis.analyzedAt,
    isStale,
  };
}
