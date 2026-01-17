'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Target,
  Loader2,
  BarChart3,
  LineChart,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface WeeklyTrend {
  week: string;
  weekLabel: string;
  totalHours: number;
  qualityHours: number;
  sessionsCount: number;
  avgQualityMultiplier: number;
  practiceDay: number;
}

interface MonthlyTrend {
  month: string;
  monthLabel: string;
  totalHours: number;
  qualityHours: number;
  sessionsCount: number;
  avgQualityMultiplier: number;
  activeDays: number;
}

interface SkillTrend {
  skillId: string;
  skillName: string;
  totalHours: number;
  qualityHours: number;
  growthRate: number;
  sessionsCount: number;
}

interface GrowthMetrics {
  weekOverWeek: number;
  monthOverMonth: number;
  averageWeeklyHours: number;
  averageMonthlyHours: number;
  projectedDaysToGoal: number | null;
  velocity: number;
}

interface MasteryProjection {
  topSkill: {
    skillName: string;
    currentHours: number;
    targetHours: number;
    projectedDate: string | null;
  } | null;
  skills: {
    skillName: string;
    currentHours: number;
    progressPercentage: number;
    projectedDate: string | null;
  }[];
}

interface TrendsData {
  weeklyTrends: WeeklyTrend[];
  monthlyTrends: MonthlyTrend[];
  skillTrends: SkillTrend[];
  growthMetrics: GrowthMetrics;
  masteryProjection: MasteryProjection;
  summary: {
    totalHoursAnalyzed: number;
    totalQualityHours: number;
    totalSessions: number;
    activeDays: number;
    dateRange: { start: string; end: string };
  };
}

interface TrendChartsProps {
  skillId?: string;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TrendCharts({ skillId, className }: TrendChartsProps) {
  const [data, setData] = useState<TrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'skills'>('weekly');

  const isFetchingRef = useRef(false);

  const fetchTrends = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      let url = '/api/sam/practice/trends?weeks=12&months=12';
      if (skillId) {
        url += `&skillId=${skillId}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [skillId]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-8 text-center text-muted-foreground">
          Unable to load trend data
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Growth Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Week over Week"
          value={`${data.growthMetrics.weekOverWeek >= 0 ? '+' : ''}${data.growthMetrics.weekOverWeek.toFixed(1)}%`}
          trend={data.growthMetrics.weekOverWeek}
          icon={Activity}
        />
        <MetricCard
          title="Month over Month"
          value={`${data.growthMetrics.monthOverMonth >= 0 ? '+' : ''}${data.growthMetrics.monthOverMonth.toFixed(1)}%`}
          trend={data.growthMetrics.monthOverMonth}
          icon={TrendingUp}
        />
        <MetricCard
          title="Weekly Avg"
          value={`${data.growthMetrics.averageWeeklyHours.toFixed(1)}h`}
          subtitle="hours/week"
          icon={Clock}
        />
        <MetricCard
          title="Velocity"
          value={`${data.growthMetrics.velocity.toFixed(1)}h`}
          subtitle="quality hrs/week"
          icon={Target}
        />
      </div>

      {/* Mastery Projection */}
      {data.masteryProjection.topSkill && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Mastery Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{data.masteryProjection.topSkill.skillName}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.masteryProjection.topSkill.currentHours.toFixed(0)} /{' '}
                    {data.masteryProjection.topSkill.targetHours.toLocaleString()} hours
                  </p>
                </div>
                {data.masteryProjection.topSkill.projectedDate && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Projected mastery</p>
                    <p className="font-medium">
                      {new Date(data.masteryProjection.topSkill.projectedDate).toLocaleDateString(
                        undefined,
                        { year: 'numeric', month: 'short', day: 'numeric' }
                      )}
                    </p>
                  </div>
                )}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (data.masteryProjection.topSkill.currentHours /
                        data.masteryProjection.topSkill.targetHours) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Practice Trends
          </CardTitle>
          <CardDescription>
            Track your practice patterns over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="skills">By Skill</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="mt-0">
              <WeeklyChart trends={data.weeklyTrends} />
            </TabsContent>

            <TabsContent value="monthly" className="mt-0">
              <MonthlyChart trends={data.monthlyTrends} />
            </TabsContent>

            <TabsContent value="skills" className="mt-0">
              <SkillsChart skills={data.skillTrends} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Hours</p>
              <p className="text-lg font-medium">{data.summary.totalHoursAnalyzed.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-muted-foreground">Quality Hours</p>
              <p className="text-lg font-medium">{data.summary.totalQualityHours.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sessions</p>
              <p className="text-lg font-medium">{data.summary.totalSessions}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Days</p>
              <p className="text-lg font-medium">{data.summary.activeDays}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string;
  trend?: number;
  subtitle?: string;
  icon: React.ElementType;
}

function MetricCard({ title, value, trend, subtitle, icon: Icon }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {getTrendIcon()}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle ?? title}</p>
      </CardContent>
    </Card>
  );
}

interface WeeklyChartProps {
  trends: WeeklyTrend[];
}

function WeeklyChart({ trends }: WeeklyChartProps) {
  const maxHours = Math.max(...trends.map((t) => t.qualityHours), 1);

  return (
    <div className="space-y-4">
      {/* Simple bar chart */}
      <div className="flex items-end gap-1 h-40">
        {trends.map((week, index) => {
          const height = (week.qualityHours / maxHours) * 100;
          return (
            <div key={week.week} className="flex-1 flex flex-col items-center">
              <div
                className={cn(
                  'w-full rounded-t transition-all hover:bg-primary/80',
                  index === trends.length - 1 ? 'bg-primary' : 'bg-primary/60'
                )}
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${week.weekLabel}: ${week.qualityHours.toFixed(1)}h`}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-1">
        {trends.map((week, index) => (
          <div key={week.week} className="flex-1 text-center">
            {index % 3 === 0 && (
              <span className="text-xs text-muted-foreground">{week.weekLabel}</span>
            )}
          </div>
        ))}
      </div>

      {/* Recent weeks detail */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        {trends.slice(-3).map((week) => (
          <div key={week.week} className="text-center">
            <p className="text-xs text-muted-foreground">{week.weekLabel}</p>
            <p className="font-medium">{week.qualityHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">
              {week.sessionsCount} sessions
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MonthlyChartProps {
  trends: MonthlyTrend[];
}

function MonthlyChart({ trends }: MonthlyChartProps) {
  const maxHours = Math.max(...trends.map((t) => t.qualityHours), 1);

  return (
    <div className="space-y-4">
      {/* Simple bar chart */}
      <div className="flex items-end gap-2 h-40">
        {trends.map((month, index) => {
          const height = (month.qualityHours / maxHours) * 100;
          return (
            <div key={month.month} className="flex-1 flex flex-col items-center">
              <div
                className={cn(
                  'w-full rounded-t transition-all hover:bg-primary/80',
                  index === trends.length - 1 ? 'bg-primary' : 'bg-primary/60'
                )}
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${month.monthLabel}: ${month.qualityHours.toFixed(1)}h`}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-2">
        {trends.map((month) => (
          <div key={month.month} className="flex-1 text-center">
            <span className="text-xs text-muted-foreground">
              {month.monthLabel.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SkillsChartProps {
  skills: SkillTrend[];
}

function SkillsChart({ skills }: SkillsChartProps) {
  if (skills.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No skill data available</p>
      </div>
    );
  }

  const maxHours = Math.max(...skills.map((s) => s.qualityHours), 1);

  return (
    <div className="space-y-4">
      {skills.map((skill) => (
        <div key={skill.skillId} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{skill.skillName}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">{skill.qualityHours.toFixed(1)}h</span>
              {skill.growthRate !== 0 && (
                <Badge
                  variant={skill.growthRate > 0 ? 'default' : 'secondary'}
                  className={cn(
                    'text-xs',
                    skill.growthRate > 0 ? 'bg-green-500' : 'bg-red-500'
                  )}
                >
                  {skill.growthRate > 0 ? '+' : ''}
                  {skill.growthRate.toFixed(0)}%
                </Badge>
              )}
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(skill.qualityHours / maxHours) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {skill.sessionsCount} sessions
          </p>
        </div>
      ))}
    </div>
  );
}

export default TrendCharts;
