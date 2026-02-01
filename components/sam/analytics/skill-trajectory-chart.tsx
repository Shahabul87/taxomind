'use client';

/**
 * SkillTrajectoryChart Component
 *
 * Visualizes skill development trajectories over time.
 * Shows mastery progression, skill gaps, and learning velocity.
 *
 * Features:
 * - Multi-skill trajectory comparison
 * - Mastery level tracking per skill
 * - Learning velocity analysis
 * - Skill gap identification
 * - Projected mastery timeline
 */

import React, { useMemo, useState } from 'react';
import {
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  GitBranch,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface SkillDataPoint {
  date: string;
  mastery: number;
  practiceCount: number;
  accuracy: number;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  currentMastery: number;
  targetMastery: number;
  history: SkillDataPoint[];
  trend: 'improving' | 'stable' | 'declining';
  velocity: number; // mastery points per week
  lastPracticed?: Date;
  hoursSpent: number;
  prerequisites?: string[];
  dependents?: string[];
}

export interface SkillCategory {
  name: string;
  skills: Skill[];
  avgMastery: number;
}

export interface SkillTrajectoryChartProps {
  skills?: Skill[];
  categories?: SkillCategory[];
  targetMastery?: number;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MASTERY_LEVELS = [
  { level: 'Novice', min: 0, max: 20, color: '#ef4444' },
  { level: 'Beginner', min: 20, max: 40, color: '#f97316' },
  { level: 'Intermediate', min: 40, max: 60, color: '#eab308' },
  { level: 'Advanced', min: 60, max: 80, color: '#22c55e' },
  { level: 'Expert', min: 80, max: 100, color: '#10b981' },
];

const SKILL_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMasteryLevel(mastery: number): typeof MASTERY_LEVELS[0] {
  return MASTERY_LEVELS.find((l) => mastery >= l.min && mastery < l.max) ?? MASTERY_LEVELS[0];
}

function getSkillColor(index: number): string {
  return SKILL_COLORS[index % SKILL_COLORS.length];
}

function formatDaysAgo(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return 'Unknown';
  const days = Math.floor((Date.now() - dateObj.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
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
    dataKey: string;
    payload?: SkillDataPoint;
  }>;
  label?: string;
}

function SkillTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="font-medium text-sm mb-2">{label}</p>
      <div className="space-y-1.5 text-sm">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </span>
            <span className="font-medium">{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SkillCard({ skill, color }: { skill: Skill; color: string }) {
  const masteryLevel = getMasteryLevel(skill.currentMastery);
  const gapToTarget = skill.targetMastery - skill.currentMastery;
  const weeksToTarget = skill.velocity > 0 ? Math.ceil(gapToTarget / skill.velocity) : Infinity;

  return (
    <div className="p-4 rounded-lg border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h4 className="font-medium truncate">{skill.name}</h4>
            <Badge variant="outline" className="text-xs">
              {skill.category}
            </Badge>
          </div>

          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mastery</span>
              <span
                className="font-medium"
                style={{ color: masteryLevel.color }}
              >
                {skill.currentMastery.toFixed(0)}% - {masteryLevel.level}
              </span>
            </div>
            <Progress
              value={skill.currentMastery}
              className="h-2"
              style={
                {
                  '--progress-color': masteryLevel.color,
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        <div className="text-right">
          {skill.trend === 'improving' && (
            <TrendingUp className="w-5 h-5 text-green-500" />
          )}
          {skill.trend === 'declining' && (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
          {skill.trend === 'stable' && (
            <div className="w-5 h-5 text-yellow-500">→</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {skill.velocity > 0 ? '+' : ''}{skill.velocity}/wk
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {skill.hoursSpent}h spent
        </span>
        <span>
          {skill.lastPracticed && formatDaysAgo(skill.lastPracticed)}
        </span>
        {gapToTarget > 0 && weeksToTarget < Infinity && (
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            ~{weeksToTarget}w to target
          </span>
        )}
      </div>
    </div>
  );
}

function SkillGapAlert({ skill }: { skill: Skill }) {
  const gapToTarget = skill.targetMastery - skill.currentMastery;

  if (gapToTarget <= 10) return null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
      <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
      <div>
        <p className="font-medium text-orange-700 dark:text-orange-300">
          {skill.name} needs attention
        </p>
        <p className="text-sm text-muted-foreground">
          {gapToTarget.toFixed(0)}% gap to your target mastery level. Current velocity: {skill.velocity}/week.
          {skill.velocity <= 0 && ' Consider increasing practice frequency.'}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SkillTrajectoryChart({
  skills,
  categories,
  targetMastery = 80,
  className,
}: SkillTrajectoryChartProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const chartSkills = useMemo(() => skills ?? [], [skills]);

  // Group skills by category
  const skillCategories = useMemo(() => {
    if (categories) return categories;

    const categoryMap = new Map<string, Skill[]>();
    chartSkills.forEach((skill) => {
      const existing = categoryMap.get(skill.category) ?? [];
      categoryMap.set(skill.category, [...existing, skill]);
    });

    return Array.from(categoryMap.entries()).map(([name, skills]) => ({
      name,
      skills,
      avgMastery: skills.reduce((sum, s) => sum + s.currentMastery, 0) / skills.length,
    }));
  }, [chartSkills, categories]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    return chartSkills.map((skill) => ({
      skill: skill.name,
      current: skill.currentMastery,
      target: skill.targetMastery,
    }));
  }, [chartSkills]);

  // Prepare trajectory data for selected skills
  const trajectoryData = useMemo(() => {
    const displaySkills = selectedSkills.length > 0
      ? chartSkills.filter((s) => selectedSkills.includes(s.id))
      : chartSkills.slice(0, 4);

    if (displaySkills.length === 0) return [];

    // Merge all skill histories by date
    const dateMap = new Map<string, Record<string, number>>();

    displaySkills.forEach((skill) => {
      skill.history.forEach((point) => {
        const existing = dateMap.get(point.date) ?? {};
        existing[skill.name] = point.mastery;
        dateMap.set(point.date, existing);
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [chartSkills, selectedSkills]);

  // Find skills needing attention
  const skillsNeedingAttention = useMemo(() => {
    return chartSkills.filter(
      (skill) => skill.currentMastery < skill.targetMastery - 20 || skill.trend === 'declining'
    );
  }, [chartSkills]);

  if (chartSkills.length === 0) {
    return (
      <Card className={cn('p-6 text-center text-sm text-muted-foreground', className)}>
        No skill trajectory data available yet.
      </Card>
    );
  }

  // Toggle skill selection
  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : prev.length < 5
        ? [...prev, skillId]
        : prev
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Layers className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Skills</p>
                <p className="text-2xl font-bold">{chartSkills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">At Target</p>
                <p className="text-2xl font-bold">
                  {chartSkills.filter((s) => s.currentMastery >= s.targetMastery).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Improving</p>
                <p className="text-2xl font-bold">
                  {chartSkills.filter((s) => s.trend === 'improving').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Need Attention</p>
                <p className="text-2xl font-bold">{skillsNeedingAttention.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Visualization */}
      <Tabs defaultValue="trajectory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trajectory" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Trajectory
          </TabsTrigger>
          <TabsTrigger value="radar" className="gap-2">
            <Target className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <GitBranch className="w-4 h-4" />
            Details
          </TabsTrigger>
        </TabsList>

        {/* Trajectory View */}
        <TabsContent value="trajectory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Skill Mastery Trajectories
              </CardTitle>
              <CardDescription>
                Track how your skills develop over time. Select up to 5 skills to compare.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Skill Selection */}
              <div className="flex flex-wrap gap-2 mb-4">
                {chartSkills.map((skill, index) => (
                  <Button
                    key={skill.id}
                    variant={selectedSkills.includes(skill.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSkill(skill.id)}
                    className="gap-2"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getSkillColor(index) }}
                    />
                    {skill.name}
                  </Button>
                ))}
              </div>

              {/* Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trajectoryData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip content={<SkillTooltip />} />
                    <Legend />
                    <ReferenceLine y={targetMastery} stroke="#10b981" strokeDasharray="5 5" label="Target" />
                    {(selectedSkills.length > 0
                      ? chartSkills.filter((s) => selectedSkills.includes(s.id))
                      : chartSkills.slice(0, 4)
                    ).map((skill, index) => (
                      <Line
                        key={skill.id}
                        type="monotone"
                        dataKey={skill.name}
                        stroke={getSkillColor(chartSkills.indexOf(skill))}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Radar View */}
        <TabsContent value="radar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Skill Mastery Overview
              </CardTitle>
              <CardDescription>
                Compare your current mastery levels against targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" className="text-xs" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Target"
                      dataKey="target"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.1}
                      strokeDasharray="5 5"
                    />
                    <Radar
                      name="Current"
                      dataKey="current"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details View */}
        <TabsContent value="details" className="space-y-4">
          {/* Skills Needing Attention */}
          {skillsNeedingAttention.length > 0 && (
            <div className="space-y-3">
              {skillsNeedingAttention.slice(0, 3).map((skill) => (
                <SkillGapAlert key={skill.id} skill={skill} />
              ))}
            </div>
          )}

          {/* Skill Cards by Category */}
          {skillCategories.map((category) => (
            <Card key={category.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {category.name}
                  </CardTitle>
                  <Badge variant="outline">
                    Avg: {category.avgMastery.toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {category.skills.map((skill, index) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      color={getSkillColor(chartSkills.indexOf(skill))}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SkillTrajectoryChart;
