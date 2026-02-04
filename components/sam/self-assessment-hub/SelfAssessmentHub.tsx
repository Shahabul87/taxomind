"use client";

/**
 * SelfAssessmentHub
 *
 * Comprehensive self-assessment exam system allowing users to:
 * - Create personal assessment exams with AI generation
 * - Take exams to test their knowledge
 * - Track progress with Bloom's Taxonomy analysis
 * - View detailed results and learning recommendations
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Plus,
  Play,
  Trophy,
  Clock,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Settings2,
  Trash2,
  Eye,
  RefreshCw,
  Brain,
  Target,
  Wand2,
  ChevronRight,
  Loader2,
  FileText,
  GraduationCap,
  TrendingUp,
  Calendar,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TemplateSelector } from "./TemplateSelector";
import type { QuestionTemplate } from "@/lib/sam/self-assessment/templates";

// Types
interface SelfAssessmentExam {
  id: string;
  title: string;
  description: string | null;
  courseId: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  timeLimit: number | null;
  passingScore: number;
  totalQuestions: number;
  totalAttempts: number;
  avgScore: number | null;
  generatedByAI: boolean;
  targetBloomsDistribution: Record<string, number> | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface ExamAttempt {
  id: string;
  attemptNumber: number;
  status: string;
  scorePercentage: number | null;
  isPassed: boolean | null;
  submittedAt: string | null;
  timeSpent: number | null;
  examTitle: string;
  passingScore: number;
  timeLimit: number | null;
}

interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface SelfAssessmentHubProps {
  userId?: string;
  defaultTab?: "overview" | "my-exams" | "history";
  className?: string;
  onExamStart?: (examId: string) => void;
  onExamCreate?: (examId: string) => void;
}

const BLOOMS_COLORS: Record<string, string> = {
  REMEMBER: "bg-red-500",
  UNDERSTAND: "bg-orange-500",
  APPLY: "bg-yellow-500",
  ANALYZE: "bg-green-500",
  EVALUATE: "bg-blue-500",
  CREATE: "bg-purple-500",
};

const DEFAULT_BLOOMS: BloomsDistribution = {
  REMEMBER: 15,
  UNDERSTAND: 20,
  APPLY: 25,
  ANALYZE: 20,
  EVALUATE: 15,
  CREATE: 5,
};

export function SelfAssessmentHub({
  userId,
  defaultTab = "overview",
  className,
  onExamStart,
  onExamCreate,
}: SelfAssessmentHubProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [exams, setExams] = useState<SelfAssessmentExam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create exam dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newExam, setNewExam] = useState({
    title: "",
    description: "",
    topic: "",
    subtopicsInput: "", // Comma-separated input for subtopics
    timeLimit: 60,
    passingScore: 70,
    generateWithAI: true,
    enableAdaptive: false,
    totalQuestions: 20,
    bloomsDistribution: { ...DEFAULT_BLOOMS },
  });

  // Use ref to track if data has been fetched
  const dataFetchedRef = useRef(false);

  // Fetch exams and attempts
  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [examsRes, attemptsRes] = await Promise.all([
        fetch("/api/self-assessment/exams?limit=50"),
        fetch("/api/exams/attempts?limit=20"),
      ]);

      if (examsRes.ok) {
        const data = await examsRes.json();
        setExams(data.exams || []);
      }

      if (attemptsRes.ok) {
        const data = await attemptsRes.json();
        setAttempts(data.attempts || []);
      }
    } catch (err) {
      setError("Failed to load data");
      console.error("Error fetching self-assessment data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchData();
    }
  }, [fetchData]);

  // Handle template selection — pre-fill exam form
  const handleTemplateSelect = useCallback((template: QuestionTemplate) => {
    setNewExam((prev) => ({
      ...prev,
      title: template.name,
      description: template.description,
      topic: template.subjectArea,
      subtopicsInput: template.tags.join(', '),
      generateWithAI: true,
      totalQuestions: template.defaultQuestionCount,
      bloomsDistribution: { ...template.bloomsDistribution },
    }));
  }, []);

  // Create new exam
  const handleCreateExam = useCallback(async () => {
    if (!newExam.title.trim()) return;

    setIsCreating(true);
    try {
      // Parse subtopics from comma-separated input
      const subtopics = newExam.subtopicsInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await fetch("/api/self-assessment/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newExam.title,
          description: newExam.description || undefined,
          topic: newExam.topic || undefined, // Topic for AI question generation
          subtopics: subtopics.length > 0 ? subtopics : undefined,
          timeLimit: newExam.timeLimit || undefined,
          passingScore: newExam.passingScore,
          generateWithAI: newExam.generateWithAI,
          enableAdaptive: newExam.enableAdaptive,
          aiConfig: newExam.generateWithAI
            ? {
                totalQuestions: newExam.totalQuestions,
                bloomsDistribution: newExam.bloomsDistribution,
                questionTypes: ["MULTIPLE_CHOICE", "SHORT_ANSWER"],
              }
            : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreateDialogOpen(false);
        setNewExam({
          title: "",
          description: "",
          topic: "",
          subtopicsInput: "",
          timeLimit: 60,
          passingScore: 70,
          generateWithAI: true,
          enableAdaptive: false,
          totalQuestions: 20,
          bloomsDistribution: { ...DEFAULT_BLOOMS },
        });
        await fetchData();
        onExamCreate?.(data.exam.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create exam");
      }
    } catch (err) {
      setError("Failed to create exam");
      console.error("Error creating exam:", err);
    } finally {
      setIsCreating(false);
    }
  }, [newExam, fetchData, onExamCreate]);

  // Delete exam
  const handleDeleteExam = useCallback(
    async (examId: string) => {
      try {
        const response = await fetch(`/api/self-assessment/exams/${examId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await fetchData();
        }
      } catch (err) {
        console.error("Error deleting exam:", err);
      }
    },
    [fetchData]
  );

  // Start exam
  const handleStartExam = useCallback(
    async (examId: string) => {
      try {
        const response = await fetch(
          `/api/self-assessment/exams/${examId}/attempts`,
          { method: "POST" }
        );

        if (response.ok) {
          const data = await response.json();
          onExamStart?.(examId);
          // In a real implementation, redirect to exam taking page
          window.location.href = `/self-assessment/${examId}/take/${data.attempt.id}`;
        }
      } catch (err) {
        console.error("Error starting exam:", err);
      }
    },
    [onExamStart]
  );

  // Calculate stats
  const stats = {
    totalExams: exams.length,
    publishedExams: exams.filter((e) => e.status === "PUBLISHED").length,
    totalAttempts: attempts.length,
    passedAttempts: attempts.filter((a) => a.isPassed).length,
    avgScore:
      attempts.length > 0
        ? Math.round(
            attempts.reduce((sum, a) => sum + (a.scorePercentage ?? 0), 0) /
              attempts.length
          )
        : 0,
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Self-Assessment Hub
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                Create and take personal skill assessments
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Self-Assessment Exam</DialogTitle>
                  <DialogDescription>
                    Create a new exam to test your knowledge. Enable AI generation for
                    automatic question creation.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Template Selector */}
                  <TemplateSelector
                    onSelectTemplate={handleTemplateSelect}
                  />

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Exam Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., JavaScript Fundamentals Assessment"
                        value={newExam.title}
                        onChange={(e) =>
                          setNewExam({ ...newExam, title: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what this assessment covers..."
                        value={newExam.description}
                        onChange={(e) =>
                          setNewExam({ ...newExam, description: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Time Limit (minutes)</Label>
                      <Input
                        type="number"
                        value={newExam.timeLimit}
                        onChange={(e) =>
                          setNewExam({
                            ...newExam,
                            timeLimit: parseInt(e.target.value) || 0,
                          })
                        }
                        min={0}
                        max={180}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Passing Score (%)</Label>
                      <Input
                        type="number"
                        value={newExam.passingScore}
                        onChange={(e) =>
                          setNewExam({
                            ...newExam,
                            passingScore: parseInt(e.target.value) || 70,
                          })
                        }
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>

                  {/* AI Generation Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Wand2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          AI Question Generation
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Automatically generate questions using SAM AI
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={newExam.generateWithAI}
                      onCheckedChange={(checked) =>
                        setNewExam({ ...newExam, generateWithAI: checked })
                      }
                    />
                  </div>

                  {/* Adaptive Testing (CAT) Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          Adaptive Testing (CAT)
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Dynamically adjust question difficulty based on responses
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={newExam.enableAdaptive}
                      onCheckedChange={(checked) =>
                        setNewExam({ ...newExam, enableAdaptive: checked })
                      }
                    />
                  </div>

                  {/* AI Config */}
                  {newExam.generateWithAI && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10"
                    >
                      {/* Topic for AI Question Generation */}
                      <div className="space-y-2">
                        <Label htmlFor="topic" className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          Topic for Question Generation
                        </Label>
                        <Input
                          id="topic"
                          placeholder="e.g., JavaScript async/await, React hooks, Python data structures"
                          value={newExam.topic}
                          onChange={(e) =>
                            setNewExam({ ...newExam, topic: e.target.value })
                          }
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Specify the main topic for AI to generate questions about. If left empty, the exam title will be used.
                        </p>
                      </div>

                      {/* Subtopics */}
                      <div className="space-y-2">
                        <Label htmlFor="subtopics">Subtopics (Optional)</Label>
                        <Input
                          id="subtopics"
                          placeholder="e.g., Promises, async functions, error handling"
                          value={newExam.subtopicsInput}
                          onChange={(e) =>
                            setNewExam({ ...newExam, subtopicsInput: e.target.value })
                          }
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Comma-separated list of subtopics to include in the questions.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Total Questions: {newExam.totalQuestions}</Label>
                        <Slider
                          value={[newExam.totalQuestions]}
                          onValueChange={([v]) =>
                            setNewExam({ ...newExam, totalQuestions: v })
                          }
                          min={5}
                          max={50}
                          step={5}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Bloom&apos;s Taxonomy Distribution</Label>
                        <div className="space-y-2">
                          {Object.entries(newExam.bloomsDistribution).map(
                            ([level, value]) => (
                              <div key={level} className="flex items-center gap-3">
                                <span className="w-24 text-sm text-slate-600 dark:text-slate-400">
                                  {level}
                                </span>
                                <div className="flex-1">
                                  <Slider
                                    value={[value]}
                                    onValueChange={([v]) =>
                                      setNewExam({
                                        ...newExam,
                                        bloomsDistribution: {
                                          ...newExam.bloomsDistribution,
                                          [level]: v,
                                        },
                                      })
                                    }
                                    min={0}
                                    max={50}
                                    step={5}
                                  />
                                </div>
                                <span className="w-10 text-sm font-medium text-slate-900 dark:text-white">
                                  {value}%
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateExam}
                      disabled={isCreating || !newExam.title.trim()}
                      className="gap-2"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Create Exam
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="w-full justify-start rounded-none border-b border-slate-200 dark:border-slate-700 bg-transparent h-auto p-0">
            {[
              { value: "overview", label: "Overview", icon: BarChart3 },
              { value: "my-exams", label: "My Exams", icon: FileText },
              { value: "history", label: "History", icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent py-3"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                <FileText className="h-5 w-5 mx-auto text-indigo-500 mb-2" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalExams}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Exams</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                <Play className="h-5 w-5 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalAttempts}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Attempts
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                <Trophy className="h-5 w-5 mx-auto text-amber-500 mb-2" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.passedAttempts}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Passed</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.avgScore}%
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg Score</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-white">
                Recent Exams
              </h4>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : exams.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No exams yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Exam
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {exams.slice(0, 3).map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            exam.status === "PUBLISHED"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-slate-100 dark:bg-slate-800"
                          )}
                        >
                          <FileText
                            className={cn(
                              "h-5 w-5",
                              exam.status === "PUBLISHED"
                                ? "text-green-600 dark:text-green-400"
                                : "text-slate-500"
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {exam.title}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <span>{exam.totalQuestions} questions</span>
                            <span>•</span>
                            <span>{exam.totalAttempts} attempts</span>
                            {exam.avgScore && (
                              <>
                                <span>•</span>
                                <span>Avg: {exam.avgScore}%</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartExam(exam.id)}
                        disabled={exam.status !== "PUBLISHED" && exam.totalQuestions === 0}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {exam.totalAttempts > 0 ? "Retake" : "Start"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* My Exams Tab */}
          <TabsContent value="my-exams" className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                  No Exams Created
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Create your first self-assessment exam to start testing your knowledge
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {exam.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={cn(
                              exam.status === "PUBLISHED"
                                ? "border-green-500 text-green-600"
                                : exam.status === "DRAFT"
                                  ? "border-amber-500 text-amber-600"
                                  : "border-slate-500 text-slate-600"
                            )}
                          >
                            {exam.status}
                          </Badge>
                          {exam.generatedByAI && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        {exam.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                            {exam.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {exam.totalQuestions} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {exam.timeLimit ? `${exam.timeLimit} min` : "No limit"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Pass: {exam.passingScore}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Play className="h-4 w-4" />
                            {exam.totalAttempts} attempts
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{exam.title}&quot; and all
                                associated attempts. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteExam(exam.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button
                          onClick={() => handleStartExam(exam.id)}
                          disabled={exam.totalQuestions === 0}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {exam.totalAttempts > 0 ? "Retake" : "Start"}
                        </Button>
                      </div>
                    </div>

                    {/* Bloom's Distribution Bar */}
                    {exam.targetBloomsDistribution && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          Bloom&apos;s Distribution
                        </p>
                        <div className="flex h-2 rounded-full overflow-hidden">
                          {Object.entries(exam.targetBloomsDistribution).map(
                            ([level, percentage]) => (
                              <TooltipProvider key={level}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(BLOOMS_COLORS[level], "h-full")}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {level}: {percentage}%
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : attempts.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                  No Attempts Yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Start taking exams to see your history here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          attempt.isPassed
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-red-100 dark:bg-red-900/30"
                        )}
                      >
                        {attempt.isPassed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {attempt.examTitle}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <span>Attempt #{attempt.attemptNumber}</span>
                          <span>•</span>
                          <span>
                            {attempt.submittedAt
                              ? new Date(attempt.submittedAt).toLocaleDateString()
                              : "In Progress"}
                          </span>
                          {attempt.timeSpent && (
                            <>
                              <span>•</span>
                              <span>
                                {Math.round(attempt.timeSpent / 60)} min
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            attempt.isPassed
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {attempt.scorePercentage?.toFixed(0) ?? "--"}%
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Pass: {attempt.passingScore}%
                        </p>
                      </div>
                      <Badge
                        variant={attempt.isPassed ? "default" : "destructive"}
                        className={
                          attempt.isPassed
                            ? "bg-green-500 hover:bg-green-600"
                            : ""
                        }
                      >
                        {attempt.isPassed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default SelfAssessmentHub;
