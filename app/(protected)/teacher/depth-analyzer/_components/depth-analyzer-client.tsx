"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Microscope,
  BookOpen,
  Layers,
  FileText,
  Brain,
  ChevronRight,
  Sparkles,
  Clock,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  ArrowLeft,
  Target,
  BarChart3,
  Zap,
  CheckCircle2,
  Info,
  Keyboard,
  GraduationCap,
  Award,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { CourseDepthAnalyzer } from "@/app/(protected)/teacher/courses/[courseId]/_components/depth-analyzer";

// Types
interface Section {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  position: number;
}

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  position: number;
  sections: Section[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  updatedAt: Date;
  whatYouWillLearn: string[];
  chapters: Chapter[];
}

interface RecentAnalysis {
  id: string;
  courseId: string;
  cognitiveDepth: number | null;
  analyzedAt: Date;
  course: {
    title: string;
  };
}

interface DepthAnalyzerClientProps {
  courses: Course[];
  userId: string;
  recentAnalyses: RecentAnalysis[];
  initialCourseId?: string;
  initialChapterId?: string;
  initialSectionId?: string;
}

type AnalysisLevel = "course" | "chapter" | "section";

interface SelectionState {
  courseId: string | null;
  chapterId: string | null;
  sectionId: string | null;
}

// Step indicator component
function StepIndicator({
  currentStep,
  analysisLevel,
}: {
  currentStep: number;
  analysisLevel: AnalysisLevel;
}) {
  const steps = [
    { id: 1, label: "Select Level", icon: Layers },
    {
      id: 2,
      label:
        analysisLevel === "course"
          ? "Choose Course"
          : analysisLevel === "chapter"
            ? "Choose Chapter"
            : "Choose Section",
      icon: BookOpen,
    },
    { id: 3, label: "Analyze", icon: Brain },
  ];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2" role="navigation" aria-label="Analysis progress">
      {steps.map((step, index) => {
        const isActive = currentStep >= step.id;
        const isCurrent = currentStep === step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full transition-all duration-300",
                isActive
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500",
                isCurrent && "ring-2 ring-violet-500/50 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium hidden sm:inline">{step.label}</span>
              <span className="text-xs font-medium sm:hidden">{step.id}</span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight
                className={cn(
                  "h-4 w-4 mx-1 transition-colors",
                  currentStep > step.id ? "text-violet-400" : "text-slate-300 dark:text-slate-600"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Stats card skeleton
function StatCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 animate-pulse">
      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
      <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  );
}

// Mini sparkline component
function MiniSparkline({ data, color = "violet" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const colors = {
    violet: "bg-violet-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div className="flex items-end gap-0.5 h-6" aria-hidden="true">
      {data.map((value, i) => (
        <div
          key={i}
          className={cn("w-1 rounded-full transition-all", colors[color as keyof typeof colors] || colors.violet)}
          style={{
            height: `${((value - min) / range) * 100}%`,
            minHeight: "2px",
            opacity: 0.4 + (i / data.length) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

// Quick stats dashboard
function QuickStatsDashboard({
  totalCourses,
  analyzedCount,
  averageScore,
  recentScores,
}: {
  totalCourses: number;
  analyzedCount: number;
  averageScore: number | null;
  recentScores: number[];
}) {
  const stats = [
    {
      label: "Total Courses",
      value: totalCourses,
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100/50 dark:bg-blue-900/20",
    },
    {
      label: "Analyzed",
      value: analyzedCount,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100/50 dark:bg-emerald-900/20",
      percentage: totalCourses > 0 ? Math.round((analyzedCount / totalCourses) * 100) : 0,
    },
    {
      label: "Avg Score",
      value: averageScore !== null ? Math.round(averageScore) : "—",
      icon: BarChart3,
      color:
        averageScore !== null && averageScore >= 70
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-amber-600 dark:text-amber-400",
      bgColor:
        averageScore !== null && averageScore >= 70
          ? "bg-emerald-100/50 dark:bg-emerald-900/20"
          : "bg-amber-100/50 dark:bg-amber-900/20",
      sparkline: recentScores,
    },
    {
      label: "Trend",
      value:
        recentScores.length >= 2
          ? recentScores[recentScores.length - 1] >= recentScores[0]
            ? "↑"
            : "↓"
          : "—",
      icon: Activity,
      color:
        recentScores.length >= 2 && recentScores[recentScores.length - 1] >= recentScores[0]
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400",
      bgColor:
        recentScores.length >= 2 && recentScores[recentScores.length - 1] >= recentScores[0]
          ? "bg-emerald-100/50 dark:bg-emerald-900/20"
          : "bg-red-100/50 dark:bg-red-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("relative p-3 sm:p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50", stat.bgColor)}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {stat.label}
              </p>
              <p className={cn("text-xl sm:text-2xl font-bold mt-1", stat.color)}>
                {stat.value}
                {stat.percentage !== undefined && (
                  <span className="text-xs font-normal text-slate-400 ml-1">({stat.percentage}%)</span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 opacity-60", stat.color)} />
              {stat.sparkline && stat.sparkline.length > 0 && (
                <MiniSparkline data={stat.sparkline} color={stat.color.includes("emerald") ? "emerald" : "violet"} />
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Enhanced course card for selection
function CourseSelectionCard({
  course,
  isSelected,
  hasAnalysis,
  score,
  onSelect,
}: {
  course: Course;
  isSelected: boolean;
  hasAnalysis: boolean;
  score: number | null;
  onSelect: () => void;
}) {
  const getScoreColor = (s: number | null) => {
    if (s === null) return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
    if (s >= 80) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400";
    if (s >= 60) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={cn(
        "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left group",
        isSelected
          ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 shadow-lg shadow-violet-500/10"
          : "border-slate-200/50 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
      )}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
            getScoreColor(score)
          )}
        >
          {hasAnalysis ? score ?? "—" : <HelpCircle className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
            {course.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px]">
              {course.chapters.length} chapters
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {course.chapters.reduce((acc, ch) => acc + ch.sections.length, 0)} sections
            </Badge>
            {!course.isPublished && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                Draft
              </Badge>
            )}
          </div>
        </div>
        <ChevronRight
          className={cn(
            "h-5 w-5 text-slate-300 group-hover:text-violet-500 transition-all",
            isSelected && "text-violet-500 translate-x-1"
          )}
        />
      </div>
    </motion.button>
  );
}

// Keyboard shortcuts hint
function KeyboardShortcutsHint() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="fixed bottom-4 left-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors opacity-60 hover:opacity-100"
            aria-label="Keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-semibold">Keyboard Shortcuts</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-slate-400">↑/↓</span>
              <span>Navigate courses</span>
              <span className="text-slate-400">Enter</span>
              <span>Select/Analyze</span>
              <span className="text-slate-400">Esc</span>
              <span>Go back</span>
              <span className="text-slate-400">1/2/3</span>
              <span>Change level</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DepthAnalyzerClient({
  courses,
  userId,
  recentAnalyses: initialRecentAnalyses,
  initialCourseId,
  initialChapterId,
  initialSectionId,
}: DepthAnalyzerClientProps) {
  // State
  const [analysisLevel, setAnalysisLevel] = useState<AnalysisLevel>("course");
  const [selection, setSelection] = useState<SelectionState>({
    courseId: initialCourseId || null,
    chapterId: initialChapterId || null,
    sectionId: initialSectionId || null,
  });
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [autoLoadSaved, setAutoLoadSaved] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>(initialRecentAnalyses);

  // Sync with server data
  useEffect(() => {
    setRecentAnalyses(initialRecentAnalyses);
  }, [initialRecentAnalyses]);

  // Handle analysis completion
  const handleAnalysisComplete = useCallback(
    (data: {
      courseId: string;
      courseTitle: string;
      cognitiveDepth: number;
      analyzedAt: Date;
    }) => {
      setRecentAnalyses((prev) => {
        const filtered = prev.filter((a) => a.courseId !== data.courseId);
        const newAnalysis: RecentAnalysis = {
          id: `temp-${Date.now()}`,
          courseId: data.courseId,
          cognitiveDepth: data.cognitiveDepth,
          analyzedAt: data.analyzedAt,
          course: { title: data.courseTitle },
        };
        return [newAnalysis, ...filtered].slice(0, 5);
      });
    },
    []
  );

  // Set initial values from URL params
  useEffect(() => {
    if (initialCourseId) {
      setSelection((prev) => ({ ...prev, courseId: initialCourseId }));
      if (initialSectionId) {
        setAnalysisLevel("section");
        setSelection((prev) => ({
          ...prev,
          chapterId: initialChapterId || null,
          sectionId: initialSectionId,
        }));
      } else if (initialChapterId) {
        setAnalysisLevel("chapter");
        setSelection((prev) => ({ ...prev, chapterId: initialChapterId }));
      }
      setShowAnalyzer(true);
    }
  }, [initialCourseId, initialChapterId, initialSectionId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAnalyzer) {
        if (e.key === "Escape") {
          setShowAnalyzer(false);
          setAutoLoadSaved(false);
        }
        return;
      }

      if (e.key === "1") setAnalysisLevel("course");
      if (e.key === "2") setAnalysisLevel("chapter");
      if (e.key === "3") setAnalysisLevel("section");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAnalyzer]);

  // Computed values
  const selectedCourse = useMemo(() => courses.find((c) => c.id === selection.courseId), [courses, selection.courseId]);
  const selectedChapter = useMemo(() => {
    if (!selectedCourse || !selection.chapterId) return null;
    return selectedCourse.chapters.find((ch) => ch.id === selection.chapterId);
  }, [selectedCourse, selection.chapterId]);
  const selectedSection = useMemo(() => {
    if (!selectedChapter || !selection.sectionId) return null;
    return selectedChapter.sections.find((s) => s.id === selection.sectionId);
  }, [selectedChapter, selection.sectionId]);

  // Analysis stats
  const analysisMap = useMemo(() => {
    const map = new Map<string, number | null>();
    recentAnalyses.forEach((a) => map.set(a.courseId, a.cognitiveDepth));
    return map;
  }, [recentAnalyses]);

  const coursesWithAnalysis = useMemo(() => new Set(recentAnalyses.map((a) => a.courseId)), [recentAnalyses]);
  const coursesWithoutAnalysis = useMemo(() => courses.filter((c) => !coursesWithAnalysis.has(c.id)), [courses, coursesWithAnalysis]);
  const lowScoreCourses = useMemo(
    () => recentAnalyses.filter((a) => a.cognitiveDepth !== null && a.cognitiveDepth < 60),
    [recentAnalyses]
  );

  // Quick stats
  const averageScore = useMemo(() => {
    const scores = recentAnalyses.filter((a) => a.cognitiveDepth !== null).map((a) => a.cognitiveDepth as number);
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [recentAnalyses]);

  const recentScores = useMemo(
    () =>
      recentAnalyses
        .filter((a) => a.cognitiveDepth !== null)
        .slice(0, 5)
        .map((a) => a.cognitiveDepth as number)
        .reverse(),
    [recentAnalyses]
  );

  // Current step calculation
  const currentStep = useMemo(() => {
    if (analysisLevel === "course" && selection.courseId) return 3;
    if (analysisLevel === "chapter" && selection.courseId && selection.chapterId) return 3;
    if (analysisLevel === "section" && selection.courseId && selection.chapterId && selection.sectionId) return 3;
    if (selection.courseId) return 2;
    return 1;
  }, [analysisLevel, selection]);

  // Handlers
  const handleLevelChange = (level: AnalysisLevel) => {
    setAnalysisLevel(level);
    if (level === "course") {
      setSelection((prev) => ({ ...prev, chapterId: null, sectionId: null }));
    } else if (level === "chapter") {
      setSelection((prev) => ({ ...prev, sectionId: null }));
    }
    setShowAnalyzer(false);
  };

  const handleCourseSelect = (courseId: string) => {
    setSelection({ courseId, chapterId: null, sectionId: null });
    if (analysisLevel === "course") {
      setShowAnalyzer(true);
    } else {
      setShowAnalyzer(false);
    }
  };

  const handleChapterSelect = (chapterId: string) => {
    setSelection((prev) => ({ ...prev, chapterId, sectionId: null }));
    if (analysisLevel === "chapter") {
      setShowAnalyzer(true);
    } else {
      setShowAnalyzer(false);
    }
  };

  const handleSectionSelect = (sectionId: string) => {
    setSelection((prev) => ({ ...prev, sectionId }));
    setShowAnalyzer(true);
  };

  const isSelectionComplete = useMemo(() => {
    switch (analysisLevel) {
      case "course":
        return !!selection.courseId;
      case "chapter":
        return !!selection.courseId && !!selection.chapterId;
      case "section":
        return !!selection.courseId && !!selection.chapterId && !!selection.sectionId;
      default:
        return false;
    }
  }, [analysisLevel, selection]);

  const getAnalysisTargetInfo = () => {
    switch (analysisLevel) {
      case "course":
        return { type: "Course", name: selectedCourse?.title || "Select a course", icon: BookOpen };
      case "chapter":
        return { type: "Chapter", name: selectedChapter?.title || "Select a chapter", icon: Layers };
      case "section":
        return { type: "Section", name: selectedSection?.title || "Select a section", icon: FileText };
    }
  };

  const getCourseDataForAnalyzer = useCallback(() => {
    if (!selectedCourse) return null;

    if (analysisLevel === "course") {
      return {
        title: selectedCourse.title,
        description: selectedCourse.description || undefined,
        whatYouWillLearn: selectedCourse.whatYouWillLearn,
        chapters: selectedCourse.chapters,
      };
    }

    if (analysisLevel === "chapter" && selectedChapter) {
      return {
        title: `${selectedCourse.title} - ${selectedChapter.title}`,
        description: selectedChapter.description || undefined,
        whatYouWillLearn: selectedCourse.whatYouWillLearn,
        chapters: [selectedChapter],
      };
    }

    if (analysisLevel === "section" && selectedChapter && selectedSection) {
      return {
        title: `${selectedCourse.title} - ${selectedSection.title}`,
        description: selectedSection.description || undefined,
        whatYouWillLearn: selectedCourse.whatYouWillLearn,
        chapters: [{ ...selectedChapter, sections: [selectedSection] }],
      };
    }

    return null;
  }, [selectedCourse, selectedChapter, selectedSection, analysisLevel]);

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const targetInfo = getAnalysisTargetInfo();
  const courseDataForAnalyzer = getCourseDataForAnalyzer();

  // Score helpers
  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-slate-500";
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return "bg-slate-100 dark:bg-slate-800";
    if (score >= 80) return "bg-emerald-100 dark:bg-emerald-900/30";
    if (score >= 60) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  // Analyzer view
  if (showAnalyzer && isSelectionComplete && courseDataForAnalyzer && selection.courseId) {
    return (
      <div className="min-h-screen">
        {/* Back Button */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => {
              setShowAnalyzer(false);
              setAutoLoadSaved(false);
            }}
            className="group flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Selection
          </Button>
        </div>

        {/* Analysis Target Info */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <Badge
              variant="outline"
              className={cn(
                "font-medium",
                analysisLevel === "course" && "border-emerald-500 text-emerald-600",
                analysisLevel === "chapter" && "border-blue-500 text-blue-600",
                analysisLevel === "section" && "border-purple-500 text-purple-600"
              )}
            >
              <targetInfo.icon className="h-3 w-3 mr-1" />
              {analysisLevel.charAt(0).toUpperCase() + analysisLevel.slice(1)} Analysis
            </Badge>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-900 dark:text-white">{targetInfo.name}</span>
          </div>
        </div>

        {/* Course Depth Analyzer */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <CourseDepthAnalyzer
            courseId={selection.courseId}
            courseData={courseDataForAnalyzer}
            autoLoadSaved={autoLoadSaved}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>
      </div>
    );
  }

  // Selection view
  return (
    <TooltipProvider>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen relative">
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20" />
          <div
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.5) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="hidden lg:block">
            <div className="absolute top-20 right-[15%] w-96 h-96 bg-gradient-to-br from-violet-400/10 to-fuchsia-400/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-[10%] w-80 h-80 bg-gradient-to-br from-cyan-400/10 to-blue-400/5 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Main Content */}
        <div className="relative px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl blur-xl opacity-40" />
                  <div className="relative p-3 sm:p-4 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-xl shadow-violet-500/20">
                    <Microscope className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-violet-800 to-indigo-900 dark:from-white dark:via-violet-200 dark:to-indigo-200 bg-clip-text text-transparent">
                    Course Depth Analyzer
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">
                    AI-powered Bloom&apos;s Taxonomy and Webb&apos;s DOK analysis
                  </p>
                </div>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center gap-4">
                <StepIndicator currentStep={currentStep} analysisLevel={analysisLevel} />
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Dashboard */}
          <motion.div variants={itemVariants} className="mb-6">
            <QuickStatsDashboard
              totalCourses={courses.length}
              analyzedCount={coursesWithAnalysis.size}
              averageScore={averageScore}
              recentScores={recentScores}
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Selection */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
              {/* Analysis Level Selector */}
              <Card className="p-4 sm:p-5 backdrop-blur-xl bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-900/5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Brain className="h-4 w-4 text-violet-600" />
                    Analysis Level
                  </h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Info className="h-4 w-4 text-slate-400" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Choose the granularity of your analysis. Course-level provides comprehensive insights, while section-level offers detailed, focused analysis.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(["course", "chapter", "section"] as AnalysisLevel[]).map((level) => {
                    const configs = {
                      course: {
                        icon: BookOpen,
                        label: "Course",
                        desc: "Full course analysis",
                        color: "emerald",
                      },
                      chapter: {
                        icon: Layers,
                        label: "Chapter",
                        desc: "Chapter deep-dive",
                        color: "blue",
                      },
                      section: {
                        icon: FileText,
                        label: "Section",
                        desc: "Focused section analysis",
                        color: "purple",
                      },
                    };
                    const config = configs[level];
                    const Icon = config.icon;
                    const isActive = analysisLevel === level;

                    return (
                      <button
                        key={level}
                        onClick={() => handleLevelChange(level)}
                        className={cn(
                          "relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 text-left group",
                          isActive
                            ? `border-${config.color}-500 bg-${config.color}-50/50 dark:bg-${config.color}-900/20 shadow-lg`
                            : "border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                        )}
                        style={
                          isActive
                            ? {
                                borderColor:
                                  config.color === "emerald"
                                    ? "rgb(16, 185, 129)"
                                    : config.color === "blue"
                                      ? "rgb(59, 130, 246)"
                                      : "rgb(168, 85, 247)",
                                backgroundColor:
                                  config.color === "emerald"
                                    ? "rgba(16, 185, 129, 0.1)"
                                    : config.color === "blue"
                                      ? "rgba(59, 130, 246, 0.1)"
                                      : "rgba(168, 85, 247, 0.1)",
                              }
                            : {}
                        }
                        aria-pressed={isActive}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon
                            className={cn(
                              "h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                              isActive
                                ? config.color === "emerald"
                                  ? "text-emerald-600"
                                  : config.color === "blue"
                                    ? "text-blue-600"
                                    : "text-purple-600"
                                : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                            )}
                          />
                          <span
                            className={cn(
                              "font-semibold text-sm sm:text-base transition-colors",
                              isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"
                            )}
                          >
                            {config.label}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                          {config.desc}
                        </p>
                        {isActive && (
                          <motion.div
                            layoutId="activeLevelIndicator"
                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                            style={{
                              backgroundColor:
                                config.color === "emerald"
                                  ? "rgb(16, 185, 129)"
                                  : config.color === "blue"
                                    ? "rgb(59, 130, 246)"
                                    : "rgb(168, 85, 247)",
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Course Selector */}
              <Card className="p-4 sm:p-5 backdrop-blur-xl bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-900/5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <targetInfo.icon className="h-4 w-4 text-violet-600" />
                    Select {targetInfo.type}
                  </h2>
                  {courses.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {courses.length} available
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Course List - Enhanced */}
                  {courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                        <BookOpen className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No courses yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                        Create a course to start analyzing
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                      {courses.map((course) => (
                        <CourseSelectionCard
                          key={course.id}
                          course={course}
                          isSelected={selection.courseId === course.id}
                          hasAnalysis={analysisMap.has(course.id)}
                          score={analysisMap.get(course.id) ?? null}
                          onSelect={() => handleCourseSelect(course.id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Chapter Selector */}
                  <AnimatePresence>
                    {(analysisLevel === "chapter" || analysisLevel === "section") && selectedCourse && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50"
                      >
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                          Chapter
                        </label>
                        <Select value={selection.chapterId || ""} onValueChange={handleChapterSelect}>
                          <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-11">
                            <SelectValue placeholder="Select a chapter..." />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedCourse.chapters.map((chapter) => (
                              <SelectItem key={chapter.id} value={chapter.id}>
                                <div className="flex items-center gap-2">
                                  <Layers className="h-4 w-4 text-slate-400" />
                                  <span>{chapter.title}</span>
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    {chapter.sections.length} sections
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Section Selector */}
                  <AnimatePresence>
                    {analysisLevel === "section" && selectedChapter && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50"
                      >
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                          Section
                        </label>
                        <Select value={selection.sectionId || ""} onValueChange={handleSectionSelect}>
                          <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-11">
                            <SelectValue placeholder="Select a section..." />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedChapter.sections.map((section) => (
                              <SelectItem key={section.id} value={section.id}>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-slate-400" />
                                  <span>{section.title}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>

            {/* Right Panel - Quick Access */}
            <motion.div variants={itemVariants} className="space-y-4">
              {/* Recent Analyses */}
              <Card className="overflow-hidden backdrop-blur-xl bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <div className="p-3 sm:p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20">
                      <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Recent Analyses</h3>
                    {recentAnalyses.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs"
                      >
                        {recentAnalyses.length}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-2 sm:p-3 space-y-1.5 max-h-44 overflow-y-auto">
                  {recentAnalyses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Sparkles className="h-7 w-7 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-xs text-slate-500">No recent analyses</p>
                    </div>
                  ) : (
                    recentAnalyses.map((analysis) => (
                      <motion.button
                        key={analysis.id}
                        whileHover={{ x: 3 }}
                        onClick={() => {
                          handleCourseSelect(analysis.courseId);
                          setAutoLoadSaved(true);
                          setShowAnalyzer(true);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left group"
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-9 h-9 rounded-lg text-xs font-bold",
                            getScoreBg(analysis.cognitiveDepth),
                            getScoreColor(analysis.cognitiveDepth)
                          )}
                        >
                          {analysis.cognitiveDepth ?? "—"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs text-slate-900 dark:text-white truncate">
                            {analysis.course.title}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {formatDistanceToNow(analysis.analyzedAt, { addSuffix: true })}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </motion.button>
                    ))
                  )}
                </div>
              </Card>

              {/* Needs Improvement */}
              <Card className="overflow-hidden backdrop-blur-xl bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <div className="p-3 sm:p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Needs Improvement</h3>
                    {lowScoreCourses.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs"
                      >
                        {lowScoreCourses.length}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-2 sm:p-3 space-y-1.5 max-h-32 overflow-y-auto">
                  {lowScoreCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <TrendingUp className="h-6 w-6 text-emerald-400 mb-1.5" />
                      <p className="text-xs text-slate-500">All courses performing well!</p>
                    </div>
                  ) : (
                    lowScoreCourses.map((analysis) => (
                      <motion.button
                        key={analysis.id}
                        whileHover={{ x: 3 }}
                        onClick={() => {
                          handleCourseSelect(analysis.courseId);
                          setShowAnalyzer(true);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left group"
                      >
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          {analysis.cognitiveDepth}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs text-slate-900 dark:text-white truncate">
                            {analysis.course.title}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </motion.button>
                    ))
                  )}
                </div>
              </Card>

              {/* Not Analyzed */}
              <Card className="overflow-hidden backdrop-blur-xl bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <div className="p-3 sm:p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-500/5 to-slate-400/5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-500/20">
                      <HelpCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Not Analyzed</h3>
                    {coursesWithoutAnalysis.length > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {coursesWithoutAnalysis.length}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-2 sm:p-3 space-y-1.5 max-h-32 overflow-y-auto">
                  {coursesWithoutAnalysis.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <Award className="h-6 w-6 text-emerald-400 mb-1.5" />
                      <p className="text-xs text-slate-500">All courses analyzed!</p>
                    </div>
                  ) : (
                    coursesWithoutAnalysis.slice(0, 5).map((course) => (
                      <motion.button
                        key={course.id}
                        whileHover={{ x: 3 }}
                        onClick={() => {
                          handleCourseSelect(course.id);
                          setShowAnalyzer(true);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left group"
                      >
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700">
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs text-slate-900 dark:text-white truncate">{course.title}</p>
                          <p className="text-[10px] text-slate-500">{course.chapters.length} chapters</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </motion.button>
                    ))
                  )}
                </div>
              </Card>

              {/* Pro Tips Card */}
              <Card className="p-3 sm:p-4 backdrop-blur-xl bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border-violet-200/30 dark:border-violet-800/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
                    <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Pro Tips</h4>
                    <ul className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <li className="flex items-start gap-1.5">
                        <span className="text-violet-500 mt-0.5">•</span>
                        Use keyboard shortcuts (1, 2, 3) to switch levels
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-violet-500 mt-0.5">•</span>
                        Scores above 70 indicate strong cognitive depth
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-violet-500 mt-0.5">•</span>
                        Re-analyze after content updates for fresh insights
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <KeyboardShortcutsHint />
      </motion.div>
    </TooltipProvider>
  );
}
