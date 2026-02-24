/**
 * Course Creation SLO Dashboard - Admin API
 *
 * GET /api/admin/course-creation-slo?hours=168
 *
 * Returns aggregated SLO metrics for course creation pipeline runs
 * within the specified time window (default 24 hours, max 720 = 30 days).
 *
 * Admin-only endpoint using the separate admin authentication system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/auth.admin';
import { AdminRole } from '@/types/admin-role';
import { getCourseCreationSLODashboard } from '@/lib/sam/course-creation/slo-telemetry';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await adminAuth();

    if (
      !session ||
      !session.user ||
      (session.user.role !== AdminRole.ADMIN &&
        session.user.role !== AdminRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' },
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const hoursParam = searchParams.get('hours');
    const hoursRaw = hoursParam ? parseInt(hoursParam, 10) : 24;
    const hours = Number.isFinite(hoursRaw)
      ? Math.max(1, Math.min(720, Math.floor(hoursRaw)))
      : 24;

    const dashboard = await getCourseCreationSLODashboard(hours);

    return NextResponse.json({
      success: true,
      data: dashboard,
      metadata: {
        hours,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[CourseCreationSLO API] Failed to fetch dashboard', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch course creation SLO dashboard',
        },
      },
      { status: 500 },
    );
  }
}
