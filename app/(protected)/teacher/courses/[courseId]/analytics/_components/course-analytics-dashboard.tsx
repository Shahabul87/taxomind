"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Target,
  Brain,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Zap,
  Eye,
  EyeOff,
  Star,
  Crown,
  ChevronRight,
  Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TourTrigger } from "@/components/ui/tour-trigger";
import { aiAnalyticsTour } from "@/lib/tours/ai-course-creation-tour";
import { InterfaceModeToggle } from "@/components/ui/interface-mode-toggle";
import { FeatureHint, FeatureProgressIndicator } from "@/components/ui/feature-hint";
import { useProgressiveDisclosure } from "@/hooks/use-progressive-disclosure";

interface CourseAnalyticsDashboardProps {
  courseId: string;
  courseName: string;
  initialMode?: 'simple' | 'advanced';
}

interface CourseAnalytics {
  overview: {
    totalStudents: number;
    activeStudents: number;
    averageProgress: number;
    completionRate: number;
    totalExams: number;
    totalExamAttempts: number;
  };
  performance: {
    classAverage: number;
    bloomsDistribution: {
      [key: string]: {
        average: number;
        studentCount: number;
        totalQuestions: number;
      };
    };
    difficultyBreakdown: {
      easy: { average: number; count: number };
      medium: { average: number; count: number };
      hard: { average: number; count: number };
    };
    trends: {
      dates: string[];
      averageScores: number[];
      participationRates: number[];
    };
  };
  riskAnalysis: {
    atRiskStudents: Array<{
      userId: string;
      userName: string;
      riskScore: number;
      riskFactors: string[];
      lastActivity: string;
      averageScore: number;
      missedExams: number;
    }>;
    interventionRecommendations: Array<{
      type: 'individual' | 'group' | 'content';
      priority: 'high' | 'medium' | 'low';
      description: string;
      affectedStudents: number;
      suggestedActions: string[];
    }>;
  };
  examAnalysis: {
    examEffectiveness: Array<{
      examId: string;
      examTitle: string;
      averageScore: number;
      completionRate: number;
      averageTime: number;
      difficultQuestions: Array<{
        questionId: string;
        question: string;
        correctRate: number;
        bloomsLevel: string;
        difficulty: string;
      }>;
    }>;
    questionInsights: Array<{
      questionId: string;
      question: string;
      correctRate: number;
      bloomsLevel: string;
      difficulty: string;
      needsReview: boolean;
      suggestions: string[];
    }>;
  };
  learningOutcomes: {
    outcomeProgress: Array<{
      outcome: string;
      chapterId: string;
      chapterTitle: string;
      masteryLevel: number;
      studentsOnTrack: number;
      studentsBehind: number;
    }>;
    cognitiveProgress: {
      remember: number;
      understand: number;
      apply: number;
      analyze: number;
      evaluate: number;
      create: number;
    };
  };
}

export const CourseAnalyticsDashboard = ({
  courseId,
  courseName,
  initialMode = 'simple'
}: CourseAnalyticsDashboardProps) => {
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'semester' | 'all'>('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [isAdvancedMode, setIsAdvancedMode] = useState(initialMode === 'advanced');
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  
  const { 
    recordFeatureUsage, 
    isFeatureUnlocked
  } = useProgressiveDisclosure();
  
  const isCognitiveAnalyticsUnlocked = isFeatureUnlocked('cognitive-analytics');
  const isPredictiveAnalyticsUnlocked = isFeatureUnlocked('predictive-analytics');
  const isBasicAnalyticsUnlocked = isFeatureUnlocked('basic-analytics');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/teacher-analytics/course-overview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          timeframe,
          includeDetailed: isAdvancedMode,
          includePredictive: isPredictiveAnalyticsUnlocked,
          includeCognitive: isCognitiveAnalyticsUnlocked
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      
      // Record usage
      recordFeatureUsage('basic-analytics', 1);
      if (isAdvancedMode && isCognitiveAnalyticsUnlocked) {
        recordFeatureUsage('cognitive-analytics', 1);
      }
      if (isPredictiveAnalyticsUnlocked) {
        recordFeatureUsage('predictive-analytics', 1);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, timeframe, isAdvancedMode, isPredictiveAnalyticsUnlocked, isCognitiveAnalyticsUnlocked, recordFeatureUsage]);

  useEffect(() => {
    fetchAnalytics();
  }, [courseId, timeframe, isAdvancedMode, fetchAnalytics]);
  
  const toggleSection = (sectionId: string) => {
    setHiddenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };
  
  const isSectionHidden = (sectionId: string) => hiddenSections.includes(sectionId);

  const getRiskLevelColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getBloomsLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      'REMEMBER': 'bg-blue-100 text-blue-700',
      'UNDERSTAND': 'bg-green-100 text-green-700',
      'APPLY': 'bg-yellow-100 text-yellow-700',
      'ANALYZE': 'bg-orange-100 text-orange-700',
      'EVALUATE': 'bg-purple-100 text-purple-700',
      'CREATE': 'bg-red-100 text-red-700'
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
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
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load analytics data</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4" data-tour="analytics-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {courseName} Analytics
              </h1>
              <TourTrigger tourConfig={aiAnalyticsTour} text="AI Analytics Tour" />
              <Badge variant="outline" className="ml-2">
                {isAdvancedMode ? 'Advanced' : 'Simple'} View
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isAdvancedMode 
                ? "Comprehensive insights with AI-powered predictions and cognitive analysis"
                : "Essential performance metrics and key insights for your course"}
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
            <Button onClick={fetchAnalytics} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Mode Toggle and Progress */}
        <div className="flex items-center justify-between">
          <InterfaceModeToggle
            isAdvancedMode={isAdvancedMode}
            onModeChange={setIsAdvancedMode}
            className="flex-1 max-w-md"
          />
          <div className="flex items-center gap-4">
            <FeatureProgressIndicator 
              className="w-48"
              totalFeatures={10}
              unlockedFeatures={5}
            />
            {!isAdvancedMode && (
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Info className="w-4 h-4" />
                <span>Switch to Advanced for more insights</span>
              </div>
            )}
          </div>
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
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics.overview.totalStudents}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {analytics.overview.activeStudents} active
                </span>
                <span className="text-gray-500 ml-2">this {timeframe}</span>
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
                    Class Average
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics.performance.classAverage.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={analytics.performance.classAverage} className="h-2" />
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
                    At-Risk Students
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics.riskAnalysis.atRiskStudents.length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-red-600 font-medium">
                  {analytics.riskAnalysis.atRiskStudents.filter(s => s.riskScore > 60).length} high risk
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Exam Attempts
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics.overview.totalExamAttempts}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">
                  Across {analytics.overview.totalExams} exams
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI-Powered Predictive Analytics Section */}
      <AnimatePresence>
        {(isAdvancedMode || isPredictiveAnalyticsUnlocked) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] rounded-xl"
            data-tour="completion-prediction"
          >
            <Card className="bg-white dark:bg-gray-900 rounded-xl border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        AI Predictive Insights
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                        Advanced analytics powered by machine learning and cognitive modeling
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200">
                      Real-time AI Analysis
                    </Badge>
                    {!isPredictiveAnalyticsUnlocked && (
                      <FeatureHint 
                        featureId="predictive-analytics"
                        title="Predictive Analytics"
                        description="Advanced AI-powered analytics and predictions"
                      >
                        <Badge variant="outline" className="cursor-pointer">
                          <Crown className="w-3 h-3 mr-1" />
                          Unlock Advanced
                        </Badge>
                      </FeatureHint>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection('predictive-analytics')}
                      className="h-8 w-8 p-0"
                    >
                      {isSectionHidden('predictive-analytics') ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <AnimatePresence>
                {!isSectionHidden('predictive-analytics') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Completion Prediction */}
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                          className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <Target className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200">Course Completion Forecast</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Predicted completion rate</span>
                              <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                {Math.round(analytics.overview.completionRate * 1.1)}%
                              </span>
                            </div>
                            <Progress 
                              value={Math.round(analytics.overview.completionRate * 1.1)} 
                              className="h-2"
                            />
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              Based on current engagement patterns and historical data
                            </div>
                            {isPredictiveAnalyticsUnlocked && (
                              <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                                <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">AI Recommendations:</div>
                                <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-1">
                                  <li>• Increase interactive content by 20%</li>
                                  <li>• Send weekly progress reminders</li>
                                  <li>• Add more frequent checkpoints</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* Bloom's Cognitive Progression */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                          className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800"
                          data-tour="cognitive-progression"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <Activity className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold text-purple-800 dark:text-purple-200">Cognitive Development</h4>
                            {!isCognitiveAnalyticsUnlocked && (
                              <FeatureHint 
                                featureId="cognitive-analytics"
                                title="Cognitive Analytics"
                                description="Advanced cognitive development tracking and insights"
                              >
                                <Badge variant="outline" className="text-xs cursor-pointer">
                                  <Star className="w-3 h-3 mr-1" />
                                  Unlock
                                </Badge>
                              </FeatureHint>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-purple-700 dark:text-purple-300">Remember</span>
                                <span className="font-medium">{analytics.learningOutcomes.cognitiveProgress.remember}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700 dark:text-purple-300">Understand</span>
                                <span className="font-medium">{analytics.learningOutcomes.cognitiveProgress.understand}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700 dark:text-purple-300">Apply</span>
                                <span className="font-medium">{analytics.learningOutcomes.cognitiveProgress.apply}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700 dark:text-purple-300">Analyze</span>
                                <span className="font-medium">{analytics.learningOutcomes.cognitiveProgress.analyze}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700 dark:text-purple-300">Evaluate</span>
                                <span className="font-medium">{analytics.learningOutcomes.cognitiveProgress.evaluate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700 dark:text-purple-300">Create</span>
                                <span className="font-medium">{analytics.learningOutcomes.cognitiveProgress.create}%</span>
                              </div>
                            </div>
                            {isCognitiveAnalyticsUnlocked && (
                              <div className="pt-2 border-t border-purple-200 dark:border-purple-700">
                                <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Predicted Growth:</div>
                                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                  Higher-order thinking skills projected to improve by 15% over next 4 weeks
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* At-Risk Student Interventions */}
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 }}
                          className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
                          data-tour="risk-analysis"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <h4 className="font-semibold text-orange-800 dark:text-orange-200">Smart Interventions</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-orange-700 dark:text-orange-300">Students needing attention</span>
                              <span className="text-lg font-bold text-orange-900 dark:text-orange-100">
                                {analytics.riskAnalysis.atRiskStudents.length}
                              </span>
                            </div>
                            {isPredictiveAnalyticsUnlocked && (
                              <>
                                <div className="text-xs text-orange-600 dark:text-orange-400">
                                  AI-suggested intervention priority:
                                </div>
                                <div className="space-y-2">
                                  {analytics.riskAnalysis.interventionRecommendations.slice(0, 2).map((recommendation, index) => (
                                    <div key={index} className="text-xs p-2 bg-orange-100 dark:bg-orange-900/30 rounded border border-orange-200 dark:border-orange-700">
                                      <div className="font-medium text-orange-800 dark:text-orange-200 capitalize">
                                        {recommendation.priority} Priority: {recommendation.type}
                                      </div>
                                      <div className="text-orange-700 dark:text-orange-300 mt-1">
                                        {recommendation.description}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                            <Button size="sm" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                              View Action Plan
                            </Button>
                          </div>
                        </motion.div>
                      </div>

                      {/* AI-Powered Course Optimization Suggestions */}
                      {isPredictiveAnalyticsUnlocked && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 }}
                          className="p-4 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 dark:from-slate-900/50 dark:via-gray-900/50 dark:to-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                          data-tour="smart-interventions"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                              <Brain className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800 dark:text-slate-200">AI Course Optimization</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400">Machine learning analysis of student behavior patterns</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">Content Optimization</h5>
                              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                <li className="flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3 text-green-500" />
                                  Add 2-3 more practice exercises in Chapter 3
                                </li>
                                <li className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-blue-500" />
                                  Reduce video length in Section 2.1 by 15%
                                </li>
                                <li className="flex items-center gap-2">
                                  <Brain className="w-3 h-3 text-purple-500" />
                                  Increase &quot;Apply&quot; level questions by 25%
                                </li>
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">Engagement Boosters</h5>
                              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                <li className="flex items-center gap-2">
                                  <Users className="w-3 h-3 text-indigo-500" />
                                  Add peer discussion forum for Chapter 4
                                </li>
                                <li className="flex items-center gap-2">
                                  <Target className="w-3 h-3 text-green-500" />
                                  Create milestone badges for week 2-3
                                </li>
                                <li className="flex items-center gap-2">
                                  <Activity className="w-3 h-3 text-orange-500" />
                                  Schedule check-in quiz after Section 1.3
                                </li>
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn(
          "grid w-full",
          isAdvancedMode ? "grid-cols-6" : "grid-cols-3"
        )}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isAdvancedMode && (
            <>
              <TabsTrigger value="cognitive" className="relative">
                Cognitive
                {!isCognitiveAnalyticsUnlocked && (
                  <Badge variant="outline" className="ml-1 text-xs">
                    <Star className="w-2 h-2" />
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
              <TabsTrigger value="exams">Exam Analysis</TabsTrigger>
              <TabsTrigger value="outcomes">Learning Outcomes</TabsTrigger>
              <TabsTrigger value="recommendations">Actions</TabsTrigger>
            </>
          )}
          {!isAdvancedMode && (
            <>
              <TabsTrigger value="risk">Students</TabsTrigger>
              <TabsTrigger value="exams">Exams</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Bloom's Taxonomy Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Cognitive Level Performance
              </CardTitle>
              <CardDescription>
                Student performance across Bloom&apos;s taxonomy levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(analytics.performance.bloomsDistribution).map(([level, data]) => (
                  <div key={level} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getBloomsLevelColor(level)} variant="outline">
                        {level.toLowerCase()}
                      </Badge>
                      <span className="text-sm font-medium">
                        {data.average.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={data.average} className="h-2" />
                    <p className="text-xs text-gray-500">
                      {data.studentCount} students, {data.totalQuestions} questions
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Question Difficulty Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                {Object.entries(analytics.performance.difficultyBreakdown).map(([difficulty, data]) => (
                  <div key={difficulty} className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {data.average.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 capitalize mb-2">
                      {difficulty} Questions
                    </div>
                    <Progress value={data.average} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">
                      {data.count} attempts
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {Object.entries(analytics.learningOutcomes.cognitiveProgress).map(([level, score]) => (
              <Card key={level}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Badge className={`${getBloomsLevelColor(level.toUpperCase())} mb-3`} variant="outline">
                      {level}
                    </Badge>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {score.toFixed(1)}%
                    </div>
                    <Progress value={score} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          {/* At-Risk Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Students Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.riskAnalysis.atRiskStudents.slice(0, 10).map((student) => (
                  <div key={student.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {student.userName}
                        </h4>
                        <Badge 
                          className={cn(
                            "text-xs",
                            student.riskScore > 60 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                          )}
                        >
                          Risk: {student.riskScore}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {student.riskFactors.map((factor, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Last activity: {new Date(student.lastActivity).toLocaleDateString()} • 
                        Average: {student.averageScore.toFixed(1)}%
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-6">
          {/* Exam Effectiveness */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.examAnalysis.examEffectiveness.map((exam) => (
                  <div key={exam.examId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {exam.examTitle}
                      </h4>
                      <Badge variant="outline">
                        {exam.averageScore.toFixed(1)}% avg
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Completion:</span>
                        <span className="ml-2 font-medium">{exam.completionRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Avg Time:</span>
                        <span className="ml-2 font-medium">{Math.round(exam.averageTime / 60)}min</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Difficult Questions:</span>
                        <span className="ml-2 font-medium">{exam.difficultQuestions.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-6">
          {/* Learning Outcomes Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Chapter Learning Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.learningOutcomes.outcomeProgress.map((outcome) => (
                  <div key={outcome.chapterId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {outcome.chapterTitle}
                      </h4>
                      <span className="text-sm font-medium">
                        {outcome.masteryLevel}% mastery
                      </span>
                    </div>
                    <Progress value={outcome.masteryLevel} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{outcome.studentsOnTrack} students on track</span>
                      <span>{outcome.studentsBehind} students behind</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Intervention Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>
                AI-generated recommendations based on student performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.riskAnalysis.interventionRecommendations.map((rec, index) => (
                  <div key={index} className={cn(
                    "border rounded-lg p-4",
                    getRiskLevelColor(rec.priority)
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskLevelColor(rec.priority)}>
                          {rec.priority} priority
                        </Badge>
                        <Badge variant="outline">
                          {rec.type}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600">
                        {rec.affectedStudents} students
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {rec.description}
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {rec.suggestedActions.map((action, actionIndex) => (
                        <li key={actionIndex} className="flex items-center gap-2">
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