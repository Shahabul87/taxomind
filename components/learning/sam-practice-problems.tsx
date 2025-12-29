"use client";

/**
 * SAM Practice Problems Component
 *
 * Interactive practice problems powered by SAM AI educational engines.
 * Features:
 * - Adaptive difficulty based on performance
 * - Progressive hints system
 * - Spaced repetition scheduling
 * - Detailed feedback and explanations
 */

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ChevronRight,
  RotateCcw,
  Trophy,
  Target,
  Clock,
  HelpCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Loader2,
} from "lucide-react";
import { useSAMPracticeProblems } from "@sam-ai/react";
import type { BloomsLevel } from "@sam-ai/core";

interface SAMPracticeProblemsProps {
  topic: string;
  sectionId: string;
  userId: string;
  bloomsLevel?: BloomsLevel;
  difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
  onComplete?: (stats: { correct: number; total: number; score: number }) => void;
}

export function SAMPracticeProblems({
  topic,
  sectionId,
  userId,
  bloomsLevel = "APPLY",
  difficulty = "intermediate",
  onComplete,
}: SAMPracticeProblemsProps) {
  const {
    problems,
    currentProblem,
    currentIndex,
    isGenerating,
    isEvaluating,
    lastEvaluation,
    sessionStats,
    hintsUsed,
    generateProblems,
    submitAnswer,
    getNextHint,
    nextProblem,
    resetSession,
  } = useSAMPracticeProblems({ userId, sectionId });

  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [displayedHints, setDisplayedHints] = useState<string[]>([]);

  // Generate problems on first load
  const handleStartPractice = useCallback(async () => {
    setDisplayedHints([]);
    await generateProblems({
      topic,
      bloomsLevel,
      difficulty,
      count: 5,
      problemTypes: ["multiple_choice", "short_answer"],
      learningObjectives: [`Master ${topic} concepts`],
    });
  }, [generateProblems, topic, bloomsLevel, difficulty]);

  // Submit answer
  const handleSubmit = useCallback(async () => {
    if (!currentProblem) return;

    const answer = currentProblem.type === "multiple_choice" ? selectedAnswer : textAnswer;
    if (!answer.trim()) return;

    await submitAnswer(answer);
    setShowExplanation(true);
  }, [currentProblem, selectedAnswer, textAnswer, submitAnswer]);

  // Move to next problem
  const handleNext = useCallback(() => {
    nextProblem();
    setSelectedAnswer("");
    setTextAnswer("");
    setShowExplanation(false);
    setDisplayedHints([]);

    // Check if practice session is complete
    if (currentIndex >= problems.length - 1 && sessionStats) {
      onComplete?.({
        correct: sessionStats.correctAnswers,
        total: sessionStats.totalAttempts,
        score: sessionStats.averageScore,
      });
    }
  }, [nextProblem, currentIndex, problems.length, sessionStats, onComplete]);

  // Request hint
  const handleGetHint = useCallback(() => {
    const hint = getNextHint();
    if (hint) {
      setDisplayedHints(prev => [...prev, hint.content]);
    }
  }, [getNextHint]);

  // Restart practice
  const handleRestart = useCallback(() => {
    resetSession();
    setSelectedAnswer("");
    setTextAnswer("");
    setShowExplanation(false);
    setDisplayedHints([]);
  }, [resetSession]);

  // Initial state - no problems generated yet
  if (problems.length === 0 && !isGenerating) {
    return (
      <Card className="w-full border-2 border-dashed border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">Practice Problems</CardTitle>
          <CardDescription className="text-base">
            Test your understanding of <span className="font-medium text-purple-600 dark:text-purple-400">{topic}</span> with
            AI-generated practice problems
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="bg-white dark:bg-slate-800">
              <Target className="w-3 h-3 mr-1" />
              {difficulty} difficulty
            </Badge>
            <Badge variant="outline" className="bg-white dark:bg-slate-800">
              <BookOpen className="w-3 h-3 mr-1" />
              {bloomsLevel.toLowerCase()} level
            </Badge>
            <Badge variant="outline" className="bg-white dark:bg-slate-800">
              <Clock className="w-3 h-3 mr-1" />
              ~10 minutes
            </Badge>
          </div>
          <Button
            onClick={handleStartPractice}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Practice
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <Card className="w-full">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500 mb-4" />
          <p className="text-muted-foreground">Generating practice problems...</p>
        </CardContent>
      </Card>
    );
  }

  // Practice complete
  if (!currentProblem && problems.length > 0) {
    const correctRate = sessionStats ? (sessionStats.correctAnswers / sessionStats.totalAttempts) * 100 : 0;

    return (
      <Card className="w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl">Practice Complete!</CardTitle>
          <CardDescription>Great job working through these problems</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
              <p className="text-3xl font-bold text-green-600">{sessionStats?.correctAnswers || 0}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <p className="text-3xl font-bold text-blue-600">{sessionStats?.totalAttempts || 0}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <p className="text-3xl font-bold text-purple-600">{Math.round(correctRate)}%</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
          </div>

          {hintsUsed.length > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              <Lightbulb className="w-4 h-4 inline mr-1" />
              Used {hintsUsed.length} hint{hintsUsed.length > 1 ? "s" : ""}
            </p>
          )}

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Practice Again
            </Button>
            <Button
              onClick={handleStartPractice}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              New Problems
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active problem view
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              Problem {currentIndex + 1} of {problems.length}
            </Badge>
            <Badge variant="outline" className={cn(
              currentProblem?.difficulty === "beginner" && "bg-green-50 text-green-600",
              currentProblem?.difficulty === "intermediate" && "bg-blue-50 text-blue-600",
              currentProblem?.difficulty === "advanced" && "bg-orange-50 text-orange-600",
              currentProblem?.difficulty === "expert" && "bg-red-50 text-red-600",
            )}>
              {currentProblem?.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {currentProblem?.timeLimit || 5} min
          </div>
        </div>
        <Progress
          value={((currentIndex + (lastEvaluation ? 1 : 0)) / problems.length) * 100}
          className="h-2 mt-3"
        />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Problem statement */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
          <h3 className="font-medium text-lg mb-2">{currentProblem?.title}</h3>
          <p className="text-muted-foreground">{currentProblem?.statement}</p>
        </div>

        {/* Hints */}
        {displayedHints.length > 0 && (
          <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Hint</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              {displayedHints[displayedHints.length - 1]}
            </AlertDescription>
          </Alert>
        )}

        {/* Answer input based on problem type */}
        {!lastEvaluation && (
          <>
            {currentProblem?.type === "multiple_choice" && currentProblem?.options ? (
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-3">
                {currentProblem.options.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                      selectedAnswer === option.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                        : "hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                    onClick={() => setSelectedAnswer(option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                placeholder="Type your answer here..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                className="min-h-[120px]"
              />
            )}
          </>
        )}

        {/* Evaluation result */}
        {lastEvaluation && (
          <div className={cn(
            "p-4 rounded-lg border-2",
            lastEvaluation.isCorrect
              ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
          )}>
            <div className="flex items-center gap-2 mb-2">
              {lastEvaluation.isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <span className={cn(
                "font-semibold text-lg",
                lastEvaluation.isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
              )}>
                {lastEvaluation.isCorrect ? "Correct!" : "Not quite right"}
              </span>
              {lastEvaluation.partialCredit > 0 && lastEvaluation.partialCredit < 1 && (
                <Badge className="ml-2 bg-amber-100 text-amber-700">
                  {Math.round(lastEvaluation.partialCredit * 100)}% credit
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{lastEvaluation.feedback}</p>

            {showExplanation && currentProblem?.solutionExplanation && (
              <>
                <Separator className="my-3" />
                <div>
                  <p className="font-medium mb-1">Solution Explanation:</p>
                  <p className="text-sm text-muted-foreground">{currentProblem.solutionExplanation}</p>
                </div>
              </>
            )}

            {lastEvaluation.conceptsToReview && lastEvaluation.conceptsToReview.length > 0 && (
              <>
                <Separator className="my-3" />
                <div>
                  <p className="font-medium mb-2">Concepts to review:</p>
                  <div className="flex flex-wrap gap-2">
                    {lastEvaluation.conceptsToReview.map((concept: string, i: number) => (
                      <Badge key={i} variant="outline">{concept}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between pt-4 border-t">
        {!lastEvaluation ? (
          <>
            <Button
              variant="outline"
              onClick={handleGetHint}
              disabled={displayedHints.length >= (currentProblem?.hints?.length || 3)}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Get Hint ({displayedHints.length}/{currentProblem?.hints?.length || 3})
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isEvaluating || (!selectedAnswer && !textAnswer.trim())}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
            >
              {isEvaluating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Submit Answer
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setShowExplanation(!showExplanation)}>
              <BookOpen className="w-4 h-4 mr-2" />
              {showExplanation ? "Hide" : "Show"} Explanation
            </Button>
            <Button onClick={handleNext} className="bg-gradient-to-r from-purple-500 to-blue-500">
              <ChevronRight className="w-4 h-4 mr-2" />
              {currentIndex < problems.length - 1 ? "Next Problem" : "Finish Practice"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
