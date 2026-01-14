'use client';

/**
 * TrendsExplorer Component
 *
 * Industry trends and market insights visualization for learners.
 *
 * Features:
 * - Trending topics and skills
 * - Industry demand analysis
 * - Career market insights
 * - Learning recommendations based on trends
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  RefreshCw,
  Loader2,
  ChevronRight,
  Sparkles,
  Clock,
  BarChart3,
  Globe,
  Zap,
  AlertCircle,
  Flame,
  Star,
  ArrowUpRight,
  Filter,
  Hash,
  Briefcase,
  GraduationCap,
  Building,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type TrendDirection = 'rising' | 'stable' | 'declining';
type TrendCategory = 'skill' | 'topic' | 'technology' | 'industry' | 'role';

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

interface TrendsExplorerData {
  trendingTopics: Trend[];
  marketInsights: MarketInsight[];
  skillDemands: SkillDemand[];
  recommendations: TrendRecommendation[];
  lastUpdated: string;
}

interface TrendRecommendation {
  id: string;
  type: 'learn' | 'explore' | 'practice';
  title: string;
  reason: string;
  trendId: string;
  priority: number;
}

interface TrendsExplorerProps {
  className?: string;
  compact?: boolean;
  category?: TrendCategory;
  onTrendClick?: (trend: Trend) => void;
  onRecommendationClick?: (rec: TrendRecommendation) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_CONFIG: Record<TrendCategory, { icon: typeof TrendingUp; color: string; label: string }> = {
  skill: { icon: Zap, color: 'text-blue-500 bg-blue-500/10', label: 'Skill' },
  topic: { icon: Hash, color: 'text-purple-500 bg-purple-500/10', label: 'Topic' },
  technology: { icon: Globe, color: 'text-green-500 bg-green-500/10', label: 'Technology' },
  industry: { icon: Building, color: 'text-orange-500 bg-orange-500/10', label: 'Industry' },
  role: { icon: Briefcase, color: 'text-cyan-500 bg-cyan-500/10', label: 'Role' },
};

const DIRECTION_CONFIG = {
  rising: { icon: TrendingUp, color: 'text-green-500', label: 'Rising' },
  stable: { icon: Minus, color: 'text-blue-500', label: 'Stable' },
  declining: { icon: TrendingDown, color: 'text-red-500', label: 'Declining' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TrendCard({ trend, onClick }: { trend: Trend; onClick?: () => void }) {
  const categoryConfig = CATEGORY_CONFIG[trend.category];
  const directionConfig = DIRECTION_CONFIG[trend.direction];
  const CategoryIcon = categoryConfig.icon;
  const DirectionIcon = directionConfig.icon;

  return (
    <div
      className="p-4 rounded-xl bg-card border hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', categoryConfig.color)}>
          <CategoryIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">{trend.name}</span>
            <DirectionIcon className={cn('w-4 h-4', directionConfig.color)} />
            {trend.direction === 'rising' && trend.growthRate > 20 && (
              <Flame className="w-4 h-4 text-orange-500" />
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className={cn('font-medium', directionConfig.color)}>
              {trend.growthRate > 0 ? '+' : ''}{trend.growthRate}%
            </span>
            <span>•</span>
            <span>{trend.demandScore}% demand</span>
          </div>

          {/* Mini progress bars */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Popularity</span>
              <Progress value={trend.popularity} className="h-1.5 flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Relevance</span>
              <Progress value={trend.relevanceScore} className="h-1.5 flex-1" />
            </div>
          </div>

          {/* Related skills */}
          {trend.relatedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {trend.relatedSkills.slice(0, 3).map((skill) => (
                <span key={skill} className="px-2 py-0.5 text-xs rounded-full bg-muted">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function MarketInsightCard({ insight }: { insight: MarketInsight }) {
  const impactColors = {
    high: 'bg-red-500/10 border-red-500/30 text-red-600',
    medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600',
    low: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
  };

  return (
    <div className={cn('p-3 rounded-lg border', impactColors[insight.impact])}>
      <div className="flex items-start gap-2 mb-2">
        <BarChart3 className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <span className="font-medium text-sm">{insight.title}</span>
          <Badge variant="outline" className="ml-2 text-xs capitalize">{insight.impact} impact</Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {insight.timeframe}
        </span>
        {insight.source && (
          <span className="flex items-center gap-1">
            Source: {insight.source}
          </span>
        )}
      </div>
    </div>
  );
}

function SkillDemandCard({ demand }: { demand: SkillDemand }) {
  const directionConfig = DIRECTION_CONFIG[demand.growthTrend];
  const DirectionIcon = directionConfig.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{demand.skillName}</span>
          <DirectionIcon className={cn('w-4 h-4', directionConfig.color)} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{demand.jobCount.toLocaleString()} jobs</span>
          <span>•</span>
          <span>{demand.salaryImpact}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold">{demand.demandLevel}%</div>
        <span className="text-xs text-muted-foreground">Demand</span>
      </div>
    </div>
  );
}

function RecommendationCard({ rec, onClick }: { rec: TrendRecommendation; onClick?: () => void }) {
  const typeIcons = {
    learn: GraduationCap,
    explore: Search,
    practice: Zap,
  };
  const Icon = typeIcons[rec.type];

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm block truncate">{rec.title}</span>
        <span className="text-xs text-muted-foreground">{rec.reason}</span>
      </div>
      <ArrowUpRight className="w-4 h-4 text-primary" />
    </div>
  );
}

function CategoryFilter({
  selected,
  onSelect,
}: {
  selected: TrendCategory | null;
  onSelect: (category: TrendCategory | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect(null)}
      >
        All
      </Button>
      {(Object.entries(CATEGORY_CONFIG) as [TrendCategory, typeof CATEGORY_CONFIG.skill][]).map(
        ([key, config]) => {
          const Icon = config.icon;
          return (
            <Button
              key={key}
              variant={selected === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelect(key)}
              className="gap-1"
            >
              <Icon className="w-3 h-3" />
              {config.label}
            </Button>
          );
        }
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TrendsExplorer({
  className,
  compact = false,
  category,
  onTrendClick,
  onRecommendationClick,
}: TrendsExplorerProps) {
  const [data, setData] = useState<TrendsExplorerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TrendCategory | null>(category || null);
  const [searchQuery, setSearchQuery] = useState('');
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('query', searchQuery);

      const res = await fetch(`/api/sam/agentic/analytics/trends?${params}`);

      if (!res.ok) throw new Error('Failed to fetch trends');

      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trends');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTrends = data?.trendingTopics.filter((trend) => {
    if (selectedCategory && trend.category !== selectedCategory) return false;
    if (searchQuery && !trend.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) || [];

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing market trends...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Trends Explorer</CardTitle>
              <CardDescription>Industry trends &amp; skill demand insights</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Search and Filter */}
        {!compact && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trends..."
                className="pl-9"
              />
            </div>
            <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
        )}

        {/* Trending Topics */}
        {filteredTrends.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Trending Now
              <Badge variant="secondary" className="text-xs">{filteredTrends.length}</Badge>
            </h4>
            <div className="space-y-2">
              {filteredTrends.slice(0, compact ? 3 : 5).map((trend) => (
                <TrendCard
                  key={trend.id}
                  trend={trend}
                  onClick={() => onTrendClick?.(trend)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Market Insights */}
        {!compact && data?.marketInsights && data.marketInsights.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Market Insights
            </h4>
            <div className="space-y-2">
              {data.marketInsights.slice(0, 3).map((insight) => (
                <MarketInsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* Skill Demands */}
        {data?.skillDemands && data.skillDemands.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Top In-Demand Skills
            </h4>
            <div className="space-y-2">
              {data.skillDemands.slice(0, compact ? 3 : 5).map((demand) => (
                <SkillDemandCard key={demand.skillId} demand={demand} />
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data?.recommendations && data.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Personalized Recommendations
            </h4>
            <div className="space-y-2">
              {data.recommendations.slice(0, compact ? 2 : 4).map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  onClick={() => onRecommendationClick?.(rec)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredTrends.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No trends found matching your criteria</p>
          </div>
        )}

        {/* Last updated */}
        {data?.lastUpdated && (
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Updated {new Date(data.lastUpdated).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TrendsExplorer;
