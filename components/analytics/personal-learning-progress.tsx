"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Flame,
  CheckCircle2,
  Brain,
  BarChart3,
  ChevronRight,
  GraduationCap,
  Award,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useLearnerAnalytics, type LearnerAnalytics } from "@/hooks/use-unified-analytics";

interface PersonalLearningProgressProps {
  className?: string;
  compact?: boolean;
}

/**
 * Personal Learning Progress Component
 * Displays real-time learning analytics for the current user
 */
export function PersonalLearningProgress({
  className,
  compact = false,
}: PersonalLearningProgressProps) {
  const { data, loading, error } = useLearnerAnalytics("month");

  if (loading) {
    return <PersonalLearningProgressSkeleton compact={compact} />;
  }

  if (error || !data) {
    return (
      <Card className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm", className)}>
        <CardContent className="py-8 text-center">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            {error || "No learning data available yet"}
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700"
          >
            Start Learning
            <ChevronRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return <CompactView data={data} className={className} />;
  }

  return <FullView data={data} className={className} />;
}

function CompactView({ data, className }: { data: LearnerAnalytics; className?: string }) {
  const { overview, cognitiveProgress } = data;

  return (
    <Card className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-500" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<BookOpen className="w-4 h-4" />}
            label="Courses"
            value={overview.totalCoursesEnrolled}
            subtext={`${overview.coursesCompleted} completed`}
            color="blue"
          />
          <StatCard
            icon={<Target className="w-4 h-4" />}
            label="Progress"
            value={`${overview.overallProgress}%`}
            subtext="overall"
            color="green"
          />
          <StatCard
            icon={<Flame className="w-4 h-4" />}
            label="Streak"
            value={`${overview.studyStreak}d`}
            subtext="days learning"
            color="orange"
          />
          <StatCard
            icon={<Brain className="w-4 h-4" />}
            label="Level"
            value={cognitiveProgress.bloomsLevel}
            subtext={`${cognitiveProgress.cognitiveScore}% score`}
            color="purple"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FullView({ data, className }: { data: LearnerAnalytics; className?: string }) {
  const { overview, cognitiveProgress, examPerformance, weeklyActivity, recentProgress } = data;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-100">Enrolled</p>
                  <p className="text-2xl font-bold">{overview.totalCoursesEnrolled}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-100">Completed</p>
                  <p className="text-2xl font-bold">{overview.coursesCompleted}</p>
                </div>
                <Trophy className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-100">In Progress</p>
                  <p className="text-2xl font-bold">{overview.coursesInProgress}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-100">Study Streak</p>
                  <p className="text-2xl font-bold">{overview.studyStreak}d</p>
                </div>
                <Flame className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-100">Time Spent</p>
                  <p className="text-2xl font-bold">{formatTime(overview.totalTimeSpent)}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-100">Avg Score</p>
                  <p className="text-2xl font-bold">
                    {overview.averageScore !== null ? `${overview.averageScore}%` : "--"}
                  </p>
                </div>
                <Award className="w-8 h-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Cognitive Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Cognitive Development
              </CardTitle>
              <CardDescription>
                Your thinking skills progress based on Bloom&apos;s Taxonomy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                  {cognitiveProgress.bloomsLevel}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Current Cognitive Level
                </p>
                <div className="mt-4">
                  <Progress
                    value={cognitiveProgress.cognitiveScore}
                    className="h-3 bg-purple-100 dark:bg-purple-900/30"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {cognitiveProgress.cognitiveScore}% cognitive mastery
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Bloom&apos;s Levels Progress
                </h4>
                {["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"].map(
                  (level, index) => {
                    const isCurrentLevel = level === cognitiveProgress.bloomsLevel;
                    const isPassed = getBloomIndex(level) < getBloomIndex(cognitiveProgress.bloomsLevel);
                    const progress = isPassed ? 100 : isCurrentLevel ? cognitiveProgress.cognitiveScore : 0;

                    return (
                      <div key={level} className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                            isPassed || isCurrentLevel
                              ? "bg-purple-500 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                          )}
                        >
                          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={cn(isCurrentLevel && "font-semibold")}>{level}</span>
                            <span className="text-slate-500">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5 mt-1" />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Exam Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Exam Performance
              </CardTitle>
              <CardDescription>Your assessment results and progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {examPerformance.totalAttempts}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total Attempts</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {examPerformance.averageScore}%
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Average Score</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {examPerformance.passRate}%
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Pass Rate</p>
                </div>
              </div>

              {examPerformance.recentExams.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Recent Exams
                  </h4>
                  {examPerformance.recentExams.slice(0, 4).map((exam) => (
                    <div
                      key={exam.examId}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {exam.examTitle}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(exam.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            exam.passed ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {exam.score}%
                        </span>
                        <Badge
                          variant={exam.passed ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {exam.passed ? "Passed" : "Failed"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Activity & Recent Progress */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-32">
                {weeklyActivity.map((day, index) => {
                  const maxTime = Math.max(...weeklyActivity.map((d) => d.timeSpent), 1);
                  const height = (day.timeSpent / maxTime) * 100;

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          "w-full rounded-t-md transition-all",
                          day.timeSpent > 0
                            ? "bg-gradient-to-t from-blue-500 to-blue-400"
                            : "bg-slate-200 dark:bg-slate-700"
                        )}
                        style={{ height: `${Math.max(height, 5)}%` }}
                      />
                      <span className="text-[10px] text-slate-500">
                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Total:{" "}
                  {formatTime(weeklyActivity.reduce((sum, d) => sum + d.timeSpent, 0))}
                </span>
                <span>
                  Sections:{" "}
                  {weeklyActivity.reduce((sum, d) => sum + d.sectionsCompleted, 0)} completed
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-500" />
                Recent Course Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProgress.length > 0 ? (
                recentProgress.slice(0, 4).map((course) => (
                  <Link
                    key={course.courseId}
                    href={`/learn/${course.courseId}`}
                    className="block p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {course.courseTitle}
                      </p>
                      <span className="text-xs text-slate-500 ml-2">
                        {new Date(course.lastAccessed).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={course.progress} className="h-2 flex-1" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {course.progress}%
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-500 text-sm">No courses in progress yet</p>
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-1 text-blue-600 text-sm mt-2"
                  >
                    Browse Courses <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
  color: "blue" | "green" | "orange" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div className="text-center">
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2",
          colorClasses[color]
        )}
      >
        {icon}
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500">{subtext}</p>
    </div>
  );
}

function PersonalLearningProgressSkeleton({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-2 animate-pulse" />
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded mx-auto animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"
          />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getBloomIndex(level: string): number {
  const levels = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
  return levels.indexOf(level);
}
