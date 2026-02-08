'use client';

/**
 * CourseDetailPanel
 *
 * Detailed analytics view for a specific enrolled course.
 * Shows comprehensive breakdown of progress, topics, assessments, and milestones.
 */

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Target,
  BookOpen,
  Brain,
  Award,
  Calendar,
  CheckCircle2,
  Circle,
  TrendingUp,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  ThumbsUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  type EnrolledCourseAnalytics,
  formatStudyTime,
  getStatusColor,
  getStatusLabel,
  getMasteryLabel,
  getMasteryColor,
  formatRelativeTime,
  getProgressColor,
} from '@/hooks/use-enrolled-course-analytics';
import { ProgressSparkline } from '../enterprise/Sparkline';

// ============================================================================
// TYPES
// ============================================================================

interface CourseDetailPanelProps {
  course: EnrolledCourseAnalytics;
  onBack: () => void;
  className?: string;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Bloom's Taxonomy Radar (simplified bar chart)
function BloomsBreakdown({
  breakdown,
}: {
  breakdown: EnrolledCourseAnalytics['assessments']['bloomsBreakdown'];
}) {
  const levels = [
    { key: 'remember', label: 'Remember', color: 'bg-blue-500' },
    { key: 'understand', label: 'Understand', color: 'bg-cyan-500' },
    { key: 'apply', label: 'Apply', color: 'bg-green-500' },
    { key: 'analyze', label: 'Analyze', color: 'bg-amber-500' },
    { key: 'evaluate', label: 'Evaluate', color: 'bg-orange-500' },
    { key: 'create', label: 'Create', color: 'bg-violet-500' },
  ] as const;

  return (
    <div className="space-y-3">
      {levels.map(({ key, label, color }) => {
        const value = breakdown[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">
              {label}
            </span>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', color)}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="w-10 text-sm font-medium text-slate-700 dark:text-slate-300 text-right">
              {value}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Topic Progress List
function TopicProgressList({ topics }: { topics: EnrolledCourseAnalytics['topics'] }) {
  if (topics.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
        No topic data available yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {topics.map((topic) => (
        <div
          key={topic.id}
          className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              topic.status === 'completed' && 'bg-emerald-500',
              topic.status === 'in_progress' && 'bg-blue-500',
              topic.status === 'not_started' && 'bg-slate-300 dark:bg-slate-600'
            )}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {topic.name}
              </h4>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  getMasteryColor(topic.masteryLevel).split(' ')[0]
                )}
              >
                {getMasteryLabel(topic.masteryLevel)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>{topic.masteryLevel}% mastery</span>
              <span>•</span>
              <span>{formatStudyTime(topic.timeSpentMinutes)} spent</span>
              {topic.lastStudiedAt && (
                <>
                  <span>•</span>
                  <span>Last: {formatRelativeTime(topic.lastStudiedAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Milestone Timeline
function MilestoneTimeline({
  milestones,
}: {
  milestones: EnrolledCourseAnalytics['milestones'];
}) {
  if (milestones.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
        No milestones set for this course
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => (
        <div key={milestone.id} className="flex gap-4">
          {/* Timeline indicator */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                milestone.status === 'completed' &&
                  'bg-emerald-100 dark:bg-emerald-900/30',
                milestone.status === 'in_progress' &&
                  'bg-blue-100 dark:bg-blue-900/30',
                milestone.status === 'upcoming' &&
                  'bg-slate-100 dark:bg-slate-800'
              )}
            >
              {milestone.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : milestone.status === 'in_progress' ? (
                <Circle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            {index < milestones.length - 1 && (
              <div
                className={cn(
                  'w-0.5 flex-1 my-1',
                  milestone.status === 'completed'
                    ? 'bg-emerald-300 dark:bg-emerald-700'
                    : 'bg-slate-200 dark:bg-slate-700'
                )}
              />
            )}
          </div>

          {/* Milestone content */}
          <div className="flex-1 pb-4">
            <h4 className="font-medium text-slate-800 dark:text-slate-200">
              {milestone.title}
            </h4>
            {milestone.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {milestone.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
              {milestone.targetDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Target: {new Date(milestone.targetDate).toLocaleDateString()}
                </span>
              )}
              {milestone.completedAt && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                </span>
              )}
              {milestone.status === 'in_progress' && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {milestone.progress}% complete
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CourseDetailPanel({
  course,
  onBack,
  className,
}: CourseDetailPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn('space-y-6', className)}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="self-start flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Button>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
            <Badge
              variant="secondary"
              className={cn('flex-shrink-0', getStatusColor(course.status))}
            >
              {getStatusLabel(course.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {course.progress.overall}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Overall Progress
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatStudyTime(course.timeSpent.totalMinutes)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Time Spent
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {course.progress.chaptersCompleted}/{course.progress.totalChapters}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chapters Done
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {course.assessments.averageScore}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Avg Exam Score
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="topics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="assessments">Exams</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Topics Tab */}
        <TabsContent value="topics">
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
                  <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                Topic Mastery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopicProgressList topics={course.topics} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Exam Stats */}
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                    <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Exam Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {course.assessments.examAttempts}
                    </p>
                    <p className="text-xs text-slate-500">Total Attempts</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {course.assessments.passedExams}
                    </p>
                    <p className="text-xs text-slate-500">Passed Exams</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {course.assessments.practiceSessionsCount}
                    </p>
                    <p className="text-xs text-slate-500">Practice Sessions</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatStudyTime(course.assessments.totalPracticeMinutes)}
                    </p>
                    <p className="text-xs text-slate-500">Practice Time</p>
                  </div>
                </div>

                {/* Average Score Progress */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Average Score
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {course.assessments.averageScore}%
                    </span>
                  </div>
                  <ProgressSparkline
                    value={course.assessments.averageScore}
                    variant="success"
                    size="md"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bloom&apos;s Taxonomy */}
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Bloom&apos;s Taxonomy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BloomsBreakdown breakdown={course.assessments.bloomsBreakdown} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                  <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                Learning Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MilestoneTimeline milestones={course.milestones} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* AI Recommendation */}
            {course.aiInsights.recommendation && (
              <Card className="bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border border-violet-200 dark:border-violet-800 lg:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-full">
                      <Lightbulb className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-violet-800 dark:text-violet-200 mb-2">
                        AI Recommendation
                      </h3>
                      <p className="text-violet-700 dark:text-violet-300">
                        {course.aiInsights.recommendation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strengths */}
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                    <ThumbsUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {course.aiInsights.strengths.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Complete more content to identify your strengths
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {course.aiInsights.strengths.map((strength, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {course.aiInsights.weaknesses.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Great job! No significant areas for improvement identified
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {course.aiInsights.weaknesses.map((weakness, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Time Activity */}
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            Time Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatStudyTime(course.timeSpent.totalMinutes)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total Time
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatStudyTime(course.timeSpent.thisWeekMinutes)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This Week
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatStudyTime(course.timeSpent.averageSessionMinutes)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Avg Session
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {course.timeSpent.sessionsCount}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sessions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default CourseDetailPanel;
