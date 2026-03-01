import { logger } from '@/lib/logger';
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { performanceMonitoring } from '@/lib/performance-monitoring'
import { successResponse, apiErrors } from '@/lib/utils/api-response';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { currentUser } from '@/lib/auth';

const PageLoadSchema = z.object({
  dns: z.number().optional(),
  tcp: z.number().optional(),
  ssl: z.number().optional(),
  ttfb: z.number({ required_error: "TTFB is required" }),
  download: z.number().optional(),
  domInteractive: z.number().optional(),
  domComplete: z.number().optional(),
  loadComplete: z.number({ required_error: "loadComplete is required" }),
  url: z.string().optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
});

export async function POST(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(req, 'standard');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json()

    const parseResult = PageLoadSchema.safeParse(body);

    if (!parseResult.success) {
      return apiErrors.validationError({ errors: parseResult.error.flatten().fieldErrors });
    }

    const {
      dns,
      tcp,
      ssl,
      ttfb,
      download,
      domInteractive,
      domComplete,
      loadComplete,
      url,
      timestamp,
    } = parseResult.data;

    // Store page load performance data (currently disabled for build compatibility)
    await performanceMonitoring.traceDatabaseQuery(
      'create',
      'page_performance',
      async () => {
        // TODO: Implement proper page performance storage model
        console.log('Page performance data:', {
          url,
          dnsLookup: dns || 0,
          tcpConnect: tcp || 0,
          sslHandshake: ssl || 0,
          timeToFirstByte: ttfb,
          download: download || 0,
          domInteractive: domInteractive || 0,
          domComplete: domComplete || 0,
          loadComplete,
          timestamp: new Date(timestamp),
        })
      }
    )

    // Check for slow page loads
    const slowThresholds = {
      ttfb: 800,
      loadComplete: 3000,
      domInteractive: 2000,
    }

    const alerts = []
    if (ttfb > slowThresholds.ttfb) {
      alerts.push({ metric: 'TTFB', value: ttfb, threshold: slowThresholds.ttfb })
    }
    if (loadComplete > slowThresholds.loadComplete) {
      alerts.push({ metric: 'Load Complete', value: loadComplete, threshold: slowThresholds.loadComplete })
    }
    if (domInteractive > slowThresholds.domInteractive) {
      alerts.push({ metric: 'DOM Interactive', value: domInteractive, threshold: slowThresholds.domInteractive })
    }

    // Create alerts for slow page loads (currently disabled for build compatibility)
    for (const alert of alerts) {
      // TODO: Implement proper performance alert model
      console.log('Performance alert:', {
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        severity: 'MEDIUM',
        url,
        timestamp: new Date(timestamp),
      })
    }

    return successResponse({ alerts: alerts.length })
  } catch (error) {
    logger.error('Error storing page load data:', error)
    return apiErrors.internal()
  }
}

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url)
    const timeframe = url.searchParams.get('timeframe') || '24h'
    const pageUrl = url.searchParams.get('url')

    // Calculate date range
    const now = new Date()
    const timeframes = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
    }
    
    const hours = timeframes[timeframe as keyof typeof timeframes] || 24
    const startDate = new Date(now.getTime() - hours * 60 * 60 * 1000)

    // Build query
    const where = {
      timestamp: {
        gte: startDate,
      },
      ...(pageUrl && { url: pageUrl }),
    }

    const pageLoads = await performanceMonitoring.traceDatabaseQuery(
      'findMany',
      'page_performance',
      async () => {
        // TODO: Implement proper page performance data retrieval
        return []
      }
    )

    // Calculate aggregated metrics
    const metrics = [
      'dnsLookup',
      'tcpConnect',
      'sslHandshake',
      'timeToFirstByte',
      'download',
      'domInteractive',
      'domComplete',
      'loadComplete',
    ]

    const aggregated = metrics.reduce((acc, metric) => {
      const values = pageLoads.map(p => p[metric as keyof typeof p] as number).filter(v => v > 0)
      
      if (values.length > 0) {
        values.sort((a, b) => a - b)
        acc[metric] = {
          count: values.length,
          average: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          p50: values[Math.floor(values.length * 0.5)],
          p75: values[Math.floor(values.length * 0.75)],
          p90: values[Math.floor(values.length * 0.9)],
          p95: values[Math.floor(values.length * 0.95)],
        }
      }

      return acc
    }, {} as any)

    // Calculate page-specific metrics if URL filter is applied
    let pageSpecific = null
    if (pageUrl) {
      // TODO: Implement page-specific metrics once page performance model is available
      pageSpecific = {
        url: pageUrl,
        totalLoads: 0,
        averageLoadTime: 0,
        fastestLoad: 0,
        slowestLoad: 0,
      }
    }

    return successResponse({
      timeframe,
      startDate,
      endDate: now,
      totalPageLoads: pageLoads.length,
      metrics: aggregated,
      pageSpecific,
    })
  } catch (error) {
    logger.error('Error fetching page load data:', error)
    return apiErrors.internal()
  }
}