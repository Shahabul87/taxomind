"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Lightbulb,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { PracticeQuestionForSolving, PracticeAnswerInput, PracticeHint } from "@/types/practice-problems";

interface PracticeSolverProps {
  questions: PracticeQuestionForSolving[];
  setTitle: string | null;
  isSubmitting: boolean;
  onSubmit: (answers: PracticeAnswerInput[], timeSpent: number) => void;
  onCancel: () => void;
}

export function PracticeSolver({
  questions,
  setTitle,
  isSubmitting,
  onSubmit,
  onCancel,
}: PracticeSolverProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, number>>({});
  const startTimeRef = useRef(Date.now());
  const questionTimesRef = useRef<Record<string, number>>({});
  const questionStartRef = useRef(Date.now());

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;

  // Track time per question
  useEffect(() => {
    questionStartRef.current = Date.now();
    const times = questionTimesRef.current;
    const questionId = currentQuestion?.id;
    return () => {
      if (questionId) {
        const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000);
        times[questionId] = (times[questionId] || 0) + elapsed;
      }
    };
  }, [currentIndex, currentQuestion]);

  const setAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const revealHint = useCallback((questionId: string) => {
    setRevealedHints((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || 0) + 1,
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    // Record final question time
    if (currentQuestion) {
      const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000);
      questionTimesRef.current[currentQuestion.id] =
        (questionTimesRef.current[currentQuestion.id] || 0) + elapsed;
    }

    const totalTimeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

    const submissionAnswers: PracticeAnswerInput[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
      timeSpent: questionTimesRef.current[q.id] || 0,
      hintsUsed: revealedHints[q.id] || 0,
    }));

    onSubmit(submissionAnswers, totalTimeSpent);
  }, [answers, currentQuestion, questions, revealedHints, onSubmit]);

  const goNext = () => {
    if (currentIndex < totalQuestions - 1) setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (!currentQuestion) return null;

  const hints = currentQuestion.hints as PracticeHint[] | null;
  const hintsRevealed = revealedHints[currentQuestion.id] || 0;
  const totalHints = hints?.length ?? 0;
  const canRevealHint = totalHints > 0 && hintsRevealed < totalHints;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{setTitle || "Practice"}</p>
          <p className="text-xs text-muted-foreground">
            Question {currentIndex + 1} of {totalQuestions} &middot; {answeredCount} answered
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1.5" />

      {/* Question Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {currentQuestion.bloomsLevel}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {currentQuestion.difficulty}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {currentQuestion.points} pts
            </Badge>
            {currentQuestion.estimatedTime && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                ~{Math.ceil(currentQuestion.estimatedTime / 60)}min
              </span>
            )}
          </div>

          {/* Question Text */}
          <p className="text-sm font-medium leading-relaxed">{currentQuestion.question}</p>

          {/* Answer Input */}
          <div className="pt-1">
            {currentQuestion.questionType === "MULTIPLE_CHOICE" && currentQuestion.options ? (
              <RadioGroup
                value={answers[currentQuestion.id] ?? ""}
                onValueChange={(v) => setAnswer(currentQuestion.id, v)}
                className="space-y-2"
              >
                {currentQuestion.options.map((opt) => (
                  <Label
                    key={opt.id}
                    htmlFor={`opt-${opt.id}`}
                    className="flex items-start gap-2 p-2.5 rounded-lg border border-border/60 hover:bg-accent/50 cursor-pointer transition-colors text-sm"
                  >
                    <RadioGroupItem value={opt.text} id={`opt-${opt.id}`} className="mt-0.5" />
                    <span>{opt.text}</span>
                  </Label>
                ))}
              </RadioGroup>
            ) : currentQuestion.questionType === "TRUE_FALSE" ? (
              <RadioGroup
                value={answers[currentQuestion.id] ?? ""}
                onValueChange={(v) => setAnswer(currentQuestion.id, v)}
                className="space-y-2"
              >
                {["true", "false"].map((val) => (
                  <Label
                    key={val}
                    htmlFor={`tf-${val}`}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 hover:bg-accent/50 cursor-pointer transition-colors text-sm capitalize"
                  >
                    <RadioGroupItem value={val} id={`tf-${val}`} />
                    {val}
                  </Label>
                ))}
              </RadioGroup>
            ) : currentQuestion.questionType === "ESSAY" ||
              currentQuestion.questionType === "SHORT_ANSWER" ? (
              <Textarea
                placeholder={
                  currentQuestion.questionType === "ESSAY"
                    ? "Write your essay response..."
                    : "Type your answer..."
                }
                value={answers[currentQuestion.id] ?? ""}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                rows={currentQuestion.questionType === "ESSAY" ? 6 : 3}
                className="text-sm"
              />
            ) : (
              <Input
                placeholder="Type your answer..."
                value={answers[currentQuestion.id] ?? ""}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                className="text-sm"
              />
            )}
          </div>

          {/* Hints */}
          {totalHints > 0 && (
            <div className="space-y-2">
              {hints?.slice(0, hintsRevealed).map((hint) => (
                <div
                  key={hint.id}
                  className="flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs"
                >
                  <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-amber-800 dark:text-amber-200">{hint.content}</p>
                </div>
              ))}
              {canRevealHint && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revealHint(currentQuestion.id)}
                  className="text-xs text-amber-600 dark:text-amber-400 h-7"
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Reveal Hint ({hintsRevealed}/{totalHints})
                  {hints?.[hintsRevealed]?.penaltyPoints ? (
                    <span className="ml-1 text-muted-foreground">
                      (-{hints[hintsRevealed].penaltyPoints} pts)
                    </span>
                  ) : null}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {/* Question dots */}
        <div className="flex gap-1 flex-wrap justify-center max-w-[200px]">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex
                  ? "bg-primary"
                  : answers[q.id]?.trim()
                    ? "bg-green-500"
                    : "bg-muted-foreground/30"
              }`}
              aria-label={`Go to question ${i + 1}`}
            />
          ))}
        </div>

        {currentIndex < totalQuestions - 1 ? (
          <Button variant="outline" size="sm" onClick={goNext} className="gap-1">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || answeredCount === 0}
            className="gap-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Grading...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit All
              </>
            )}
          </Button>
        )}
      </div>

      {/* Unanswered warning */}
      {answeredCount < totalQuestions && currentIndex === totalQuestions - 1 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 justify-center">
          <AlertCircle className="h-3 w-3" />
          {totalQuestions - answeredCount} question{totalQuestions - answeredCount !== 1 ? "s" : ""}{" "}
          unanswered
        </div>
      )}
    </div>
  );
}
