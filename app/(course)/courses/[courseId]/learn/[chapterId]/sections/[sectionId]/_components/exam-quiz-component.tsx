"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  FileQuestion,
  Trophy,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLearningMode } from "../../../../_components/learning-mode-context";

interface Question {
  id: string;
  question: string;
  type: "single" | "multiple" | "truefalse";
  options: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points?: number;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  passingScore?: number;
  timeLimit?: number; // in minutes
  attempts?: number;
}

interface ExamQuizComponentProps {
  exam: Exam;
  sectionId: string;
  onComplete?: (score: number) => void;
}

export function ExamQuizComponent({
  exam,
  sectionId,
  onComplete,
}: ExamQuizComponentProps) {
  const { canTrackProgress, user } = useLearningMode();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(exam.timeLimit ? exam.timeLimit * 60 : 0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);

  const calculateScore = useCallback(() => {
    let correct = 0;
    let totalPoints = 0;

    exam.questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const points = question.points || 1;
      totalPoints += points;

      if (question.type === "multiple") {
        const correctAnswers = question.correctAnswer as string[];
        const userAnswers = userAnswer || [];
        if (
          correctAnswers.length === userAnswers.length &&
          correctAnswers.every((a) => userAnswers.includes(a))
        ) {
          correct += points;
        }
      } else {
        if (userAnswer === question.correctAnswer) {
          correct += points;
        }
      }
    });

    return Math.round((correct / totalPoints) * 100);
  }, [exam.questions, answers]);

  const handleSubmit = useCallback(async () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setIsSubmitted(true);
    setShowResults(true);

    if (canTrackProgress && user?.id) {
      try {
        await fetch(`/api/sections/${sectionId}/exam-attempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examId: exam.id,
            score: finalScore,
            answers,
            timeSpent: exam.timeLimit ? exam.timeLimit * 60 - timeRemaining : 0,
          }),
        });
      } catch (error) {
        console.error("Failed to save exam attempt:", error);
      }
    }

    const passed = finalScore >= (exam.passingScore || 70);
    if (passed) {
      toast.success(`🎉 Congratulations! You passed with ${finalScore}%`);
      onComplete?.(finalScore);
    } else {
      toast.error(`Score: ${finalScore}%. Keep practicing!`);
    }
  }, [calculateScore, canTrackProgress, user?.id, sectionId, answers, exam.id, exam.timeLimit, exam.passingScore, timeRemaining, onComplete]);

  // Timer countdown
  useEffect(() => {
    if (exam.timeLimit && timeRemaining > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, isSubmitted, exam.timeLimit, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (value: any) => {
    setAnswers({
      ...answers,
      [exam.questions[currentQuestion].id]: value,
    });
  };

  const handleMultipleAnswerChange = (option: string, checked: boolean) => {
    const current = answers[exam.questions[currentQuestion].id] || [];
    if (checked) {
      setAnswers({
        ...answers,
        [exam.questions[currentQuestion].id]: [...current, option],
      });
    } else {
      setAnswers({
        ...answers,
        [exam.questions[currentQuestion].id]: current.filter((a: string) => a !== option),
      });
    }
  };

  const getQuestionStatus = (questionId: string) => {
    if (!isSubmitted) return "unanswered";
    const question = exam.questions.find((q) => q.id === questionId);
    const userAnswer = answers[questionId];

    if (!question || !userAnswer) return "unanswered";

    if (question.type === "multiple") {
      const correctAnswers = question.correctAnswer as string[];
      const userAnswers = userAnswer || [];
      return correctAnswers.length === userAnswers.length &&
        correctAnswers.every((a: string) => userAnswers.includes(a))
        ? "correct"
        : "incorrect";
    } else {
      return userAnswer === question.correctAnswer ? "correct" : "incorrect";
    }
  };

  const question = exam.questions[currentQuestion];
  const isLastQuestion = currentQuestion === exam.questions.length - 1;
  const allQuestionsAnswered = exam.questions.every((q) => answers[q.id] !== undefined);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-indigo-500" />
              {exam.title}
            </CardTitle>
            {exam.description && (
              <CardDescription className="mt-2">{exam.description}</CardDescription>
            )}
          </div>
          {exam.timeLimit && !isSubmitted && (
            <Badge
              variant={timeRemaining < 60 ? "destructive" : "secondary"}
              className="flex items-center gap-1"
            >
              <Clock className="h-3 w-3" />
              {formatTime(timeRemaining)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!showResults ? (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentQuestion + 1} of {exam.questions.length}</span>
                <span>{Math.round(((currentQuestion + 1) / exam.questions.length) * 100)}%</span>
              </div>
              <Progress value={((currentQuestion + 1) / exam.questions.length) * 100} />
            </div>

            {/* Question */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {question.question}
              </h3>

              {/* Answer Options */}
              {question.type === "single" || question.type === "truefalse" ? (
                <RadioGroup
                  value={answers[question.id] || ""}
                  onValueChange={handleAnswerChange}
                  disabled={isSubmitted}
                >
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center space-x-2 p-3 rounded-lg border transition-colors",
                          answers[question.id] === option && "bg-blue-50 dark:bg-blue-950/20 border-blue-500"
                        )}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center space-x-2 p-3 rounded-lg border transition-colors",
                        answers[question.id]?.includes(option) && "bg-blue-50 dark:bg-blue-950/20 border-blue-500"
                      )}
                    >
                      <Checkbox
                        id={`option-${index}`}
                        checked={answers[question.id]?.includes(option) || false}
                        onCheckedChange={(checked) =>
                          handleMultipleAnswerChange(option, checked as boolean)
                        }
                        disabled={isSubmitted}
                      />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!allQuestionsAnswered}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Submit Exam
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </>
        ) : (
          /* Results View */
          <div className="space-y-6">
            {/* Score Card */}
            <div className="text-center p-6 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
              <div className="mb-4">
                {score >= (exam.passingScore || 70) ? (
                  <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
                ) : (
                  <Target className="h-16 w-16 text-gray-500 mx-auto" />
                )}
              </div>
              <h2 className="text-3xl font-bold mb-2">{score}%</h2>
              <p className="text-muted-foreground">
                {score >= (exam.passingScore || 70) ? "Passed!" : "Keep Practicing"}
              </p>
            </div>

            {/* Question Review */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Review Answers</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExplanations(!showExplanations)}
                >
                  {showExplanations ? "Hide" : "Show"} Explanations
                </Button>
              </div>

              {exam.questions.map((q, index) => {
                const status = getQuestionStatus(q.id);
                return (
                  <div key={q.id} className="p-4 rounded-lg border">
                    <div className="flex items-start gap-3">
                      {status === "correct" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : status === "incorrect" ? (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-500 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-2">
                        <p className="font-medium">
                          {index + 1}. {q.question}
                        </p>
                        <p className="text-sm">
                          Your answer: <span className="font-medium">{answers[q.id] || "Not answered"}</span>
                        </p>
                        {status === "incorrect" && (
                          <p className="text-sm text-green-600">
                            Correct answer: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : q.correctAnswer}
                          </p>
                        )}
                        {showExplanations && q.explanation && (
                          <Alert className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{q.explanation}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentQuestion(0);
                  setAnswers({});
                  setShowResults(false);
                  setIsSubmitted(false);
                  setTimeRemaining(exam.timeLimit ? exam.timeLimit * 60 : 0);
                }}
              >
                Retry Exam
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}