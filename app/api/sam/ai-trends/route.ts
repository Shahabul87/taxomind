import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { samTrendsEngine } from '@/sam/engines/advanced/sam-trends-engine';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'analyze': {
        const category = searchParams.get('category') || undefined;
        const timeframe = searchParams.get('timeframe') as any;
        const impact = searchParams.get('impact') as any;
        const minRelevance = searchParams.get('minRelevance');

        const trends = await samTrendsEngine.analyzeTrends({
          category,
          timeframe,
          impact,
          minRelevance: minRelevance ? parseInt(minRelevance) : undefined
        });

        return NextResponse.json({ trends });
      }

      case 'categories': {
        const categories = await samTrendsEngine.getTrendCategories();
        return NextResponse.json({ categories });
      }

      case 'signals': {
        const trendId = searchParams.get('trendId');
        if (!trendId) {
          return NextResponse.json({ error: 'Trend ID required' }, { status: 400 });
        }

        const signals = await samTrendsEngine.detectMarketSignals(trendId);
        return NextResponse.json({ signals });
      }

      case 'compare': {
        const trendId1 = searchParams.get('trendId1');
        const trendId2 = searchParams.get('trendId2');
        
        if (!trendId1 || !trendId2) {
          return NextResponse.json({ error: 'Two trend IDs required' }, { status: 400 });
        }

        const comparison = await samTrendsEngine.compareTrends(trendId1, trendId2);
        return NextResponse.json({ comparison });
      }

      case 'predict': {
        const trendId = searchParams.get('trendId');
        const horizon = searchParams.get('horizon') as any;
        
        if (!trendId || !horizon) {
          return NextResponse.json({ error: 'Trend ID and horizon required' }, { status: 400 });
        }

        const prediction = await samTrendsEngine.predictTrendTrajectory(trendId, horizon);
        return NextResponse.json({ prediction });
      }

      case 'industry-report': {
        const industry = searchParams.get('industry');
        if (!industry) {
          return NextResponse.json({ error: 'Industry required' }, { status: 400 });
        }

        const report = await samTrendsEngine.generateIndustryReport(industry);
        return NextResponse.json({ report });
      }

      case 'search': {
        const query = searchParams.get('query');
        if (!query) {
          return NextResponse.json({ error: 'Search query required' }, { status: 400 });
        }

        const results = await samTrendsEngine.searchTrends(query);
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
        // Default: get all trends
        const trends = await samTrendsEngine.analyzeTrends();
        return NextResponse.json({ trends });
      }
    }
  } catch (error) {
    logger.error('AI Trends API error:', error);
    return NextResponse.json(
      { error: 'Failed to process trends request' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case 'record-interaction': {
        const { trendId, interactionType } = params;
        
        if (!trendId || !interactionType) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        await samTrendsEngine.recordInteraction(
          session.user.id,
          trendId,
          interactionType
        );

        return NextResponse.json({ success: true });
      }

      case 'analyze-custom': {
        // For more complex analysis with custom parameters
        const trends = await samTrendsEngine.analyzeTrends(params.filter);
        
        // Additional processing could go here
        const enrichedTrends = trends.map(trend => ({
          ...trend,
          userRelevance: calculateUserRelevance(trend, session.user)
        }));

        return NextResponse.json({ trends: enrichedTrends });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('AI Trends API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process trends request' },
      { status: 500 }
    );
  }
}

// Helper function to calculate user-specific relevance
function calculateUserRelevance(trend: any, user: any): number {
  // This could be enhanced with user preferences, history, etc.
  let relevance = trend.relevance;
  
  // Boost educational trends for student users
  if (user.role === 'USER' && trend.educationalImplications?.length > 0) {
    relevance += 10;
  }
  
  return Math.min(relevance, 100);
}