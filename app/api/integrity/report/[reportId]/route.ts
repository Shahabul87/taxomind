/**
 * Integrity Report API
 * GET /api/integrity/report/[reportId] - Get integrity report by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const user = await currentUser();
    const { reportId } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const report = await db.integrityReport.findUnique({
      where: { id: reportId },
      include: {
        matches: true,
        student: {
          select: { id: true, name: true, email: true },
        },
        exam: {
          select: { id: true, title: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } },
        { status: 404 }
      );
    }

    // Authorization: Only the student (their own report), teachers, or admins can view
    const isOwner = report.studentId === user.id;
    const isPrivileged = ['ADMIN', 'TEACHER', 'INSTRUCTOR'].includes(user.role);

    if (!isOwner && !isPrivileged) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        answerId: report.answerId,
        student: isPrivileged ? report.student : undefined,
        exam: report.exam,
        checkType: report.checkType,
        status: report.status,
        riskLevel: report.riskLevel,
        overallScore: report.overallScore,
        plagiarismScore: report.plagiarismScore,
        highestSimilarity: report.highestSimilarity,
        aiProbability: report.aiProbability,
        styleConsistency: report.styleConsistency,
        matches: report.matches.map((m) => ({
          id: m.id,
          sourceType: m.sourceType,
          sourceId: m.sourceId,
          sourceTitle: m.sourceTitle,
          similarity: m.similarity,
          matchedText: m.matchedText,
        })),
        reviewedBy: report.reviewedBy,
        reviewedAt: report.reviewedAt,
        reviewNotes: report.reviewNotes,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('[INTEGRITY_REPORT_GET]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch report' } },
      { status: 500 }
    );
  }
}
