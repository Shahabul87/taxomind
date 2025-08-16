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
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-800/60 rounded-lg border border-slate-600/30">
        <button
          onClick={() => setActiveTab('predictions')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'predictions'
              ? 'bg-purple-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          AI Predictions
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'schedule'
              ? 'bg-purple-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          Study Schedule
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'recommendations'
              ? 'bg-purple-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
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
          <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-100">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-white">Course Completion Prediction</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshPrediction}
                  disabled={predictionLoading}
                >
                  {predictionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {predictionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : completionPrediction ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-purple-600 mb-2">
                      {completionPrediction.completionProbability}%
                    </div>
                    <div className="text-lg text-slate-300 mb-1">Completion Probability</div>
                    <div className="text-sm text-slate-500">
                      Confidence Score: {completionPrediction.confidenceScore}%
                    </div>
                  </div>
                  
                  {completionPrediction.riskFactors.length > 0 && (
                    <div className="p-4 bg-orange-900/20 border border-orange-600/30 rounded-lg">
                      <h4 className="font-medium text-orange-300 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Risk Factors
                      </h4>
                      <ul className="text-sm text-orange-200 space-y-1">
                        {completionPrediction.riskFactors.map((factor, index) => (
                          <li key={index}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {completionPrediction.recommendations.length > 0 && (
                    <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                      <h4 className="font-medium text-blue-300 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        AI Recommendations
                      </h4>
                      <ul className="text-sm text-blue-200 space-y-1">
                        {completionPrediction.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-slate-400">No prediction data available</div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshPrediction}
                    className="mt-2"
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
          <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-white">Optimal Study Schedule</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshSchedule}
                  disabled={scheduleLoading}
                >
                  {scheduleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : studySchedule ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-800/60 rounded-lg border border-slate-600/30">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {studySchedule.recommendedDailyMinutes}
                      </div>
                      <div className="text-sm text-slate-300">Minutes/Day</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/60 rounded-lg border border-slate-600/30">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {studySchedule.estimatedCompletionWeeks}
                      </div>
                      <div className="text-sm text-slate-300">Weeks to Complete</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-600/30">
                    <h4 className="font-medium text-white mb-2">Best Study Times</h4>
                    <div className="flex flex-wrap gap-2">
                      {studySchedule.bestStudyTimes.map((time, index) => (
                        <Badge key={index} variant="outline" className="text-slate-300">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-600/30">
                    <h4 className="font-medium text-white mb-2">Weekly Goal</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-purple-600">
                        {studySchedule.weeklyGoal}
                      </span>
                      <span className="text-slate-300">minutes per week</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-slate-400">No schedule data available</div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshSchedule}
                    className="mt-2"
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
          <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-white">Personalized Recommendations</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshRecommendations}
                  disabled={recommendationsLoading}
                >
                  {recommendationsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              ) : personalizedRecommendations ? (
                <div className="space-y-4">
                  {personalizedRecommendations.contentRecommendations.length > 0 && (
                    <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                      <h4 className="font-medium text-blue-300 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Content Recommendations
                      </h4>
                      <ul className="text-sm text-blue-200 space-y-1">
                        {personalizedRecommendations.contentRecommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {personalizedRecommendations.studyStrategies.length > 0 && (
                    <div className="p-4 bg-purple-900/20 border border-purple-600/30 rounded-lg">
                      <h4 className="font-medium text-purple-300 mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Study Strategies
                      </h4>
                      <ul className="text-sm text-purple-200 space-y-1">
                        {personalizedRecommendations.studyStrategies.map((strategy, index) => (
                          <li key={index}>• {strategy}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {personalizedRecommendations.peerConnections.length > 0 && (
                    <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                      <h4 className="font-medium text-green-300 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Peer Connections
                      </h4>
                      <ul className="text-sm text-green-200 space-y-1">
                        {personalizedRecommendations.peerConnections.map((connection, index) => (
                          <li key={index}>• {connection}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {personalizedRecommendations.resourceSuggestions.length > 0 && (
                    <div className="p-4 bg-orange-900/20 border border-orange-600/30 rounded-lg">
                      <h4 className="font-medium text-orange-300 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Resource Suggestions
                      </h4>
                      <ul className="text-sm text-orange-200 space-y-1">
                        {personalizedRecommendations.resourceSuggestions.map((resource, index) => (
                          <li key={index}>• {resource}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-slate-400">No recommendations available</div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshRecommendations}
                    className="mt-2"
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
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-white">Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {performanceMetrics.map((metric, index) => {
                const TrendIcon = getTrendIcon(metric.trend);
                return (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{metric.name}</h4>
                      <TrendIcon className={`w-4 h-4 ${getTrendColor(metric.trend)}`} />
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-2xl font-bold text-white">
                        {metric.value}
                      </span>
                      <span className="text-sm text-slate-400">{metric.unit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        Benchmark: {metric.benchmark}{metric.unit}
                      </span>
                      {metric.change !== 0 && (
                        <span className={`font-medium ${
                          metric.change > 0 ? 'text-green-600' : 'text-red-600'
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
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-200 dark:bg-purple-800/50">
                <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">AI Predictions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.map((prediction, index) => {
                const PredictionIcon = prediction.icon;
                return (
                  <motion.div
                    key={prediction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full bg-gradient-to-r ${prediction.color} text-white`}>
                        <PredictionIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-800 dark:text-slate-200">{prediction.title}</h4>
                          <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {prediction.confidence}% confident
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{prediction.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-500">
                            Timeframe: {prediction.timeframe}
                          </span>
                          {prediction.actionable && (
                            <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600">
                              Take Action
                              <ArrowRight className="w-3 h-3 ml-1" />
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
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-200 dark:bg-emerald-800/50">
                <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">AI Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => {
                const InsightIcon = insight.icon;
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                      <InsightIcon className={`w-4 h-4 ${insight.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-slate-800 dark:text-slate-200">{insight.title}</h4>
                        <Badge className={getPriorityColor(insight.priority)}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{insight.description}</p>
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
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-800/50">
                <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">Learning Health Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                89
              </div>
              <div className="text-lg text-slate-700 dark:text-slate-300 mb-1 font-medium">Excellent Learning Health</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Based on engagement, progress, and learning patterns
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">92</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Engagement</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">87</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Progress</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400 mb-1">88</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Consistency</div>
              </div>
            </div>

            <Button variant="outline" className="w-full border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600">
              <Eye className="w-4 h-4 mr-2" />
              View Detailed Analysis
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}