"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, Brain, Target, Clock, 
  AlertCircle, CheckCircle2, Lightbulb, 
  BarChart3, TrendingDown, Zap,
  Calendar, Star, ArrowRight, Eye,
  Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User } from "next-auth";
import { useCompletionPrediction, useStudySchedule, usePersonalizedRecommendations } from "@/hooks/use-predictive-analytics";

interface PredictiveAnalyticsProps {
  user: User;
}

interface LearningPrediction {
  id: string;
  title: string;
  description: string;
  confidence: number;
  type: "success" | "warning" | "info" | "opportunity";
  icon: any;
  color: string;
  actionable: boolean;
  timeframe: string;
}

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  trend: "up" | "down" | "stable";
  change: number;
  benchmark: number;
  unit: string;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: "learning_pattern" | "performance" | "recommendation" | "risk";
  priority: "high" | "medium" | "low";
  icon: any;
  color: string;
}

export function PredictiveAnalytics({ user }: PredictiveAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'predictions' | 'schedule' | 'recommendations'>('predictions');
  const [selectedCourse, setSelectedCourse] = useState('demo-course-1');
  
  // Use real predictive analytics
  const { 
    prediction: completionPrediction, 
    loading: predictionLoading,
    refreshPrediction
  } = useCompletionPrediction(selectedCourse);
  
  const { 
    schedule: studySchedule, 
    loading: scheduleLoading,
    refreshSchedule
  } = useStudySchedule(selectedCourse);
  
  const { 
    recommendations: personalizedRecommendations, 
    loading: recommendationsLoading,
    refreshRecommendations
  } = usePersonalizedRecommendations(selectedCourse);

  // Fallback data for demo
  const [predictions] = useState<LearningPrediction[]>([
    {
      id: "1",
      title: "Course Completion Probability",
      description: "85% likely to complete React course by next week",
      confidence: 85,
      type: "success",
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-600",
      actionable: true,
      timeframe: "7 days"
    },
    {
      id: "2",
      title: "Optimal Study Time",
      description: "Your peak learning efficiency is between 9-11 AM",
      confidence: 92,
      type: "info",
      icon: Clock,
      color: "from-blue-500 to-indigo-600",
      actionable: true,
      timeframe: "Daily"
    },
    {
      id: "3",
      title: "Knowledge Gap Alert",
      description: "JavaScript fundamentals need review before advanced topics",
      confidence: 78,
      type: "warning",
      icon: AlertCircle,
      color: "from-yellow-500 to-orange-600",
      actionable: true,
      timeframe: "Before next course"
    },
    {
      id: "4",
      title: "Skill Mastery Timeline",
      description: "Full-stack development mastery projected in 6 months",
      confidence: 73,
      type: "opportunity",
      icon: Target,
      color: "from-purple-500 to-pink-600",
      actionable: false,
      timeframe: "6 months"
    }
  ]);

  const [performanceMetrics] = useState<PerformanceMetric[]>([
    {
      id: "1",
      name: "Learning Velocity",
      value: 8.5,
      trend: "up",
      change: 12,
      benchmark: 7.0,
      unit: "hours/week"
    },
    {
      id: "2",
      name: "Retention Rate",
      value: 87,
      trend: "up",
      change: 5,
      benchmark: 75,
      unit: "%"
    },
    {
      id: "3",
      name: "Engagement Score",
      value: 92,
      trend: "stable",
      change: 0,
      benchmark: 85,
      unit: "%"
    },
    {
      id: "4",
      name: "Quiz Performance",
      value: 84,
      trend: "down",
      change: -3,
      benchmark: 80,
      unit: "%"
    }
  ]);

  const [aiInsights] = useState<AIInsight[]>([
    {
      id: "1",
      title: "Learning Pattern Detected",
      description: "You learn 40% faster with interactive content vs. video lectures",
      category: "learning_pattern",
      priority: "high",
      icon: Brain,
      color: "text-purple-600"
    },
    {
      id: "2",
      title: "Performance Improvement",
      description: "Your problem-solving speed has increased by 23% this month",
      category: "performance",
      priority: "medium",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      id: "3",
      title: "Course Recommendation",
      description: "Based on your progress, consider 'Advanced React Patterns' next",
      category: "recommendation",
      priority: "medium",
      icon: Lightbulb,
      color: "text-blue-600"
    },
    {
      id: "4",
      title: "Potential Risk",
      description: "Study session length decreasing - consider shorter, frequent sessions",
      category: "risk",
      priority: "low",
      icon: AlertCircle,
      color: "text-orange-600"
    }
  ]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return TrendingUp;
      case "down": return TrendingDown;
      case "stable": return BarChart3;
      default: return BarChart3;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-green-600";
      case "down": return "text-red-600";
      case "stable": return "text-slate-400";
      default: return "text-slate-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "border-green-200 bg-green-50";
      case "warning": return "border-yellow-200 bg-yellow-50";
      case "info": return "border-blue-200 bg-blue-50";
      case "opportunity": return "border-purple-200 bg-purple-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Tab Navigation */}
      <div 
        className="flex flex-wrap gap-2 sm:gap-2.5 p-1.5 sm:p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm sm:shadow-md"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setActiveTab('predictions')}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold sm:font-medium transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-[36px] flex items-center justify-center flex-1 sm:flex-none active:scale-[0.98] ${
            activeTab === 'predictions'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700'
          }`}
        >
          AI Predictions
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold sm:font-medium transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-[36px] flex items-center justify-center flex-1 sm:flex-none active:scale-[0.98] ${
            activeTab === 'schedule'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700'
          }`}
        >
          Study Schedule
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold sm:font-medium transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-[36px] flex items-center justify-center flex-1 sm:flex-none active:scale-[0.98] ${
            activeTab === 'recommendations'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700'
          }`}
        >
          Recommendations
        </button>
      </div>

      {/* Course Completion Prediction */}
      {activeTab === 'predictions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-md sm:shadow-lg">
            <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-purple-200 dark:bg-purple-800/50 flex-shrink-0">
                    <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base leading-tight sm:leading-normal break-words">
                    Course Completion Prediction
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshPrediction}
                  disabled={predictionLoading}
                  className="w-full sm:w-auto min-h-[36px] sm:min-h-[32px] px-3 sm:px-3 text-xs sm:text-sm font-medium touch-manipulation"
                >
                  {predictionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span className="ml-1.5 sm:ml-2 hidden sm:inline">Refresh</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              {predictionLoading ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-3">
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-purple-600" />
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Loading prediction...</p>
                </div>
              ) : completionPrediction ? (
                <div className="space-y-3 sm:space-y-4 md:space-y-5">
                  {/* Main Percentage Display */}
                  <div className="text-center py-2 sm:py-4">
                    <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-3 leading-none tracking-tight">
                      {completionPrediction.completionProbability}%
                    </div>
                    <div className="text-base sm:text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2 font-semibold sm:font-medium">
                      Completion Probability
                    </div>
                    <div className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 font-normal">
                      Confidence Score: <span className="font-semibold">{completionPrediction.confidenceScore}%</span>
                    </div>
                  </div>

                  {/* Risk Factors Section */}
                  {completionPrediction.riskFactors.length > 0 && (
                    <div className="p-3 sm:p-4 md:p-5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-600/30 rounded-lg sm:rounded-xl">
                      <h4 className="font-semibold sm:font-medium text-orange-700 dark:text-orange-300 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        Risk Factors
                      </h4>
                      <ul className="text-xs sm:text-sm md:text-base text-orange-600 dark:text-orange-200 space-y-1.5 sm:space-y-2 leading-relaxed">
                        {completionPrediction.riskFactors.map((factor, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="flex-shrink-0 mt-0.5">•</span>
                            <span className="flex-1 break-words">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Recommendations Section */}
                  {completionPrediction.recommendations.length > 0 && (
                    <div className="p-3 sm:p-4 md:p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600/30 rounded-lg sm:rounded-xl">
                      <h4 className="font-semibold sm:font-medium text-blue-700 dark:text-blue-300 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        AI Recommendations
                      </h4>
                      <ul className="text-xs sm:text-sm md:text-base text-blue-600 dark:text-blue-200 space-y-1.5 sm:space-y-2 leading-relaxed">
                        {completionPrediction.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="flex-shrink-0 mt-0.5">•</span>
                            <span className="flex-1 break-words">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 break-words">No prediction data available</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshPrediction}
                    className="min-h-[44px] sm:min-h-[36px] px-4 sm:px-3 text-sm font-medium touch-manipulation active:scale-[0.98]"
                  >
                    Load Prediction
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Study Schedule */}
      {activeTab === 'schedule' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-md sm:shadow-lg">
            <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-blue-200 dark:bg-blue-800/50 flex-shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base break-words">Optimal Study Schedule</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshSchedule}
                  disabled={scheduleLoading}
                  className="w-full sm:w-auto min-h-[36px] sm:min-h-[32px] px-3 sm:px-3 text-xs sm:text-sm font-medium touch-manipulation"
                >
                  {scheduleLoading ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span className="ml-1.5 sm:ml-2 hidden sm:inline">Refresh</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              {scheduleLoading ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-3">
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-blue-600" />
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 break-words">Generating schedule...</p>
                </div>
              ) : studySchedule ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1 sm:mb-2 break-words">
                        {studySchedule.recommendedDailyMinutes}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium break-words">Minutes/Day</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2 break-words">
                        {studySchedule.estimatedCompletionWeeks}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium break-words">Weeks to Complete</div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300">
                    <h4 className="font-medium text-xs sm:text-sm md:text-base text-slate-800 dark:text-slate-200 mb-2 break-words">Best Study Times</h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {studySchedule.bestStudyTimes.map((time, index) => (
                        <Badge key={index} variant="outline" className="border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs break-words">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300">
                    <h4 className="font-medium text-xs sm:text-sm md:text-base text-slate-800 dark:text-slate-200 mb-2 break-words">Weekly Goal</h4>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 break-words">
                        {studySchedule.weeklyGoal}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 break-words">minutes per week</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 break-words">No schedule data available</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshSchedule}
                    className="min-h-[44px] sm:min-h-[36px] px-4 sm:px-3 text-sm font-medium touch-manipulation active:scale-[0.98]"
                  >
                    Generate Schedule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Personalized Recommendations */}
      {activeTab === 'recommendations' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-md sm:shadow-lg">
            <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-green-200 dark:bg-green-800/50 flex-shrink-0">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base break-words">Personalized Recommendations</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshRecommendations}
                  disabled={recommendationsLoading}
                  className="w-full sm:w-auto min-h-[36px] sm:min-h-[32px] px-3 sm:px-3 text-xs sm:text-sm font-medium touch-manipulation"
                >
                  {recommendationsLoading ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span className="ml-1.5 sm:ml-2 hidden sm:inline">Refresh</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              {recommendationsLoading ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-3">
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-green-600" />
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 break-words">Loading recommendations...</p>
                </div>
              ) : personalizedRecommendations ? (
                <div className="space-y-3 sm:space-y-4">
                  {personalizedRecommendations.contentRecommendations.length > 0 && (
                    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600/30 rounded-lg">
                      <h4 className="font-medium text-xs sm:text-sm md:text-base text-blue-700 dark:text-blue-300 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 break-words">
                        <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        Content Recommendations
                      </h4>
                      <ul className="text-xs sm:text-sm text-blue-600 dark:text-blue-200 space-y-1 leading-relaxed">
                        {personalizedRecommendations.contentRecommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-1.5">
                            <span className="flex-shrink-0 mt-0.5">•</span>
                            <span className="flex-1 break-words">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {personalizedRecommendations.studyStrategies.length > 0 && (
                    <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-600/30 rounded-lg">
                      <h4 className="font-medium text-xs sm:text-sm md:text-base text-purple-700 dark:text-purple-300 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 break-words">
                        <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        Study Strategies
                      </h4>
                      <ul className="text-xs sm:text-sm text-purple-600 dark:text-purple-200 space-y-1 leading-relaxed">
                        {personalizedRecommendations.studyStrategies.map((strategy, index) => (
                          <li key={index} className="flex items-start gap-1.5">
                            <span className="flex-shrink-0 mt-0.5">•</span>
                            <span className="flex-1 break-words">{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {personalizedRecommendations.peerConnections.length > 0 && (
                    <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-600/30 rounded-lg">
                      <h4 className="font-medium text-xs sm:text-sm md:text-base text-green-700 dark:text-green-300 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 break-words">
                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        Peer Connections
                      </h4>
                      <ul className="text-xs sm:text-sm text-green-600 dark:text-green-200 space-y-1 leading-relaxed">
                        {personalizedRecommendations.peerConnections.map((connection, index) => (
                          <li key={index} className="flex items-start gap-1.5">
                            <span className="flex-shrink-0 mt-0.5">•</span>
                            <span className="flex-1 break-words">{connection}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {personalizedRecommendations.resourceSuggestions.length > 0 && (
                    <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-600/30 rounded-lg">
                      <h4 className="font-medium text-xs sm:text-sm md:text-base text-orange-700 dark:text-orange-300 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 break-words">
                        <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        Resource Suggestions
                      </h4>
                      <ul className="text-xs sm:text-sm text-orange-600 dark:text-orange-200 space-y-1 leading-relaxed">
                        {personalizedRecommendations.resourceSuggestions.map((resource, index) => (
                          <li key={index} className="flex items-start gap-1.5">
                            <span className="flex-shrink-0 mt-0.5">•</span>
                            <span className="flex-1 break-words">{resource}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 break-words">No recommendations available</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshRecommendations}
                    className="min-h-[44px] sm:min-h-[36px] px-4 sm:px-3 text-sm font-medium touch-manipulation active:scale-[0.98]"
                  >
                    Generate Recommendations
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-200 dark:bg-purple-800/50 flex-shrink-0">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base break-words">Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {performanceMetrics.map((metric, index) => {
                const TrendIcon = getTrendIcon(metric.trend);
                return (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-3 sm:p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                      <h4 className="font-semibold sm:font-medium text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-tight break-words">
                        {metric.name}
                      </h4>
                      <TrendIcon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${getTrendColor(metric.trend)}`} />
                    </div>
                    <div className="flex items-baseline gap-1 sm:gap-1.5 mb-2 sm:mb-2.5">
                      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white leading-none">
                        {metric.value}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">{metric.unit}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-0 text-xs sm:text-sm">
                      <span className="text-slate-600 dark:text-slate-500 leading-relaxed">
                        Benchmark: <span className="font-semibold">{metric.benchmark}{metric.unit}</span>
                      </span>
                      {metric.change !== 0 && (
                        <span className={`font-semibold ${
                          metric.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Predictions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-200 dark:bg-purple-800/50 flex-shrink-0">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base break-words">AI Predictions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              {predictions.map((prediction, index) => {
                const PredictionIcon = prediction.icon;
                return (
                  <motion.div
                    key={prediction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300 p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-full bg-gradient-to-r ${prediction.color} text-white flex-shrink-0`}>
                        <PredictionIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-2.5">
                          <h4 className="font-semibold sm:font-medium text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-tight break-words">
                            {prediction.title}
                          </h4>
                          <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 w-fit">
                            {prediction.confidence}% confident
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2.5 sm:mb-3 leading-relaxed break-words">
                          {prediction.description}
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                          <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                            Timeframe: <span className="font-semibold">{prediction.timeframe}</span>
                          </span>
                          {prediction.actionable && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="min-h-[36px] sm:min-h-[28px] px-3 sm:px-3 text-xs border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 touch-manipulation w-full sm:w-auto"
                            >
                              Take Action
                              <ArrowRight className="w-3 h-3 ml-1.5 sm:ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-200 dark:bg-emerald-800/50 flex-shrink-0">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base break-words">AI Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2.5 sm:space-y-3">
              {aiInsights.map((insight, index) => {
                const InsightIcon = insight.icon;
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="p-1.5 sm:p-2 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex-shrink-0">
                      <InsightIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${insight.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-1">
                        <h4 className="font-semibold sm:font-medium text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-tight break-words">
                          {insight.title}
                        </h4>
                        <Badge className={`${getPriorityColor(insight.priority)} text-xs w-fit`}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words">
                        {insight.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Learning Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-200 dark:bg-blue-800/50 flex-shrink-0">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base break-words">Learning Health Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2 sm:mb-3 leading-none tracking-tight">
                89
              </div>
              <div className="text-base sm:text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2 font-semibold sm:font-medium">
                Excellent Learning Health
              </div>
              <div className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed px-2">
                Based on engagement, progress, and learning patterns
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5">
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1 leading-none">
                  92
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold sm:font-medium leading-tight">
                  Engagement
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1 leading-none">
                  87
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold sm:font-medium leading-tight">
                  Progress
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-pink-600 dark:text-pink-400 mb-1 leading-none">
                  88
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold sm:font-medium leading-tight">
                  Consistency
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full min-h-[44px] sm:min-h-[40px] border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 text-sm sm:text-base font-medium touch-manipulation"
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              View Detailed Analysis
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}