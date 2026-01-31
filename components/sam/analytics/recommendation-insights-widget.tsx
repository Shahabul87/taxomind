'use client';

/**
 * RecommendationInsightsWidget Component
 *
 * Displays insights about recommendation effectiveness.
 * Shows which recommendations users follow and their outcomes.
 *
 * Features:
 * - Recommendation follow rate visualization
 * - Outcome effectiveness by type
 * - Trending recommendations
 * - Personalized improvement suggestions
 */

import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowRight,
  Star,
  Zap,
  BookOpen,
  Users,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface RecommendationInsight {
  type: string;
  displayName: string;
  totalRecommendations: number;
  followedCount: number;
  followRate: number;
  avgOutcomeScore: number;
  effectiveness: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface RecentRecommendation {
  id: string;
  type: string;
  title: string;
  wasFollowed: boolean;
  outcomeScore?: number;
  timestamp: Date;
}

export interface RecommendationInsightsWidgetProps {
  insights?: RecommendationInsight[];
  recentRecommendations?: RecentRecommendation[];
  overallFollowRate?: number;
  overallEffectiveness?: number;
  totalRecommendations?: number;
  className?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; displayName: string }> = {
  content: { icon: BookOpen, color: '#3b82f6', displayName: 'Content' },
  practice: { icon: Target, color: '#10b981', displayName: 'Practice' },
  review: { icon: RefreshCw, color: '#f59e0b', displayName: 'Review' },
  course: { icon: BookOpen, color: '#8b5cf6', displayName: 'Course' },
  skill: { icon: Zap, color: '#ec4899', displayName: 'Skill' },
  study_time: { icon: Clock, color: '#06b6d4', displayName: 'Study Time' },
  learning_path: { icon: ArrowRight, color: '#14b8a6', displayName: 'Learning Path' },
  intervention: { icon: Lightbulb, color: '#f97316', displayName: 'Intervention' },
  social: { icon: Users, color: '#6366f1', displayName: 'Social' },
  other: { icon: Star, color: '#94a3b8', displayName: 'Other' },
};

const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#94a3b8',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSampleInsights(): RecommendationInsight[] {
  const types = ['content', 'practice', 'review', 'course', 'skill', 'study_time'];

  return types.map((type, index) => {
    const total = Math.floor(20 + Math.random() * 80);
    const followed = Math.floor(total * (0.3 + Math.random() * 0.5));
    const followRate = (followed / total) * 100;
    const avgOutcome = 50 + Math.random() * 40;
    const effectiveness = (followRate / 100) * avgOutcome;

    return {
      type,
      displayName: TYPE_CONFIG[type]?.displayName ?? type,
      totalRecommendations: total,
      followedCount: followed,
      followRate: Math.round(followRate * 10) / 10,
      avgOutcomeScore: Math.round(avgOutcome * 10) / 10,
      effectiveness: Math.round(effectiveness * 10) / 10,
      trend: Math.random() > 0.6 ? 'improving' : Math.random() > 0.3 ? 'stable' : 'declining',
    };
  });
}

function generateSampleRecentRecommendations(): RecentRecommendation[] {
  const recommendations = [
    { type: 'content', title: 'Review JavaScript closures concept' },
    { type: 'practice', title: 'Complete 5 React hook exercises' },
    { type: 'review', title: 'Revise TypeScript generics' },
    { type: 'course', title: 'Start Node.js Fundamentals course' },
    { type: 'skill', title: 'Practice SQL query optimization' },
  ];

  return recommendations.map((rec, index) => ({
    id: `rec-${index}`,
    type: rec.type,
    title: rec.title,
    wasFollowed: Math.random() > 0.4,
    outcomeScore: Math.random() > 0.5 ? Math.round(60 + Math.random() * 35) : undefined,
    timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
  }));
}

function getEffectivenessColor(effectiveness: number): string {
  if (effectiveness >= 40) return 'text-green-500';
  if (effectiveness >= 25) return 'text-blue-500';
  if (effectiveness >= 15) return 'text-yellow-500';
  return 'text-red-500';
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload?: RecommendationInsight;
  }>;
  label?: string;
}

function InsightTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="font-medium text-sm mb-2">{data.displayName}</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium">{data.totalRecommendations}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Followed</span>
          <span className="font-medium">{data.followedCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Follow Rate</span>
          <span className="font-medium">{data.followRate.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Outcome</span>
          <span className="font-medium">{data.avgOutcomeScore.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function OverviewCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    amber: 'bg-amber-500/10 text-amber-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <div className={cn('p-2 rounded-lg', colorClasses[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold">{value}</p>
          {trend && (
            trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : null
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: RecommendationInsight }) {
  const config = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.other;
  const Icon = config.icon;

  return (
    <div className="p-3 rounded-lg border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <div>
            <h4 className="font-medium text-sm">{insight.displayName}</h4>
            <p className="text-xs text-muted-foreground">
              {insight.followedCount}/{insight.totalRecommendations} followed
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            insight.trend === 'improving' && 'text-green-600 border-green-300',
            insight.trend === 'declining' && 'text-red-600 border-red-300',
            insight.trend === 'stable' && 'text-yellow-600 border-yellow-300'
          )}
        >
          {insight.trend === 'improving' && <TrendingUp className="w-3 h-3 mr-1" />}
          {insight.trend === 'declining' && <TrendingDown className="w-3 h-3 mr-1" />}
          {insight.trend}
        </Badge>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Follow Rate</span>
          <span className="font-medium">{insight.followRate.toFixed(0)}%</span>
        </div>
        <Progress value={insight.followRate} className="h-1.5" />

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-muted-foreground">Effectiveness</span>
          <span className={cn('font-medium', getEffectivenessColor(insight.effectiveness))}>
            {insight.effectiveness.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}

function RecentRecommendationItem({ recommendation }: { recommendation: RecentRecommendation }) {
  const config = TYPE_CONFIG[recommendation.type] ?? TYPE_CONFIG.other;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div
        className="p-1.5 rounded-lg shrink-0"
        style={{ backgroundColor: `${config.color}20` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{recommendation.title}</p>
        <p className="text-xs text-muted-foreground">{formatTimeAgo(recommendation.timestamp)}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {recommendation.wasFollowed ? (
          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Followed
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Skipped
          </Badge>
        )}
        {recommendation.outcomeScore != null && (
          <Badge variant="secondary" className="text-xs">
            {recommendation.outcomeScore}%
          </Badge>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RecommendationInsightsWidget({
  insights,
  recentRecommendations,
  overallFollowRate = 45,
  overallEffectiveness = 32,
  totalRecommendations = 156,
  className,
  onRefresh,
  isLoading = false,
}: RecommendationInsightsWidgetProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Generate sample data if not provided
  const isUsingDemoData = !insights;
  const chartInsights = useMemo(() => insights ?? generateSampleInsights(), [insights]);
  const chartRecent = useMemo(
    () => recentRecommendations ?? generateSampleRecentRecommendations(),
    [recentRecommendations]
  );

  // Prepare chart data
  const barChartData = useMemo(() => {
    return chartInsights.map((insight) => ({
      ...insight,
      name: insight.displayName,
    }));
  }, [chartInsights]);

  const pieChartData = useMemo(() => {
    return chartInsights.map((insight, index) => ({
      name: insight.displayName,
      value: insight.totalRecommendations,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [chartInsights]);

  // Calculate top performers
  const topPerformers = useMemo(() => {
    return [...chartInsights].sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 3);
  }, [chartInsights]);

  // Calculate improvement areas
  const improvementAreas = useMemo(() => {
    return chartInsights.filter((i) => i.followRate < 40 || i.avgOutcomeScore < 50);
  }, [chartInsights]);

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Recommendation Insights
              </CardTitle>
              {isUsingDemoData && (
                <Badge variant="outline" className="text-xs text-muted-foreground">Sample Data</Badge>
              )}
            </div>
            <CardDescription>
              Track how well recommendations are serving your learning
            </CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <OverviewCard
            title="Total Recommendations"
            value={totalRecommendations}
            icon={Target}
            color="blue"
          />
          <OverviewCard
            title="Follow Rate"
            value={`${overallFollowRate}%`}
            subtitle="of recommendations followed"
            icon={ThumbsUp}
            trend="up"
            color="green"
          />
          <OverviewCard
            title="Effectiveness"
            value={overallEffectiveness}
            subtitle="average outcome score"
            icon={Zap}
            color="amber"
          />
          <OverviewCard
            title="Top Performer"
            value={topPerformers[0]?.displayName ?? 'N/A'}
            subtitle={`${topPerformers[0]?.effectiveness.toFixed(0) ?? 0} effectiveness`}
            icon={Star}
            color="purple"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="gap-2">
              <PieChartIcon className="w-4 h-4" />
              Breakdown
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="w-4 h-4" />
              Recent
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<InsightTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="followRate"
                    name="Follow Rate (%)"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="avgOutcomeScore"
                    name="Avg Outcome (%)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Insights Cards */}
            <div className="grid gap-3 md:grid-cols-2">
              {chartInsights.slice(0, 4).map((insight) => (
                <InsightCard key={insight.type} insight={insight} />
              ))}
            </div>
          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pie Chart */}
              <div>
                <h4 className="font-medium text-sm mb-3">Distribution by Type</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Improvement Areas */}
              <div>
                <h4 className="font-medium text-sm mb-3">Areas for Improvement</h4>
                {improvementAreas.length > 0 ? (
                  <div className="space-y-3">
                    {improvementAreas.map((area) => (
                      <div
                        key={area.type}
                        className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <ThumbsDown className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-sm text-amber-700 dark:text-amber-300">
                            {area.displayName}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {area.followRate < 40
                            ? `Low follow rate (${area.followRate.toFixed(0)}%). Consider adjusting timing or relevance.`
                            : `Low outcome (${area.avgOutcomeScore.toFixed(0)}%). Recommendations may need refinement.`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      All recommendation types are performing well!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="space-y-2">
            <div className="max-h-80 overflow-y-auto space-y-1 pr-2">
              {chartRecent.map((rec) => (
                <RecentRecommendationItem key={rec.id} recommendation={rec} />
              ))}
            </div>

            {chartRecent.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Lightbulb className="w-10 h-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No recent recommendations to show
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default RecommendationInsightsWidget;
