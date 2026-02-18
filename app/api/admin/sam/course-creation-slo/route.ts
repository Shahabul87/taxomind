import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getCourseCreationSLODashboard } from '@/lib/sam/course-creation/slo-telemetry';
import { getCanaryComparisonStats } from '@/lib/sam/course-creation/experiments';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const hoursRaw = Number(searchParams.get('hours') ?? '24');
    const hours = Number.isFinite(hoursRaw) ? Math.max(1, Math.min(24 * 30, Math.floor(hoursRaw))) : 24;
    const experimentId = searchParams.get('experimentId') ?? 'enterprise-rollout-canary-v1';

    const [sloDashboard, canaryComparison] = await Promise.all([
      getCourseCreationSLODashboard(hours),
      getCanaryComparisonStats(experimentId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        periodHours: hours,
        sloDashboard,
        canaryComparison,
      },
    });
  } catch (error) {
    logger.error('[CourseCreationSLO API] Failed to fetch dashboard', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch course creation SLO dashboard' } },
      { status: 500 },
    );
  }
}
