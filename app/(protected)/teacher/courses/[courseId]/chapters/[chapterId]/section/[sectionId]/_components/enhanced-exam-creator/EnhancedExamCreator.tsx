"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PenTool,
  Sparkles,
  BookOpen,
  Settings,
  Brain,
  CheckCircle2,
  TrendingUp,
  Target,
  Layers,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ManualQuestionCreator } from "./ManualQuestionCreator";
import { AIQuestionGenerator } from "./AIQuestionGenerator";
import { QuestionBankBrowser } from "./QuestionBankBrowser";
import { ExamSettingsPanel, ExamSettings } from "./ExamSettingsPanel";
import { QuestionPreviewList } from "./QuestionPreviewList";
import {
  GeneratedQuestion,
  EnhancedQuestionFormData,
  DEFAULT_BLOOMS_DISTRIBUTION,
  BloomsDistribution,
} from "./types";
import { BloomsLevel } from "@prisma/client";

interface EnhancedExamCreatorProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  sectionTitle: string;
  sectionContent?: string;
  learningObjectives?: string[];
  onExamCreate: (examData: ExamCreateData) => Promise<void>;
}

interface ExamCreateData {
  title: string;
  description: string;
  timeLimit?: number;
  passingScore: number;
  questions: GeneratedQuestion[];
  bloomsDistribution: BloomsDistribution;
}

export function EnhancedExamCreator({
  courseId,
  chapterId,
  sectionId,
  sectionTitle,
  sectionContent,
  learningObjectives = [],
  onExamCreate,
}: EnhancedExamCreatorProps) {
  const [activeTab, setActiveTab] = useState("manual");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [examSettings, setExamSettings] = useState<ExamSettings>({
    title: `${sectionTitle} Assessment`,
    description: "",
    timeLimit: 30,
    passingScore: 70,
    attempts: 3,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResults: true,
    showCorrectAnswers: true,
    showExplanations: true,
    allowReview: true,
    isPublished: false,
    scheduledStart: null,
    scheduledEnd: null,
    proctoring: false,
    randomizeFromPool: false,
    poolSize: null,
  });

  const handleAddQuestion = useCallback((formData: EnhancedQuestionFormData) => {
    const question: GeneratedQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...formData,
      generationMode: "AI_GUIDED",
      confidence: 1.0,
      needsReview: false,
    };
    setQuestions((prev) => [...prev, question]);
  }, []);

  const handleRemoveQuestion = useCallback((questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setSelectedQuestionIds((prev) => prev.filter((id) => id !== questionId));
  }, []);

  const handleToggleSelect = useCallback((questionId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  }, []);

  const handleAIGenerate = useCallback((generatedQuestions: GeneratedQuestion[]) => {
    setQuestions((prev) => [...prev, ...generatedQuestions]);
  }, []);

  const handleBankImport = useCallback((importedQuestions: GeneratedQuestion[]) => {
    setQuestions((prev) => [...prev, ...importedQuestions]);
  }, []);

  const handleCreateExam = useCallback(async () => {
    if (questions.length === 0) return;

    const bloomsDistribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    questions.forEach((q) => {
      bloomsDistribution[q.bloomsLevel]++;
    });

    // Convert counts to percentages
    const total = questions.length;
    Object.keys(bloomsDistribution).forEach((key) => {
      bloomsDistribution[key as BloomsLevel] =
        Math.round((bloomsDistribution[key as BloomsLevel] / total) * 100);
    });

    await onExamCreate({
      title: examSettings.title,
      description: examSettings.description,
      timeLimit: examSettings.timeLimit ?? undefined,
      passingScore: examSettings.passingScore,
      questions,
      bloomsDistribution,
    });
  }, [questions, examSettings, onExamCreate]);

  // Calculate stats for the header
  const stats = {
    totalQuestions: questions.length,
    totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
    estimatedTime: Math.ceil(questions.reduce((sum, q) => sum + q.estimatedTime, 0) / 60),
    bloomsCoverage: new Set(questions.map((q) => q.bloomsLevel)).size,
  };

  const tabItems = [
    {
      value: "manual",
      label: "Manual",
      icon: PenTool,
      description: "Create questions manually",
      color: "from-blue-500 to-cyan-500",
    },
    {
      value: "ai",
      label: "AI Generate",
      icon: Sparkles,
      description: "AI-powered generation",
      color: "from-purple-500 to-pink-500",
    },
    {
      value: "bank",
      label: "Question Bank",
      icon: BookOpen,
      description: "Import from bank",
      color: "from-amber-500 to-orange-500",
    },
    {
      value: "settings",
      label: "Settings",
      icon: Settings,
      description: "Exam configuration",
      color: "from-slate-500 to-gray-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    Bloom&apos;s Taxonomy Powered
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                  Enhanced Exam Creator
                </h1>
                <p className="text-white/80 text-sm sm:text-base max-w-xl">
                  Create comprehensive assessments with AI-powered question generation, cognitive
                  skill mapping, and Bloom&apos;s Taxonomy alignment.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalQuestions}</div>
                  <div className="text-xs text-white/70">Questions</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalPoints}</div>
                  <div className="text-xs text-white/70">Points</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stats.estimatedTime}</div>
                  <div className="text-xs text-white/70">Minutes</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stats.bloomsCoverage}/6</div>
                  <div className="text-xs text-white/70">Bloom&apos;s Levels</div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 60V30C240 0 480 0 720 15C960 30 1200 45 1440 30V60H0Z"
              className="fill-slate-50 dark:fill-slate-950"
            />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Panel - Question Creation */}
          <div className="xl:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Custom Tab List */}
              <TabsList className="grid grid-cols-4 bg-white dark:bg-slate-800 rounded-2xl p-1.5 shadow-lg border border-slate-200 dark:border-slate-700 mb-6 h-auto">
                {tabItems.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all",
                      "data-[state=active]:bg-gradient-to-br data-[state=active]:shadow-md",
                      tab.value === "manual" && "data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500",
                      tab.value === "ai" && "data-[state=active]:from-purple-500 data-[state=active]:to-pink-500",
                      tab.value === "bank" && "data-[state=active]:from-amber-500 data-[state=active]:to-orange-500",
                      tab.value === "settings" && "data-[state=active]:from-slate-600 data-[state=active]:to-gray-600",
                      "data-[state=active]:text-white",
                      "data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400",
                      "data-[state=inactive]:hover:bg-slate-100 dark:data-[state=inactive]:hover:bg-slate-700/50"
                    )}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Manual Creation Tab */}
              <TabsContent value="manual" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                            <PenTool className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-slate-800 dark:text-white">
                              Manual Question Creator
                            </CardTitle>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Create questions with Bloom&apos;s Taxonomy guidance
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white dark:bg-slate-800">
                          <Brain className="h-3 w-3 mr-1" />
                          Guided Mode
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ManualQuestionCreator
                        onAddQuestion={handleAddQuestion}
                        learningObjectives={learningObjectives.map((obj, i) => ({
                          id: `lo-${i}`,
                          objective: obj,
                          bloomsLevel: "UNDERSTAND" as BloomsLevel,
                        }))}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* AI Generation Tab */}
              <TabsContent value="ai" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-slate-800 dark:text-white">
                              AI Question Generator
                            </CardTitle>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Generate questions with SAM AI
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                          <Zap className="h-3 w-3 mr-1" />
                          AI Powered
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <AIQuestionGenerator
                        sectionContent={sectionContent || ""}
                        learningObjectives={learningObjectives}
                        onQuestionsGenerated={handleAIGenerate}
                        isGenerating={isGenerating}
                        setIsGenerating={setIsGenerating}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Question Bank Tab */}
              <TabsContent value="bank" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-slate-800 dark:text-white">
                              Question Bank
                            </CardTitle>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Browse and import existing questions
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white dark:bg-slate-800">
                          <Layers className="h-3 w-3 mr-1" />
                          Repository
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <QuestionBankBrowser
                        courseId={courseId}
                        sectionId={sectionId}
                        onImportQuestions={handleBankImport}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-slate-600 to-gray-600 rounded-xl">
                            <Settings className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-slate-800 dark:text-white">
                              Exam Settings
                            </CardTitle>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Configure exam parameters
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ExamSettingsPanel
                        settings={examSettings}
                        onSettingsChange={setExamSettings}
                        totalQuestions={questions.length}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Question Preview */}
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-indigo-500" />
                      <CardTitle className="text-lg">Questions Preview</CardTitle>
                    </div>
                    <Badge
                      variant={questions.length > 0 ? "default" : "secondary"}
                      className={cn(
                        questions.length > 0
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : ""
                      )}
                    >
                      {questions.length} Added
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <QuestionPreviewList
                    questions={questions}
                    selectedIds={selectedQuestionIds}
                    onToggleSelect={handleToggleSelect}
                    onRemove={handleRemoveQuestion}
                    onReorder={(reorderedQuestions) => setQuestions(reorderedQuestions)}
                  />

                  {questions.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <Button
                        onClick={handleCreateExam}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                        size="lg"
                      >
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Create Exam ({questions.length} Questions)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bloom's Distribution Overview */}
              {questions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="mt-4 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <CardTitle className="text-sm">Bloom&apos;s Distribution</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <BloomsDistributionChart questions={questions} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bloom's Distribution Chart Component
function BloomsDistributionChart({ questions }: { questions: GeneratedQuestion[] }) {
  const distribution = {
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

  const levels = [
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
        const count = distribution[level.key as keyof typeof distribution];
        const percentage = (count / maxCount) * 100;
        return (
          <div key={level.key} className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-20 truncate">{level.label}</span>
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
