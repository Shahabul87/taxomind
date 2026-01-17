import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { createTrendsEngine, type TrendAnalysis } from '@sam-ai/educational';
import { getSAMConfig, createTrendsAdapter } from '@/lib/adapters';

type TrendCategory = 'skill' | 'topic' | 'technology' | 'industry' | 'role';
type TrendDirection = 'rising' | 'stable' | 'declining';

interface Trend {
  id: string;
  name: string;
  category: TrendCategory;
  direction: TrendDirection;
  growthRate: number;
  popularity: number;
  demandScore: number;
  relevanceScore: number;
  relatedSkills: string[];
  industries: string[];
}

interface MarketInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  source?: string;
  relevantRoles: string[];
}

interface SkillDemand {
  skillId: string;
  skillName: string;
  demandLevel: number;
  growthTrend: TrendDirection;
  salaryImpact: string;
  jobCount: number;
  topEmployers: string[];
}

interface TrendRecommendation {
  id: string;
  type: 'learn' | 'explore' | 'practice';
  title: string;
  reason: string;
  trendId: string;
  priority: number;
}

interface TrendsExplorerData {
  trendingTopics: Trend[];
  marketInsights: MarketInsight[];
  skillDemands: SkillDemand[];
  recommendations: TrendRecommendation[];
  lastUpdated: string;
}

const TrendsQuerySchema = z.object({
  category: z.string().optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

let trendsEngine: ReturnType<typeof createTrendsEngine> | null = null;

function getTrendsEngine() {
  if (!trendsEngine) {
    trendsEngine = createTrendsEngine({
      samConfig: getSAMConfig(),
      database: createTrendsAdapter(db),
    });
  }
  return trendsEngine;
}

function mapTrendCategory(category?: string): TrendCategory {
  const normalized = (category ?? '').toLowerCase();
  if (normalized.includes('industry')) return 'industry';
  if (normalized.includes('role') || normalized.includes('career')) return 'role';
  if (normalized.includes('skill')) return 'skill';
  if (normalized.includes('topic')) return 'topic';
  return 'technology';
}

function mapTrendDirection(trend: TrendAnalysis): TrendDirection {
  if (trend.timeframe === 'declining') return 'declining';
  if (trend.timeframe === 'emerging') return 'rising';
  return 'stable';
}

function mapGrowthRate(trend: TrendAnalysis): number {
  const base = trend.marketAdoption ?? 0;
  if (trend.timeframe === 'declining') return -Math.max(5, Math.round(base / 2));
  if (trend.timeframe === 'emerging') return Math.max(10, Math.round(base + 15));
  return Math.max(5, Math.round(base));
}

function toTrend(trend: TrendAnalysis): Trend {
  const direction = mapTrendDirection(trend);
  const relevanceScore = Math.min(100, Math.max(0, trend.relevance ?? 0));
  return {
    id: trend.trendId,
    name: trend.title,
    category: mapTrendCategory(trend.category),
    direction,
    growthRate: mapGrowthRate(trend),
    popularity: Math.min(100, Math.max(0, trend.marketAdoption ?? relevanceScore)),
    demandScore: Math.min(100, Math.max(0, (trend.marketAdoption ?? 0) + Math.round(relevanceScore / 2))),
    relevanceScore,
    relatedSkills: trend.skillsRequired ?? [],
    industries: trend.applicationAreas ?? [],
  };
}

function buildMarketInsights(trends: TrendAnalysis[]): MarketInsight[] {
  return trends.slice(0, 5).map((trend) => ({
    id: `insight-${trend.trendId}`,
    title: trend.title,
    description: trend.futureOutlook ?? trend.description,
    impact: trend.impact === 'transformative' ? 'high' : (trend.impact ?? 'medium'),
    timeframe: trend.timeframe ?? 'current',
    source: trend.sources?.[0]?.name,
    relevantRoles: trend.skillsRequired ?? [],
  }));
}

function buildSkillDemands(trends: TrendAnalysis[]): SkillDemand[] {
  const items: SkillDemand[] = [];
  for (const trend of trends) {
    const direction = mapTrendDirection(trend);
    const demandLevel = Math.min(100, Math.max(0, trend.relevance ?? 0));
    for (const skill of trend.skillsRequired ?? []) {
      items.push({
        skillId: `${trend.trendId}-${skill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        skillName: skill,
        demandLevel,
        growthTrend: direction,
        salaryImpact: direction === 'rising' ? '+12%' : direction === 'declining' ? '-5%' : 'stable',
        jobCount: Math.max(0, Math.round((trend.marketAdoption ?? 10) * 10)),
        topEmployers: (trend.sources ?? []).map((source) => source.name).slice(0, 3),
      });
    }
  }
  return items.slice(0, 12);
}

function buildRecommendations(trends: TrendAnalysis[]): TrendRecommendation[] {
  return trends.slice(0, 6).map((trend, index) => ({
    id: `rec-${trend.trendId}`,
    type: index % 3 === 0 ? 'learn' : index % 3 === 1 ? 'explore' : 'practice',
    title: `Explore ${trend.title}`,
    reason: trend.keyInsights?.[0] ?? trend.description,
    trendId: trend.trendId,
    priority: index + 1,
  }));
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = TrendsQuerySchema.parse({
      category: searchParams.get('category') ?? undefined,
      query: searchParams.get('query') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const engine = getTrendsEngine();
    const rawTrends = query.query
      ? await engine.searchTrends(query.query)
      : await engine.analyzeTrends({ category: query.category ?? undefined });

    const filtered = query.category
      ? rawTrends.filter((trend) => trend.category === query.category)
      : rawTrends;

    const limited = typeof query.limit === 'number' ? filtered.slice(0, query.limit) : filtered;

    const data: TrendsExplorerData = {
      trendingTopics: limited.map(toTrend),
      marketInsights: buildMarketInsights(limited),
      skillDemands: buildSkillDemands(limited),
      recommendations: buildRecommendations(limited),
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('[SAM Trends] Failed to fetch trends', { error });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
