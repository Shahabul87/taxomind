"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Eye,
  Heart,
  Share2,
  TrendingUp,
  Star,
  Clock,
  Target,
  BookOpen,
  Activity,
  Globe,
  Award,
  MessageCircle
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

interface CourseCreatorDashboardProps {
  creatorId: string;
}

interface CreatorAnalytics {
  overview: {
    totalCourses: number;
    totalLearners: number;
    totalViews: number;
    averageRating: number;
    totalRatings: number;
    totalShares: number;
    totalCompletions: number;
    monthlyGrowth: number;
  };
  coursePerformance: Array<{
    courseId: string;
    courseTitle: string;
    learners: number;
    completionRate: number;
    averageRating: number;
    totalRatings: number;
    averageStudyTime: number;
    views: number;
    shares: number;
    createdAt: string;
    lastActivity: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
  }>;
  learnerInsights: {
    demographics: {
      experienceLevels: { [key: string]: number };
      mostActiveCountries: Array<{ country: string; count: number }>;
      ageGroups: { [key: string]: number };
    };
    engagementMetrics: {
      averageTimePerSection: number;
      mostPopularSections: Array<{
        sectionTitle: string;
        courseTitle: string;
        engagementScore: number;
      }>;
      dropoffPoints: Array<{
        sectionTitle: string;
        courseTitle: string;
        dropoffRate: number;
      }>;
    };
    performanceData: {
      averageExamScores: number;
      cognitiveSkillsProgress: {
        remember: number;
        understand: number;
        apply: number;
        analyze: number;
        evaluate: number;
        create: number;
      };
      commonStrugglingAreas: Array<{
        area: string;
        courseTitle: string;
        strugglingPercentage: number;
      }>;
    };
  };
  communityFeedback: Array<{
    courseId: string;
    courseTitle: string;
    learnerName: string;
    rating: number;
    review: string;
    createdAt: string;
    helpful: boolean;
  }>;
  suggestions: Array<{
    type: 'content_improvement' | 'new_course' | 'engagement' | 'difficulty_adjustment';
    title: string;
    description: string;
    relatedCourse?: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: string;
  }>;
}

export const CourseCreatorDashboard = ({
  creatorId
}: CourseCreatorDashboardProps) => {
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/creator-analytics/dashboard', {
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
      console.error('Error fetching creator analytics:', error);
      toast.error('Failed to load creator analytics');
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No courses created yet</p>
        <p className="text-sm text-gray-500 mt-2">Create your first course to see analytics</p>
        <Link href="/create-course">
          <Button className="mt-4">Create Your First Course</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Creator Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            See how your shared courses are helping others learn and grow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
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
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Learners
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatNumber(analytics.overview.totalLearners)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">
                  +{analytics.overview.monthlyGrowth.toFixed(1)}%
                </span>
                <span className="text-gray-500 ml-2">this month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Course Rating
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.overview.averageRating.toFixed(1)}
                    </p>
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-yellow-600 font-medium">
                  {formatNumber(analytics.overview.totalRatings)} reviews
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Views
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatNumber(analytics.overview.totalViews)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-purple-600 font-medium">
                  {formatNumber(analytics.overview.totalShares)} shares
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completions
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatNumber(analytics.overview.totalCompletions)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {analytics.overview.totalCourses} courses
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <TabsTrigger value="overview">My Courses</TabsTrigger>
          <TabsTrigger value="learners">Learner Insights</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="feedback">Community Feedback</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Course Performance */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>
                How your shared courses are performing in the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.coursePerformance.map((course) => (
                  <div key={course.courseId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {course.courseTitle}
                        </h4>
                        <Badge className={getDifficultyColor(course.difficulty)}>
                          {course.difficulty}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">
                            {course.averageRating.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({course.totalRatings})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {formatNumber(course.learners)} learners
                        </Badge>
                        <Link href={`/my-courses/${course.courseId}/edit`}>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                        <div className="mt-1">
                          <Progress value={course.completionRate} className="h-2" />
                          <span className="text-xs text-gray-500 mt-1">
                            {course.completionRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Avg Study Time:</span>
                        <p className="font-medium">{Math.round(course.averageStudyTime / 60)}h</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Views:</span>
                        <p className="font-medium">{formatNumber(course.views)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Shares:</span>
                        <p className="font-medium">{formatNumber(course.shares)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Last Activity:</span>
                        <p className="font-medium">
                          {new Date(course.lastActivity).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {course.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learners" className="space-y-6">
          {/* Learner Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle>Experience Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.learnerInsights.demographics.experienceLevels).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{level}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${(count / analytics.overview.totalLearners) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.learnerInsights.demographics.mostActiveCountries.slice(0, 5).map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{country.country}</span>
                      <Badge variant="outline">{country.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Average Exam Score</span>
                    <div className="mt-1">
                      <Progress value={analytics.learnerInsights.performanceData.averageExamScores} className="h-2" />
                      <span className="text-sm font-medium">
                        {analytics.learnerInsights.performanceData.averageExamScores.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Time per Section</span>
                    <p className="text-lg font-semibold">
                      {Math.round(analytics.learnerInsights.engagementMetrics.averageTimePerSection)} min
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cognitive Skills Progress */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle>Learners&apos; Cognitive Skills Development</CardTitle>
              <CardDescription>
                How learners are progressing across different thinking skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(analytics.learnerInsights.performanceData.cognitiveSkillsProgress).map(([skill, score]) => (
                  <div key={skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{skill}</span>
                      <span className="text-sm text-gray-600">{score.toFixed(1)}%</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* Popular Sections */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle>Most Engaging Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.learnerInsights.engagementMetrics.mostPopularSections.map((section, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {section.sectionTitle}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {section.courseTitle}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      {section.engagementScore.toFixed(1)} score
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Drop-off Points */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle>Areas for Improvement</CardTitle>
              <CardDescription>
                Sections where learners commonly struggle or drop off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.learnerInsights.engagementMetrics.dropoffPoints.map((section, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {section.sectionTitle}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {section.courseTitle}
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">
                      {section.dropoffRate.toFixed(1)}% drop-off
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {/* Community Reviews */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Recent Community Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.communityFeedback.slice(0, 10).map((feedback, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {feedback.learnerName}
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={cn(
                                "w-4 h-4",
                                i < feedback.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                              )} 
                            />
                          ))}
                        </div>
                        {feedback.helpful && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            Helpful
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {feedback.review}
                    </p>
                    <p className="text-sm text-gray-500">
                      Course: {feedback.courseTitle}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          {/* AI Suggestions */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle>AI-Powered Improvement Suggestions</CardTitle>
              <CardDescription>
                Data-driven recommendations to enhance your courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.suggestions.map((suggestion, index) => (
                  <div key={index} className={cn(
                    "border rounded-lg p-4",
                    getPriorityColor(suggestion.priority)
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {suggestion.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          suggestion.priority === 'high' ? "bg-red-100 text-red-700" :
                          suggestion.priority === 'medium' ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        )}>
                          {suggestion.priority} priority
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {suggestion.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {suggestion.description}
                    </p>
                    {suggestion.relatedCourse && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Related to: {suggestion.relatedCourse}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-600 font-medium">
                        Estimated Impact: {suggestion.estimatedImpact}
                      </span>
                    </div>
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