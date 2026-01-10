"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileQuestion,
  Brain,
  Eye,
  Target,
  Lightbulb,
  Sparkles,
  ShieldCheck,
  Gauge,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIExamAssistant } from "../ai-exam-assistant";
import { EnhancedAIExamAssistant } from "../enhanced-ai-exam-assistant";
import { BloomsTaxonomyGuide } from "../blooms-taxonomy-guide";
import { SimpleQuestionValidation } from "./SimpleQuestionValidation";
import { CognitiveAnalyticsDashboard } from "../cognitive-analytics-dashboard";
import { SAMQualityIndicator } from "./SAMQualityIndicator";
import { ExamAnalyticsPanel } from "./ExamAnalyticsPanel";
import { Question, CourseContext, ValidationResult } from "./types";
import { BloomsLevel } from "@prisma/client";

interface BloomsTaxonomyTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  questions: Question[];
  courseContext: CourseContext;
  onAIGenerate: (questions: Question[]) => void;
  onValidationChange: (questionId: string, result: ValidationResult) => void;
  onBloomsLevelSelect: (level: string) => void;
  selectedBloomsLevel: string | null;
  children: React.ReactNode;
}

// Calculate Bloom's distribution from questions
function calculateBloomsDistribution(questions: Question[]): Record<string, number> {
  const distribution: Record<string, number> = {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };

  for (const q of questions) {
    const level = q.bloomsLevel?.toUpperCase();
    if (level && level in distribution) {
      distribution[level]++;
    }
  }

  return distribution;
}

// Calculate difficulty distribution
function calculateDifficultyDistribution(questions: Question[]): Record<string, number> {
  const distribution: Record<string, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  for (const q of questions) {
    const difficulty = q.difficulty?.toLowerCase() || "medium";
    if (difficulty in distribution) {
      distribution[difficulty]++;
    }
  }

  return distribution;
}

export function BloomsTaxonomyTabs({
  activeTab,
  onTabChange,
  questions,
  courseContext,
  onAIGenerate,
  onValidationChange,
  onBloomsLevelSelect,
  selectedBloomsLevel,
  children,
}: BloomsTaxonomyTabsProps) {
  const [samValidation, setSamValidation] = useState<Record<string, unknown> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const bloomsDistribution = calculateBloomsDistribution(questions);
  const difficultyDistribution = calculateDifficultyDistribution(questions);

  // Calculate quick stats
  const totalQuestions = questions.length;
  const estimatedTime = questions.reduce((acc, q) => acc + (q.timeEstimate || 2), 0);
  const avgCognitiveLoad =
    questions.length > 0
      ? questions.reduce((acc, q) => acc + (q.cognitiveLoad || 2), 0) / questions.length
      : 0;

  // Handler for AI generation with SAM validation tracking
  const handleAIGenerate = useCallback(
    (generatedQuestions: Question[], validation?: Record<string, unknown>) => {
      if (validation) {
        setSamValidation(validation);
      }
      onAIGenerate(generatedQuestions);
    },
    [onAIGenerate]
  );

  return (
    <div className="animate-fadeIn">
      {/* Enterprise Header with SAM Integration */}
      <div className="relative overflow-hidden rounded-xl mb-6">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 opacity-90" />
        <div className="absolute inset-0 bg-[url('/patterns/circuit.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left: Title and description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Bloom&apos;s Taxonomy AI Exam Creator
                </h3>
              </div>
              <p className="text-white/80 text-sm sm:text-base max-w-xl">
                Create sophisticated assessments with AI-powered cognitive analysis and SAM
                validation
              </p>
            </div>

            {/* Right: Badges and quick stats */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs">
                <ShieldCheck className="h-3 w-3 mr-1" />
                SAM Validated
              </Badge>
              <Badge className="bg-emerald-500/90 text-white text-xs">
                <Gauge className="h-3 w-3 mr-1" />
                Quality Gates
              </Badge>
              <Badge className="bg-amber-500/90 text-white text-xs">
                <Zap className="h-3 w-3 mr-1" />
                AI Enhanced
              </Badge>
            </div>
          </div>

          {/* Quick Stats Bar */}
          {totalQuestions > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded">
                    <FileQuestion className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Questions</p>
                    <p className="text-white font-semibold">{totalQuestions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Est. Time</p>
                    <p className="text-white font-semibold">{estimatedTime} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Cognitive Load</p>
                    <p className="text-white font-semibold">{avgCognitiveLoad.toFixed(1)}/5</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded">
                    {samValidation ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">SAM Status</p>
                    <p className="text-white font-semibold">
                      {samValidation ? "Validated" : "Pending"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 mb-6 gap-1">
          {[
            { value: "creation", icon: FileQuestion, label: "Exam Creation", short: "Create" },
            { value: "guide", icon: Brain, label: "Bloom's Guide", short: "Guide" },
            { value: "validation", icon: Eye, label: "Validation", short: "Validate" },
            { value: "analytics", icon: Target, label: "Analytics", short: "Stats" },
            { value: "pathway", icon: Lightbulb, label: "Learning Paths", short: "Paths" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "relative group",
                "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700",
                "data-[state=active]:shadow-sm",
                "font-medium transition-all duration-200",
                "text-xs sm:text-sm h-10 sm:h-11",
                "flex items-center justify-center gap-1.5"
              )}
            >
              <tab.icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.short}</span>
              {/* Active indicator dot */}
              <span
                className={cn(
                  "absolute -bottom-1 left-1/2 -translate-x-1/2",
                  "w-1 h-1 rounded-full bg-violet-500",
                  "opacity-0 data-[state=active]:opacity-100",
                  "transition-opacity"
                )}
              />
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Exam Creation Tab */}
        <TabsContent value="creation" className="space-y-6 animate-fadeIn">
          {/* SAM Quality Indicator - Show when validation is available */}
          {samValidation && (
            <SAMQualityIndicator validation={samValidation as Record<string, unknown>} variant="compact" />
          )}

          {/* AI Question Generators */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                AI Question Generation
              </h4>
              {isGenerating && (
                <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                  <div className="h-2 w-2 bg-violet-500 rounded-full animate-pulse" />
                  Generating...
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pro AI Generator with SAM */}
              <div
                className={cn(
                  "relative overflow-hidden",
                  "bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50",
                  "dark:from-violet-950/40 dark:via-purple-950/40 dark:to-indigo-950/40",
                  "p-4 rounded-xl",
                  "border-2 border-violet-200 dark:border-violet-700",
                  "shadow-sm hover:shadow-md transition-shadow"
                )}
              >
                {/* Pro badge */}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    SAM Pro
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2.5 w-2.5 bg-violet-500 rounded-full animate-pulse" />
                  <h5 className="font-semibold text-sm text-violet-800 dark:text-violet-200">
                    Pro AI Generator
                  </h5>
                </div>
                <p className="text-xs text-violet-600 dark:text-violet-400 mb-3">
                  Advanced generation with quality gates, safety validation, and pedagogical
                  analysis
                </p>
                <EnhancedAIExamAssistant
                  sectionTitle={courseContext.sectionTitle}
                  chapterTitle={courseContext.chapterTitle}
                  courseTitle={courseContext.courseTitle}
                  learningObjectives={[]}
                  onGenerate={(generatedQuestions) => {
                    handleAIGenerate(generatedQuestions);
                  }}
                  disabled={!courseContext.sectionTitle}
                />
              </div>

              {/* Basic AI Generator */}
              <div
                className={cn(
                  "relative overflow-hidden",
                  "bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50",
                  "dark:from-blue-950/40 dark:via-cyan-950/40 dark:to-teal-950/40",
                  "p-4 rounded-xl",
                  "border border-blue-200 dark:border-blue-700",
                  "shadow-sm hover:shadow-md transition-shadow"
                )}
              >
                <div className="absolute top-3 right-3">
                  <Badge
                    variant="outline"
                    className="text-xs border-blue-300 text-blue-600 dark:border-blue-600 dark:text-blue-300"
                  >
                    Quick Start
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2.5 w-2.5 bg-blue-500 rounded-full" />
                  <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-200">
                    Basic AI Generator
                  </h5>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                  Quick question generation for simple assessments
                </p>
                <AIExamAssistant
                  sectionTitle={courseContext.sectionTitle}
                  onGenerate={onAIGenerate}
                  disabled={!courseContext.sectionTitle}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!courseContext.sectionTitle}
                      className="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 h-10"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Questions
                    </Button>
                  }
                />
              </div>
            </div>
          </div>

          {/* Real-time Validation Section */}
          {questions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-emerald-500" />
                Real-time Validation
                <Badge variant="outline" className="ml-2 text-xs">
                  {questions.length} questions
                </Badge>
              </h4>
              <div
                className={cn(
                  "bg-gradient-to-br from-emerald-50 to-teal-50",
                  "dark:from-emerald-950/30 dark:to-teal-950/30",
                  "p-4 rounded-xl border border-emerald-200 dark:border-emerald-800"
                )}
              >
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {questions.slice(0, 3).map((question) => (
                    <div
                      key={question.id}
                      className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800 shadow-sm"
                    >
                      <SimpleQuestionValidation
                        question={{
                          question: question.question,
                          bloomsLevel: question.bloomsLevel,
                          questionType: question.type,
                          difficulty: question.difficulty,
                          points: question.points,
                        }}
                        isVisible={true}
                        onValidationChange={(result) => onValidationChange(question.id, result)}
                      />
                    </div>
                  ))}
                  {questions.length > 3 && (
                    <div className="text-center py-2">
                      <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
                        +{questions.length - 3} more questions
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Exam Details Form */}
          <div
            className={cn(
              "bg-gradient-to-br from-slate-50 to-gray-50",
              "dark:from-slate-900/50 dark:to-gray-900/50",
              "p-4 sm:p-6 rounded-xl",
              "border border-slate-200 dark:border-slate-700"
            )}
          >
            <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
              <FileQuestion className="h-5 w-5 text-slate-500" />
              Exam Details
            </h4>
            {children}
          </div>
        </TabsContent>

        {/* Bloom's Taxonomy Guide Tab */}
        <TabsContent value="guide" className="space-y-6 animate-fadeIn">
          <div
            className={cn(
              "group relative overflow-hidden",
              "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
              "dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50",
              "border border-blue-200/60 dark:border-blue-700/60",
              "rounded-xl shadow-sm hover:shadow-md",
              "transition-all duration-300",
              "p-4 sm:p-6"
            )}
          >
            <BloomsTaxonomyGuide
              onLevelSelect={onBloomsLevelSelect}
              selectedLevel={selectedBloomsLevel as BloomsLevel | undefined}
              showQuestionExamples={true}
              isInteractive={true}
            />
          </div>
        </TabsContent>

        {/* Question Validation Tab */}
        <TabsContent value="validation" className="space-y-6 animate-fadeIn">
          {/* SAM Quality Indicator */}
          {samValidation && <SAMQualityIndicator validation={samValidation as Record<string, unknown>} variant="full" />}

          <div
            className={cn(
              "group relative overflow-hidden",
              "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
              "dark:from-emerald-950/50 dark:via-teal-950/50 dark:to-cyan-950/50",
              "border border-emerald-200/60 dark:border-emerald-700/60",
              "rounded-xl shadow-sm hover:shadow-md",
              "transition-all duration-300",
              "p-4 sm:p-6"
            )}
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-1 w-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Question Quality Validation
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm ml-11">
                Analyze the quality and cognitive alignment of your exam questions
              </p>
            </div>

            {questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question) => (
                  <SimpleQuestionValidation
                    key={question.id}
                    question={{
                      question: question.question,
                      bloomsLevel: question.bloomsLevel,
                      questionType: question.type,
                      difficulty: question.difficulty,
                      points: question.points,
                    }}
                    isVisible={true}
                    onValidationChange={(result) => onValidationChange(question.id, result)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                  No Questions to Validate
                </h4>
                <p className="text-sm text-gray-500">
                  Create or generate questions in the Exam Creation tab
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 animate-fadeIn">
          {/* Exam Analytics Panel */}
          {questions.length > 0 && (
            <ExamAnalyticsPanel
              bloomsDistribution={bloomsDistribution}
              difficultyDistribution={difficultyDistribution}
              questionCount={totalQuestions}
              estimatedTime={estimatedTime}
              avgCognitiveLoad={avgCognitiveLoad}
              samValidation={samValidation}
            />
          )}

          <div
            className={cn(
              "group relative overflow-hidden",
              "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
              "dark:from-orange-950/50 dark:via-amber-950/50 dark:to-yellow-950/50",
              "border border-orange-200/60 dark:border-orange-700/60",
              "rounded-xl shadow-sm hover:shadow-md",
              "transition-all duration-300",
              "p-4 sm:p-6"
            )}
          >
            <CognitiveAnalyticsDashboard
              courseId={courseContext.courseId}
              chapterId={courseContext.chapterId}
              sectionId={courseContext.sectionId}
            />
          </div>
        </TabsContent>

        {/* Learning Pathway Tab */}
        <TabsContent value="pathway" className="space-y-6 animate-fadeIn">
          <div
            className={cn(
              "group relative overflow-hidden",
              "bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50",
              "dark:from-rose-950/50 dark:via-pink-950/50 dark:to-purple-950/50",
              "border border-rose-200/60 dark:border-rose-700/60",
              "rounded-xl shadow-sm hover:shadow-md",
              "transition-all duration-300",
              "p-4 sm:p-6"
            )}
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-1 w-8 bg-gradient-to-r from-violet-500 to-pink-600 rounded-full" />
                <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-violet-700 via-purple-700 to-pink-700 dark:from-violet-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                  Cognitive Learning Pathways
                </h3>
              </div>
              <p className="text-violet-600 dark:text-violet-400 text-sm ml-11">
                Visualize cognitive progression and learning dependencies
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
              {questions.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analyzing {questions.length} questions for cognitive pathways...
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"].map(
                      (level) => {
                        const levelKey = level.toUpperCase();
                        const count = bloomsDistribution[levelKey] || 0;
                        const percentage = totalQuestions > 0 ? (count / totalQuestions) * 100 : 0;
                        return (
                          <div
                            key={level}
                            className={cn(
                              "p-3 rounded-lg text-center",
                              "bg-gradient-to-br from-violet-100 to-purple-100",
                              "dark:from-violet-900/30 dark:to-purple-900/30",
                              "border border-violet-200/50 dark:border-violet-700/50"
                            )}
                          >
                            <h4 className="font-medium text-violet-700 dark:text-violet-300 text-xs sm:text-sm">
                              {level}
                            </h4>
                            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 my-1">
                              {count}
                            </p>
                            <Progress value={percentage} className="h-1.5 bg-violet-200 dark:bg-violet-800" />
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-violet-400 mx-auto mb-4" />
                  <h4 className="text-base sm:text-lg font-medium text-violet-700 dark:text-violet-300 mb-2">
                    No Questions Available
                  </h4>
                  <p className="text-sm text-violet-600 dark:text-violet-400">
                    Create questions to visualize cognitive learning pathways
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
