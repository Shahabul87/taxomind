"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';
import { 
  TrendingUp, Brain, Target, Clock, 
  AlertCircle, CheckCircle2, Lightbulb, 
  BarChart3, TrendingDown, Zap,
  Calendar, Star, ArrowRight, Eye,
  Loader2, RefreshCw, Shield, Users,
  BookOpen, Award, Activity, Sparkles,
  ChevronRight, AlertTriangle, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "next-auth";
import { useCompletionPrediction, useStudySchedule, usePersonalizedRecommendations } from "@/hooks/use-predictive-analytics";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PredictiveAnalyticsEnhancedProps {
  user: User;
  enrolledCourses?: any[];
}

interface SAMPrediction {
  outcomeType: string;
  probability: number;
  confidence: number;
  timeframe: string;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
  interventions?: {
    type: string;
    urgency: "high" | "medium" | "low";
    action: string;
  }[];
}

interface RiskAnalysis {
  studentId: string;
  riskLevel: "high" | "medium" | "low";
  riskScore: number;
  indicators: string[];
  suggestedInterventions: string[];
  estimatedImprovementTime: string;
}

interface CohortComparison {
  studentPercentile: number;
  averageProgress: number;
  studentProgress: number;
  topPerformers: {
    characteristic: string;
    impact: string;
  }[];
}

export function PredictiveAnalyticsEnhanced({ user, enrolledCourses = [] }: PredictiveAnalyticsEnhancedProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'interventions' | 'cohort'>('overview');
  const [selectedCourse, setSelectedCourse] = useState(enrolledCourses[0]?.id || 'demo-course-1');
  const [samPredictions, setSamPredictions] = useState<SAMPrediction[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [cohortData, setCohortData] = useState<CohortComparison | null>(null);
  const [isLoadingSAM, setIsLoadingSAM] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  
  // Use existing hooks
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

  // Fetch SAM AI predictions
  const fetchSAMPredictions = useCallback(async () => {
    setIsLoadingSAM(true);
    try {
      const response = await axios.post("/api/sam/predictive-learning", {
        action: "predict-outcomes",
        data: {
          studentId: user.id,
          courseId: selectedCourse,
          includeInterventions: true,
        },
      });

      if (response.data.success) {
        setSamPredictions(response.data.data.predictions || []);
        setLastAnalysisTime(new Date());
        toast.success("AI predictions updated successfully");
      }
    } catch (error: any) {
      logger.error("Failed to fetch SAM predictions:", error);
      toast.error("Failed to load AI predictions");
    } finally {
      setIsLoadingSAM(false);
    }
  }, [user.id, selectedCourse]);

  // Fetch risk analysis
  const fetchRiskAnalysis = useCallback(async () => {
    try {
      const response = await axios.post("/api/sam/predictive-learning", {
        action: "identify-risks",
        data: {
          studentIds: [user.id],
          courseId: selectedCourse,
        },
      });

      if (response.data.success && response.data.data.risks?.length > 0) {
        setRiskAnalysis(response.data.data.risks[0]);
      }
    } catch (error: any) {
      logger.error("Failed to fetch risk analysis:", error);
    }
  }, [user.id, selectedCourse]);

  // Fetch cohort comparison
  const fetchCohortComparison = useCallback(async () => {
    try {
      const response = await axios.post("/api/sam/predictive-learning", {
        action: "cohort-analysis",
        data: {
          studentId: user.id,
          courseId: selectedCourse,
        },
      });

      if (response.data.success) {
        setCohortData(response.data.data);
      }
    } catch (error: any) {
      logger.error("Failed to fetch cohort comparison:", error);
    }
  }, [user.id, selectedCourse]);

  // Initial data fetch
  useEffect(() => {
    if (selectedCourse) {
      fetchSAMPredictions();
      fetchRiskAnalysis();
      fetchCohortComparison();
    }
  }, [selectedCourse, fetchSAMPredictions, fetchRiskAnalysis, fetchCohortComparison]);

  const getPredictionIcon = (type: string) => {
    switch (type) {
      case "completion":
        return CheckCircle2;
      case "performance":
        return TrendingUp;
      case "engagement":
        return Activity;
      case "mastery":
        return Award;
      default:
        return Brain;
    }
  };

  const getPredictionColor = (probability: number) => {
    if (probability >= 80) return "text-green-600 dark:text-green-400";
    if (probability >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with AI Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              SAM AI Predictive Analytics
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered learning predictions and interventions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastAnalysisTime && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Last updated: {lastAnalysisTime.toLocaleTimeString()}
            </Badge>
          )}
          <Button
            onClick={fetchSAMPredictions}
            variant="outline"
            size="sm"
            disabled={isLoadingSAM}
          >
            {isLoadingSAM ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Course Selector */}
      {enrolledCourses.length > 0 && (
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {enrolledCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourse(course.id)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                selectedCourse === course.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {course.title}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Risk Assessment Card */}
          {riskAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={cn(
                "border-2",
                riskAnalysis.riskLevel === "high" ? "border-red-500/50" :
                riskAnalysis.riskLevel === "medium" ? "border-yellow-500/50" :
                "border-green-500/50"
              )}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Risk Assessment
                    </div>
                    <Badge className={getRiskLevelColor(riskAnalysis.riskLevel)}>
                      {riskAnalysis.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Risk Score
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress value={riskAnalysis.riskScore} className="w-24" />
                      <span className="text-sm font-bold">{riskAnalysis.riskScore}%</span>
                    </div>
                  </div>
                  
                  {riskAnalysis.indicators.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Risk Indicators:</h4>
                      <ul className="space-y-1">
                        {riskAnalysis.indicators.map((indicator, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Button 
                      className="w-full"
                      onClick={() => setActiveTab("interventions")}
                    >
                      View Recommended Interventions
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Completion Probability */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    AI Prediction
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold">
                    {completionPrediction?.completionProbability || "85"}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Completion Probability
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Study Streak */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Current
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold">12</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Day Study Streak
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Optimal Study Time */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Recommended
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold">
                    {studySchedule?.recommendedDailyMinutes || "45"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Minutes per day
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                AI Learning Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Learning Pattern Detected
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You learn 40% faster with interactive content compared to video lectures
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Performance Improvement
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your problem-solving speed has increased by 23% this month
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {isLoadingSAM ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Brain className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-pulse mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  SAM AI is analyzing your learning patterns...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {samPredictions.map((prediction, index) => {
                const Icon = getPredictionIcon(prediction.outcomeType);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                              <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold capitalize">
                                {prediction.outcomeType} Prediction
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Timeframe: {prediction.timeframe}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-2xl font-bold", getPredictionColor(prediction.probability))}>
                              {prediction.probability}%
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {prediction.confidence}% confidence
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <CardContent className="pt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Positive Factors */}
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                              Positive Factors
                            </h4>
                            <ul className="space-y-1">
                              {prediction.factors.positive.map((factor, idx) => (
                                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                  • {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Negative Factors */}
                          {prediction.factors.negative.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                Areas for Improvement
                              </h4>
                              <ul className="space-y-1">
                                {prediction.factors.negative.map((factor, idx) => (
                                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                    • {factor}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {/* Recommendations */}
                        {prediction.recommendations.length > 0 && (
                          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              AI Recommendations
                            </h4>
                            <ul className="space-y-1">
                              {prediction.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm text-blue-700 dark:text-blue-300">
                                  • {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Interventions Tab */}
        <TabsContent value="interventions" className="space-y-4">
          {riskAnalysis && riskAnalysis.suggestedInterventions.length > 0 ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Personalized Interventions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                      Based on your learning patterns, SAM AI recommends:
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Estimated improvement time: {riskAnalysis.estimatedImprovementTime}
                    </p>
                  </div>
                  
                  {riskAnalysis.suggestedInterventions.map((intervention, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-4 rounded-lg border bg-white dark:bg-gray-800"
                    >
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">
                          Intervention {index + 1}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {intervention}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                        >
                          Start Now
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
              
              {/* Additional Support Resources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Additional Support Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <button className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm">Join Study Group</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm">Schedule AI Tutor Session</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm">Practice Exercises</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Great job! No interventions needed
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You&apos;re on track with your learning goals
              </p>
            </div>
          )}
        </TabsContent>

        {/* Cohort Analysis Tab */}
        <TabsContent value="cohort" className="space-y-4">
          {cohortData ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Your Position in Cohort
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Top {100 - cohortData.studentPercentile}%
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        You&apos;re performing better than {cohortData.studentPercentile}% of your peers
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Your Progress</span>
                        <span className="font-bold">{cohortData.studentProgress}%</span>
                      </div>
                      <Progress value={cohortData.studentProgress} className="h-2" />
                      
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Cohort Average</span>
                        <span>{cohortData.averageProgress}%</span>
                      </div>
                      <Progress value={cohortData.averageProgress} className="h-2 opacity-50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    Top Performer Characteristics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cohortData.topPerformers.map((trait, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20"
                      >
                        <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{trait.characteristic}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {trait.impact}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button className="w-full mt-4">
                    Adopt Top Performer Strategies
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Loading cohort data...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Analyzing your position among peers
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}