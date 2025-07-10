"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Target,
  Brain,
  Clock,
  BarChart3,
  CheckCircle,
  Star,
  Crown,
  Eye,
  Activity,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InterfaceModeToggle } from "@/components/ui/interface-mode-toggle";
import { FeatureHint, FeatureProgressIndicator } from "@/components/ui/feature-hint";
import { useProgressiveDisclosure } from "@/hooks/use-progressive-disclosure";
import { cn } from "@/lib/utils";

interface SimplifiedAnalyticsDashboardProps {
  courseId: string;
  courseName: string;
}

// Mock data for demonstration
const mockAnalytics = {
  overview: {
    totalStudents: 45,
    activeStudents: 38,
    averageProgress: 72,
    completionRate: 68,
    totalExams: 8,
    totalExamAttempts: 156
  },
  performance: {
    classAverage: 78,
    bloomsDistribution: {
      remember: { average: 85, studentCount: 40, totalQuestions: 15 },
      understand: { average: 80, studentCount: 38, totalQuestions: 20 },
      apply: { average: 75, studentCount: 35, totalQuestions: 18 },
      analyze: { average: 70, studentCount: 30, totalQuestions: 12 },
      evaluate: { average: 68, studentCount: 25, totalQuestions: 8 },
      create: { average: 65, studentCount: 20, totalQuestions: 5 }
    }
  },
  riskAnalysis: {
    atRiskStudents: [
      {
        userId: "1",
        userName: "Sarah Johnson",
        riskScore: 85,
        riskFactors: ["Low attendance", "Missing assignments"],
        lastActivity: "3 days ago",
        averageScore: 45,
        missedExams: 2
      },
      {
        userId: "2", 
        userName: "Mike Chen",
        riskScore: 70,
        riskFactors: ["Declining scores", "Late submissions"],
        lastActivity: "1 day ago",
        averageScore: 58,
        missedExams: 1
      }
    ]
  }
};

export const SimplifiedAnalyticsDashboard = ({
  courseId,
  courseName
}: SimplifiedAnalyticsDashboardProps) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [analytics, setAnalytics] = useState(mockAnalytics);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    isFeatureRevealed,
    revealFeature,
    markFeatureUsed,
    getProgressScore,
    getAllRevealedFeatures
  } = useProgressiveDisclosure();

  // Feature reveal handlers
  const handleFeatureActivate = (featureId: string) => {
    revealFeature(featureId);
    markFeatureUsed(featureId);
    
    if (featureId === "advanced-charts") {
      setIsAdvancedMode(true);
    }
  };

  const progressScore = getProgressScore();
  const revealedFeatures = getAllRevealedFeatures();

  return (
    <div className="space-y-6">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Course Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Insights for {courseName}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <FeatureProgressIndicator
            totalFeatures={8}
            unlockedFeatures={revealedFeatures.length}
            className="hidden lg:block"
          />
          <InterfaceModeToggle
            isAdvancedMode={isAdvancedMode}
            onModeChange={setIsAdvancedMode}
          />
        </div>
      </div>

      {/* Progressive Feature Hints */}
      <div className="space-y-3">
        {!isFeatureRevealed("advanced-charts") && (
          <FeatureHint
            featureId="advanced-charts"
            title="Advanced Charts Available"
            description="Unlock detailed performance charts and trend analysis to better understand student progress."
            priority="medium"
            category="advanced"
            onActivate={() => handleFeatureActivate("advanced-charts")}
          />
        )}

        {isFeatureRevealed("advanced-charts") && !isFeatureRevealed("risk-analysis") && (
          <FeatureHint
            featureId="risk-analysis"
            title="Student Risk Analysis"
            description="Identify students who may need additional support with AI-powered risk assessment."
            priority="high"
            category="advanced"
            isNew={true}
            onActivate={() => handleFeatureActivate("risk-analysis")}
          />
        )}

        {isFeatureRevealed("risk-analysis") && !isFeatureRevealed("cognitive-analytics") && (
          <FeatureHint
            featureId="cognitive-analytics"
            title="Cognitive Analytics"
            description="Deep dive into Bloom's taxonomy analysis and cognitive skill development tracking."
            priority="medium"
            category="expert"
            isNew={true}
            onActivate={() => handleFeatureActivate("cognitive-analytics")}
          />
        )}
      </div>

      {/* Simple Mode Dashboard */}
      {!isAdvancedMode ? (
        <div className="space-y-6">
          {/* Basic Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics.overview.totalStudents}
                      </p>
                    </div>
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
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Students</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics.overview.activeStudents}
                      </p>
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
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                      <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Average Progress</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics.overview.averageProgress}%
                      </p>
                    </div>
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
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                      <Target className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Class Average</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics.performance.classAverage}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Course Progress Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Course Progress Overview
                </CardTitle>
                <CardDescription>
                  Overall progress and completion rates for your course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Progress</span>
                      <span className="font-medium">{analytics.overview.averageProgress}%</span>
                    </div>
                    <Progress value={analytics.overview.averageProgress} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Completion Rate</span>
                      <span className="font-medium">{analytics.overview.completionRate}%</span>
                    </div>
                    <Progress value={analytics.overview.completionRate} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Simple Performance Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Performance Summary
                </CardTitle>
                <CardDescription>
                  Quick overview of student performance across different skill levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analytics.performance.bloomsDistribution).slice(0, 3).map(([level, data]) => (
                    <div key={level} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">{level}</span>
                        <Badge variant="outline">{data.average}%</Badge>
                      </div>
                      <Progress value={data.average} className="h-2" />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {data.studentCount} students
                      </p>
                    </div>
                  ))}
                </div>
                
                {isFeatureRevealed("advanced-charts") && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Advanced charts are now available! Switch to Advanced Mode to see detailed analytics.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : (
        /* Advanced Mode Content */
        <div className="space-y-6">
          {/* Advanced analytics would go here */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-600" />
                  Advanced Analytics Dashboard
                </CardTitle>
                <CardDescription>
                  Comprehensive analytics with detailed insights and AI-powered recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Crown className="w-16 h-16 text-purple-600 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Advanced Mode Activated!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You now have access to detailed charts, risk analysis, and cognitive analytics.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Risk Analysis (if revealed) */}
          {isFeatureRevealed("risk-analysis") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Student Risk Analysis
                    <Badge className="bg-red-100 text-red-700 text-xs">New</Badge>
                  </CardTitle>
                  <CardDescription>
                    AI-powered identification of students who may need additional support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.riskAnalysis.atRiskStudents.map((student) => (
                      <div key={student.userId} className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-red-800 dark:text-red-300">
                            {student.userName}
                          </h4>
                          <Badge variant="destructive">
                            Risk: {student.riskScore}%
                          </Badge>
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-400 space-y-1">
                          <p>Average Score: {student.averageScore}%</p>
                          <p>Last Activity: {student.lastActivity}</p>
                          <p>Risk Factors: {student.riskFactors.join(", ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Cognitive Analytics (if revealed) */}
          {isFeatureRevealed("cognitive-analytics") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Cognitive Development Analytics
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Expert</Badge>
                  </CardTitle>
                  <CardDescription>
                    Deep analysis of cognitive skill development across Bloom's taxonomy levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(analytics.performance.bloomsDistribution).map(([level, data]) => (
                      <div key={level} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium capitalize">{level}</span>
                          <Badge variant={data.average >= 75 ? "default" : "secondary"}>
                            {data.average}%
                          </Badge>
                        </div>
                        <Progress value={data.average} className="h-3 mb-2" />
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <p>{data.studentCount} students</p>
                          <p>{data.totalQuestions} questions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};