import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { samTrendsEngine } from '@/lib/sam-trends-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  analyzeTrendsSchema,
  compareTrendsSchema,
  predictTrendSchema,
  industryReportSchema,
  searchQuerySchema,
  trendInteractionSchema,
  sanitizeString
} from '@/lib/validators/sam-validators';
import { rateLimiters, RateLimiter, rateLimitResponse } from '@/lib/rate-limiter';

// Error response helper
function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

// Validation helper
function validateInput<T>(schema: z.ZodSchema<T>, data: any): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Invalid input' };
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401);
    }

    // Rate limiting
    const rateLimitResult = await rateLimiters.search.check(
      RateLimiter.getIdentifier(req, session.user.id)
    );
    
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'analyze': {
        const params = {
          category: searchParams.get('category') || undefined,
          timeframe: searchParams.get('timeframe') || undefined,
          impact: searchParams.get('impact') || undefined,
          minRelevance: searchParams.get('minRelevance') || undefined,
        };

        const validation = validateInput(analyzeTrendsSchema, params);
        if (!validation.success) {
          return errorResponse(validation.error);
        }

        const trends = await samTrendsEngine.analyzeTrends(validation.data);
        return NextResponse.json({ trends });
      }

      case 'categories': {
        const categories = await samTrendsEngine.getTrendCategories();
        return NextResponse.json({ categories });
      }

      case 'signals': {
        const trendId = searchParams.get('trendId');
        if (!trendId) {
          return errorResponse('Trend ID required');
        }

        // Validate trend ID format
        if (!/^[\w-]+$/.test(trendId)) {
          return errorResponse('Invalid trend ID format');
        }

        try {
          const signals = await samTrendsEngine.detectMarketSignals(trendId);
          return NextResponse.json({ signals });
        } catch (error) {
          return errorResponse('Trend not found', 404);
        }
      }

      case 'compare': {
        const params = {
          trendId1: searchParams.get('trendId1'),
          trendId2: searchParams.get('trendId2'),
        };

        const validation = validateInput(compareTrendsSchema, params);
        if (!validation.success) {
          return errorResponse(validation.error);
        }

        try {
          const comparison = await samTrendsEngine.compareTrends(
            validation.data.trendId1,
            validation.data.trendId2
          );
          return NextResponse.json({ comparison });
        } catch (error) {
          return errorResponse('One or both trends not found', 404);
        }
      }

      case 'predict': {
        const params = {
          trendId: searchParams.get('trendId'),
          horizon: searchParams.get('horizon'),
        };

        const validation = validateInput(predictTrendSchema, params);
        if (!validation.success) {
          return errorResponse(validation.error);
        }

        try {
          const prediction = await samTrendsEngine.predictTrendTrajectory(
            validation.data.trendId,
            validation.data.horizon
          );
          return NextResponse.json({ prediction });
        } catch (error) {
          return errorResponse('Trend not found', 404);
        }
      }

      case 'industry-report': {
        const params = {
          industry: searchParams.get('industry'),
        };

        const validation = validateInput(industryReportSchema, params);
        if (!validation.success) {
          return errorResponse(validation.error);
        }

        const report = await samTrendsEngine.generateIndustryReport(
          sanitizeString(validation.data.industry)
        );
        return NextResponse.json({ report });
      }

      case 'search': {
        const params = {
          query: searchParams.get('query'),
        };

        const validation = validateInput(searchQuerySchema, params);
        if (!validation.success) {
          return errorResponse(validation.error);
        }

        const results = await samTrendsEngine.searchTrends(
          sanitizeString(validation.data.query)
        );
        return NextResponse.json({ results });
      }

      case 'trending': {
        const trending = await samTrendsEngine.getTrendingNow();
        return NextResponse.json({ trending });
      }

      case 'emerging': {
        const emerging = await samTrendsEngine.getEmergingTrends();
        return NextResponse.json({ emerging });
      }

      case 'educational': {
        const educational = await samTrendsEngine.getEducationalTrends();
        return NextResponse.json({ educational });
      }

      default: {
        // Default: get all trends with rate limiting
        const trends = await samTrendsEngine.analyzeTrends();
        return NextResponse.json({ trends });
      }
    }
  } catch (error) {
    logger.error('AI Trends API error:', error);
    // Don't expose internal errors
    return errorResponse('An error occurred processing your request', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401);
    }

    // Rate limiting for POST requests
    const rateLimitResult = await rateLimiters.general.check(
      RateLimiter.getIdentifier(req, session.user.id)
    );
    
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case 'record-interaction': {
        const validation = validateInput(trendInteractionSchema, params);
        if (!validation.success) {
          return errorResponse(validation.error);
        }

        await samTrendsEngine.recordInteraction(
          session.user.id,
          validation.data.trendId,
          validation.data.interactionType
        );

        return NextResponse.json({ success: true });
      }

      case 'analyze-custom': {
        // Rate limit heavy operations
        const heavyRateLimit = await rateLimiters.heavy.check(
          RateLimiter.getIdentifier(req, session.user.id)
        );
        
        if (!heavyRateLimit.allowed) {
          return rateLimitResponse(heavyRateLimit);
        }

        // Validate filter if provided
        if (params.filter) {
          const validation = validateInput(analyzeTrendsSchema, params.filter);
          if (!validation.success) {
            return errorResponse(validation.error);
          }
          params.filter = validation.data;
        }

        const trends = await samTrendsEngine.analyzeTrends(params.filter);
        
        // Add user relevance calculation
        const enrichedTrends = trends.map(trend => ({
          ...trend,
          userRelevance: calculateUserRelevance(trend, session.user)
        }));

        return NextResponse.json({ trends: enrichedTrends });
      }

      default:
        return errorResponse('Invalid action');
    }
  } catch (error) {
    logger.error('AI Trends API POST error:', error);
    return errorResponse('An error occurred processing your request', 500);
  }
}

// Helper function to calculate user-specific relevance
function calculateUserRelevance(trend: any, user: any): number {
  let relevance = trend.relevance;
  
  // Boost educational trends for student users
  if (user.role === 'USER' && trend.educationalImplications?.length > 0) {
    relevance = Math.min(relevance + 10, 100);
  }
  
  return relevance;
}