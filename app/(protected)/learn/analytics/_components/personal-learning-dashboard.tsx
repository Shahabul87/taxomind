"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  TrendingUp,
  Target,
  Brain,
  Clock,
  Award,
  Activity,
  Calendar,
  Zap,
  Trophy,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PersonalLearningDashboardProps {
  userId: string;
}

interface LearningAnalytics {
  overview: {
    totalCourses: number;
    activeCourses: number;
    completedCourses: number;
    totalStudyTime: number;
    averageProgress: number;
    currentStreak: number;
    totalExamsCompleted: number;
    averageScore: number;
  };
  cognitiveProgress: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  learningPatterns: {
    preferredStudyTime: string;
    averageSessionLength: number;
    studyFrequency: string;
    mostActiveDay: string;
    learningVelocity: number;
    retentionRate: number;
  };
  recentActivity: Array<{
    courseId: string;
    courseTitle: string;
    activityType: 'exam' | 'section' | 'chapter';
    activityTitle: string;
    score?: number;
    completedAt: string;
    timeSpent: number;
  }>;
  courseProgress: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    lastActivity: string;
    totalSections: number;
    completedSections: number;
    averageScore: number;
    estimatedTimeToComplete: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>;
  aiRecommendations: Array<{
    type: 'study_schedule' | 'weak_areas' | 'course_recommendation' | 'learning_strategy';
    title: string;
    description: string;
    actionItems: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    iconType: 'streak' | 'completion' | 'score' | 'time' | 'cognitive';
    unlockedAt: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}

export const PersonalLearningDashboard = ({
  userId
}: PersonalLearningDashboardProps) => {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'semester' | 'all'>('month');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/learning-analytics/personal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframe
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load learning analytics');
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe, fetchAnalytics]);

  const getBloomsLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      'remember': 'bg-blue-100 text-blue-700 border-blue-200',
      'understand': 'bg-green-100 text-green-700 border-green-200',
      'apply': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'analyze': 'bg-orange-100 text-orange-700 border-orange-200',
      'evaluate': 'bg-purple-100 text-purple-700 border-purple-200',
      'create': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[level] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getAchievementColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      'common': 'bg-gray-100 text-gray-700 border-gray-300',
      'rare': 'bg-blue-100 text-blue-700 border-blue-300',
      'epic': 'bg-purple-100 text-purple-700 border-purple-300',
      'legendary': 'bg-yellow-100 text-yellow-700 border-yellow-300'
    };
    return colors[rarity] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No learning data available yet</p>
        <p className="text-sm text-gray-500 mt-2">Start taking courses to see your analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Learning Journey
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your progress and discover insights about your learning patterns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="semester">This Semester</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Courses
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics.overview.activeCourses}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {analytics.overview.completedCourses} completed
                </span>
                <span className="text-gray-500 ml-2">• {analytics.overview.totalCourses} total</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Score
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics.overview.averageScore.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={analytics.overview.averageScore} className="h-2" />
                <div className="text-sm text-gray-500 mt-2">
                  {analytics.overview.totalExamsCompleted} exams completed
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Study Streak
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics.overview.currentStreak}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-orange-600 font-medium">
                  {analytics.overview.currentStreak > 0 ? 'Keep it up!' : 'Start today!'}
                </span>
                <span className="text-gray-500 ml-2">days</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Study Time
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {Math.round(analytics.overview.totalStudyTime / 60)}h
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-purple-600 font-medium">
                  {Math.round(analytics.learningPatterns.averageSessionLength)} min
                </span>
                <span className="text-gray-500 ml-2">avg session</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cognitive">Cognitive</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="patterns">Study Patterns</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Learning Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentActivity.slice(0, 8).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {activity.activityTitle}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {activity.activityType}
                        </Badge>
                        {activity.score && (
                          <Badge className={cn(
                            "text-xs",
                            activity.score >= 80 ? "bg-green-100 text-green-700" :
                            activity.score >= 60 ? "bg-blue-100 text-blue-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            {activity.score.toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {activity.courseTitle} • 
                        {new Date(activity.completedAt).toLocaleDateString()} • 
                        {Math.round(activity.timeSpent / 60)} minutes
                      </div>
                    </div>
                    <Link href={`/courses/${activity.courseId}/learn`}>
                      <Button size="sm" variant="ghost">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-6">
          {/* Cognitive Skills Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Cognitive Skills Development
              </CardTitle>
              <CardDescription>
                Your progress across different thinking skills (Bloom&apos;s Taxonomy)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Object.entries(analytics.cognitiveProgress).map(([level, score]) => (
                  <div key={level} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getBloomsLevelColor(level)} variant="outline">
                        {level}
                      </Badge>
                      <span className="text-sm font-medium">
                        {score.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={score} className="h-3" />
                    <div className="text-xs text-gray-500 capitalize">
                      {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Practice'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          {/* Course Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.courseProgress.map((course) => (
                  <div key={course.courseId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {course.courseTitle}
                        </h4>
                        <Badge className={getDifficultyColor(course.difficulty)}>
                          {course.difficulty}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">
                        {course.progress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={course.progress} className="h-2 mb-3" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                        <span className="ml-2 font-medium">
                          {course.completedSections}/{course.totalSections} sections
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Avg Score:</span>
                        <span className="ml-2 font-medium">{course.averageScore.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Time Left:</span>
                        <span className="ml-2 font-medium">{Math.round(course.estimatedTimeToComplete / 60)}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Last Activity:</span>
                        <span className="ml-2 font-medium">
                          {new Date(course.lastActivity).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Link href={`/courses/${course.courseId}/learn`}>
                        <Button size="sm">Continue Learning</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {/* Learning Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Your Learning Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2 capitalize">
                    {analytics.learningPatterns.preferredStudyTime}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Preferred Study Time
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {analytics.learningPatterns.averageSessionLength.toFixed(0)} min
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Average Session
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2 capitalize">
                    {analytics.learningPatterns.studyFrequency}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Study Frequency
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2 capitalize">
                    {analytics.learningPatterns.mostActiveDay}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Most Active Day
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">
                    {(analytics.learningPatterns.learningVelocity * 100).toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Learning Velocity
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600 mb-2">
                    {analytics.learningPatterns.retentionRate.toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Retention Rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Your Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.achievements.map((achievement) => (
                  <div key={achievement.id} className={cn(
                    "border rounded-lg p-4",
                    getAchievementColor(achievement.rarity)
                  )}>
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="w-6 h-6" />
                      <Badge className={getAchievementColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {achievement.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {achievement.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Learning Insights
              </CardTitle>
              <CardDescription>
                Personalized recommendations to improve your learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.aiRecommendations.map((rec, index) => (
                  <div key={index} className={cn(
                    "border rounded-lg p-4",
                    rec.priority === 'high' ? "border-red-200 bg-red-50" :
                    rec.priority === 'medium' ? "border-yellow-200 bg-yellow-50" :
                    "border-green-200 bg-green-50"
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {rec.title}
                      </h4>
                      <Badge className={cn(
                        rec.priority === 'high' ? "bg-red-100 text-red-700" :
                        rec.priority === 'medium' ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      )}>
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {rec.description}
                    </p>
                    <ul className="space-y-1 text-sm">
                      {rec.actionItems.map((action, actionIndex) => (
                        <li key={actionIndex} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};