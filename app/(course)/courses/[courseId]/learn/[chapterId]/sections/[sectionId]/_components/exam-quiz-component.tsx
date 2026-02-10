"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  FileQuestion,
  Trophy,
  Target,
  AlertCircle,
  PlayCircle,
  RotateCcw,
  Eye,
  Loader2,
  Award,
  XCircle,
  ArrowRight,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AttemptData {
  id: string;
  attemptNumber: number;
  status: string;
  scorePercentage: number | null;
  isPassed: boolean | null;
  submittedAt: string | null;
  timeSpent: number | null;
  correctAnswers: number;
  totalQuestions: number;
}

interface ExamCardProps {
  exam: {
    id: string;
    title: string;
    description?: string | null;
    timeLimit?: number | null;
    passingScore: number;
    attempts: number;
    instructions?: string | null;
    _count: { ExamQuestion: number };
    UserExamAttempt?: AttemptData[];
  };
  sectionId: string;
  courseId: string;
  chapterId: string;
}

export function ExamCard({
  exam,
  sectionId,
  courseId,
  chapterId,
}: ExamCardProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const attempts = exam.UserExamAttempt ?? [];
  const completedAttempts = attempts.filter(
    (a) => a.status === "SUBMITTED" || a.status === "GRADED"
  );
  const inProgressAttempt = attempts.find((a) => a.status === "IN_PROGRESS");
  const bestAttempt = completedAttempts.reduce<AttemptData | null>(
    (best, curr) => {
      if (!best) return curr;
      return (curr.scorePercentage ?? 0) > (best.scorePercentage ?? 0)
        ? curr
        : best;
    },
    null
  );
  const hasPassed = completedAttempts.some((a) => a.isPassed === true);
  const attemptsRemaining = Math.max(0, exam.attempts - attempts.length);
  const maxAttemptsReached = attemptsRemaining === 0 && !inProgressAttempt;

  const examBasePath = `/courses/${courseId}/learn/${chapterId}/sections/${sectionId}/exams/${exam.id}`;

  const handleStartExam = useCallback(async () => {
    setIsStarting(true);
    try {
      const res = await fetch(
        `/api/courses/sections/${sectionId}/exams/${exam.id}/attempts`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to start exam");
        return;
      }

      const attempt = await res.json();
      router.push(`${examBasePath}/take/${attempt.id}`);
    } catch {
      toast.error("Failed to start exam. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }, [sectionId, exam.id, examBasePath, router]);

  const handleResumeExam = useCallback(() => {
    if (inProgressAttempt) {
      router.push(`${examBasePath}/take/${inProgressAttempt.id}`);
    }
  }, [inProgressAttempt, examBasePath, router]);

  const handleViewResults = useCallback(
    (attemptId: string) => {
      router.push(`${examBasePath}/results/${attemptId}`);
    },
    [examBasePath, router]
  );

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const formatTimeSpent = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Determine card state
  const cardState = hasPassed
    ? "passed"
    : inProgressAttempt
      ? "in-progress"
      : maxAttemptsReached
        ? "exhausted"
        : completedAttempts.length > 0
          ? "retry"
          : "fresh";

  const headerGradient = {
    passed:
      "from-emerald-500/10 via-green-500/5 to-transparent dark:from-emerald-500/20 dark:via-green-500/10 dark:to-transparent",
    "in-progress":
      "from-amber-500/10 via-yellow-500/5 to-transparent dark:from-amber-500/20 dark:via-yellow-500/10 dark:to-transparent",
    exhausted:
      "from-red-500/10 via-rose-500/5 to-transparent dark:from-red-500/20 dark:via-rose-500/10 dark:to-transparent",
    retry:
      "from-blue-500/10 via-indigo-500/5 to-transparent dark:from-blue-500/20 dark:via-indigo-500/10 dark:to-transparent",
    fresh:
      "from-indigo-500/10 via-violet-500/5 to-transparent dark:from-indigo-500/20 dark:via-violet-500/10 dark:to-transparent",
  }[cardState];

  return (
    <Card className="overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.06)] transition-shadow bg-white dark:bg-slate-900 ring-1 ring-slate-900/[0.04] dark:ring-white/[0.04]">
      {/* Header with gradient */}
      <div className={cn("bg-gradient-to-r px-5 pt-5 pb-4", headerGradient)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div
              className={cn(
                "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                cardState === "passed"
                  ? "bg-emerald-100 dark:bg-emerald-900/40"
                  : cardState === "in-progress"
                    ? "bg-amber-100 dark:bg-amber-900/40"
                    : "bg-indigo-100 dark:bg-indigo-900/40"
              )}
            >
              {cardState === "passed" ? (
                <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : cardState === "in-progress" ? (
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <FileQuestion className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            {/* Title + description */}
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                {exam.title}
              </h3>
              {exam.description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {exam.description}
                </p>
              )}
            </div>
          </div>

          {/* Status badge */}
          {cardState === "passed" && (
            <Badge className="shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-medium">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Passed
            </Badge>
          )}
          {cardState === "in-progress" && (
            <Badge className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-medium animate-pulse">
              <Clock className="h-3 w-3 mr-1" />
              In Progress
            </Badge>
          )}
          {cardState === "exhausted" && (
            <Badge className="shrink-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800 font-medium">
              <XCircle className="h-3 w-3 mr-1" />
              No Retries
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="px-5 pb-5 pt-0 space-y-4">
        {/* Stat Pills */}
        <div className="flex flex-wrap gap-2 -mt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Hash className="h-3 w-3 text-slate-400" />
            {exam._count.ExamQuestion} questions
          </div>
          {exam.timeLimit != null && exam.timeLimit > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Clock className="h-3 w-3 text-slate-400" />
              {formatTime(exam.timeLimit)}
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Target className="h-3 w-3 text-slate-400" />
            Pass: {exam.passingScore}%
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
            <RotateCcw className="h-3 w-3 text-slate-400" />
            {inProgressAttempt
              ? `${attemptsRemaining} left`
              : maxAttemptsReached
                ? "0 left"
                : `${attemptsRemaining} of ${exam.attempts}`}{" "}
            attempts
          </div>
        </div>

        {/* Best Score Banner */}
        {bestAttempt && (
          <div
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-xl border",
              hasPassed
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  hasPassed
                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                    : "bg-slate-100 dark:bg-slate-700"
                )}
              >
                <Award
                  className={cn(
                    "h-4 w-4",
                    hasPassed
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-500"
                  )}
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Best Score
                </p>
                <p
                  className={cn(
                    "text-lg font-bold leading-tight",
                    hasPassed
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {Math.round(bestAttempt.scorePercentage ?? 0)}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {bestAttempt.correctAnswers}/{bestAttempt.totalQuestions} correct
              </p>
              {bestAttempt.timeSpent != null && bestAttempt.timeSpent > 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  in {formatTimeSpent(bestAttempt.timeSpent)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {exam.instructions && cardState === "fresh" && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              {exam.instructions}
            </p>
          </div>
        )}

        {/* In-Progress Banner */}
        {inProgressAttempt && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Attempt #{inProgressAttempt.attemptNumber} in progress &mdash;
              pick up where you left off
            </p>
          </div>
        )}

        {/* Attempt History */}
        {completedAttempts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Previous Attempts
            </h4>
            <div className="space-y-1.5">
              {completedAttempts.slice(0, 3).map((attempt) => (
                <div
                  key={attempt.id}
                  className="group flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    {attempt.isPassed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-slate-500 dark:text-slate-400">
                      #{attempt.attemptNumber}
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        attempt.isPassed
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {Math.round(attempt.scorePercentage ?? 0)}%
                    </span>
                    {attempt.timeSpent != null && attempt.timeSpent > 0 && (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        {formatTimeSpent(attempt.timeSpent)}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                    onClick={() => handleViewResults(attempt.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              ))}
              {completedAttempts.length > 3 && (
                <p className="text-xs text-slate-400 pl-3">
                  +{completedAttempts.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1">
          {inProgressAttempt ? (
            <Button
              onClick={handleResumeExam}
              size="lg"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm shadow-amber-200/50 dark:shadow-none"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Resume Exam
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : maxAttemptsReached ? (
            bestAttempt && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleViewResults(bestAttempt.id)}
                className="w-full border-slate-200 dark:border-slate-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Best Result
              </Button>
            )
          ) : (
            <Button
              onClick={handleStartExam}
              size="lg"
              disabled={isStarting || exam._count.ExamQuestion === 0}
              className={cn(
                "w-full font-medium shadow-sm",
                completedAttempts.length > 0
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200/50 dark:shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50 dark:shadow-none",
                "text-white"
              )}
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              {completedAttempts.length > 0
                ? "Start New Attempt"
                : "Start Exam"}
              {!isStarting && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
