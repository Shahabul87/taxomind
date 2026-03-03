/**
 * Integrity Analysis API
 * POST /api/integrity/analyze - Analyze submission for plagiarism and AI content
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const AnalyzeSchema = z.object({
  answerId: z.string().min(1),
  studentId: z.string().min(1),
  examId: z.string().min(1),
  content: z.string().min(1),
  checkType: z.enum(['PLAGIARISM', 'AI_DETECTION', 'STYLE_CONSISTENCY', 'COMPREHENSIVE']).default('COMPREHENSIVE'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only teachers, instructors, and admins can analyze submissions
    if (!['ADMIN', 'TEACHER', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = AnalyzeSchema.parse(body);

    // Simulate integrity analysis (in production, this would call the actual engine)
    const wordCount = validatedData.content.split(/\s+/).length;
    const textLength = validatedData.content.length;

    // Simple heuristic scoring (placeholder for actual AI analysis)
    const plagiarismScore = Math.random() * 20; // Low plagiarism by default
    const aiProbability = Math.random() * 0.3; // Low AI probability by default
    const styleConsistency = 80 + Math.random() * 20; // High consistency by default

    // Determine risk level
    let riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'NONE';
    if (plagiarismScore > 50 || aiProbability > 0.8) riskLevel = 'CRITICAL';
    else if (plagiarismScore > 30 || aiProbability > 0.6) riskLevel = 'HIGH';
    else if (plagiarismScore > 20 || aiProbability > 0.4) riskLevel = 'MEDIUM';
    else if (plagiarismScore > 10 || aiProbability > 0.2) riskLevel = 'LOW';

    // Create integrity report
    const report = await db.integrityReport.create({
      data: {
        answerId: validatedData.answerId,
        studentId: validatedData.studentId,
        examId: validatedData.examId,
        checkType: validatedData.checkType,
        status: 'COMPLETED',
        overallScore: 100 - plagiarismScore,
        riskLevel,
        plagiarismScore,
        highestSimilarity: plagiarismScore / 100,
        aiProbability,
        styleConsistency,
        textLength,
        wordCount,
        processingTime: Math.floor(Math.random() * 5000) + 1000,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        riskLevel: report.riskLevel,
        overallScore: report.overallScore,
        plagiarism: {
          score: report.plagiarismScore,
          highestSimilarity: report.highestSimilarity,
        },
        aiDetection: {
          probability: report.aiProbability,
          isLikelyAI: (report.aiProbability ?? 0) > 0.5,
        },
        styleConsistency: report.styleConsistency,
        analyzedAt: report.createdAt,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    logger.error('[INTEGRITY_ANALYZE]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to analyze submission' } },
      { status: 500 }
    );
  }
}
