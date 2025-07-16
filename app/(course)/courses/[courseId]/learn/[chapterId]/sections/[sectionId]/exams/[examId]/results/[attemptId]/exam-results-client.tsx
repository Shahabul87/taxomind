"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  BarChart3,
  Brain,
  Star,
  TrendingUp,
  Award,
  RefreshCw,
  BookOpen,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ExamResultsClientProps {
  params: {
    courseId: string;
    chapterId: string;
    sectionId: string;
    examId: string;
    attemptId: string;
  };
}

interface ExamResult {
  attempt: {
    id: string;
    attemptNumber: number;
    scorePercentage: number;
    isPassed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    submittedAt: string;
    answers: Array<{
      id: string;
      answer: any;
      isCorrect: boolean;
      pointsEarned: number;
      question: {
        id: string;
        question: string;
        questionType: string;
        points: number;
        correctAnswer: any;
        explanation?: string;
      };
    }>;
    exam: {
      id: string;
      title: string;
      passingScore: number;
      timeLimit?: number;
    };
  };
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    scorePercentage: number;
    isPassed: boolean;
    earnedPoints: number;
    totalPoints: number;
    timeSpent: number;
  };
}

export default function ExamResultsClient({ params }: ExamResultsClientProps) {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/courses/sections/${params.sectionId}/exams/${params.examId}/attempts`
      );
      if (response.ok) {
        const attempts = await response.json();
        const attempt = attempts.find((a: any) => a.id === params.attemptId);
        if (attempt) {
          setResult({
            attempt,
            summary: {
              totalQuestions: attempt.totalQuestions,
              correctAnswers: attempt.correctAnswers,
              scorePercentage: attempt.scorePercentage,
              isPassed: attempt.isPassed,
              earnedPoints: attempt.answers?.reduce((sum: number, a: any) => sum + a.pointsEarned, 0) || 0,
              totalPoints: attempt.answers?.reduce((sum: number, a: any) => sum + a.question.points, 0) || 0,
              timeSpent: attempt.timeSpent,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  }, [params.sectionId, params.examId, params.attemptId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return "text-green-600";
    if (score >= passingScore * 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: "A", color: "text-green-600" };
    if (score >= 80) return { grade: "B", color: "text-blue-600" };
    if (score >= 70) return { grade: "C", color: "text-yellow-600" };
    if (score >= 60) return { grade: "D", color: "text-orange-600" };
    return { grade: "F", color: "text-red-600" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Results Not Found</h1>
          <p className="text-slate-600 mb-4">The exam results could not be loaded.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { attempt, summary } = result;
  const gradeInfo = getGrade(summary.scorePercentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push(
                  `/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}`
                )}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Section
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Exam Results
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {attempt.exam.title} - Attempt {attempt.attemptNumber}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(
                  `/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}`
                )}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retake Exam
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="relative overflow-hidden">
            <div className={cn(
              "absolute inset-0 opacity-10",
              summary.isPassed ? "bg-green-500" : "bg-red-500"
            )} />
            <CardContent className="relative p-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  {summary.isPassed ? (
                    <Trophy className="w-16 h-16 text-green-600" />
                  ) : (
                    <Target className="w-16 h-16 text-red-600" />
                  )}
                </div>
                
                <h2 className="text-4xl font-bold mb-2">
                  <span className={getScoreColor(summary.scorePercentage, attempt.exam.passingScore)}>
                    {summary.scorePercentage.toFixed(1)}%
                  </span>
                  <span className={cn("text-6xl ml-4", gradeInfo.color)}>
                    {gradeInfo.grade}
                  </span>
                </h2>
                
                <p className="text-xl mb-4">
                  {summary.isPassed ? (
                    <span className="text-green-600 font-semibold">Congratulations! You passed!</span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      You need {attempt.exam.passingScore}% to pass
                    </span>
                  )}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {summary.correctAnswers}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Correct Answers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {summary.totalQuestions}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total Questions
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {summary.earnedPoints}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Points Earned
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatTime(summary.timeSpent)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Time Spent
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Results */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Question Review</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Performance Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Performance Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-sm font-semibold">
                        {summary.scorePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={summary.scorePercentage} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Accuracy</span>
                      <span className="text-sm font-semibold">
                        {((summary.correctAnswers / summary.totalQuestions) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={(summary.correctAnswers / summary.totalQuestions) * 100} 
                      className="h-3" 
                    />
                  </div>

                  {attempt.exam.timeLimit && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Time Utilization</span>
                        <span className="text-sm font-semibold">
                          {((summary.timeSpent / (attempt.exam.timeLimit * 60)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={(summary.timeSpent / (attempt.exam.timeLimit * 60)) * 100} 
                        className="h-3" 
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {summary.correctAnswers}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Correct Answers
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {summary.totalQuestions - summary.correctAnswers}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Incorrect Answers
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(summary.timeSpent / summary.totalQuestions)}s
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Avg. per Question
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            {attempt.answers?.map((answer, index) => (
              <motion.div
                key={answer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  "border-l-4",
                  answer.isCorrect ? "border-l-green-500" : "border-l-red-500"
                )}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Question {index + 1}</Badge>
                          <Badge variant={answer.isCorrect ? "default" : "destructive"}>
                            {answer.isCorrect ? "Correct" : "Incorrect"}
                          </Badge>
                          <Badge variant="secondary">
                            {answer.pointsEarned}/{answer.question.points} points
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {answer.question.question}
                        </h3>
                      </div>
                      {answer.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Your Answer:
                      </p>
                      <p className={cn(
                        "text-sm p-2 rounded",
                        answer.isCorrect 
                          ? "bg-green-50 text-green-800 border border-green-200" 
                          : "bg-red-50 text-red-800 border border-red-200"
                      )}>
                        {typeof answer.answer === 'boolean' 
                          ? (answer.answer ? 'True' : 'False')
                          : answer.answer || 'No answer provided'
                        }
                      </p>
                    </div>

                    {!answer.isCorrect && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Correct Answer:
                        </p>
                        <p className="text-sm p-2 rounded bg-green-50 text-green-800 border border-green-200">
                          {typeof answer.question.correctAnswer === 'boolean'
                            ? (answer.question.correctAnswer ? 'True' : 'False')
                            : answer.question.correctAnswer
                          }
                        </p>
                      </div>
                    )}

                    {answer.question.explanation && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Explanation:
                        </p>
                        <p className="text-sm p-2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          {answer.question.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}