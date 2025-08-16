"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { logger } from '@/lib/logger';
import {
  User,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Brain,
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StudentProfileAnalyticsProps {
  courseId: string;
  studentId: string;
  studentName: string;
  onBack: () => void;
}

interface StudentProfile {
  student: {
    id: string;
    name: string;
    email: string;
    enrolledDate: string;
    lastActivity: string;
  };
  performance: {
    overallScore: number;
    examsTaken: number;
    examsAvailable: number;
    averageTime: number;
    improvementTrend: number;
    consistency: number;
    rank: number;
    totalStudents: number;
  };
  cognitiveAnalysis: {
    bloomsLevels: {
      remember: { score: number; total: number; rank: string };
      understand: { score: number; total: number; rank: string };
      apply: { score: number; total: number; rank: string };
      analyze: { score: number; total: number; rank: string };
      evaluate: { score: number; total: number; rank: string };
      create: { score: number; total: number; rank: string };
    };
    strongestAreas: string[];
    weakestAreas: string[];
    cognitiveGrowth: number;
  };
  examHistory: Array<{
    examId: string;
    examTitle: string;
    attemptNumber: number;
    score: number;
    timeSpent: number;
    date: string;
    bloomsBreakdown: { [key: string]: number };
    difficultyBreakdown: { [key: string]: number };
  }>;
  learningPatterns: {
    preferredStudyTime: string;
    averageSessionLength: number;
    studyFrequency: string;
    learningVelocity: number;
    retentionRate: number;
  };
  interventionPlan: {
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: Array<{
      type: 'study' | 'content' | 'engagement' | 'support';
      priority: 'high' | 'medium' | 'low';
      description: string;
      actionItems: string[];
    }>;
    progressGoals: Array<{
      area: string;
      currentLevel: number;
      targetLevel: number;
      timeframe: string;
    }>;
  };
  comparativeAnalysis: {
    percentileRank: number;
    aboveClassAverage: boolean;
    similarPerformers: Array<{
      studentId: string;
      similarityScore: number;
    }>;
    peerComparison: {
      classAverage: number;
      studentScore: number;
      difference: number;
    };
  };
}

export const StudentProfileAnalytics = ({
  courseId,
  studentId,
  studentName,
  onBack
}: StudentProfileAnalyticsProps) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'semester' | 'all'>('month');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStudentProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/teacher-analytics/student-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          studentId,
          timeframe
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      logger.error('Error fetching student profile:', error);
      toast.error('Failed to load student profile');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, studentId, timeframe]);

  useEffect(() => {
    fetchStudentProfile();
  }, [courseId, studentId, timeframe, fetchStudentProfile]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getBloomsLevelColor = (rank: string) => {
    switch (rank) {
      case 'excellent': return 'bg-green-100 text-green-700';
      case 'good': return 'bg-blue-100 text-blue-700';
      case 'fair': return 'bg-yellow-100 text-yellow-700';
      case 'needs improvement': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load student profile</p>
        <Button onClick={fetchStudentProfile} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {profile.student.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Detailed performance analytics and learning insights
            </p>
          </div>
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

      {/* Student Overview Cards */}
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
                    Overall Score
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.performance.overallScore.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={profile.performance.overallScore} className="h-2" />
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">
                    Rank: {profile.performance.rank}/{profile.performance.totalStudents}
                  </span>
                  <Badge className={cn(
                    profile.comparativeAnalysis.aboveClassAverage 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700"
                  )}>
                    {profile.comparativeAnalysis.percentileRank.toFixed(0)}th percentile
                  </Badge>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Progress Trend
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.performance.improvementTrend > 0 ? '+' : ''}{profile.performance.improvementTrend.toFixed(1)}%
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg",
                  profile.performance.improvementTrend > 0 
                    ? "bg-green-100 dark:bg-green-900/20" 
                    : "bg-red-100 dark:bg-red-900/20"
                )}>
                  {profile.performance.improvementTrend > 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={cn(
                  "font-medium",
                  profile.performance.improvementTrend > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {profile.performance.improvementTrend > 0 ? 'Improving' : 'Declining'}
                </span>
                <span className="text-gray-500 ml-2">trend</span>
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
                    Consistency
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.performance.consistency.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={profile.performance.consistency} className="h-2" />
                <div className="text-sm text-gray-500 mt-2">
                  Performance stability
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Risk Level
                  </p>
                  <Badge className={cn("text-lg font-bold px-3 py-1", getRiskLevelColor(profile.interventionPlan.riskLevel))}>
                    {profile.interventionPlan.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className={cn(
                  "p-3 rounded-lg",
                  profile.interventionPlan.riskLevel === 'high' ? "bg-red-100 dark:bg-red-900/20" :
                  profile.interventionPlan.riskLevel === 'medium' ? "bg-yellow-100 dark:bg-yellow-900/20" :
                  "bg-green-100 dark:bg-green-900/20"
                )}>
                  <AlertTriangle className={cn(
                    "w-6 h-6",
                    profile.interventionPlan.riskLevel === 'high' ? "text-red-600" :
                    profile.interventionPlan.riskLevel === 'medium' ? "text-yellow-600" :
                    "text-green-600"
                  )} />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {profile.interventionPlan.recommendations.length} recommendations
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cognitive">Cognitive</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Learning Patterns</TabsTrigger>
          <TabsTrigger value="intervention">Intervention Plan</TabsTrigger>
          <TabsTrigger value="comparison">Peer Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-medium">{profile.student.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled</p>
                  <p className="font-medium">{new Date(profile.student.enrolledDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Activity</p>
                  <p className="font-medium">{new Date(profile.student.lastActivity).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Exams Taken</p>
                  <p className="font-medium">{profile.performance.examsTaken}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Exam History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Exam Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.examHistory.slice(0, 5).map((exam, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {exam.examTitle}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(exam.date).toLocaleDateString()} • 
                        Attempt #{exam.attemptNumber} • 
                        {Math.round(exam.timeSpent / 60)} minutes
                      </p>
                    </div>
                    <Badge className={cn(
                      exam.score >= 80 ? "bg-green-100 text-green-700" :
                      exam.score >= 60 ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {exam.score.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-6">
          {/* Bloom's Taxonomy Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Cognitive Level Analysis
              </CardTitle>
              <CardDescription>
                Performance across different thinking skills (Bloom&apos;s Taxonomy)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(profile.cognitiveAnalysis.bloomsLevels).map(([level, data]) => (
                  <div key={level} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">{level}</h4>
                      <Badge className={getBloomsLevelColor(data.rank)}>
                        {data.rank}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Score</span>
                        <span className="font-medium">{data.score.toFixed(1)}%</span>
                      </div>
                      <Progress value={data.score} className="h-2" />
                      <div className="text-xs text-gray-500">
                        {data.total} questions attempted
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cognitive Growth */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Cognitive Growth</h3>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  +{profile.cognitiveAnalysis.cognitiveGrowth}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Improvement over time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Strongest Areas</h3>
                <div className="space-y-2">
                  {profile.cognitiveAnalysis.strongestAreas.map((area, index) => (
                    <Badge key={index} className="bg-green-100 text-green-700 capitalize">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Areas for Improvement</h3>
                <div className="space-y-2">
                  {profile.cognitiveAnalysis.weakestAreas.map((area, index) => (
                    <Badge key={index} className="bg-red-100 text-red-700 capitalize">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {/* Learning Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Learning Patterns & Habits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {profile.learningPatterns.preferredStudyTime}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Preferred Study Time
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {profile.learningPatterns.averageSessionLength.toFixed(0)}min
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Session Length
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2 capitalize">
                    {profile.learningPatterns.studyFrequency}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Study Frequency
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {(profile.learningPatterns.learningVelocity * 100).toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Learning Velocity
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">
                    {profile.learningPatterns.retentionRate}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Retention Rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intervention" className="space-y-6">
          {/* Intervention Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Personalized Intervention Plan
              </CardTitle>
              <CardDescription>
                AI-generated recommendations based on performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Recommendations */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Recommendations
                  </h3>
                  <div className="space-y-4">
                    {profile.interventionPlan.recommendations.map((rec, index) => (
                      <div key={index} className={cn(
                        "border rounded-lg p-4",
                        getPriorityColor(rec.priority)
                      )}>
                        <div className="flex items-center justify-between mb-3">
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority} priority
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {rec.type}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {rec.description}
                        </h4>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {rec.actionItems.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress Goals */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Progress Goals
                  </h3>
                  <div className="space-y-3">
                    {profile.interventionPlan.progressGoals.map((goal, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{goal.area}</span>
                          <span className="text-sm text-gray-600">
                            {goal.currentLevel}% → {goal.targetLevel}% ({goal.timeframe})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={goal.currentLevel} className="flex-1 h-2" />
                          <span className="text-xs text-gray-500 w-12">
                            {goal.currentLevel}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {/* Peer Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Peer Comparison Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {profile.comparativeAnalysis.percentileRank.toFixed(0)}th
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Percentile Rank
                  </p>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-3xl font-bold mb-2",
                    profile.comparativeAnalysis.peerComparison.difference > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {profile.comparativeAnalysis.peerComparison.difference > 0 ? '+' : ''}{profile.comparativeAnalysis.peerComparison.difference.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    vs Class Average
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {profile.comparativeAnalysis.similarPerformers.length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Similar Performers
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Student Score</span>
                  <span className="font-medium">{profile.comparativeAnalysis.peerComparison.studentScore.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span>Class Average</span>
                  <span className="font-medium">{profile.comparativeAnalysis.peerComparison.classAverage.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};