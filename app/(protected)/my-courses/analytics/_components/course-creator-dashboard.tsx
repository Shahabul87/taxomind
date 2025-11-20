"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { logger } from '@/lib/logger';
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
    } catch (error: any) {
      logger.error('Error fetching creator analytics:', error);
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
      <div className="space-y-4 sm:space-y-5 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-2">
            <div className="h-6 sm:h-7 md:h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 sm:w-56 md:w-64 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 sm:w-40 md:w-48 animate-pulse"></div>
          </div>
          <div className="h-9 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded w-full sm:w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 sm:h-28 md:h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 sm:py-10 md:py-12 px-4">
        <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">No courses created yet</p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2">Create your first course to see analytics</p>
        <Link href="/create-course">
          <Button className="mt-4 h-9 sm:h-10 text-sm sm:text-base">Create Your First Course</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Creator Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            See how your shared courses are helping others learn and grow
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-full sm:w-32 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm h-9 sm:h-10 text-sm">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Total Learners
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5 sm:mt-1">
                    {formatNumber(analytics.overview.totalLearners)}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 md:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 md:mt-4 flex items-center text-[10px] sm:text-xs md:text-sm flex-wrap gap-1">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                <span className="text-green-600 font-medium">
                  +{analytics.overview.monthlyGrowth.toFixed(1)}%
                </span>
                <span className="text-gray-500">this month</span>
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
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Course Rating
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.overview.averageRating.toFixed(1)}
                    </p>
                    <Star className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-yellow-500 fill-current flex-shrink-0" />
                  </div>
                </div>
                <div className="p-1.5 sm:p-2 md:p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex-shrink-0">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 md:mt-4 flex items-center text-[10px] sm:text-xs md:text-sm">
                <span className="text-yellow-600 font-medium truncate">
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
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Total Views
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5 sm:mt-1">
                    {formatNumber(analytics.overview.totalViews)}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 md:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 md:mt-4 flex items-center text-[10px] sm:text-xs md:text-sm">
                <span className="text-purple-600 font-medium truncate">
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
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Completions
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5 sm:mt-1">
                    {formatNumber(analytics.overview.totalCompletions)}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 md:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 md:mt-4 flex items-center text-[10px] sm:text-xs md:text-sm">
                <span className="text-green-600 font-medium truncate">
                  {analytics.overview.totalCourses} courses
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full min-w-[600px] sm:min-w-0 grid-cols-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-1">
            <TabsTrigger value="overview" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <span className="hidden xs:inline">My Courses</span>
              <span className="xs:hidden">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="learners" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <span className="hidden sm:inline">Learner Insights</span>
              <span className="sm:hidden">Learners</span>
            </TabsTrigger>
            <TabsTrigger value="engagement" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Engagement
            </TabsTrigger>
            <TabsTrigger value="feedback" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <span className="hidden sm:inline">Community Feedback</span>
              <span className="sm:hidden">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <span className="hidden sm:inline">AI Suggestions</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
          {/* Course Performance */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl md:text-2xl">Course Performance</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
                How your shared courses are performing in the community
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {analytics.coursePerformance.map((course) => (
                  <div key={course.courseId} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                          {course.courseTitle}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn(getDifficultyColor(course.difficulty), "text-[10px] sm:text-xs")}>
                            {course.difficulty}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-yellow-500 fill-current flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium">
                              {course.averageRating.toFixed(1)}
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-500">
                              ({course.totalRatings})
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          {formatNumber(course.learners)} learners
                        </Badge>
                        <Link href={`/my-courses/${course.courseId}/edit`}>
                          <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">Completion Rate:</span>
                        <div className="mt-1">
                          <Progress value={course.completionRate} className="h-1.5 sm:h-2" />
                          <span className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 block">
                            {course.completionRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">Avg Study Time:</span>
                        <p className="font-medium text-xs sm:text-sm mt-0.5">{Math.round(course.averageStudyTime / 60)}h</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">Views:</span>
                        <p className="font-medium text-xs sm:text-sm mt-0.5">{formatNumber(course.views)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">Shares:</span>
                        <p className="font-medium text-xs sm:text-sm mt-0.5">{formatNumber(course.shares)}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">Last Activity:</span>
                        <p className="font-medium text-xs sm:text-sm mt-0.5">
                          {new Date(course.lastActivity).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-3 flex flex-wrap gap-1">
                      {course.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5">
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

        <TabsContent value="learners" className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
          {/* Learner Demographics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg md:text-xl">Experience Levels</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-2.5 sm:space-y-3">
                  {Object.entries(analytics.learnerInsights.demographics.experienceLevels).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm capitalize truncate flex-1">{level}</span>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <div className="w-16 sm:w-20 h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${(count / analytics.overview.totalLearners) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-medium min-w-[2rem] text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg md:text-xl">Top Countries</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-2.5 sm:space-y-3">
                  {analytics.learnerInsights.demographics.mostActiveCountries.slice(0, 5).map((country, index) => (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm truncate flex-1">{country.country}</span>
                      <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 flex-shrink-0">{country.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg md:text-xl">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average Exam Score</span>
                    <div className="mt-1">
                      <Progress value={analytics.learnerInsights.performanceData.averageExamScores} className="h-1.5 sm:h-2" />
                      <span className="text-xs sm:text-sm font-medium mt-0.5 sm:mt-1 block">
                        {analytics.learnerInsights.performanceData.averageExamScores.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg Time per Section</span>
                    <p className="text-base sm:text-lg font-semibold mt-0.5 sm:mt-1">
                      {Math.round(analytics.learnerInsights.engagementMetrics.averageTimePerSection)} min
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cognitive Skills Progress */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">Learners&apos; Cognitive Skills Development</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
                How learners are progressing across different thinking skills
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {Object.entries(analytics.learnerInsights.performanceData.cognitiveSkillsProgress).map(([skill, score]) => (
                  <div key={skill} className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium capitalize truncate flex-1">{skill}</span>
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 ml-2 flex-shrink-0">{score.toFixed(1)}%</span>
                    </div>
                    <Progress value={score} className="h-1.5 sm:h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
          {/* Popular Sections */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">Most Engaging Content</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-2.5 sm:space-y-3">
                {analytics.learnerInsights.engagementMetrics.mostPopularSections.map((section, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                        {section.sectionTitle}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                        {section.courseTitle}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 text-[10px] sm:text-xs px-2 sm:px-2.5 flex-shrink-0 self-start sm:self-auto">
                      {section.engagementScore.toFixed(1)} score
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Drop-off Points */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">Areas for Improvement</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
                Sections where learners commonly struggle or drop off
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-2.5 sm:space-y-3">
                {analytics.learnerInsights.engagementMetrics.dropoffPoints.map((section, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                        {section.sectionTitle}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                        {section.courseTitle}
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-700 text-[10px] sm:text-xs px-2 sm:px-2.5 flex-shrink-0 self-start sm:self-auto">
                      {section.dropoffRate.toFixed(1)}% drop-off
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
          {/* Community Reviews */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Recent Community Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {analytics.communityFeedback.slice(0, 10).map((feedback, index) => (
                  <div key={index} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          {feedback.learnerName}
                        </span>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={cn(
                                "w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4",
                                i < feedback.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                              )} 
                            />
                          ))}
                        </div>
                        {feedback.helpful && (
                          <Badge className="bg-green-100 text-green-700 text-[9px] sm:text-xs px-1.5 sm:px-2">
                            Helpful
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 flex-shrink-0">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 leading-relaxed">
                      {feedback.review}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                      Course: {feedback.courseTitle}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
          {/* AI Suggestions */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">AI-Powered Improvement Suggestions</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
                Data-driven recommendations to enhance your courses
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {analytics.suggestions.map((suggestion, index) => (
                  <div key={index} className={cn(
                    "border rounded-lg p-3 sm:p-4",
                    getPriorityColor(suggestion.priority)
                  )}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 flex-1 min-w-0">
                        {suggestion.title}
                      </h4>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap flex-shrink-0">
                        <Badge className={cn(
                          "text-[9px] sm:text-xs px-1.5 sm:px-2",
                          suggestion.priority === 'high' ? "bg-red-100 text-red-700" :
                          suggestion.priority === 'medium' ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        )}>
                          {suggestion.priority} priority
                        </Badge>
                        <Badge variant="outline" className="capitalize text-[9px] sm:text-xs px-1.5 sm:px-2">
                          {suggestion.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 leading-relaxed">
                      {suggestion.description}
                    </p>
                    {suggestion.relatedCourse && (
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2 truncate">
                        Related to: {suggestion.relatedCourse}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-blue-600 font-medium truncate">
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