"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Flag,
  Save,
  Send,
  Timer,
  BookOpen,
  Target,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ExamTakeClientProps {
  params: {
    courseId: string;
    chapterId: string;
    sectionId: string;
    examId: string;
    attemptId: string;
  };
}

interface Question {
  id: string;
  question: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK';
  options?: any;
  points: number;
  order: number;
  imageUrl?: string;
  videoUrl?: string;
}

interface ExamAttempt {
  id: string;
  exam: {
    id: string;
    title: string;
    description?: string;
    timeLimit?: number;
    questions: Question[];
  };
  startedAt: string;
  timeSpent?: number;
  status: string;
}

export default function ExamTakeClient({ params }: ExamTakeClientProps) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  const fetchAttempt = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/courses/sections/${params.sectionId}/exams/${params.examId}/attempts`
      );
      if (response.ok) {
        const attempts = await response.json();
        const currentAttempt = attempts.find((a: any) => a.id === params.attemptId);
        if (currentAttempt) {
          setAttempt(currentAttempt);
          // Initialize answers from existing attempt
          const existingAnswers: Record<string, any> = {};
          currentAttempt.answers?.forEach((answer: any) => {
            existingAnswers[answer.questionId] = answer.answer;
          });
          setAnswers(existingAnswers);
        }
      }
    } catch (error) {
      logger.error("Error fetching attempt:", error);
    } finally {
      setLoading(false);
    }
  }, [params.sectionId, params.examId, params.attemptId]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  useEffect(() => {
    if (attempt?.exam.timeLimit && timeRemaining === null) {
      const startTime = new Date(attempt.startedAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = (attempt.exam.timeLimit * 60) - elapsed;
      setTimeRemaining(Math.max(0, remaining));
    }
  }, [attempt, timeRemaining]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || !attempt) return;

    setSubmitting(true);
    try {
      const answersArray = attempt.exam.questions.map(question => ({
        questionId: question.id,
        answer: answers[question.id] || null,
      }));

      const startTime = new Date(attempt.startedAt).getTime();
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await fetch(
        `/api/courses/sections/${params.sectionId}/exams/${params.examId}/attempts/${params.attemptId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answers: answersArray,
            timeSpent,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Redirect to results page
        router.push(
          `/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}/exams/${params.examId}/results/${params.attemptId}`
        );
      }
    } catch (error) {
      logger.error("Error submitting exam:", error);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, attempt, answers, params.sectionId, params.examId, params.attemptId, params.courseId, params.chapterId, router]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
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
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!attempt) return 0;
    const answered = attempt.exam.questions.filter(q => answers[q.id] !== undefined).length;
    return (answered / attempt.exam.questions.length) * 100;
  };

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id];

    switch (question.questionType) {
      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup
            value={answer || ""}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {question.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'TRUE_FALSE':
        return (
          <RadioGroup
            value={answer || ""}
            onValueChange={(value) => handleAnswerChange(question.id, value === 'true')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${question.id}-true`} />
              <Label htmlFor={`${question.id}-true`} className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${question.id}-false`} />
              <Label htmlFor={`${question.id}-false`} className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );

      case 'SHORT_ANSWER':
      case 'FILL_IN_BLANK':
        return (
          <Input
            value={answer || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full"
          />
        );

      case 'ESSAY':
        return (
          <Textarea
            value={answer || ""}
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Exam Not Found</h1>
          <p className="text-slate-600 mb-4">The exam attempt could not be loaded.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = attempt.exam.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === attempt.exam.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Exam
              </Button>
              <div>
                <h1 className="font-semibold text-slate-900 dark:text-slate-100">
                  {attempt.exam.title}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Question {currentQuestionIndex + 1} of {attempt.exam.questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-lg",
                  timeRemaining < 300 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                )}>
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                  {attempt.exam.questions.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={cn(
                        "w-10 h-10 lg:w-full lg:h-8 rounded-lg text-sm font-medium transition-all flex items-center justify-center lg:justify-start lg:px-3",
                        index === currentQuestionIndex
                          ? "bg-blue-600 text-white"
                          : answers[question.id] !== undefined
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      <span className="lg:mr-2">{index + 1}</span>
                      {flaggedQuestions.has(question.id) && (
                        <Flag className="w-3 h-3 text-yellow-500" />
                      )}
                      {answers[question.id] !== undefined && (
                        <CheckCircle className="w-3 h-3 ml-auto hidden lg:block" />
                      )}
                    </button>
                  ))}
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
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            Question {currentQuestionIndex + 1}
                          </Badge>
                          <Badge variant="secondary">
                            {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                          </Badge>
                          <Badge variant="outline">
                            {currentQuestion.questionType.replace('_', ' ')}
                          </Badge>
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
                    {/* Question Media */}
                    {currentQuestion.imageUrl && (
                      <div className="rounded-lg overflow-hidden">
                        <Image
                          src={currentQuestion.imageUrl}
                          alt="Question image"
                          width={800}
                          height={400}
                          className="w-full h-auto"
                        />
                      </div>
                    )}

                    {/* Answer Input */}
                    <div className="space-y-4">
                      {renderQuestion(currentQuestion)}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={isFirstQuestion}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>

                      <div className="flex gap-2">
                        {!isLastQuestion ? (
                          <Button
                            onClick={() => setCurrentQuestionIndex(prev => 
                              Math.min(attempt.exam.questions.length - 1, prev + 1)
                            )}
                          >
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        ) : (
                          <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {submitting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Exam
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