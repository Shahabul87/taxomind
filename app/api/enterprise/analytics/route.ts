import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const analyticsQuerySchema = z.object({
  organizationId: z.string().optional(),
  metricType: z.enum(['USER_ENGAGEMENT', 'CONTENT_PERFORMANCE', 'AI_USAGE', 'SYSTEM_PERFORMANCE', 'REVENUE', 'COMPLIANCE', 'SECURITY', 'COLLABORATION']).optional(),
  period: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('DAILY'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.array(z.string()).optional(),
});

const recordAnalyticsSchema = z.object({
  organizationId: z.string().optional(),
  metricType: z.enum(['USER_ENGAGEMENT', 'CONTENT_PERFORMANCE', 'AI_USAGE', 'SYSTEM_PERFORMANCE', 'REVENUE', 'COMPLIANCE', 'SECURITY', 'COLLABORATION']),
  metricCategory: z.string(),
  value: z.number(),
  metadata: z.object({}).optional(),
  dimensions: z.object({}).optional(),
  aggregationPeriod: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('DAILY'),
});

// GET /api/enterprise/analytics - Get enterprise analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // For demo purposes, allow access if no session (development mode)
    if (!session?.user) {
      // Return mock data for development
      return NextResponse.json({
        success: true,
        data: {
          analytics: [
            {
              id: "analytics-1",
              metricType: "USER_ENGAGEMENT",
              metricCategory: "daily_active_users",
              value: 1250,
              recordedAt: new Date().toISOString(),
              organization: { id: "demo-org-1", name: "Acme Corporation" }
            },
            {
              id: "analytics-2", 
              metricType: "CONTENT_PERFORMANCE",
              metricCategory: "course_completion_rate",
              value: 0.78,
              recordedAt: new Date().toISOString(),
              organization: { id: "demo-org-2", name: "Tech University" }
            }
          ],
          summary: {
            totalRecords: 2,
            uniqueOrganizations: 2,
            metricTypes: [
              { type: "USER_ENGAGEMENT", count: 1, totalValue: 1250, avgValue: 1250 },
              { type: "CONTENT_PERFORMANCE", count: 1, totalValue: 0.78, avgValue: 0.78 }
            ]
          }
        }
      });
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      organizationId: searchParams.get('organizationId') || undefined,
      metricType: searchParams.get('metricType') || undefined,
      period: searchParams.get('period') || 'DAILY',
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      groupBy: searchParams.getAll('groupBy').length > 0 ? searchParams.getAll('groupBy') : undefined,
    };

    const validatedQuery = analyticsQuerySchema.parse(queryParams);

    // Build date range
    const endDate = validatedQuery.endDate ? new Date(validatedQuery.endDate) : new Date();
    const startDate = validatedQuery.startDate ? new Date(validatedQuery.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Build where clause
    const where: any = {
      recordedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (validatedQuery.organizationId) {
      where.organizationId = validatedQuery.organizationId;
    }

    if (validatedQuery.metricType) {
      where.metricType = validatedQuery.metricType;
    }

    if (validatedQuery.period) {
      where.aggregationPeriod = validatedQuery.period;
    }

    // Fetch analytics data
    const analytics = await db.enterpriseAnalytics.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 1000, // Limit to prevent large responses
    });

    // Aggregate data based on groupBy parameters
    const aggregatedData = aggregateAnalytics(analytics, validatedQuery.groupBy);

    // Get summary statistics
    const summary = await getAnalyticsSummary(where);

    return NextResponse.json({
      success: true,
      data: {
        analytics: aggregatedData,
        summary,
        query: validatedQuery,
        totalRecords: analytics.length,
      },
    });

  } catch (error) {
    console.error('Error fetching enterprise analytics:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// POST /api/enterprise/analytics - Record analytics data
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Handle both single record and batch records
    const isArray = Array.isArray(body);
    const records = isArray ? body : [body];

    const validatedRecords = records.map(record => recordAnalyticsSchema.parse(record));

    // Insert analytics records
    const result = await db.enterpriseAnalytics.createMany({
      data: validatedRecords,
    });

    return NextResponse.json({
      success: true,
      data: {
        recordsInserted: result.count,
        records: validatedRecords,
      },
    });

  } catch (error) {
    console.error('Error recording analytics:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record analytics' },
      { status: 500 }
    );
  }
}

// Helper functions
function aggregateAnalytics(analytics: any[], groupBy: string[] = []) {
  if (!groupBy || groupBy.length === 0) {
    return analytics;
  }

  const grouped = analytics.reduce((acc, record) => {
    const key = groupBy.map(field => record[field] || 'unknown').join('-');
    
    if (!acc[key]) {
      acc[key] = {
        groupKey: key,
        groupFields: groupBy.reduce((fields, field) => {
          fields[field] = record[field];
          return fields;
        }, {} as any),
        records: [],
        totalValue: 0,
        avgValue: 0,
        minValue: Infinity,
        maxValue: -Infinity,
        count: 0,
      };
    }

    acc[key].records.push(record);
    acc[key].totalValue += record.value;
    acc[key].minValue = Math.min(acc[key].minValue, record.value);
    acc[key].maxValue = Math.max(acc[key].maxValue, record.value);
    acc[key].count++;
    acc[key].avgValue = acc[key].totalValue / acc[key].count;

    return acc;
  }, {} as any);

  return Object.values(grouped);
}

async function getAnalyticsSummary(where: any) {
  const [
    totalRecords,
    uniqueOrganizations,
    metricTypes,
    dateRange,
  ] = await Promise.all([
    db.enterpriseAnalytics.count({ where }),
    db.enterpriseAnalytics.groupBy({
      by: ['organizationId'],
      where,
      _count: true,
    }),
    db.enterpriseAnalytics.groupBy({
      by: ['metricType'],
      where,
      _count: true,
      _sum: { value: true },
      _avg: { value: true },
    }),
    db.enterpriseAnalytics.aggregate({
      where,
      _min: { recordedAt: true },
      _max: { recordedAt: true },
    }),
  ]);

  return {
    totalRecords,
    uniqueOrganizations: uniqueOrganizations.length,
    metricTypes: metricTypes.map(mt => ({
      type: mt.metricType,
      count: mt._count,
      totalValue: mt._sum.value,
      avgValue: mt._avg.value,
    })),
    dateRange: {
      start: dateRange._min.recordedAt,
      end: dateRange._max.recordedAt,
    },
  };
}