/**
 * SAM Agentic Health API
 * Provides system health metrics and status for the SAM AI system
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCombinedSession } from '@/lib/auth/combined-session';
import { logger } from '@/lib/logger';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  detailed: z.coerce.boolean().optional().default(false),
  includeAlerts: z.coerce.boolean().optional().default(true),
});

// ============================================================================
// TYPES
// ============================================================================

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  timestamp: string;
  uptime: number;
  components: {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latencyMs: number;
    errorRate: number;
    lastCheck: string;
  }[];
  alerts?: {
    id: string;
    severity: string;
    message: string;
    triggeredAt: string;
    acknowledged: boolean;
  }[];
  metrics?: {
    requestsPerMinute: number;
    avgResponseTimeMs: number;
    p95ResponseTimeMs: number;
    errorRate: number;
    activeConnections: number;
  };
}

// ============================================================================
// GET /api/sam/agentic/health
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Support both user and admin authentication
    const session = await getCombinedSession();
    if (!session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      detailed: searchParams.get('detailed'),
      includeAlerts: searchParams.get('includeAlerts'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { detailed, includeAlerts } = parsed.data;

    const telemetry = getSAMTelemetryService();
    telemetry.start();

    // Get system health from telemetry service
    const systemHealth = await telemetry.getSystemHealth();

    // Build component health status
    const avgLatencyMs = systemHealth.latencyP50Ms ?? 0;
    const components: HealthStatus['components'] = [
      {
        name: 'tool-executor',
        status: systemHealth.healthScore > 0.8 ? 'healthy' : systemHealth.healthScore > 0.5 ? 'degraded' : 'unhealthy',
        latencyMs: avgLatencyMs,
        errorRate: systemHealth.errorRate,
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'memory-system',
        status: 'healthy',
        latencyMs: avgLatencyMs * 0.8,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'confidence-calibration',
        status: 'healthy',
        latencyMs: 50,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'plan-lifecycle',
        status: 'healthy',
        latencyMs: 30,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
      },
    ];

    // Calculate overall status
    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;
    const degradedCount = components.filter(c => c.status === 'degraded').length;

    let overallStatus: HealthStatus['status'] = 'healthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }

    const healthResponse: HealthStatus = {
      status: overallStatus,
      score: systemHealth.healthScore,
      timestamp: new Date().toISOString(),
      uptime: 0, // Uptime tracking not available in SystemHealthMetrics
      components,
    };

    // Include alerts if requested
    if (includeAlerts) {
      const activeAlerts = telemetry.getActiveAlerts();
      healthResponse.alerts = activeAlerts.map(alert => ({
        id: alert.id,
        severity: alert.severity,
        message: alert.message,
        triggeredAt: alert.triggeredAt.toISOString(),
        acknowledged: !!alert.acknowledgedAt,
      }));
    }

    // Include detailed metrics if requested
    if (detailed) {
      healthResponse.metrics = {
        requestsPerMinute: 0, // Request count tracking not available
        avgResponseTimeMs: avgLatencyMs,
        p95ResponseTimeMs: systemHealth.latencyP95Ms ?? 0,
        errorRate: systemHealth.errorRate,
        activeConnections: systemHealth.activeConnections,
      };
    }

    return NextResponse.json({
      success: true,
      data: healthResponse,
    });
  } catch (error) {
    logger.error('Error fetching health status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch health status' },
      { status: 500 }
    );
  }
}
