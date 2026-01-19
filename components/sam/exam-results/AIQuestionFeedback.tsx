"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Brain,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { BloomsLevel } from "@prisma/client";

interface AIEvaluation {
  accuracy: number | null;
  completeness: number | null;
  relevance: number | null;
  depth: number | null;
  feedback: string | null;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  demonstratedLevel: BloomsLevel | null;
  targetLevel: BloomsLevel;
  conceptsUnderstood: string[];
  misconceptions: string[];
  knowledgeGaps: string[];
  confidence?: number | null;
  flaggedForReview?: boolean;
}

interface QuestionAnswer {
  id: string;
  questionId: string;
  question: {
    id: string;
    question: string;
    questionType: string;
    bloomsLevel: BloomsLevel;
    difficulty: string;
    points: number;
    correctAnswer?: string | null;
    explanation?: string | null;
    hint?: string | null;
    options?: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }> | null;
  };
  studentAnswer: string | null;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  maxPoints: number;
  evaluationType: string;
  feedback: string | null;
  aiEvaluation: AIEvaluation | null;
}

interface AIQuestionFeedbackProps {
  answer: QuestionAnswer;
  questionNumber: number;
  showCorrectAnswer?: boolean;
}

const BLOOMS_LABELS: Record<BloomsLevel, string> = {
  REMEMBER: "Remember",
  UNDERSTAND: "Understand",
  APPLY: "Apply",
  ANALYZE: "Analyze",
  EVALUATE: "Evaluate",
  CREATE: "Create",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  HARD: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

export function AIQuestionFeedback({
  answer,
  questionNumber,
  showCorrectAnswer = true,
}: AIQuestionFeedbackProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { question, aiEvaluation } = answer;

  const hasAIEvaluation = aiEvaluation !== null;
  const isAIGraded = answer.evaluationType === "AI_EVALUATED";

  const getScoreColor = (score: number | null): string => {
    if (score === null) return "text-slate-400";
    if (score >= 0.7) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  const formatScore = (score: number | null): string => {
    if (score === null) return "N/A";
    return `${Math.round(score * 100)}%`;
  };

  const bloomsComparison = () => {
    if (!aiEvaluation?.demonstratedLevel) return null;

    const bloomsOrder: BloomsLevel[] = [
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE",
    ];
    const targetIndex = bloomsOrder.indexOf(question.bloomsLevel);
    const demonstratedIndex = bloomsOrder.indexOf(
      aiEvaluation.demonstratedLevel
    );

    if (demonstratedIndex >= targetIndex) {
      return {
        status: "met",
        message: `Met or exceeded target level`,
        color: "text-green-600",
      };
    } else if (demonstratedIndex === targetIndex - 1) {
      return {
        status: "close",
        message: `Close to target level`,
        color: "text-yellow-600",
      };
    }
    return {
      status: "below",
      message: `Below target level`,
      color: "text-orange-600",
    };
  };

  const comparison = bloomsComparison();

  return (
    <Card
      className={cn(
        "border-l-4 transition-shadow hover:shadow-md",
        answer.isCorrect
          ? "border-l-green-500"
          : answer.isCorrect === false
          ? "border-l-red-500"
          : "border-l-slate-300"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline">Q{questionNumber}</Badge>
              <Badge
                variant={
                  answer.isCorrect
                    ? "default"
                    : answer.isCorrect === false
                    ? "destructive"
                    : "secondary"
                }
              >
                {answer.isCorrect ? "Correct" : answer.isCorrect === false ? "Incorrect" : "Pending"}
              </Badge>
              <Badge variant="secondary" className={DIFFICULTY_COLORS[question.difficulty] || ""}>
                {question.difficulty}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Brain className="w-3 h-3" />
                {BLOOMS_LABELS[question.bloomsLevel]}
              </Badge>
              {isAIGraded && (
                <Badge variant="outline" className="gap-1 text-purple-600 border-purple-300">
                  <Sparkles className="w-3 h-3" />
                  AI Graded
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 pr-4">
              {question.question}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium">
              {answer.pointsEarned ?? 0}/{answer.maxPoints} pts
            </span>
            {answer.isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
            ) : answer.isCorrect === false ? (
              <XCircle className="w-6 h-6 text-red-600 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-slate-400 shrink-0" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Student Answer */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Your Answer:
          </p>
          <div
            className={cn(
              "text-sm p-3 rounded-lg border",
              answer.isCorrect
                ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-800"
                : answer.isCorrect === false
                ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-800"
                : "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700"
            )}
          >
            {answer.studentAnswer || "No answer provided"}
          </div>
        </div>

        {/* Correct Answer (if incorrect and allowed) */}
        {!answer.isCorrect && showCorrectAnswer && question.correctAnswer && (
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Correct Answer:
            </p>
            <div className="text-sm p-3 rounded-lg bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-800">
              {question.correctAnswer}
            </div>
          </div>
        )}

        {/* Basic Feedback */}
        {answer.feedback && (
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Feedback:
            </p>
            <div className="text-sm p-3 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-800">
              {answer.feedback}
            </div>
          </div>
        )}

        {/* AI Evaluation Details */}
        {hasAIEvaluation && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Analysis Details
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4"
                  >
                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Accuracy", value: aiEvaluation.accuracy },
                        { label: "Completeness", value: aiEvaluation.completeness },
                        { label: "Relevance", value: aiEvaluation.relevance },
                        { label: "Depth", value: aiEvaluation.depth },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="text-xs text-slate-500 mb-1">{label}</div>
                          <div className={cn("text-lg font-bold", getScoreColor(value))}>
                            {formatScore(value)}
                          </div>
                          {value !== null && (
                            <Progress value={value * 100} className="h-1.5 mt-1" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Bloom's Level Comparison */}
                    {comparison && aiEvaluation.demonstratedLevel && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-slate-500" />
                            <span className="text-sm">
                              Target: <strong>{BLOOMS_LABELS[question.bloomsLevel]}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-slate-500" />
                            <span className="text-sm">
                              Demonstrated:{" "}
                              <strong>{BLOOMS_LABELS[aiEvaluation.demonstratedLevel]}</strong>
                            </span>
                          </div>
                        </div>
                        <div className={cn("text-sm mt-2", comparison.color)}>
                          {comparison.message}
                        </div>
                      </div>
                    )}

                    {/* Strengths */}
                    {aiEvaluation.strengths && aiEvaluation.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {aiEvaluation.strengths.map((strength, i) => (
                            <li
                              key={i}
                              className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                            >
                              <span className="text-green-500 mt-1">+</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {aiEvaluation.improvements && aiEvaluation.improvements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-1">
                          {aiEvaluation.improvements.map((improvement, i) => (
                            <li
                              key={i}
                              className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                            >
                              <span className="text-yellow-500 mt-1">-</span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Knowledge Gaps */}
                    {aiEvaluation.knowledgeGaps && aiEvaluation.knowledgeGaps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-orange-500" />
                          Knowledge Gaps Identified
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {aiEvaluation.knowledgeGaps.map((gap, i) => (
                            <Badge key={i} variant="outline" className="text-orange-600 border-orange-300">
                              {gap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Misconceptions */}
                    {aiEvaluation.misconceptions && aiEvaluation.misconceptions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          Misconceptions Detected
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {aiEvaluation.misconceptions.map((misconception, i) => (
                            <Badge key={i} variant="outline" className="text-red-600 border-red-300">
                              {misconception}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    {aiEvaluation.nextSteps && aiEvaluation.nextSteps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          Recommended Next Steps
                        </h4>
                        <ul className="space-y-1">
                          {aiEvaluation.nextSteps.map((step, i) => (
                            <li
                              key={i}
                              className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                            >
                              <span className="text-blue-500 font-medium">{i + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Flagged for Review */}
                    {aiEvaluation.flaggedForReview && (
                      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          This answer has been flagged for instructor review
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Explanation (if available) */}
        {question.explanation && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Explanation:
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {question.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIQuestionFeedback;
