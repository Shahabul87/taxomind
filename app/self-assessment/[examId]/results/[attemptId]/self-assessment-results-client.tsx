"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { logger } from "@/lib/logger";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Trophy,
  Brain,
  Target,
  Clock,
  TrendingUp,
  Lightbulb,
  BarChart3,
  BookOpen,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SelfAssessmentResultsClientProps {
  params: {
    examId: string;
    attemptId: string;
  };
  userId: string;
}

interface QuestionResult {
  id: string;
  question: string;
  questionType: string;
  points: number;
  bloomsLevel: string;
  userAnswer: string | null;
  correctAnswer: string | null;
  explanation: string | null;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  feedback: string | null;
  aiEvaluation: Record<string, unknown> | null;
}

interface BloomsBreakdown {
  [level: string]: {
    questionsCount: number;
    correctCount: number;
    scorePercentage: number;
  };
}

interface CognitiveProfile {
  overallMastery: number;
  strengths: string[];
  weaknesses: string[];
  recommendedFocus: string[];
}

interface LearningRecommendation {
  type: string;
  title: string;
  description: string;
  priority: string;
  bloomsLevel: string;
}

interface Attempt {
  id: string;
  attemptNumber: number;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  timeSpent: number | null;
  totalQuestions: number;
  correctAnswers: number | null;
  totalPoints: number | null;
  earnedPoints: number | null;
  scorePercentage: number | null;
  isPassed: boolean | null;
  bloomsBreakdown: BloomsBreakdown | null;
  cognitiveProfile: CognitiveProfile | null;
  learningRecommendations: LearningRecommendation[] | null;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimit: number | null;
  showResults: boolean;
}

const bloomsLevelLabels: Record<string, string> = {
  REMEMBER: "Remember",
  UNDERSTAND: "Understand",
  APPLY: "Apply",
  ANALYZE: "Analyze",
  EVALUATE: "Evaluate",
  CREATE: "Create",
};

const bloomsLevelColors: Record<string, { bg: string; text: string; fill: string }> = {
  REMEMBER: { bg: "bg-blue-100", text: "text-blue-700", fill: "bg-blue-500" },
  UNDERSTAND: { bg: "bg-green-100", text: "text-green-700", fill: "bg-green-500" },
  APPLY: { bg: "bg-yellow-100", text: "text-yellow-700", fill: "bg-yellow-500" },
  ANALYZE: { bg: "bg-orange-100", text: "text-orange-700", fill: "bg-orange-500" },
  EVALUATE: { bg: "bg-purple-100", text: "text-purple-700", fill: "bg-purple-500" },
  CREATE: { bg: "bg-pink-100", text: "text-pink-700", fill: "bg-pink-500" },
};

const bloomsOrder = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];

export default function SelfAssessmentResultsClient({
  params,
  userId,
}: SelfAssessmentResultsClientProps) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/self-assessment/exams/${params.examId}/attempts/${params.attemptId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setExam(data.exam);
          setAttempt(data.attempt);
          setQuestions(data.questions || []);
        }
      }
    } catch (error) {
      logger.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  }, [params.examId, params.attemptId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleRetake = async () => {
    try {
      const response = await fetch(
        `/api/self-assessment/exams/${params.examId}/attempts`,
        { method: "POST" }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.attempt) {
          router.push(`/self-assessment/${params.examId}/take/${data.attempt.id}`);
        }
      }
    } catch (error) {
      logger.error("Error starting retake:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Loading your results...
          </p>
        </div>
      </div>
    );
  }

  if (!exam || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Results Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The assessment results could not be loaded.
          </p>
          <Button onClick={() => router.push("/dashboard/user")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isPassed = attempt.isPassed ?? false;
  const scorePercentage = attempt.scorePercentage ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/user")}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-slate-900 dark:text-slate-100">
                    {exam.title}
                  </h1>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Results
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Attempt #{attempt.attemptNumber}
                </p>
              </div>
            </div>

            <Button onClick={handleRetake} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retake Assessment
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card
            className={cn(
              "border-2",
              isPassed
                ? "border-green-200 bg-green-50/50 dark:bg-green-950/20"
                : "border-red-200 bg-red-50/50 dark:bg-red-950/20"
            )}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center",
                      isPassed ? "bg-green-100" : "bg-red-100"
                    )}
                  >
                    {isPassed ? (
                      <Trophy className="w-10 h-10 text-green-600" />
                    ) : (
                      <Target className="w-10 h-10 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h2
                      className={cn(
                        "text-3xl font-bold",
                        isPassed ? "text-green-700" : "text-red-700"
                      )}
                    >
                      {scorePercentage.toFixed(1)}%
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      {isPassed ? "Congratulations! You passed!" : "Keep practicing!"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Passing score: {exam.passingScore}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {attempt.correctAnswers ?? 0}
                    </p>
                    <p className="text-xs text-slate-500">Correct</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {attempt.totalQuestions - (attempt.correctAnswers ?? 0)}
                    </p>
                    <p className="text-xs text-slate-500">Incorrect</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {attempt.earnedPoints?.toFixed(1) ?? 0}
                    </p>
                    <p className="text-xs text-slate-500">
                      / {attempt.totalPoints} pts
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {attempt.timeSpent ? formatTime(attempt.timeSpent) : "N/A"}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">Time Spent</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bloom&apos;s Taxonomy Breakdown */}
        {attempt.bloomsBreakdown && exam.showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Bloom&apos;s Taxonomy Analysis
                </CardTitle>
                <CardDescription>
                  Your performance across different cognitive levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bloomsOrder.map((level) => {
                    const data = attempt.bloomsBreakdown?.[level];
                    if (!data) return null;

                    const colors = bloomsLevelColors[level];
                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(colors.bg, colors.text)}
                            >
                              {bloomsLevelLabels[level]}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {data.correctCount}/{data.questionsCount} correct
                            </span>
                          </div>
                          <span
                            className={cn(
                              "font-semibold",
                              data.scorePercentage >= 80
                                ? "text-green-600"
                                : data.scorePercentage >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                            )}
                          >
                            {data.scorePercentage}%
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.scorePercentage}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={cn("h-full rounded-full", colors.fill)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Cognitive Profile & Recommendations */}
        {attempt.cognitiveProfile && exam.showResults && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Strengths & Weaknesses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    Cognitive Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Overall Mastery
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {attempt.cognitiveProfile.overallMastery}%
                    </span>
                  </div>

                  {attempt.cognitiveProfile.strengths.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Strengths
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {attempt.cognitiveProfile.strengths.map((strength) => (
                          <Badge
                            key={strength}
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {bloomsLevelLabels[strength] || strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {attempt.cognitiveProfile.weaknesses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        Areas to Improve
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {attempt.cognitiveProfile.weaknesses.map((weakness) => (
                          <Badge
                            key={weakness}
                            variant="outline"
                            className="bg-orange-50 text-orange-700 border-orange-200"
                          >
                            {bloomsLevelLabels[weakness] || weakness}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Learning Recommendations */}
            {attempt.learningRecommendations &&
              attempt.learningRecommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {attempt.learningRecommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-full bg-amber-100">
                              <BookOpen className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                                {rec.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {rec.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    bloomsLevelColors[rec.bloomsLevel]?.bg,
                                    bloomsLevelColors[rec.bloomsLevel]?.text
                                  )}
                                >
                                  {bloomsLevelLabels[rec.bloomsLevel]}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    rec.priority === "HIGH"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-slate-50 text-slate-700"
                                  )}
                                >
                                  {rec.priority} Priority
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
          </div>
        )}

        {/* Question-by-Question Review */}
        {exam.showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-slate-600" />
                  Question Review
                </CardTitle>
                <CardDescription>
                  Click on each question to see detailed feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((question, index) => (
                  <Collapsible
                    key={question.id}
                    open={expandedQuestions.has(question.id)}
                    onOpenChange={() => toggleQuestion(question.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          "w-full p-4 rounded-lg border text-left transition-colors",
                          question.isCorrect
                            ? "border-green-200 bg-green-50/50 hover:bg-green-50 dark:bg-green-950/20"
                            : "border-red-200 bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                question.isCorrect
                                  ? "bg-green-100"
                                  : "bg-red-100"
                              )}
                            >
                              {question.isCorrect ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Q{index + 1}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    bloomsLevelColors[question.bloomsLevel]?.bg,
                                    bloomsLevelColors[question.bloomsLevel]?.text
                                  )}
                                >
                                  {bloomsLevelLabels[question.bloomsLevel]}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.pointsEarned ?? 0}/{question.points} pts
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-900 dark:text-white line-clamp-2">
                                {question.question}
                              </p>
                            </div>
                          </div>
                          {expandedQuestions.has(question.id) ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                            Your Answer
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {question.userAnswer || "No answer provided"}
                          </p>
                        </div>
                        {question.correctAnswer && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                              Correct Answer
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400">
                              {question.correctAnswer}
                            </p>
                          </div>
                        )}
                        {question.feedback && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                              Feedback
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {question.feedback}
                            </p>
                          </div>
                        )}
                        {question.explanation && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                              Explanation
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {question.explanation}
                            </p>
                          </div>
                        )}
                        {question.aiEvaluation && (
                          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200">
                            <p className="text-xs font-medium text-purple-600 uppercase mb-2 flex items-center gap-1">
                              <Brain className="w-3 h-3" />
                              AI Analysis
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(question.aiEvaluation).map(
                                ([key, value]) => {
                                  if (Array.isArray(value) && value.length > 0) {
                                    return (
                                      <div key={key} className="col-span-2">
                                        <span className="font-medium text-purple-700 capitalize">
                                          {key.replace(/([A-Z])/g, " $1").trim()}:
                                        </span>{" "}
                                        <span className="text-slate-600">
                                          {value.join(", ")}
                                        </span>
                                      </div>
                                    );
                                  }
                                  if (typeof value === "number") {
                                    return (
                                      <div key={key}>
                                        <span className="font-medium text-purple-700 capitalize">
                                          {key}:
                                        </span>{" "}
                                        <span className="text-slate-600">
                                          {(value * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                }
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push("/dashboard/user")}
            variant="outline"
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={handleRetake} className="bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
