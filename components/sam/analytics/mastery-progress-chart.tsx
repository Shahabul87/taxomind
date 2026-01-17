'use client';

/**
 * MasteryProgressChart Component
 *
 * Visualizes mastery progression across topics and courses.
 * Shows learning milestones, mastery levels, and knowledge depth.
 *
 * Features:
 * - Overall mastery score with breakdown
 * - Course-level mastery tracking
 * - Knowledge depth visualization
 * - Mastery milestones timeline
 * - Competency mapping
 */

import React, { useMemo } from 'react';
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Treemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  TrendingUp,
  Target,
  Award,
  Star,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Trophy,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface MasteryDataPoint {
  date: string;
  overallMastery: number;
  courseMastery: number;
  topicsMastered: number;
  hoursSpent: number;
}

export interface CourseMastery {
  courseId: string;
  courseName: string;
  mastery: number;
  topicsTotal: number;
  topicsMastered: number;
  hoursSpent: number;
  lastActivity: Date;
  completionRate: number;
}

export interface TopicMastery {
  topicId: string;
  topicName: string;
  courseName: string;
  mastery: number;
  size: number;
  depth: 'surface' | 'intermediate' | 'deep';
}

export interface MasteryMilestone {
  id: string;
  title: string;
  description: string;
  type: 'topic' | 'course' | 'skill' | 'achievement';
  achievedAt?: Date;
  progress: number;
  target: number;
}

export interface MasteryProgressChartProps {
  masteryHistory?: MasteryDataPoint[];
  courseMastery?: CourseMastery[];
  topicMastery?: TopicMastery[];
  milestones?: MasteryMilestone[];
  overallMastery?: number;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MASTERY_LEVELS = [
  { level: 'Beginner', min: 0, max: 25, color: '#ef4444', icon: Star },
  { level: 'Developing', min: 25, max: 50, color: '#f97316', icon: BookOpen },
  { level: 'Proficient', min: 50, max: 75, color: '#3b82f6', icon: Target },
  { level: 'Expert', min: 75, max: 90, color: '#22c55e', icon: Award },
  { level: 'Master', min: 90, max: 100, color: '#10b981', icon: GraduationCap },
];

const DEPTH_COLORS = {
  surface: '#94a3b8',
  intermediate: '#3b82f6',
  deep: '#10b981',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSampleMasteryHistory(days: number = 30): MasteryDataPoint[] {
  const data: MasteryDataPoint[] = [];
  const today = new Date();
  let mastery = 20;
  let topicsMastered = 0;
  let totalHours = 0;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Gradual mastery improvement
    mastery = Math.min(100, mastery + Math.random() * 2);
    const hoursToday = Math.random() * 2;
    totalHours += hoursToday;

    // Occasionally master a topic
    if (Math.random() > 0.8) {
      topicsMastered += 1;
    }

    data.push({
      date: date.toISOString().split('T')[0],
      overallMastery: Math.round(mastery * 10) / 10,
      courseMastery: Math.round((mastery - 5 + Math.random() * 10) * 10) / 10,
      topicsMastered,
      hoursSpent: Math.round(totalHours * 10) / 10,
    });
  }

  return data;
}

function generateSampleCourseMastery(): CourseMastery[] {
  const courses = [
    { name: 'JavaScript Fundamentals', topics: 15 },
    { name: 'React Development', topics: 20 },
    { name: 'TypeScript Mastery', topics: 12 },
    { name: 'Node.js Backend', topics: 18 },
    { name: 'Database Design', topics: 10 },
  ];

  return courses.map((course, index) => {
    const mastery = 30 + Math.random() * 60;
    const topicsMastered = Math.floor((mastery / 100) * course.topics);

    return {
      courseId: `course-${index}`,
      courseName: course.name,
      mastery: Math.round(mastery * 10) / 10,
      topicsTotal: course.topics,
      topicsMastered,
      hoursSpent: Math.round(5 + Math.random() * 20),
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      completionRate: Math.round((topicsMastered / course.topics) * 100),
    };
  });
}

function generateSampleTopicMastery(): TopicMastery[] {
  const topics = [
    { name: 'Variables & Types', course: 'JavaScript', mastery: 95 },
    { name: 'Functions', course: 'JavaScript', mastery: 85 },
    { name: 'Arrays & Objects', course: 'JavaScript', mastery: 78 },
    { name: 'Async/Await', course: 'JavaScript', mastery: 62 },
    { name: 'React Hooks', course: 'React', mastery: 75 },
    { name: 'State Management', course: 'React', mastery: 55 },
    { name: 'Component Design', course: 'React', mastery: 70 },
    { name: 'TypeScript Basics', course: 'TypeScript', mastery: 80 },
    { name: 'Generics', course: 'TypeScript', mastery: 45 },
    { name: 'REST APIs', course: 'Node.js', mastery: 72 },
    { name: 'Authentication', course: 'Node.js', mastery: 58 },
    { name: 'SQL Queries', course: 'Database', mastery: 68 },
  ];

  return topics.map((topic, index) => ({
    topicId: `topic-${index}`,
    topicName: topic.name,
    courseName: topic.course,
    mastery: topic.mastery,
    size: topic.mastery,
    depth: topic.mastery >= 75 ? 'deep' : topic.mastery >= 50 ? 'intermediate' : 'surface',
  }));
}

function generateSampleMilestones(): MasteryMilestone[] {
  return [
    {
      id: '1',
      title: 'JavaScript Expert',
      description: 'Master all JavaScript fundamentals',
      type: 'course',
      achievedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      progress: 15,
      target: 15,
    },
    {
      id: '2',
      title: 'React Developer',
      description: 'Complete React Development course',
      type: 'course',
      progress: 16,
      target: 20,
    },
    {
      id: '3',
      title: '100 Topics Mastered',
      description: 'Master 100 different topics',
      type: 'achievement',
      progress: 67,
      target: 100,
    },
    {
      id: '4',
      title: 'Full Stack Ready',
      description: 'Achieve 70% mastery across all courses',
      type: 'skill',
      progress: 58,
      target: 70,
    },
  ];
}

function getMasteryLevel(mastery: number) {
  return MASTERY_LEVELS.find((l) => mastery >= l.min && mastery < l.max) ?? MASTERY_LEVELS[0];
}

function formatDaysAgo(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return 'Unknown';
  const days = Math.floor((Date.now() - dateObj.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return dateObj.toLocaleDateString();
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
    payload?: MasteryDataPoint;
  }>;
  label?: string;
}

function MasteryTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="font-medium text-sm mb-2">{label}</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Overall Mastery</span>
          <span className="font-medium">{data.overallMastery.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Topics Mastered</span>
          <span className="font-medium">{data.topicsMastered}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Hours Spent</span>
          <span className="font-medium">{data.hoursSpent}h</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MasteryRing({ mastery, size = 120 }: { mastery: number; size?: number }) {
  const level = getMasteryLevel(mastery);
  const strokeWidth = size / 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (mastery / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={level.color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: level.color }}>
          {mastery.toFixed(0)}%
        </span>
        <span className="text-xs text-muted-foreground">{level.level}</span>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: CourseMastery }) {
  const level = getMasteryLevel(course.mastery);
  const LevelIcon = level.icon;

  return (
    <div className="p-4 rounded-lg border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <LevelIcon className="w-4 h-4" style={{ color: level.color }} />
            <h4 className="font-medium truncate">{course.courseName}</h4>
          </div>

          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mastery</span>
              <span className="font-medium" style={{ color: level.color }}>
                {course.mastery.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={course.mastery}
              className="h-2"
              style={{ '--progress-color': level.color } as React.CSSProperties}
            />
          </div>
        </div>

        <Badge variant="outline" className="shrink-0">
          {course.topicsMastered}/{course.topicsTotal}
        </Badge>
      </div>

      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {course.hoursSpent}h spent
        </span>
        <span>{formatDaysAgo(course.lastActivity)}</span>
      </div>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: MasteryMilestone }) {
  const progress = (milestone.progress / milestone.target) * 100;
  const isComplete = milestone.achievedAt != null;

  const typeIcons = {
    topic: BookOpen,
    course: GraduationCap,
    skill: Zap,
    achievement: Trophy,
  };

  const Icon = typeIcons[milestone.type];

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-colors',
        isComplete ? 'bg-green-500/5 border-green-500/20' : 'hover:border-primary/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            isComplete ? 'bg-green-500/10' : 'bg-muted'
          )}
        >
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Icon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn('font-medium', isComplete && 'text-green-700 dark:text-green-300')}>
              {milestone.title}
            </h4>
            {isComplete && (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{milestone.description}</p>

          {!isComplete && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {milestone.progress}/{milestone.target}
                </span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {isComplete && milestone.achievedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Achieved {formatDaysAgo(milestone.achievedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Custom Treemap content
interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  name: string;
  mastery: number;
}

function CustomTreemapContent({ x, y, width, height, depth, name, mastery }: TreemapContentProps) {
  if (width < 50 || height < 30) return null;

  const topicData = { mastery } as TopicMastery;
  const level = getMasteryLevel(mastery);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={level.color}
        fillOpacity={0.2}
        stroke={level.color}
        strokeWidth={1}
        rx={4}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground text-xs font-medium"
      >
        {name?.length > 15 ? `${name.substring(0, 12)}...` : name}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs"
        fill={level.color}
      >
        {mastery}%
      </text>
    </g>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MasteryProgressChart({
  masteryHistory,
  courseMastery,
  topicMastery,
  milestones,
  overallMastery = 62,
  className,
}: MasteryProgressChartProps) {
  // Generate sample data if not provided
  const chartMasteryHistory = useMemo(
    () => masteryHistory ?? generateSampleMasteryHistory(),
    [masteryHistory]
  );
  const chartCourseMastery = useMemo(
    () => courseMastery ?? generateSampleCourseMastery(),
    [courseMastery]
  );
  const chartTopicMastery = useMemo(
    () => topicMastery ?? generateSampleTopicMastery(),
    [topicMastery]
  );
  const chartMilestones = useMemo(
    () => milestones ?? generateSampleMilestones(),
    [milestones]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const effectiveMastery =
      chartMasteryHistory[chartMasteryHistory.length - 1]?.overallMastery ?? overallMastery;
    const topicsMastered = chartTopicMastery.filter((t) => t.mastery >= 75).length;
    const coursesCompleted = chartCourseMastery.filter((c) => c.mastery >= 80).length;
    const totalHours = chartCourseMastery.reduce((sum, c) => sum + c.hoursSpent, 0);

    // Mastery distribution
    const distribution = MASTERY_LEVELS.map((level) => ({
      level: level.level,
      count: chartTopicMastery.filter((t) => t.mastery >= level.min && t.mastery < level.max).length,
      color: level.color,
    }));

    return {
      effectiveMastery,
      topicsMastered,
      totalTopics: chartTopicMastery.length,
      coursesCompleted,
      totalCourses: chartCourseMastery.length,
      totalHours,
      distribution,
    };
  }, [chartMasteryHistory, chartTopicMastery, chartCourseMastery, overallMastery]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main Mastery Ring */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center justify-center">
            <MasteryRing mastery={stats.effectiveMastery} size={140} />
            <p className="text-sm text-muted-foreground mt-3">Overall Mastery</p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{stats.topicsMastered}</p>
                <p className="text-sm text-muted-foreground">Topics Mastered</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <GraduationCap className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold">
                  {stats.coursesCompleted}/{stats.totalCourses}
                </p>
                <p className="text-sm text-muted-foreground">Courses Completed</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold">{stats.totalHours}h</p>
                <p className="text-sm text-muted-foreground">Total Study Time</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold">
                  {chartMilestones.filter((m) => m.achievedAt).length}
                </p>
                <p className="text-sm text-muted-foreground">Milestones Achieved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mastery Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Mastery Progress Over Time
          </CardTitle>
          <CardDescription>
            Track your overall mastery growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartMasteryHistory}>
                <defs>
                  <linearGradient id="masteryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip content={<MasteryTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="overallMastery"
                  name="Overall Mastery"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Course Mastery
            </CardTitle>
            <CardDescription>Your progress across courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {chartCourseMastery
                .sort((a, b) => b.mastery - a.mastery)
                .map((course) => (
                  <CourseCard key={course.courseId} course={course} />
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Learning Milestones
            </CardTitle>
            <CardDescription>Track your achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {chartMilestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topic Mastery Treemap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Topic Mastery Map
          </CardTitle>
          <CardDescription>
            Visual representation of your knowledge across topics. Larger areas indicate more time spent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={chartTopicMastery}
                dataKey="size"
                stroke="#fff"
                fill="#8884d8"
                content={<CustomTreemapContent x={0} y={0} width={0} height={0} depth={0} name="" mastery={0} />}
              />
            </ResponsiveContainer>
          </div>

          {/* Mastery Level Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
            {MASTERY_LEVELS.map((level) => (
              <div key={level.level} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: level.color, opacity: 0.3 }}
                />
                <span className="text-muted-foreground">{level.level}</span>
                <span className="font-medium">
                  {level.min}-{level.max}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MasteryProgressChart;
