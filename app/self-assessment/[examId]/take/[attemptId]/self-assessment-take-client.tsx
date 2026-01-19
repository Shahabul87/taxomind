"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/lib/logger";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Flag,
  Send,
  Timer,
  Brain,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
} from "lucide-react";
import { ConfidenceIndicator, SelfCritiquePanel } from "@/components/sam/confidence";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SelfAssessmentTakeClientProps {
  params: {
    examId: string;
    attemptId: string;
  };
  userId: string;
}

interface Question {
  id: string;
  question: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_BLANK";
  options: string[] | null;
  points: number;
  order: number;
  bloomsLevel: string;
  difficulty: string;
  hint: string | null;
  imageUrl?: string;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  timeLimit: number | null;
  passingScore: number;
  showResults: boolean;
  totalQuestions: number;
  totalPoints: number;
}

interface Attempt {
  id: string;
  attemptNumber: number;
  status: string;
  startedAt: string;
  timeSpent: number | null;
}

interface SelfCritique {
  overallConfidence: number;
  dimensions: Array<{
    name: string;
    score: number;
    description: string;
    category: "knowledge" | "reasoning" | "relevance" | "clarity" | "accuracy";
  }>;
  strengths: string[];
  weaknesses: string[];
  uncertainties: string[];
  suggestions: string[];
  generatedAt: string;
}

const bloomsLevelLabels: Record<string, string> = {
  REMEMBER: "Remember",
  UNDERSTAND: "Understand",
  APPLY: "Apply",
  ANALYZE: "Analyze",
  EVALUATE: "Evaluate",
  CREATE: "Create",
};

const bloomsLevelColors: Record<string, string> = {
  REMEMBER: "bg-blue-100 text-blue-700 border-blue-200",
  UNDERSTAND: "bg-green-100 text-green-700 border-green-200",
  APPLY: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ANALYZE: "bg-orange-100 text-orange-700 border-orange-200",
  EVALUATE: "bg-purple-100 text-purple-700 border-purple-200",
  CREATE: "bg-pink-100 text-pink-700 border-pink-200",
};

export default function SelfAssessmentTakeClient({
  params,
  userId,
}: SelfAssessmentTakeClientProps) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [existingAnswers, setExistingAnswers] = useState<Record<string, string | null>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showSamHint, setShowSamHint] = useState(false);
  const [samHintUsed, setSamHintUsed] = useState<Set<string>>(new Set());

  // Close SAM hint panel when navigating
  useEffect(() => {
    setShowSamHint(false);
  }, [currentQuestionIndex]);

  const fetchAttempt = useCallback(async () => {
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

          // Initialize answers from existing attempt
          const existing: Record<string, string> = {};
          data.questions?.forEach((q: { id: string; userAnswer: string | null }) => {
            if (q.userAnswer) {
              existing[q.id] = q.userAnswer;
            }
          });
          setExistingAnswers(existing);
          setAnswers(existing);
        }
      }
    } catch (error) {
      logger.error("Error fetching attempt:", error);
    } finally {
      setLoading(false);
    }
  }, [params.examId, params.attemptId]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  // Timer setup
  useEffect(() => {
    if (exam?.timeLimit && attempt?.startedAt && timeRemaining === null) {
      const startTime = new Date(attempt.startedAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = exam.timeLimit * 60 - elapsed;
      setTimeRemaining(Math.max(0, remaining));
    }
  }, [exam, attempt, timeRemaining]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Save progress
  const saveProgress = useCallback(async () => {
    if (saving || !attempt) return;

    setSaving(true);
    try {
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const startTime = new Date(attempt.startedAt).getTime();
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      await fetch(
        `/api/self-assessment/exams/${params.examId}/attempts/${params.attemptId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: answersArray, timeSpent }),
        }
      );
    } catch (error) {
      logger.error("Error saving progress:", error);
    } finally {
      setSaving(false);
    }
  }, [saving, attempt, answers, params.examId, params.attemptId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(answers).length > 0 && attempt?.status === "IN_PROGRESS") {
        saveProgress();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [answers, attempt, saveProgress]);

  const handleSubmit = useCallback(async () => {
    if (submitting || !attempt) return;

    setSubmitting(true);
    try {
      const answersArray = questions.map((question) => ({
        questionId: question.id,
        answer: answers[question.id] || null,
      }));

      const startTime = new Date(attempt.startedAt).getTime();
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await fetch(
        `/api/self-assessment/exams/${params.examId}/attempts/${params.attemptId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: answersArray, timeSpent }),
        }
      );

      if (response.ok) {
        router.push(
          `/self-assessment/${params.examId}/results/${params.attemptId}`
        );
      }
    } catch (error) {
      logger.error("Error submitting exam:", error);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, attempt, questions, answers, params.examId, params.attemptId, router]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, handleSubmit]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getProgress = () => {
    if (!questions.length) return 0;
    const answered = questions.filter((q) => answers[q.id]).length;
    return (answered / questions.length) * 100;
  };

  // Generate SAM critique data
  const currentSamCritique = useMemo((): SelfCritique | null => {
    if (!questions.length) return null;
    const question = questions[currentQuestionIndex];
    if (!question) return null;

    const getHintSuggestions = (): string[] => {
      const levelHints: Record<string, string[]> = {
        REMEMBER: [
          "Focus on recalling key terms and definitions",
          "Think about the basic facts you learned",
          "Try to visualize where you saw this information",
        ],
        UNDERSTAND: [
          "Explain the concept in your own words first",
          "Think about examples that illustrate this idea",
          "Consider how this connects to other concepts",
        ],
        APPLY: [
          "Think about how you would use this in practice",
          "Consider similar problems you have solved before",
          "Break down the problem into smaller steps",
        ],
        ANALYZE: [
          "Identify the key components and relationships",
          "Look for patterns and underlying structures",
          "Consider cause and effect relationships",
        ],
        EVALUATE: [
          "Consider multiple perspectives on this issue",
          "What criteria would you use to judge this?",
          "Think about strengths and weaknesses",
        ],
        CREATE: [
          "Combine ideas in new and original ways",
          "Think about how to synthesize different concepts",
          "Consider innovative solutions",
        ],
      };

      return levelHints[question.bloomsLevel] || [
        "Take your time and read the question carefully",
      ];
    };

    const questionDifficulty = Math.min(0.95, 0.6 + question.points * 0.08);

    return {
      overallConfidence: questionDifficulty,
      dimensions: [
        {
          name: "Question Clarity",
          score: 0.85,
          description: "How well the question communicates what is being asked",
          category: "clarity" as const,
        },
        {
          name: `${bloomsLevelLabels[question.bloomsLevel]} Level`,
          score: 0.78,
          description: `This question tests ${question.bloomsLevel.toLowerCase()} cognitive skills`,
          category: "knowledge" as const,
        },
      ],
      strengths: [
        `This question tests ${bloomsLevelLabels[question.bloomsLevel]} cognitive skills`,
        question.hint ? "A hint is available for guidance" : "Clear question format",
      ],
      weaknesses: [],
      uncertainties:
        question.points >= 3
          ? ["This is a higher-value question - take extra time to review your answer"]
          : [],
      suggestions: getHintSuggestions(),
      generatedAt: new Date().toISOString(),
    };
  }, [questions, currentQuestionIndex]);

  const questionConfidence = useMemo(() => {
    if (!questions.length) return 0.7;
    const question = questions[currentQuestionIndex];
    if (!question) return 0.7;
    return Math.min(0.95, 0.65 + question.points * 0.05);
  }, [questions, currentQuestionIndex]);

  const handleShowSamHint = useCallback(() => {
    const question = questions[currentQuestionIndex];
    if (question) {
      setSamHintUsed((prev) => new Set(prev).add(question.id));
    }
    setShowSamHint(true);
  }, [questions, currentQuestionIndex]);

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id] || "";

    switch (question.questionType) {
      case "MULTIPLE_CHOICE":
        return (
          <RadioGroup
            value={answer}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {question.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label
                  htmlFor={`${question.id}-${index}`}
                  className="flex-1 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "TRUE_FALSE":
        return (
          <RadioGroup
            value={answer}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${question.id}-true`} />
              <Label htmlFor={`${question.id}-true`} className="cursor-pointer">
                True
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${question.id}-false`} />
              <Label htmlFor={`${question.id}-false`} className="cursor-pointer">
                False
              </Label>
            </div>
          </RadioGroup>
        );

      case "SHORT_ANSWER":
      case "FILL_IN_BLANK":
        return (
          <Input
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full"
          />
        );

      case "ESSAY":
        return (
          <Textarea
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Write your essay here..."
            className="w-full min-h-[200px]"
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Loading your assessment...
          </p>
        </div>
      </div>
    );
  }

  if (!exam || !attempt || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Assessment Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The assessment attempt could not be loaded.
          </p>
          <Button onClick={() => router.push("/dashboard/user")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

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
                Exit
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-slate-900 dark:text-slate-100">
                    {exam.title}
                  </h1>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Self-Assessment
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-lg",
                    timeRemaining < 300
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  )}
                >
                  <Timer className="w-4 h-4" />
                  <span className="font-mono font-semibold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Progress value={getProgress()} className="w-24 h-2" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {Math.round(getProgress())}%
                </span>
              </div>

              {saving && (
                <Badge variant="outline" className="text-slate-500">
                  Saving...
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={cn(
                        "w-10 h-10 lg:w-full lg:h-8 rounded-lg text-sm font-medium transition-all flex items-center justify-center lg:justify-start lg:px-3",
                        index === currentQuestionIndex
                          ? "bg-emerald-600 text-white"
                          : answers[question.id]
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      <span className="lg:mr-2">{index + 1}</span>
                      {flaggedQuestions.has(question.id) && (
                        <Flag className="w-3 h-3 text-yellow-500" />
                      )}
                      {answers[question.id] && (
                        <CheckCircle className="w-3 h-3 ml-auto hidden lg:block" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Passing score info */}
                <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Passing Score: {exam.passingScore}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total Points: {exam.totalPoints}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant="outline">
                            Question {currentQuestionIndex + 1}
                          </Badge>
                          <Badge variant="secondary">
                            {currentQuestion.points}{" "}
                            {currentQuestion.points === 1 ? "point" : "points"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={bloomsLevelColors[currentQuestion.bloomsLevel]}
                          >
                            <Brain className="w-3 h-3 mr-1" />
                            {bloomsLevelLabels[currentQuestion.bloomsLevel]}
                          </Badge>
                          <Badge variant="outline">
                            {currentQuestion.questionType.replace("_", " ")}
                          </Badge>
                          <ConfidenceIndicator
                            confidence={questionConfidence}
                            mode="minimal"
                            size="sm"
                            explanation="SAM AI confidence in question-difficulty match"
                          />
                          {samHintUsed.has(currentQuestion.id) && (
                            <Badge
                              variant="outline"
                              className="text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30"
                            >
                              <Lightbulb className="w-3 h-3 mr-1" />
                              Hint viewed
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {currentQuestion.question}
                        </h2>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFlag(currentQuestion.id)}
                        className={cn(
                          "ml-4",
                          flaggedQuestions.has(currentQuestion.id) && "text-yellow-600"
                        )}
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Answer Input */}
                    <div className="space-y-4">{renderQuestion(currentQuestion)}</div>

                    {/* Question Hint */}
                    {currentQuestion.hint && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                              Hint
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              {currentQuestion.hint}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SAM AI Hint Panel */}
                    {currentSamCritique && (
                      <Collapsible
                        open={showSamHint}
                        onOpenChange={setShowSamHint}
                        className="mt-4"
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            onClick={handleShowSamHint}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/50">
                                <Brain className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="font-medium text-purple-700 dark:text-purple-300">
                                Need guidance from SAM?
                              </span>
                              {!samHintUsed.has(currentQuestion.id) && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-purple-500 border-purple-300"
                                >
                                  Available
                                </Badge>
                              )}
                            </div>
                            {showSamHint ? (
                              <ChevronUp className="h-4 w-4 text-purple-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-purple-500" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-2"
                          >
                            <SelfCritiquePanel
                              critique={currentSamCritique}
                              mode="compact"
                              defaultExpanded={true}
                              showActions={false}
                            />
                          </motion.div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                        }
                        disabled={isFirstQuestion}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>

                      <div className="flex gap-2">
                        {!isLastQuestion ? (
                          <Button
                            onClick={() =>
                              setCurrentQuestionIndex((prev) =>
                                Math.min(questions.length - 1, prev + 1)
                              )
                            }
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        ) : (
                          <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {submitting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Assessment
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
