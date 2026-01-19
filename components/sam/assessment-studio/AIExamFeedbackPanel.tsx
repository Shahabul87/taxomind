"use client";

/**
 * AIExamFeedbackPanel
 *
 * Displays AI-powered exam feedback and evaluation results.
 * Integrates with the EvaluationEngine to show detailed analysis.
 *
 * Phase 1 of the engine merge plan - EvaluationEngine integration for analytics.
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Brain,
  FileText,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Clock,
  BarChart3,
  BookOpen,
  Lightbulb,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelfCritiquePanel } from "@/components/sam/confidence/SelfCritiquePanel";
import { BloomsLevel } from "@prisma/client";
import { toast } from "sonner";

export interface AIExamFeedbackPanelProps {
  userId?: string;
  className?: string;
  compact?: boolean;
  maxAttempts?: number;
}

interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  status: string;
  scorePercentage: number;
  isPassed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  startedAt: string;
  submittedAt: string | null;
  timeSpent: number | null;
}

interface EvaluationResult {
  questionId: string;
  question: string;
  studentAnswer: string;
  isCorrect: boolean | null;
  pointsEarned: number;
  evaluationType: string;
  aiEvaluation: {
    accuracy: number;
    completeness: number;
    relevance: number;
    depth: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
    demonstratedLevel: BloomsLevel | null;
  } | null;
}

interface AttemptDetails {
  attempt: ExamAttempt;
  exam: {
    id: string;
    title: string;
    passingScore: number;
  };
  answers: EvaluationResult[];
}

// Bloom&apos;s level colors
const BLOOMS_COLORS: Record<BloomsLevel, { bg: string; text: string; border: string }> = {
  REMEMBER: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
  UNDERSTAND: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
  APPLY: { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800" },
  ANALYZE: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
  EVALUATE: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  CREATE: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
};

export function AIExamFeedbackPanel({
  userId,
  className,
  compact = false,
  maxAttempts = 10,
}: AIExamFeedbackPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<AttemptDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent exam attempts
  const fetchAttempts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/exams/attempts?limit=${maxAttempts}&status=GRADED`);

      if (!response.ok) {
        throw new Error("Failed to fetch exam attempts");
      }

      const data = await response.json();
      setAttempts(data.attempts || []);

      // Auto-select first attempt if available
      if (data.attempts?.length > 0 && !selectedAttemptId) {
        setSelectedAttemptId(data.attempts[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load exam attempts";
      setError(message);
      console.error("Error fetching attempts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [maxAttempts, selectedAttemptId]);

  // Fetch details for selected attempt
  const fetchAttemptDetails = useCallback(async (attemptId: string) => {
    setIsLoadingDetails(true);

    try {
      const response = await fetch(`/api/exams/evaluate?attemptId=${attemptId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch evaluation details");
      }

      const data = await response.json();
      setAttemptDetails(data);
    } catch (err) {
      console.error("Error fetching attempt details:", err);
      toast.error("Failed to load evaluation details");
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  // Load details when selection changes
  useEffect(() => {
    if (selectedAttemptId) {
      fetchAttemptDetails(selectedAttemptId);
    }
  }, [selectedAttemptId, fetchAttemptDetails]);

  // Build self-critique data from evaluation
  const buildSelfCritique = (details: AttemptDetails) => {
    const aiAnswers = details.answers.filter((a) => a.aiEvaluation);
    const avgAccuracy = aiAnswers.length > 0
      ? aiAnswers.reduce((sum, a) => sum + (a.aiEvaluation?.accuracy || 0), 0) / aiAnswers.length
      : 0;
    const avgCompleteness = aiAnswers.length > 0
      ? aiAnswers.reduce((sum, a) => sum + (a.aiEvaluation?.completeness || 0), 0) / aiAnswers.length
      : 0;
    const avgRelevance = aiAnswers.length > 0
      ? aiAnswers.reduce((sum, a) => sum + (a.aiEvaluation?.relevance || 0), 0) / aiAnswers.length
      : 0;
    const avgDepth = aiAnswers.length > 0
      ? aiAnswers.reduce((sum, a) => sum + (a.aiEvaluation?.depth || 0), 0) / aiAnswers.length
      : 0;

    // Collect all strengths, improvements, and next steps
    const allStrengths = aiAnswers.flatMap((a) => a.aiEvaluation?.strengths || []);
    const allImprovements = aiAnswers.flatMap((a) => a.aiEvaluation?.improvements || []);
    const allNextSteps = aiAnswers.flatMap((a) => a.aiEvaluation?.nextSteps || []);

    return {
      overallConfidence: details.attempt.scorePercentage / 100,
      dimensions: [
        {
          name: "Accuracy",
          score: avgAccuracy / 100,
          description: "How accurately you answered the questions",
          category: "accuracy" as const,
        },
        {
          name: "Completeness",
          score: avgCompleteness / 100,
          description: "How thoroughly you addressed all aspects",
          category: "knowledge" as const,
        },
        {
          name: "Relevance",
          score: avgRelevance / 100,
          description: "How well your answers addressed the questions",
          category: "relevance" as const,
        },
        {
          name: "Depth",
          score: avgDepth / 100,
          description: "The depth of understanding demonstrated",
          category: "reasoning" as const,
        },
      ],
      strengths: [...new Set(allStrengths)].slice(0, 5),
      weaknesses: [...new Set(allImprovements)].slice(0, 5),
      uncertainties: [],
      suggestions: [...new Set(allNextSteps)].slice(0, 5),
      generatedAt: details.attempt.submittedAt || new Date().toISOString(),
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="py-12 text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-purple-500" />
          <p className="text-slate-500 dark:text-slate-400">Loading exam feedback...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("overflow-hidden border-red-200 dark:border-red-800", className)}>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-500" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={fetchAttempts} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (attempts.length === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">AI Exam Feedback</CardTitle>
              <CardDescription>View AI-powered analysis of your exam performance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 mb-2">No completed exams yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Complete an exam to see AI-powered feedback and analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">AI Exam Feedback</CardTitle>
              <CardDescription>Detailed analysis of your exam performance</CardDescription>
            </div>
          </div>

          {/* Attempt Selector */}
          <Select
            value={selectedAttemptId || ""}
            onValueChange={setSelectedAttemptId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select exam" />
            </SelectTrigger>
            <SelectContent>
              {attempts.map((attempt) => (
                <SelectItem key={attempt.id} value={attempt.id}>
                  <div className="flex items-center gap-2">
                    {attempt.isPassed ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="truncate max-w-[120px]">{attempt.examTitle}</span>
                    <span className="text-xs text-slate-400">
                      {Math.round(attempt.scorePercentage)}%
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoadingDetails ? (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-purple-500" />
            <p className="text-slate-500 dark:text-slate-400">Loading evaluation details...</p>
          </div>
        ) : attemptDetails ? (
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-6">
              {/* Score Summary */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                  <Target className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {Math.round(attemptDetails.attempt.scorePercentage)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Score</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                  <CheckCircle2 className="h-4 w-4 mx-auto text-green-500 mb-1" />
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {attemptDetails.attempt.correctAnswers}/{attemptDetails.attempt.totalQuestions}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Correct</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                  <Clock className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {attemptDetails.attempt.timeSpent
                      ? `${Math.round(attemptDetails.attempt.timeSpent / 60)}m`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Time</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                  {attemptDetails.attempt.isPassed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mx-auto text-green-500 mb-1" />
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        Passed
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mx-auto text-red-500 mb-1" />
                      <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                        Not Passed
                      </p>
                    </>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Need {attemptDetails.exam.passingScore}%
                  </p>
                </div>
              </div>

              {/* AI Self-Critique Panel */}
              {attemptDetails.answers.some((a) => a.aiEvaluation) && (
                <SelfCritiquePanel
                  critique={buildSelfCritique(attemptDetails)}
                  mode="full"
                  showActions={false}
                />
              )}

              {/* Question-by-Question Analysis */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Question Analysis
                </h3>

                <Accordion type="multiple" className="space-y-2">
                  {attemptDetails.answers.map((answer, idx) => (
                    <AccordionItem
                      key={answer.questionId}
                      value={answer.questionId}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-center gap-3 text-left">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-medium",
                              answer.isCorrect
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}
                          >
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                              {answer.question}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  answer.isCorrect
                                    ? "text-green-600 border-green-300"
                                    : "text-red-600 border-red-300"
                                )}
                              >
                                {answer.isCorrect ? "Correct" : "Incorrect"}
                              </Badge>
                              {answer.aiEvaluation?.demonstratedLevel && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    BLOOMS_COLORS[answer.aiEvaluation.demonstratedLevel].text,
                                    BLOOMS_COLORS[answer.aiEvaluation.demonstratedLevel].border
                                  )}
                                >
                                  {answer.aiEvaluation.demonstratedLevel}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          {/* Your Answer */}
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Your Answer
                            </p>
                            <p className="text-sm text-slate-900 dark:text-white">
                              {answer.studentAnswer}
                            </p>
                          </div>

                          {/* AI Evaluation */}
                          {answer.aiEvaluation && (
                            <>
                              {/* Metrics */}
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { label: "Accuracy", value: answer.aiEvaluation.accuracy },
                                  { label: "Completeness", value: answer.aiEvaluation.completeness },
                                  { label: "Relevance", value: answer.aiEvaluation.relevance },
                                  { label: "Depth", value: answer.aiEvaluation.depth },
                                ].map((metric) => (
                                  <div key={metric.label} className="text-center">
                                    <Progress
                                      value={metric.value}
                                      className="h-1.5 mb-1"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {metric.label}: {Math.round(metric.value)}%
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Feedback */}
                              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="h-4 w-4 text-purple-500" />
                                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                    AI Feedback
                                  </span>
                                </div>
                                <p className="text-sm text-purple-900 dark:text-purple-200">
                                  {answer.aiEvaluation.feedback}
                                </p>
                              </div>

                              {/* Strengths & Improvements */}
                              <div className="grid grid-cols-2 gap-3">
                                {answer.aiEvaluation.strengths.length > 0 && (
                                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                                    <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Strengths
                                    </p>
                                    <ul className="space-y-1">
                                      {answer.aiEvaluation.strengths.map((s, i) => (
                                        <li
                                          key={i}
                                          className="text-xs text-green-800 dark:text-green-200"
                                        >
                                          • {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {answer.aiEvaluation.improvements.length > 0 && (
                                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1">
                                      <Lightbulb className="h-3 w-3" />
                                      Improvements
                                    </p>
                                    <ul className="space-y-1">
                                      {answer.aiEvaluation.improvements.map((s, i) => (
                                        <li
                                          key={i}
                                          className="text-xs text-amber-800 dark:text-amber-200"
                                        >
                                          • {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {/* Next Steps */}
                              {answer.aiEvaluation.nextSteps.length > 0 && (
                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Next Steps
                                  </p>
                                  <ul className="space-y-1">
                                    {answer.aiEvaluation.nextSteps.map((s, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-blue-800 dark:text-blue-200"
                                      >
                                        {i + 1}. {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">Select an exam to view feedback</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIExamFeedbackPanel;
