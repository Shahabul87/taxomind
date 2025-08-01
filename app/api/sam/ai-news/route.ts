import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { samNewsEngine } from '@/lib/sam-news-engine';
import { isProductionEnvironment } from '@/lib/config/news-config';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const realtime = searchParams.get('realtime') === 'true';

    switch (action) {
      case 'latest': {
        const category = searchParams.get('category') as any;
        const tags = searchParams.get('tags')?.split(',').filter(Boolean);
        const minRelevance = searchParams.get('minRelevance');
        const technicalDepth = searchParams.get('technicalDepth');
        const limit = searchParams.get('limit');

        const news = await samNewsEngine.getLatestNews({
          category,
          tags,
          minRelevance: minRelevance ? parseInt(minRelevance) : undefined,
          technicalDepth,
          limit: limit ? parseInt(limit) : undefined
        });

        return NextResponse.json({ news });
      }

      case 'digest': {
        const date = searchParams.get('date');
        const digest = await samNewsEngine.getNewsDigest(
          date ? new Date(date) : undefined
        );
        return NextResponse.json({ digest });
      }

      case 'search': {
        const query = searchParams.get('query');
        if (!query) {
          return NextResponse.json({ error: 'Search query required' }, { status: 400 });
        }

        const results = await samNewsEngine.searchNews(query);
        return NextResponse.json({ results });
      }

      case 'trending-topics': {
        const topics = await samNewsEngine.getTrendingTopics();
        return NextResponse.json({ topics });
      }

      case 'by-topic': {
        const topicId = searchParams.get('topicId');
        if (!topicId) {
          return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });
        }

        const news = await samNewsEngine.getNewsByTopic(topicId);
        return NextResponse.json({ news });
      }

      case 'analytics': {
        const timeframe = searchParams.get('timeframe') as any;
        if (!timeframe) {
          return NextResponse.json({ error: 'Timeframe required' }, { status: 400 });
        }

        const analytics = await samNewsEngine.getNewsAnalytics(timeframe);
        return NextResponse.json({ analytics });
      }

      case 'related': {
        const articleId = searchParams.get('articleId');
        if (!articleId) {
          return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
        }

        const related = await samNewsEngine.getRelatedArticles(articleId);
        return NextResponse.json({ related });
      }

      case 'experts': {
        const topicId = searchParams.get('topicId');
        if (!topicId) {
          return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });
        }

        const experts = await samNewsEngine.getExpertOpinions(topicId);
        return NextResponse.json({ experts });
      }

      case 'educational': {
        const news = await samNewsEngine.getEducationalNews();
        return NextResponse.json({ news });
      }

      case 'beginner': {
        const news = await samNewsEngine.getBeginnerFriendlyNews();
        return NextResponse.json({ news });
      }

      case 'realtime': {
        // Fetch real-time news from external sources
        const news = await samNewsEngine.fetchRealTimeNews(true);
        return NextResponse.json({ news });
      }

      case 'top-ranked': {
        // Get top-ranked news based on all criteria
        const limit = searchParams.get('limit');
        const news = await samNewsEngine.getTopRankedNews(
          limit ? parseInt(limit) : 20
        );
        return NextResponse.json({ news });
      }

      case 'trending': {
        // Get trending news (hot + rising)
        const limit = searchParams.get('limit');
        const news = await samNewsEngine.getTrendingNews(
          limit ? parseInt(limit) : 10
        );
        return NextResponse.json({ news });
      }

      case 'by-criteria': {
        // Get news by specific criteria
        const criteria = searchParams.get('criteria') as any;
        const limit = searchParams.get('limit');
        
        if (!criteria || !['freshness', 'relevance', 'impact', 'innovation'].includes(criteria)) {
          return NextResponse.json({ error: 'Invalid criteria' }, { status: 400 });
        }
        
        const news = await samNewsEngine.getNewsByCriteria(
          criteria,
          limit ? parseInt(limit) : 10
        );
        return NextResponse.json({ news });
      }

      default: {
        // Default: get top-ranked news
        // In production, always use real news regardless of parameter
        const forceReal = isProductionEnvironment() || realtime;
        
        // If realtime is true or in production, temporarily set the environment variable
        if (forceReal) {
          process.env.USE_REAL_NEWS = 'true';
        }
        
        const news = await samNewsEngine.getTopRankedNews(20);
        
        // Reset the environment variable if we set it
        if (forceReal && !isProductionEnvironment()) {
          delete process.env.USE_REAL_NEWS;
        }
        
        return NextResponse.json({ 
          news,
          source: forceReal ? 'real' : 'demo',
          environment: process.env.NODE_ENV
        });
      }
    }
  } catch (error) {
    console.error('AI News API error:', error);
    return NextResponse.json(
      { error: 'Failed to process news request' },
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
      case 'create-alert': {
        const { keywords, categories, frequency } = params;
        
        if (!keywords || !categories || !frequency) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const alert = await samNewsEngine.createNewsAlert(
          session.user.id,
          keywords,
          categories,
          frequency
        );

        return NextResponse.json({ alert });
      }

      case 'record-reading': {
        const { articleId, readingTime, completed } = params;
        
        if (!articleId || readingTime === undefined || completed === undefined) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        await samNewsEngine.recordReading(
          session.user.id,
          articleId,
          readingTime,
          completed
        );

        return NextResponse.json({ success: true });
      }

      case 'personalized-digest': {
        // Generate personalized news digest based on user preferences
        const digest = await samNewsEngine.getNewsDigest();
        
        // Filter based on user's interests (could be enhanced with ML)
        const personalizedDigest = {
          ...digest,
          topStories: digest.topStories.filter(story => 
            story.educationalValue > 70 || story.category === 'education'
          ),
          personalizedFor: session.user.id
        };

        return NextResponse.json({ digest: personalizedDigest });
      }

      case 'mark-read': {
        const { articleIds } = params;
        
        if (!articleIds || !Array.isArray(articleIds)) {
          return NextResponse.json({ error: 'Article IDs array required' }, { status: 400 });
        }

        // Record bulk reading activity
        for (const articleId of articleIds) {
          await samNewsEngine.recordReading(
            session.user.id,
            articleId,
            0,
            false
          );
        }

        return NextResponse.json({ success: true, count: articleIds.length });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI News API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process news request' },
      { status: 500 }
    );
  }
}

// WebSocket endpoint for real-time news updates (if needed in future)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This could be used for real-time news updates
    // For now, return latest breaking news
    const breakingNews = await samNewsEngine.getLatestNews({
      category: 'breakthrough',
      limit: 5,
      minRelevance: 90
    });

    return NextResponse.json({ 
      breakingNews,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI News API PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to get breaking news' },
      { status: 500 }
    );
  }
}