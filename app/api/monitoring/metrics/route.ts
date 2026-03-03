/**
 * Monitoring Metrics API Route
 * Provides system metrics and performance data
 */

import { NextRequest, NextResponse } from 'next/server';

import { adminAuth } from '@/auth.admin';
import { AdminRole } from '@/types/admin-role';
import { safeErrorResponse } from '@/lib/api/safe-error';
import os from 'os';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await adminAuth();

    if (
      !session?.user ||
      (session.user.role !== AdminRole.ADMIN &&
        session.user.role !== AdminRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') ?? '1h';

    // Real system metrics
    const memUsage = process.memoryUsage();
    const uptimeSeconds = process.uptime();
    const cpuCount = os.cpus().length;
    const loadAvg = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const metrics = {
      period,
      timestamp: new Date().toISOString(),
      system: {
        cpu: {
          cores: cpuCount,
          loadAverage: loadAvg,
        },
        memory: {
          totalBytes: totalMem,
          freeBytes: freeMem,
          usedPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
        },
      },
      process: {
        uptime: Math.round(uptimeSeconds),
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        },
        pid: process.pid,
      },
    };

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    return safeErrorResponse(error, 500, 'MONITORING_METRICS');
  }
}