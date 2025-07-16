"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  Clock, 
  Target, 
  TrendingUp, 
  Award, 
  Play, 
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Users,
  Trophy,
  BookOpen,
  Timer,
  Zap,
  Brain,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Exam {
  id: string;
  title: string;
  description?: string;
  timeLimit?: number;
  attempts: number;
  passingScore: number;
  questions: any[];
  userAttempts: ExamAttempt[];
}

interface ExamAttempt {
  id: string;
  attemptNumber: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  startedAt: string;
  submittedAt?: string;
  timeSpent?: number;
  scorePercentage?: number;
  isPassed?: boolean;
  correctAnswers: number;
  totalQuestions: number;
}

interface ExamAnalytics {
  attempts: any[];
  summary: {
    totalAttempts: number;
    latestScore: number;
    bestScore: number;
    averageScore: number;
    isPassed: boolean;
    hasImproved: boolean;
    averageTime: number;
    passingScore: number;
  };
  trends: {
    performance: any[];
    timeDistribution: any[];
  };
  questionAnalysis: {
    all: any[];
    difficult: any[];
    strong: any[];
  };
  recommendations: any[];
}

interface ExamsContentProps {
  sectionId: string;
  courseId: string;
  chapterId: string;
}

export const ExamsContent = ({ sectionId, courseId, chapterId }: ExamsContentProps) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"overview" | "analytics">("overview");

  const fetchAnalytics = useCallback(async (examId: string) => {
    try {
      const response = await fetch(`/api/courses/sections/${sectionId}/exams/${examId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  }, [sectionId]);

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/sections/${sectionId}/exams`);
      if (response.ok) {
        const data = await response.json();
        setExams(data);
        if (data.length > 0) {
          setSelectedExam(data[0]);
          fetchAnalytics(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  }, [sectionId, fetchAnalytics]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const startExam = async (examId: string) => {
    try {
      const response = await fetch(`/api/courses/sections/${sectionId}/exams/${examId}/attempts`, {
        method: 'POST',
      });
      if (response.ok) {
        const attempt = await response.json();
        // Navigate to exam taking interface
        window.open(`/courses/${courseId}/learn/${chapterId}/sections/${sectionId}/exams/${examId}/take/${attempt.id}`, '_blank');
      }
    } catch (error) {
      console.error("Error starting exam:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SUBMITTED':
      case 'GRADED':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return 'text-green-600';
    if (score >= passingScore * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          No Exams Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Exams will be added to this section soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exam Selection */}
      <div className="flex flex-wrap gap-2">
        {exams.map((exam) => (
          <button
            key={exam.id}
            onClick={() => {
              setSelectedExam(exam);
              fetchAnalytics(exam.id);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              selectedExam?.id === exam.id
                ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <GraduationCap className="w-4 h-4" />
            {exam.title}
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {exam.questions.length} Q
            </Badge>
          </button>
        ))}
      </div>

      {selectedExam && (
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Exam Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      {selectedExam.title}
                    </CardTitle>
                    {selectedExam.description && (
                      <CardDescription className="mt-2">
                        {selectedExam.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => startExam(selectedExam.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Exam
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Questions</p>
                      <p className="font-semibold">{selectedExam.questions.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Time Limit</p>
                      <p className="font-semibold">
                        {selectedExam.timeLimit ? `${selectedExam.timeLimit} min` : 'No limit'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Passing Score</p>
                      <p className="font-semibold">{selectedExam.passingScore}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Attempts</p>
                      <p className="font-semibold">
                        {selectedExam.userAttempts.length}/{selectedExam.attempts}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attempt History */}
            {selectedExam.userAttempts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    Attempt History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedExam.userAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(attempt.status)}>
                              Attempt {attempt.attemptNumber}
                            </Badge>
                            {attempt.isPassed && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              Score: {attempt.scorePercentage ? 
                                <span className={getScoreColor(attempt.scorePercentage, selectedExam.passingScore)}>
                                  {attempt.scorePercentage.toFixed(1)}%
                                </span> : 'In Progress'
                              }
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {attempt.correctAnswers}/{attempt.totalQuestions} correct
                              {attempt.timeSpent && ` • ${Math.round(attempt.timeSpent / 60)} min`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(attempt.startedAt).toLocaleDateString()}
                          </p>
                          {attempt.submittedAt && (
                            <p className="text-xs text-slate-500">
                              Completed {new Date(attempt.submittedAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {analytics && analytics.summary ? (
              <>
                {/* Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <h3 className="font-semibold">Best Score</h3>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {analytics.summary.bestScore.toFixed(1)}%
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {analytics.summary.isPassed ? 'Passed' : 'Not passed yet'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h3 className="font-semibold">Average Score</h3>
                      </div>
                      <p className="text-2xl font-bold">
                        {analytics.summary.averageScore.toFixed(1)}%
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {analytics.summary.hasImproved ? 'Improving' : 'Stable'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="w-5 h-5 text-purple-500" />
                        <h3 className="font-semibold">Avg. Time</h3>
                      </div>
                      <p className="text-2xl font-bold">
                        {Math.round(analytics.summary.averageTime / 60)}m
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Per attempt
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Trends */}
                {analytics.trends.performance.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Performance Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.trends.performance.map((trend, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-16 text-sm text-slate-600 dark:text-slate-400">
                              Attempt {trend.attemptNumber}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {trend.score.toFixed(1)}%
                                </span>
                                {trend.improvement !== 0 && (
                                  <span className={cn(
                                    "text-xs flex items-center gap-1",
                                    trend.improvement > 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {trend.improvement > 0 ? '+' : ''}{trend.improvement.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                              <Progress 
                                value={trend.score} 
                                className="h-2"
                              />
                            </div>
                            <div className="w-20 text-right text-sm text-slate-600 dark:text-slate-400">
                              {Math.round(trend.timeSpent / 60)}m
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {analytics.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-4 rounded-lg border-l-4",
                              rec.type === 'improvement' && "border-red-500 bg-red-50 dark:bg-red-900/20",
                              rec.type === 'success' && "border-green-500 bg-green-50 dark:bg-green-900/20",
                              rec.type === 'warning' && "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
                              rec.type === 'study' && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                              rec.type === 'time' && "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            )}
                          >
                            <h4 className="font-semibold mb-1">{rec.title}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {rec.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No Analytics Available
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Complete an exam to see your performance analytics.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}; 