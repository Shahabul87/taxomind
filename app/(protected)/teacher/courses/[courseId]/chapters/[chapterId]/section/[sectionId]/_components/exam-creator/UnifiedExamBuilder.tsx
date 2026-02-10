"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PenTool,
  Sparkles,
  Settings,
  Save,
  ClipboardCheck,
  Loader2,
  PlusCircle,
  FileQuestion,
  Target,
  TrendingUp,
  Eye,
  EyeOff,
  BookOpen,
  ChevronLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BloomsLevel } from "@prisma/client";
import type { EnhancedQuestionFormData, GeneratedQuestion } from "../enhanced-exam-creator/types";
import { ManualQuestionCreator } from "../enhanced-exam-creator/ManualQuestionCreator";
import { AIQuestionGenerator } from "../enhanced-exam-creator/AIQuestionGenerator";
import { QuestionBankBrowser } from "../enhanced-exam-creator/QuestionBankBrowser";
import { ExamSettingsPanel } from "../enhanced-exam-creator/ExamSettingsPanel";
import type { ExamSettings } from "../enhanced-exam-creator/ExamSettingsPanel";
import { ExamList } from "./ExamList";
import { useUnifiedExamBuilder } from "./useUnifiedExamBuilder";
import { ExamEvaluationReport } from "./ExamEvaluationReport";
import { UnifiedQuestionPreviewList } from "./UnifiedQuestionPreviewList";
import type {
  UnifiedExamBuilderProps,
  SectionContext,
} from "./types";

// ============================================================================
// BLOOM'S DISTRIBUTION CHART (inline for sidebar)
// ============================================================================

function BloomsDistributionChart({
  questions,
}: {
  questions: Array<{ bloomsLevel: BloomsLevel }>;
}) {
  const distribution: Record<BloomsLevel, number> = {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };
  questions.forEach((q) => {
    distribution[q.bloomsLevel]++;
  });

  const levels: Array<{ key: BloomsLevel; label: string; color: string }> = [
    { key: "REMEMBER", label: "Remember", color: "bg-red-500" },
    { key: "UNDERSTAND", label: "Understand", color: "bg-orange-500" },
    { key: "APPLY", label: "Apply", color: "bg-yellow-500" },
    { key: "ANALYZE", label: "Analyze", color: "bg-green-500" },
    { key: "EVALUATE", label: "Evaluate", color: "bg-blue-500" },
    { key: "CREATE", label: "Create", color: "bg-purple-500" },
  ];

  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-2">
      {levels.map((level) => {
        const count = distribution[level.key];
        const percentage = (count / maxCount) * 100;
        return (
          <div key={level.key} className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-20 truncate">
              {level.label}
            </span>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn("h-full rounded-full", level.color)}
              />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-6 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnifiedExamBuilder({
  courseId,
  chapterId,
  sectionId,
  initialData,
  sectionContent,
  learningObjectives = [],
}: UnifiedExamBuilderProps) {
  const sectionContext: SectionContext = useMemo(
    () => ({
      courseId,
      chapterId,
      sectionId,
      courseTitle: initialData?.course?.title ?? "",
      chapterTitle: initialData?.chapter?.title ?? "",
      sectionTitle: initialData?.section?.title ?? "",
      sectionContent,
      learningObjectives,
    }),
    [courseId, chapterId, sectionId, initialData, sectionContent, learningObjectives]
  );

  const builder = useUnifiedExamBuilder(sectionContext);
  const { state } = builder;

  const [activeTab, setActiveTab] = useState<string>("manual");
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const q = state.questions;
    return {
      totalQuestions: q.length,
      totalPoints: q.reduce((sum, question) => sum + question.points, 0),
      estimatedTime: Math.ceil(
        q.reduce((sum, question) => sum + question.estimatedTime, 0) / 60
      ),
      bloomsCoverage: new Set(q.map((question) => question.bloomsLevel)).size,
    };
  }, [state.questions]);

  // ── Settings bridge ────────────────────────────────────────────────────
  const settingsFromMetadata: ExamSettings = useMemo(
    () => ({
      title: state.examMetadata.title,
      description: state.examMetadata.description,
      timeLimit: state.examMetadata.timeLimit,
      passingScore: state.examMetadata.passingScore,
      attempts: state.examMetadata.attempts,
      shuffleQuestions: state.examMetadata.shuffleQuestions,
      shuffleOptions: state.examMetadata.shuffleOptions,
      showResults: state.examMetadata.showResults,
      showCorrectAnswers: state.examMetadata.showCorrectAnswers,
      showExplanations: state.examMetadata.showExplanations,
      allowReview: state.examMetadata.allowReview,
      isPublished: state.examMetadata.isPublished,
      scheduledStart: null,
      scheduledEnd: null,
      proctoring: state.examMetadata.proctoring,
      randomizeFromPool: state.examMetadata.randomizeFromPool,
      poolSize: state.examMetadata.poolSize,
    }),
    [state.examMetadata]
  );

  const handleSettingsChange = useCallback(
    (settings: ExamSettings) => {
      builder.updateExamMetadata({
        title: settings.title,
        description: settings.description,
        timeLimit: settings.timeLimit,
        passingScore: settings.passingScore,
        attempts: settings.attempts,
        shuffleQuestions: settings.shuffleQuestions,
        shuffleOptions: settings.shuffleOptions,
        showResults: settings.showResults,
        showCorrectAnswers: settings.showCorrectAnswers,
        showExplanations: settings.showExplanations,
        allowReview: settings.allowReview,
        isPublished: settings.isPublished,
        proctoring: settings.proctoring,
        randomizeFromPool: settings.randomizeFromPool,
        poolSize: settings.poolSize,
      });
    },
    [builder]
  );

  // ── Manual question handler ────────────────────────────────────────────
  const handleAddManualQuestion = useCallback(
    (formData: EnhancedQuestionFormData) => {
      builder.addManualQuestion(formData);
    },
    [builder]
  );

  // ── AI generation handler ──────────────────────────────────────────────
  const handleAIGenerate = useCallback(
    (generatedQuestions: GeneratedQuestion[]) => {
      builder.addGeneratedQuestions(generatedQuestions);
    },
    [builder]
  );

  // ── Bank import handler ────────────────────────────────────────────────
  const handleBankImport = useCallback(
    (importedQuestions: GeneratedQuestion[]) => {
      builder.addGeneratedQuestions(importedQuestions);
    },
    [builder]
  );

  // ── Tab definitions ────────────────────────────────────────────────────
  const tabItems = [
    {
      value: "manual",
      label: "Manual",
      icon: PenTool,
      color: "from-blue-500 to-cyan-500",
    },
    {
      value: "ai",
      label: "AI Generate",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
    },
    {
      value: "bank",
      label: "Question Bank",
      icon: BookOpen,
      color: "from-amber-500 to-orange-500",
    },
    {
      value: "settings",
      label: "Settings",
      icon: Settings,
      color: "from-slate-500 to-gray-500",
    },
  ];

  // ── Not creating yet → show existing exams + create button ─────────────
  if (!state.isCreating) {
    return (
      <div className="w-full space-y-4 sm:space-y-6">
        {/* Existing Exams */}
        {!state.isLoadingExams && (
          <ExamList
            exams={state.existingExams}
            publishingExamId={state.publishingExamId}
            onPreview={builder.previewExam}
            onEdit={builder.editExam}
            onDelete={builder.deleteExam}
            onPublishToggle={builder.togglePublish}
          />
        )}

        {/* Create New Exam CTA */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-gray-50 dark:bg-gray-900/30 rounded-lg sm:rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <FileQuestion className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            Create an Exam
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center mb-4 sm:mb-6 max-w-md px-2">
            Build exams with Manual or AI-powered question creation, with Bloom&apos;s
            Taxonomy alignment and AI evaluation reports.
          </p>
          <Button
            onClick={() => builder.setCreating(true)}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-10 sm:h-11 px-4 sm:px-6 text-xs sm:text-sm"
          >
            <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Create New Exam
          </Button>
        </div>
      </div>
    );
  }

  // ── Builder UI ─────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => builder.setCreating(false)}
          className="text-slate-600 dark:text-slate-400"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          {/* Stats badges */}
          <Badge variant="outline" className="gap-1">
            <Target className="h-3 w-3" />
            {stats.totalQuestions} Questions
          </Badge>
          <Badge variant="outline" className="gap-1">
            {stats.totalPoints} pts
          </Badge>
          <Badge variant="outline" className="gap-1">
            {stats.bloomsCoverage}/6 Bloom&apos;s
          </Badge>
        </div>
      </div>

      {/* Main layout: tabs left, preview right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: Question Creation Tabs */}
        <div className="xl:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-md border border-slate-200 dark:border-slate-700 mb-4 h-auto">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-all text-xs",
                    "data-[state=active]:bg-gradient-to-br data-[state=active]:shadow-md",
                    tab.value === "manual" &&
                      "data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500",
                    tab.value === "ai" &&
                      "data-[state=active]:from-purple-500 data-[state=active]:to-pink-500",
                    tab.value === "bank" &&
                      "data-[state=active]:from-amber-500 data-[state=active]:to-orange-500",
                    tab.value === "settings" &&
                      "data-[state=active]:from-slate-600 data-[state=active]:to-gray-600",
                    "data-[state=active]:text-white",
                    "data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Manual Tab */}
            <TabsContent value="manual" className="mt-0">
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-t-xl pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <PenTool className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-800 dark:text-white">
                        Manual Question Creator
                      </CardTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Create questions with Bloom&apos;s Taxonomy guidance
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <ManualQuestionCreator
                    onAddQuestion={handleAddManualQuestion}
                    learningObjectives={learningObjectives.map((obj, i) => ({
                      id: `lo-${i}`,
                      objective: obj,
                      bloomsLevel: "UNDERSTAND" as BloomsLevel,
                    }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Tab */}
            <TabsContent value="ai" className="mt-0">
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-t-xl pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-800 dark:text-white">
                        AI Question Generator
                      </CardTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Generate questions with SAM AI
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <AIQuestionGenerator
                    sectionContent={sectionContent ?? ""}
                    learningObjectives={learningObjectives}
                    onQuestionsGenerated={handleAIGenerate}
                    isGenerating={isGenerating}
                    setIsGenerating={setIsGenerating}
                    sectionContext={sectionContext}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bank Tab */}
            <TabsContent value="bank" className="mt-0">
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-t-xl pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-800 dark:text-white">
                        Question Bank
                      </CardTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Browse and import existing questions
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <QuestionBankBrowser
                    courseId={courseId}
                    sectionId={sectionId}
                    onImportQuestions={handleBankImport}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-0">
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-t-xl pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gradient-to-br from-slate-600 to-gray-600 rounded-lg">
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-800 dark:text-white">
                        Exam Settings
                      </CardTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Configure exam parameters
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <ExamSettingsPanel
                    settings={settingsFromMetadata}
                    onSettingsChange={handleSettingsChange}
                    totalQuestions={state.questions.length}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Question Preview + Bloom's Chart */}
        <div className="xl:col-span-1">
          <div className="sticky top-4 space-y-4">
            {/* Question Preview */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-indigo-500" />
                    <CardTitle className="text-base">Questions</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {state.questions.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={
                          Object.values(state.answerVisibility).every(
                            (v) => v === "revealed"
                          )
                            ? builder.hideAllAnswers
                            : builder.revealAllAnswers
                        }
                        className="h-7 px-2 text-xs"
                      >
                        {Object.values(state.answerVisibility).every(
                          (v) => v === "revealed"
                        ) ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide All
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Reveal All
                          </>
                        )}
                      </Button>
                    )}
                    <Badge
                      variant={state.questions.length > 0 ? "default" : "secondary"}
                      className={cn(
                        state.questions.length > 0 &&
                          "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      )}
                    >
                      {state.questions.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <UnifiedQuestionPreviewList
                  questions={state.questions}
                  answerVisibility={state.answerVisibility}
                  onRemove={builder.deleteQuestion}
                  onRevealAnswer={builder.revealAnswer}
                  onHideAnswer={builder.hideAnswer}
                  onReorder={builder.setQuestions}
                />
              </CardContent>
            </Card>

            {/* Bloom's Distribution */}
            {state.questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <CardTitle className="text-sm">
                        Bloom&apos;s Distribution
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <BloomsDistributionChart questions={state.questions} />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* AI Evaluation Report */}
            {state.evaluationReport && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ExamEvaluationReport
                  report={state.evaluationReport}
                  questions={state.questions}
                  onApplySuggestion={builder.applySuggestion}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {state.questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 z-10"
        >
          <Card className="border-0 shadow-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">
                    {state.questions.length} question
                    {state.questions.length !== 1 ? "s" : ""} &middot;{" "}
                    {stats.totalPoints} pts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Evaluate Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={builder.evaluateExam}
                    disabled={state.isEvaluating || state.questions.length === 0}
                    className="gap-1.5"
                  >
                    {state.isEvaluating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ClipboardCheck className="h-3.5 w-3.5" />
                    )}
                    {state.isEvaluating ? "Evaluating..." : "AI Evaluate"}
                  </Button>

                  {/* Save Button */}
                  <Button
                    onClick={builder.saveExam}
                    disabled={
                      state.isSaving ||
                      state.questions.length === 0 ||
                      !state.examMetadata.title.trim()
                    }
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg gap-1.5"
                    size="sm"
                  >
                    {state.isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {state.isSaving ? "Saving..." : "Save Exam"}
                  </Button>
                </div>
              </div>
              {!state.examMetadata.title.trim() && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Go to Settings tab to set an exam title before saving
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
