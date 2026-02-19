"use client";

/**
 * ExamBuilder
 *
 * Enterprise-level AI-powered exam builder with Bloom's Taxonomy alignment,
 * question bank integration, and real-time preview.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Settings2,
  Library,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Clock,
  Hash,
  BarChart3,
  Layers,
  ChevronRight,
  Info,
  Zap,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { useExamEngine, useQuestionBank } from "@sam-ai/react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BloomsDistributionPicker, type BloomsDistribution } from "./BloomsDistributionPicker";
import { QuestionBankBrowser, type BankQuestion } from "./QuestionBankBrowser";
import { ExamPreview, type ExamData, type PreviewQuestion } from "./ExamPreview";

// Question types available
const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice", icon: Layers },
  { value: "TRUE_FALSE", label: "True/False", icon: CheckCircle2 },
  { value: "SHORT_ANSWER", label: "Short Answer", icon: FileText },
  { value: "ESSAY", label: "Essay", icon: BookOpen },
] as const;

type QuestionTypeValue = (typeof QUESTION_TYPES)[number]["value"];

export interface ExamBuilderProps {
  courseId: string;
  sectionIds?: string[];
  onExamCreated?: (examId: string) => void;
  onClose?: () => void;
  className?: string;
}

type BuildMode = "ai-generate" | "question-bank" | "mixed";
type ActiveTab = "config" | "questions" | "preview";

export function ExamBuilder({
  courseId,
  sectionIds,
  onExamCreated,
  onClose,
  className,
}: ExamBuilderProps) {
  const user = useCurrentUser();

  // Mode and navigation
  const [buildMode, setBuildMode] = useState<BuildMode>("ai-generate");
  const [activeTab, setActiveTab] = useState<ActiveTab>("config");

  // Configuration state
  const [examTitle, setExamTitle] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [timeLimit, setTimeLimit] = useState(60);
  const [adaptiveMode, setAdaptiveMode] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<QuestionTypeValue[]>(["MULTIPLE_CHOICE", "SHORT_ANSWER"]);
  const [bloomsDistribution, setBloomsDistribution] = useState<BloomsDistribution>({
    REMEMBER: 15,
    UNDERSTAND: 20,
    APPLY: 25,
    ANALYZE: 20,
    EVALUATE: 15,
    CREATE: 5,
  });

  // Question bank selection
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Generated exam
  const [generatedExam, setGeneratedExam] = useState<ExamData | null>(null);

  // Hooks
  const {
    isGenerating,
    error: generateError,
    generateExam,
    getDefaultBloomsDistribution,
    reset: resetExamEngine,
  } = useExamEngine({
    courseId,
    sectionIds,
    includeStudentProfile: adaptiveMode,
    onExamGenerated: (exam) => {
      setGeneratedExam({
        examId: exam.examId,
        title: examTitle || "Generated Exam",
        questions: exam.questions as PreviewQuestion[],
        totalQuestions: exam.totalQuestions,
        totalPoints: exam.totalPoints,
        estimatedDuration: exam.estimatedDuration,
        bloomsAnalysis: exam.bloomsAnalysis,
        metadata: exam.metadata,
      });
      setActiveTab("preview");
    },
    onError: (err) => {
      console.error("Exam generation error:", err);
    },
  });

  const {
    questions: bankQuestions,
    stats: bankStats,
    isLoading: isLoadingBank,
    getQuestions,
    loadMore,
    pagination,
  } = useQuestionBank({
    courseId,
    pageSize: 50,
  });

  // Load question bank on mount
  useEffect(() => {
    getQuestions();
  }, [getQuestions]);

  // Handle AI generation
  const handleGenerate = useCallback(async () => {
    const result = await generateExam({
      totalQuestions,
      timeLimit,
      bloomsDistribution: bloomsDistribution as Partial<BloomsDistribution>,
      questionTypes: selectedTypes,
      adaptiveMode,
    });

    if (result) {
      setGeneratedExam({
        examId: result.examId,
        title: examTitle || "Generated Exam",
        questions: result.questions as PreviewQuestion[],
        totalQuestions: result.totalQuestions,
        totalPoints: result.totalPoints,
        estimatedDuration: result.estimatedDuration,
        bloomsAnalysis: result.bloomsAnalysis,
        metadata: result.metadata,
      });
      setActiveTab("preview");
    }
  }, [generateExam, totalQuestions, timeLimit, bloomsDistribution, selectedTypes, adaptiveMode, examTitle]);

  // Handle question bank selection to exam
  const handleBuildFromBank = useCallback(() => {
    const selectedQuestions = bankQuestions.filter((q) =>
      selectedQuestionIds.includes(q.id)
    );

    if (selectedQuestions.length === 0) return;

    // Calculate Bloom's distribution from selected questions
    const distribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    selectedQuestions.forEach((q) => {
      distribution[q.bloomsLevel]++;
    });

    // Convert to percentages
    const total = selectedQuestions.length;
    Object.keys(distribution).forEach((key) => {
      distribution[key as keyof BloomsDistribution] = Math.round(
        (distribution[key as keyof BloomsDistribution] / total) * 100
      );
    });

    // Calculate alignment score (simplified)
    const targetDist = bloomsDistribution;
    let totalDeviation = 0;
    const deviations: Record<string, number> = {};
    Object.keys(distribution).forEach((key) => {
      const actual = distribution[key as keyof BloomsDistribution];
      const target = targetDist[key as keyof BloomsDistribution];
      const deviation = actual - target;
      deviations[key] = deviation;
      totalDeviation += Math.abs(deviation);
    });
    const alignmentScore = Math.max(0, 100 - totalDeviation);

    const exam: ExamData = {
      examId: `bank-${Date.now()}`,
      title: examTitle || "Custom Exam",
      questions: selectedQuestions.map((q, i) => ({
        id: q.id,
        text: q.question,
        type: q.questionType,
        bloomsLevel: q.bloomsLevel,
        difficulty: q.difficulty,
        correctAnswer: "",
        estimatedTime: q.avgTimeSpent || 60,
        points: 1,
        tags: q.tags,
      })),
      totalQuestions: selectedQuestions.length,
      totalPoints: selectedQuestions.length,
      estimatedDuration: selectedQuestions.reduce(
        (sum, q) => sum + (q.avgTimeSpent || 60),
        0
      ) / 60,
      bloomsAnalysis: {
        targetVsActual: {
          alignmentScore,
          deviations: deviations as Record<string, number>,
        },
        distribution,
        recommendations:
          alignmentScore < 80
            ? ["Consider adjusting question selection to better match target distribution"]
            : [],
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        engine: "question-bank",
        adaptiveMode: false,
      },
    };

    setGeneratedExam(exam);
    setActiveTab("preview");
  }, [bankQuestions, selectedQuestionIds, bloomsDistribution, examTitle]);

  // Handle reorder in preview
  const handleReorder = useCallback((questions: PreviewQuestion[]) => {
    setGeneratedExam((prev) =>
      prev ? { ...prev, questions } : null
    );
  }, []);

  // Handle remove question in preview
  const handleRemoveQuestion = useCallback((questionId: string) => {
    setGeneratedExam((prev) => {
      if (!prev) return null;
      const newQuestions = prev.questions.filter((q) => q.id !== questionId);
      return {
        ...prev,
        questions: newQuestions,
        totalQuestions: newQuestions.length,
        totalPoints: newQuestions.reduce((sum, q) => sum + q.points, 0),
      };
    });
  }, []);

  // Save exam
  const handleSaveExam = useCallback(async () => {
    if (!generatedExam) return;
    // TODO: Implement save to database
    onExamCreated?.(generatedExam.examId);
  }, [generatedExam, onExamCreated]);

  // Reset everything
  const handleReset = useCallback(() => {
    setGeneratedExam(null);
    setSelectedQuestionIds([]);
    setActiveTab("config");
    resetExamEngine();
  }, [resetExamEngine]);

  // Configuration completeness
  const configComplete = useMemo(() => {
    return totalQuestions > 0 && selectedTypes.length > 0;
  }, [totalQuestions, selectedTypes]);

  // Bank selection completeness
  const bankSelectionComplete = selectedQuestionIds.length > 0;

  return (
    <div className={cn("flex flex-col h-full bg-slate-950", className)}>
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-100">
                Exam Builder
              </h1>
              <p className="text-sm text-slate-400">
                AI-powered assessment creation with Bloom&apos;s Taxonomy alignment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {generatedExam && (
              <Button
                onClick={handleSaveExam}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Exam
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm text-slate-400">Build Mode:</span>
          <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-800/50">
            {[
              { value: "ai-generate", label: "AI Generate", icon: Wand2 },
              { value: "question-bank", label: "Question Bank", icon: Library },
              { value: "mixed", label: "Mixed", icon: Layers },
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.value}
                  onClick={() => setBuildMode(mode.value as BuildMode)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    buildMode === mode.value
                      ? "bg-purple-500 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {mode.label}
                </button>
              );
            })}
          </div>

          {generatedExam && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="ml-auto text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Configuration */}
        <div className="w-[480px] flex-none border-r border-slate-800 overflow-hidden flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ActiveTab)}
            className="flex-1 flex flex-col"
          >
            <TabsList className="flex-none mx-4 mt-4 bg-slate-800/50 p-1">
              <TabsTrigger
                value="config"
                className="flex-1 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Configure
              </TabsTrigger>
              {(buildMode === "question-bank" || buildMode === "mixed") && (
                <TabsTrigger
                  value="questions"
                  className="flex-1 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                >
                  <Library className="mr-2 h-4 w-4" />
                  Questions
                  {selectedQuestionIds.length > 0 && (
                    <Badge className="ml-2 bg-purple-700">{selectedQuestionIds.length}</Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger
                value="preview"
                disabled={!generatedExam}
                className="flex-1 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                <FileText className="mr-2 h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            {/* Configuration Tab */}
            <TabsContent value="config" className="flex-1 overflow-auto p-4 space-y-6">
              {/* Basic Settings */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-200 flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-purple-400" />
                    Exam Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Exam Title</Label>
                    <Input
                      placeholder="e.g., Midterm Assessment - Chapter 5"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-slate-200"
                    />
                  </div>

                  {/* Questions & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        Questions
                      </Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[totalQuestions]}
                          onValueChange={([v]) => setTotalQuestions(v)}
                          min={5}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-lg font-bold text-slate-200 w-12 text-right">
                          {totalQuestions}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Time (min)
                      </Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[timeLimit]}
                          onValueChange={([v]) => setTimeLimit(v)}
                          min={15}
                          max={180}
                          step={15}
                          className="flex-1"
                        />
                        <span className="text-lg font-bold text-slate-200 w-12 text-right">
                          {timeLimit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Question Types */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Question Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {QUESTION_TYPES.map((type) => {
                        const isSelected = selectedTypes.includes(type.value);
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            onClick={() => {
                              setSelectedTypes((prev) =>
                                isSelected
                                  ? prev.filter((t) => t !== type.value)
                                  : [...prev, type.value]
                              );
                            }}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                              isSelected
                                ? "border-purple-500 bg-purple-500/20 text-purple-300"
                                : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Adaptive Mode */}
                  {buildMode === "ai-generate" && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                          <Zap className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-200">
                            Adaptive Mode
                          </span>
                          <p className="text-xs text-slate-500">
                            Adjust difficulty based on student profile
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={adaptiveMode}
                        onCheckedChange={setAdaptiveMode}
                        className="data-[state=checked]:bg-amber-500"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bloom's Distribution */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <BloomsDistributionPicker
                    value={bloomsDistribution}
                    onChange={setBloomsDistribution}
                  />
                </CardContent>
              </Card>

              {/* Generate Button */}
              {buildMode === "ai-generate" && (
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !configComplete}
                  className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 text-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Exam...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-5 w-5" />
                      Generate Exam with AI
                    </>
                  )}
                </Button>
              )}

              {/* Build from Bank Button */}
              {(buildMode === "question-bank" || buildMode === "mixed") && (
                <Button
                  onClick={handleBuildFromBank}
                  disabled={!bankSelectionComplete}
                  className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 text-lg"
                >
                  <Library className="mr-2 h-5 w-5" />
                  Build from {selectedQuestionIds.length} Questions
                </Button>
              )}

              {/* Error Display */}
              {generateError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
                >
                  <AlertCircle className="h-5 w-5 text-red-400 flex-none" />
                  <p className="text-sm text-red-300">{generateError}</p>
                </motion.div>
              )}
            </TabsContent>

            {/* Questions Tab */}
            {(buildMode === "question-bank" || buildMode === "mixed") && (
              <TabsContent value="questions" className="flex-1 overflow-hidden p-4">
                <QuestionBankBrowser
                  questions={bankQuestions as unknown as import('./QuestionBankBrowser').BankQuestion[]}
                  selectedIds={selectedQuestionIds}
                  onSelectionChange={setSelectedQuestionIds}
                  onLoadMore={loadMore}
                  onRefresh={() => getQuestions()}
                  hasMore={pagination?.hasMore}
                  isLoading={isLoadingBank}
                  maxSelections={buildMode === "mixed" ? totalQuestions : undefined}
                  className="h-full"
                />
              </TabsContent>
            )}

            {/* Preview Tab */}
            <TabsContent value="preview" className="flex-1 overflow-hidden p-4">
              <ExamPreview
                exam={generatedExam}
                onReorder={handleReorder}
                onRemoveQuestion={handleRemoveQuestion}
                className="h-full"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel: Live Preview */}
        <div className="flex-1 p-6 overflow-hidden bg-slate-900/30">
          <div className="h-full rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden">
            {generatedExam ? (
              <ExamPreview
                exam={generatedExam}
                onReorder={handleReorder}
                onRemoveQuestion={handleRemoveQuestion}
                className="h-full p-6"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  {/* Animated background circles */}
                  <div className="absolute inset-0 -z-10">
                    <motion.div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-500/10"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.1, 0.3],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <motion.div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-pink-500/10"
                      animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.1, 0.3, 0.1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>

                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6 mx-auto">
                    <Sparkles className="h-12 w-12 text-purple-400" />
                  </div>
                </motion.div>

                <h3 className="text-2xl font-semibold text-slate-200 mb-2">
                  Ready to Build Your Exam
                </h3>
                <p className="text-slate-400 max-w-md mb-8">
                  Configure your exam settings and Bloom&apos;s Taxonomy distribution,
                  then let AI generate perfectly aligned questions.
                </p>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Bloom&apos;s Aligned
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Adaptive Difficulty
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Quality Assured
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamBuilder;
