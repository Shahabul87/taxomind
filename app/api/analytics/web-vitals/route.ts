import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { performanceMonitoring } from '@/lib/performance-monitoring'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      name,
      value,
      rating,
      delta,
      id,
      navigationType,
      timestamp,
      url,
      userAgent,
      connectionType,
    } = body

    // Validate required fields
    if (!name || typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: name, value' },
        { status: 400 }
      )
    }

    // Store web vitals data in database
    await performanceMonitoring.traceDatabaseQuery(
      'create',
      'web_vitals',
      async () => {
        // Model doesn't exist, just log the data
        console.log('Web vital recorded:', {
          name,
          value,
          rating,
          delta,
          entryId: id,
          navigationType,
          timestamp: new Date(timestamp),
          url,
          userAgent,
          connectionType,
          sessionId: req.headers.get('x-session-id') || null,
        });
      }
    );

    // Check for performance issues and create alerts
    const thresholds = {
      LCP: 2500, // Largest Contentful Paint
      FID: 100,  // First Input Delay
      CLS: 0.1,  // Cumulative Layout Shift
      FCP: 1800, // First Contentful Paint
      TTFB: 800, // Time to First Byte
    }

    const threshold = thresholds[name as keyof typeof thresholds]
    if (threshold && value > threshold) {
      // Create performance alert
      // await db.performanceAlert.create({ // Model doesn't exist
      console.log('Performance alert:', {
        metric: name,
        value,
        threshold,
        severity: rating === 'poor' ? 'HIGH' : 'MEDIUM',
        url,
        timestamp: new Date(timestamp),
        resolved: false,
      });
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing web vitals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const timeframe = url.searchParams.get('timeframe') || '24h'
    const metric = url.searchParams.get('metric')

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
      ...(metric && { name: metric }),
    }

    const webVitals = await performanceMonitoring.traceDatabaseQuery(
      'findMany',
      'web_vitals',
      async () => {
        // return await db.webVital.findMany({ // Model doesn't exist
        return []; // Return empty array since model doesn't exist
      }
    )

    // Calculate aggregated metrics
    const aggregated = webVitals.reduce((acc: any, vital: any) => {
      if (!acc[vital.name]) {
        acc[vital.name] = {
          name: vital.name,
          count: 0,
          sum: 0,
          min: vital.value,
          max: vital.value,
          values: [],
          ratings: { good: 0, 'needs-improvement': 0, poor: 0 },
        }
      }

      const metric = acc[vital.name]
      metric.count++
      metric.sum += vital.value
      metric.min = Math.min(metric.min, vital.value)
      metric.max = Math.max(metric.max, vital.value)
      metric.values.push(vital.value)
      metric.ratings[vital.rating as keyof typeof metric.ratings]++

      return acc
    }, {} as any)

    // Calculate percentiles and averages
    Object.values(aggregated).forEach((metric: any) => {
      metric.average = metric.sum / metric.count
      metric.values.sort((a: number, b: number) => a - b)
      metric.p50 = metric.values[Math.floor(metric.count * 0.5)]
      metric.p75 = metric.values[Math.floor(metric.count * 0.75)]
      metric.p90 = metric.values[Math.floor(metric.count * 0.9)]
      metric.p95 = metric.values[Math.floor(metric.count * 0.95)]
      delete metric.values // Remove raw values to reduce response size
    })

    return NextResponse.json({
      timeframe,
      startDate,
      endDate: now,
      metrics: Object.values(aggregated),
      total: webVitals.length,
    })
  } catch (error) {
    console.error('Error fetching web vitals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}