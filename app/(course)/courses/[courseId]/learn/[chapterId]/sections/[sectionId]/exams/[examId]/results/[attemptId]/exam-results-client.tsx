"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { logger } from "@/lib/logger";
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  BarChart3,
  RefreshCw,
  Sparkles,
  Brain,
} from "lucide-react";
import { RecommendationCard } from "@/components/sam/recommendations";
import { ConfidenceIndicator } from "@/components/sam/confidence";
import { LearningStyleIndicator } from "@/components/sam/behavior";
import { LearningPathWidget } from "@/components/sam";
import {
  BloomsTaxonomyBreakdown,
  CognitiveProfileCard,
  AIQuestionFeedback,
  LearningRecommendations,
} from "@/components/sam/exam-results";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { BloomsLevel } from "@prisma/client";

interface ExamResultsClientProps {
  params: {
    courseId: string;
    chapterId: string;
    sectionId: string;
    examId: string;
    attemptId: string;
  };
}

// Enhanced result types from the API
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

interface LevelPerformance {
  questionsCount: number;
  correctCount: number;
  scorePercentage: number;
  averageTime?: number;
}

interface BloomsBreakdown {
  REMEMBER: LevelPerformance;
  UNDERSTAND: LevelPerformance;
  APPLY: LevelPerformance;
  ANALYZE: LevelPerformance;
  EVALUATE: LevelPerformance;
  CREATE: LevelPerformance;
}

interface CognitiveProfile {
  overallMastery: number;
  strengths: BloomsLevel[];
  weaknesses: BloomsLevel[];
  recommendedFocus: BloomsLevel[];
}

interface LearningRecommendation {
  type: "remediate" | "practice" | "advance" | "review";
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  bloomsLevel: BloomsLevel;
  relatedConcepts?: string[];
  estimatedTime?: number;
}

interface EnhancedExamResult {
  id: string;
  examId: string;
  examTitle: string;
  status: string;
  scorePercentage: number;
  isPassed: boolean;
  passingScore: number;
  startedAt?: string;
  submittedAt?: string;
  timeSpent: number | null;
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  maxPoints: number;
  answers: QuestionAnswer[];
  bloomsBreakdown: BloomsBreakdown;
  cognitiveProfile: CognitiveProfile;
  learningPath: LearningRecommendation[];
  student: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  course?: {
    id: string;
    title: string;
  } | null;
  section?: {
    id: string;
    chapterId: string;
    chapterTitle: string;
  } | null;
}

// Legacy result type for fallback
interface LegacyExamResult {
  attempt: {
    id: string;
    attemptNumber: number;
    scorePercentage: number;
    isPassed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    submittedAt: string;
    answers: Array<{
      id: string;
      answer: unknown;
      isCorrect: boolean;
      pointsEarned: number;
      question: {
        id: string;
        question: string;
        questionType: string;
        points: number;
        correctAnswer: unknown;
        explanation?: string;
      };
    }>;
    exam: {
      id: string;
      title: string;
      passingScore: number;
      timeLimit?: number;
    };
  };
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    scorePercentage: number;
    isPassed: boolean;
    earnedPoints: number;
    totalPoints: number;
    timeSpent: number;
  };
}

export default function ExamResultsClient({ params }: ExamResultsClientProps) {
  const router = useRouter();
  const [enhancedResult, setEnhancedResult] =
    useState<EnhancedExamResult | null>(null);
  const [legacyResult, setLegacyResult] = useState<LegacyExamResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [filteredBloomsLevel, setFilteredBloomsLevel] =
    useState<BloomsLevel | null>(null);

  // Use ref to track if we've already fetched
  const hasFetchedRef = useRef(false);

  const fetchResults = useCallback(async () => {
    // Prevent duplicate fetches
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    try {
      setLoading(true);

      // Try the enhanced results endpoint first
      const enhancedResponse = await fetch(
        `/api/exams/results/${params.attemptId}`
      );

      if (enhancedResponse.ok) {
        const data = await enhancedResponse.json();
        if (data.success && data.result) {
          setEnhancedResult(data.result);
          return;
        }
      }

      // Fallback to legacy endpoint
      const legacyResponse = await fetch(
        `/api/courses/sections/${params.sectionId}/exams/${params.examId}/attempts`
      );

      if (legacyResponse.ok) {
        const attempts = await legacyResponse.json();
        const attempt = attempts.find(
          (a: { id: string }) => a.id === params.attemptId
        );
        if (attempt) {
          setLegacyResult({
            attempt,
            summary: {
              totalQuestions: attempt.totalQuestions,
              correctAnswers: attempt.correctAnswers,
              scorePercentage: attempt.scorePercentage,
              isPassed: attempt.isPassed,
              earnedPoints:
                attempt.answers?.reduce(
                  (sum: number, a: { pointsEarned: number }) =>
                    sum + a.pointsEarned,
                  0
                ) || 0,
              totalPoints:
                attempt.answers?.reduce(
                  (sum: number, a: { question: { points: number } }) =>
                    sum + a.question.points,
                  0
                ) || 0,
              timeSpent: attempt.timeSpent,
            },
          });
        }
      }
    } catch (error) {
      logger.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  }, [params.attemptId, params.sectionId, params.examId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return "text-green-600";
    if (score >= passingScore * 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: "A", color: "text-green-600" };
    if (score >= 80) return { grade: "B", color: "text-blue-600" };
    if (score >= 70) return { grade: "C", color: "text-yellow-600" };
    if (score >= 60) return { grade: "D", color: "text-orange-600" };
    return { grade: "F", color: "text-red-600" };
  };

  const handleBloomsLevelClick = (level: BloomsLevel) => {
    setFilteredBloomsLevel(filteredBloomsLevel === level ? null : level);
    setActiveTab("questions");
  };

  const handleLearningRecommendation = (rec: LearningRecommendation) => {
    // Navigate based on recommendation type
    if (rec.type === "remediate" || rec.type === "review") {
      router.push(
        `/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}`
      );
    } else {
      setActiveTab("questions");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render enhanced results if available
  if (enhancedResult) {
    return (
      <EnhancedResultsView
        result={enhancedResult}
        params={params}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filteredBloomsLevel={filteredBloomsLevel}
        onBloomsLevelClick={handleBloomsLevelClick}
        onLearningRecommendation={handleLearningRecommendation}
        formatTime={formatTime}
        getScoreColor={getScoreColor}
        getGrade={getGrade}
        router={router}
      />
    );
  }

  // Fallback to legacy view
  if (legacyResult) {
    return (
      <LegacyResultsView
        result={legacyResult}
        params={params}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        formatTime={(s: number) => formatTime(s)}
        getScoreColor={getScoreColor}
        getGrade={getGrade}
        router={router}
      />
    );
  }

  // No results found
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Results Not Found
        </h1>
        <p className="text-slate-600 mb-4">
          The exam results could not be loaded.
        </p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    </div>
  );
}

// Enhanced Results View Component
function EnhancedResultsView({
  result,
  params,
  activeTab,
  setActiveTab,
  filteredBloomsLevel,
  onBloomsLevelClick,
  onLearningRecommendation,
  formatTime,
  getScoreColor,
  getGrade,
  router,
}: {
  result: EnhancedExamResult;
  params: ExamResultsClientProps["params"];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filteredBloomsLevel: BloomsLevel | null;
  onBloomsLevelClick: (level: BloomsLevel) => void;
  onLearningRecommendation: (rec: LearningRecommendation) => void;
  formatTime: (s: number | null) => string;
  getScoreColor: (score: number, passing: number) => string;
  getGrade: (score: number) => { grade: string; color: string };
  router: ReturnType<typeof useRouter>;
}) {
  const gradeInfo = getGrade(result.scorePercentage);

  // Filter answers by Bloom&apos;s level if selected
  const filteredAnswers = filteredBloomsLevel
    ? result.answers.filter(
        (a) => a.question.bloomsLevel === filteredBloomsLevel
      )
    : result.answers;

  // Check if we have AI evaluations
  const hasAIEvaluations = result.answers.some((a) => a.aiEvaluation !== null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() =>
                  router.push(
                    `/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}`
                  )
                }
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Section
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Exam Results
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {result.examTitle}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {hasAIEvaluations && (
                <Badge
                  variant="outline"
                  className="gap-1 text-purple-600 border-purple-300"
                >
                  <Sparkles className="w-3 h-3" />
                  AI-Enhanced Feedback
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}`
                  )
                }
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retake Exam
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="relative overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 opacity-10",
                result.isPassed ? "bg-green-500" : "bg-red-500"
              )}
            />
            <CardContent className="relative p-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  {result.isPassed ? (
                    <Trophy className="w-16 h-16 text-green-600" />
                  ) : (
                    <Target className="w-16 h-16 text-red-600" />
                  )}
                </div>

                <h2 className="text-4xl font-bold mb-2">
                  <span
                    className={getScoreColor(
                      result.scorePercentage,
                      result.passingScore
                    )}
                  >
                    {result.scorePercentage.toFixed(1)}%
                  </span>
                  <span className={cn("text-6xl ml-4", gradeInfo.color)}>
                    {gradeInfo.grade}
                  </span>
                </h2>

                <p className="text-xl mb-4">
                  {result.isPassed ? (
                    <span className="text-green-600 font-semibold">
                      Congratulations! You passed!
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      You need {result.passingScore}% to pass
                    </span>
                  )}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {result.correctAnswers}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Correct Answers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {result.totalQuestions}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total Questions
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {result.totalPoints}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Points Earned
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatTime(result.timeSpent ? result.timeSpent * 60 : null)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Time Spent
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Results */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cognitive">Cognitive Analysis</TabsTrigger>
            <TabsTrigger value="questions">
              Question Review
              {filteredBloomsLevel && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Filtered
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="learning">Learning Path</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* SAM AI Learning Insights */}
            <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  SAM AI Learning Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RecommendationCard
                    recommendation={{
                      id: `exam-rec-${result.id}`,
                      type: result.isPassed ? "content" : "review",
                      title: result.isPassed
                        ? "Great job! Ready for the next challenge"
                        : "Focus areas identified",
                      description: result.isPassed
                        ? `You scored ${result.scorePercentage.toFixed(0)}%! Consider advancing to more challenging content.`
                        : `Review the ${result.totalQuestions - result.correctAnswers} incorrect answers and revisit related concepts.`,
                      priority: result.isPassed ? "medium" : "high",
                      reason: result.isPassed
                        ? "Knowledge reinforcement"
                        : "Struggle pattern detected",
                      estimatedMinutes: result.isPassed ? 15 : 30,
                      metadata: {
                        confidence: result.scorePercentage / 100,
                      },
                    }}
                    onAction={() => {
                      if (result.isPassed) {
                        router.push(
                          `/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}`
                        );
                      } else {
                        setActiveTab("questions");
                      }
                    }}
                    onDismiss={() => {}}
                    compact={true}
                  />

                  <div className="space-y-4">
                    <ConfidenceIndicator
                      confidence={result.scorePercentage / 100}
                      mode="meter"
                      size="lg"
                      showPercentage={true}
                      showExplanation={true}
                      explanation={`Mastery Level: ${result.scorePercentage.toFixed(0)}%`}
                      category="knowledge"
                    />
                    <LearningStyleIndicator mode="badge" />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-purple-200 dark:border-purple-800">
                  <LearningPathWidget
                    courseId={params.courseId}
                    compact={true}
                    showSkillProfile={false}
                    showDueForReview={!result.isPassed}
                    onStepClick={() => {
                      router.push(
                        `/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}`
                      );
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Performance Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Performance Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-sm font-semibold">
                        {result.scorePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={result.scorePercentage} className="h-3" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Accuracy</span>
                      <span className="text-sm font-semibold">
                        {(
                          (result.correctAnswers / result.totalQuestions) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (result.correctAnswers / result.totalQuestions) * 100
                      }
                      className="h-3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {result.correctAnswers}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Correct Answers
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {result.totalQuestions - result.correctAnswers}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Incorrect Answers
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {result.timeSpent
                      ? Math.round(
                          (result.timeSpent * 60) / result.totalQuestions
                        )
                      : 0}
                    s
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Avg. per Question
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cognitive" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bloom&apos;s Taxonomy Breakdown */}
              <BloomsTaxonomyBreakdown
                breakdown={result.bloomsBreakdown}
                onLevelClick={onBloomsLevelClick}
              />

              {/* Cognitive Profile */}
              <CognitiveProfileCard profile={result.cognitiveProfile} />
            </div>

            {/* Compact Learning Recommendations */}
            <LearningRecommendations
              recommendations={result.learningPath}
              onStartRecommendation={onLearningRecommendation}
              compact={true}
            />
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 mt-6">
            {filteredBloomsLevel && (
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="gap-1">
                  <Brain className="w-3 h-3" />
                  Filtered by: {filteredBloomsLevel}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBloomsLevelClick(filteredBloomsLevel)}
                >
                  Clear Filter
                </Button>
              </div>
            )}

            {filteredAnswers.map((answer, index) => (
              <motion.div
                key={answer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AIQuestionFeedback
                  answer={answer}
                  questionNumber={
                    filteredBloomsLevel
                      ? index + 1
                      : result.answers.findIndex((a) => a.id === answer.id) + 1
                  }
                  showCorrectAnswer={true}
                />
              </motion.div>
            ))}

            {filteredAnswers.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-slate-500">
                    No questions found for the selected filter.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="learning" className="space-y-6 mt-6">
            <LearningRecommendations
              recommendations={result.learningPath}
              onStartRecommendation={onLearningRecommendation}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Legacy Results View Component (fallback)
function LegacyResultsView({
  result,
  params,
  activeTab,
  setActiveTab,
  formatTime,
  getScoreColor,
  getGrade,
  router,
}: {
  result: LegacyExamResult;
  params: ExamResultsClientProps["params"];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  formatTime: (s: number) => string;
  getScoreColor: (score: number, passing: number) => string;
  getGrade: (score: number) => { grade: string; color: string };
  router: ReturnType<typeof useRouter>;
}) {
  const { attempt, summary } = result;
  const gradeInfo = getGrade(summary.scorePercentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() =>
                  router.push(
                    `/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}`
                  )
                }
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Section
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Exam Results
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {attempt.exam.title} - Attempt {attempt.attemptNumber}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}`
                  )
                }
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retake Exam
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="relative overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 opacity-10",
                summary.isPassed ? "bg-green-500" : "bg-red-500"
              )}
            />
            <CardContent className="relative p-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  {summary.isPassed ? (
                    <Trophy className="w-16 h-16 text-green-600" />
                  ) : (
                    <Target className="w-16 h-16 text-red-600" />
                  )}
                </div>

                <h2 className="text-4xl font-bold mb-2">
                  <span
                    className={getScoreColor(
                      summary.scorePercentage,
                      attempt.exam.passingScore
                    )}
                  >
                    {summary.scorePercentage.toFixed(1)}%
                  </span>
                  <span className={cn("text-6xl ml-4", gradeInfo.color)}>
                    {gradeInfo.grade}
                  </span>
                </h2>

                <p className="text-xl mb-4">
                  {summary.isPassed ? (
                    <span className="text-green-600 font-semibold">
                      Congratulations! You passed!
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      You need {attempt.exam.passingScore}% to pass
                    </span>
                  )}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {summary.correctAnswers}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Correct Answers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {summary.totalQuestions}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total Questions
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {summary.earnedPoints}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Points Earned
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatTime(summary.timeSpent)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Time Spent
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Results */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Question Review</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  SAM AI Learning Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RecommendationCard
                    recommendation={{
                      id: `exam-rec-${params.attemptId}`,
                      type: summary.isPassed ? "content" : "review",
                      title: summary.isPassed
                        ? "Great job! Ready for the next challenge"
                        : "Focus areas identified",
                      description: summary.isPassed
                        ? `You scored ${summary.scorePercentage.toFixed(0)}%! Consider advancing to more challenging content.`
                        : `Review the ${summary.totalQuestions - summary.correctAnswers} incorrect answers and revisit related concepts.`,
                      priority: summary.isPassed ? "medium" : "high",
                      reason: summary.isPassed
                        ? "Knowledge reinforcement"
                        : "Struggle pattern detected",
                      estimatedMinutes: summary.isPassed ? 15 : 30,
                      metadata: {
                        confidence: summary.scorePercentage / 100,
                      },
                    }}
                    onAction={() => {
                      if (summary.isPassed) {
                        router.push(
                          `/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}`
                        );
                      } else {
                        setActiveTab("questions");
                      }
                    }}
                    onDismiss={() => {}}
                    compact={true}
                  />

                  <div className="space-y-4">
                    <ConfidenceIndicator
                      confidence={summary.scorePercentage / 100}
                      mode="meter"
                      size="lg"
                      showPercentage={true}
                      showExplanation={true}
                      explanation={`Mastery Level: ${summary.scorePercentage.toFixed(0)}%`}
                      category="knowledge"
                    />
                    <LearningStyleIndicator mode="badge" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Performance Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-sm font-semibold">
                        {summary.scorePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={summary.scorePercentage} className="h-3" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Accuracy</span>
                      <span className="text-sm font-semibold">
                        {(
                          (summary.correctAnswers / summary.totalQuestions) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (summary.correctAnswers / summary.totalQuestions) * 100
                      }
                      className="h-3"
                    />
                  </div>

                  {attempt.exam.timeLimit && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                          Time Utilization
                        </span>
                        <span className="text-sm font-semibold">
                          {(
                            (summary.timeSpent / (attempt.exam.timeLimit * 60)) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          (summary.timeSpent / (attempt.exam.timeLimit * 60)) *
                          100
                        }
                        className="h-3"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {summary.correctAnswers}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Correct Answers
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {summary.totalQuestions - summary.correctAnswers}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Incorrect Answers
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(summary.timeSpent / summary.totalQuestions)}s
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Avg. per Question
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 mt-6">
            {attempt.answers?.map((answer, index) => (
              <motion.div
                key={answer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "border-l-4",
                    answer.isCorrect
                      ? "border-l-green-500"
                      : "border-l-red-500"
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Question {index + 1}</Badge>
                          <Badge
                            variant={
                              answer.isCorrect ? "default" : "destructive"
                            }
                          >
                            {answer.isCorrect ? "Correct" : "Incorrect"}
                          </Badge>
                          <Badge variant="secondary">
                            {answer.pointsEarned}/{answer.question.points} points
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {answer.question.question}
                        </h3>
                      </div>
                      {answer.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Your Answer:
                      </p>
                      <p
                        className={cn(
                          "text-sm p-2 rounded",
                          answer.isCorrect
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        )}
                      >
                        {typeof answer.answer === "boolean"
                          ? answer.answer
                            ? "True"
                            : "False"
                          : String(answer.answer) || "No answer provided"}
                      </p>
                    </div>

                    {!answer.isCorrect && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Correct Answer:
                        </p>
                        <p className="text-sm p-2 rounded bg-green-50 text-green-800 border border-green-200">
                          {typeof answer.question.correctAnswer === "boolean"
                            ? answer.question.correctAnswer
                              ? "True"
                              : "False"
                            : String(answer.question.correctAnswer)}
                        </p>
                      </div>
                    )}

                    {answer.question.explanation && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Explanation:
                        </p>
                        <p className="text-sm p-2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          {answer.question.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
