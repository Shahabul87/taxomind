"use client";

/**
 * PracticeProblemsWidget
 *
 * Dashboard widget for generating and practicing AI-generated problems.
 * Uses the useSAMPracticeProblems hook from @sam-ai/react package.
 */

import { useState, useCallback, useEffect } from "react";
import { useSAMPracticeProblems } from "@sam-ai/react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Loader2,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  AlertCircle,
} from "lucide-react";

interface PracticeProblemsWidgetProps {
  courseId?: string;
  sectionId?: string;
  defaultTopic?: string;
  compact?: boolean;
  className?: string;
}

type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

export function PracticeProblemsWidget({
  courseId,
  sectionId,
  defaultTopic = "",
  compact = false,
  className = "",
}: PracticeProblemsWidgetProps) {
  const user = useCurrentUser();
  const [topic, setTopic] = useState(defaultTopic);
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [userAnswer, setUserAnswer] = useState("");
  const [currentHint, setCurrentHint] = useState<string | null>(null);

  const {
    problems,
    currentProblem,
    currentIndex,
    isGenerating,
    isEvaluating,
    lastEvaluation,
    sessionStats,
    error,
    hintsUsed,
    generateProblems,
    submitAnswer,
    getNextHint,
    nextProblem,
    previousProblem,
    resetSession,
    getRecommendedDifficulty,
  } = useSAMPracticeProblems({
    userId: user?.id,
    courseId,
    sectionId,
    adaptiveDifficulty: true,
    onProblemComplete: (problem, evaluation) => {
      console.log("Problem completed:", problem.id, "Correct:", evaluation.isCorrect);
    },
    onStatsUpdate: (stats) => {
      console.log("Session stats updated:", stats);
    },
  });

  // Get recommended difficulty on mount
  useEffect(() => {
    if (user?.id) {
      getRecommendedDifficulty();
    }
  }, [user?.id, getRecommendedDifficulty]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    await generateProblems({
      topic: topic.trim(),
      difficulty,
      count: 5,
    });
    setUserAnswer("");
    setCurrentHint(null);
  }, [topic, difficulty, generateProblems]);

  const handleSubmit = useCallback(async () => {
    if (!userAnswer.trim()) return;

    await submitAnswer(userAnswer.trim());
  }, [userAnswer, submitAnswer]);

  const handleGetHint = useCallback(() => {
    const hint = getNextHint();
    if (hint) {
      setCurrentHint(hint.content);
    }
  }, [getNextHint]);

  const handleNextProblem = useCallback(() => {
    nextProblem();
    setUserAnswer("");
    setCurrentHint(null);
  }, [nextProblem]);

  const handlePreviousProblem = useCallback(() => {
    previousProblem();
    setUserAnswer("");
    setCurrentHint(null);
  }, [previousProblem]);

  const handleReset = useCallback(() => {
    resetSession();
    setUserAnswer("");
    setCurrentHint(null);
  }, [resetSession]);

  // Calculate progress
  const progress = problems.length > 0 ? ((currentIndex + 1) / problems.length) * 100 : 0;

  if (compact) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-purple-500" />
            Practice Problems
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentProblem ? (
            <div className="space-y-2">
              <p className="text-sm font-medium line-clamp-2">
                {currentProblem.title}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {currentIndex + 1} of {problems.length}
                </span>
                {sessionStats && (
                  <span className="text-green-600">
                    {sessionStats.correctAnswers}/{sessionStats.totalAttempts} correct
                  </span>
                )}
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Generate practice problems to test your knowledge
              </p>
              <Button
                size="sm"
                onClick={() => setTopic("General Knowledge")}
                className="w-full"
              >
                <Sparkles className="mr-2 h-3 w-3" />
                Quick Practice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Practice Problems Generator
          {sessionStats && sessionStats.totalAttempts > 0 && (
            <Badge variant="outline" className="ml-auto">
              <Trophy className="mr-1 h-3 w-3 text-yellow-500" />
              {sessionStats.correctAnswers}/{sessionStats.totalAttempts}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Topic and Difficulty Selection */}
        {!currentProblem && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Topic</label>
              <Textarea
                placeholder="Enter a topic to practice (e.g., JavaScript Closures, React Hooks, SQL Joins)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Difficulty</label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">
                      <span className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-green-500" />
                        Beginner
                      </span>
                    </SelectItem>
                    <SelectItem value="intermediate">
                      <span className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-yellow-500" />
                        Intermediate
                      </span>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <span className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-orange-500" />
                        Advanced
                      </span>
                    </SelectItem>
                    <SelectItem value="expert">
                      <span className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-red-500" />
                        Expert
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Problems
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Current Problem Display */}
        {currentProblem && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <Progress value={progress} className="flex-1" />
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1}/{problems.length}
              </span>
            </div>

            {/* Problem Card */}
            <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{currentProblem.title}</h3>
                <Badge
                  variant={
                    currentProblem.difficulty === "beginner"
                      ? "secondary"
                      : currentProblem.difficulty === "intermediate"
                        ? "outline"
                        : currentProblem.difficulty === "advanced"
                          ? "default"
                          : "destructive"
                  }
                >
                  {currentProblem.difficulty}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap text-sm">{currentProblem.statement}</p>

              {/* Code Block if present */}
              {currentProblem.starterCode && (
                <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-3 text-sm text-slate-100 dark:bg-slate-950">
                  <code>{currentProblem.starterCode}</code>
                </pre>
              )}
            </div>

            {/* Hint Display */}
            {currentHint && (
              <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                <Lightbulb className="mt-0.5 h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    Hint {hintsUsed.length}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-500">{currentHint}</p>
                </div>
              </div>
            )}

            {/* Answer Input */}
            {!lastEvaluation && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter your answer..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={isEvaluating || !userAnswer.trim()}
                    className="flex-1"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      "Submit Answer"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGetHint}
                    disabled={
                      !currentProblem.hints ||
                      hintsUsed.length >= currentProblem.hints.length
                    }
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Hint ({currentProblem.hints?.length ?? 0 - hintsUsed.length} left)
                  </Button>
                </div>
              </div>
            )}

            {/* Evaluation Result */}
            {lastEvaluation && (
              <div
                className={`rounded-lg border p-4 ${
                  lastEvaluation.isCorrect
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  {lastEvaluation.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span
                    className={`font-semibold ${
                      lastEvaluation.isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {lastEvaluation.isCorrect ? "Correct!" : "Not quite right"}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    Score: {Math.round((lastEvaluation.partialCredit ?? (lastEvaluation.isCorrect ? 1 : 0)) * 100)}%
                  </Badge>
                </div>
                {lastEvaluation.feedback && (
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {lastEvaluation.feedback}
                  </p>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousProblem}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="mr-1 h-4 w-4" />
                New Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextProblem}
                disabled={currentIndex === problems.length - 1}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Session Stats */}
        {sessionStats && sessionStats.totalAttempts > 0 && !currentProblem && (
          <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
            <h4 className="mb-2 font-medium">Session Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {sessionStats.correctAnswers}
                </p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {sessionStats.totalAttempts - sessionStats.correctAnswers}
                </p>
                <p className="text-xs text-muted-foreground">Incorrect</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((sessionStats.correctAnswers / sessionStats.totalAttempts) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PracticeProblemsWidget;
