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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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

  // Local state for recent analyses - updated immediately when analysis completes
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>(initialRecentAnalyses);

  // Sync with server data when props change (e.g., after router.refresh())
  useEffect(() => {
    setRecentAnalyses(initialRecentAnalyses);
  }, [initialRecentAnalyses]);

  // Handle analysis completion - update local state immediately
  const handleAnalysisComplete = useCallback((data: {
    courseId: string;
    courseTitle: string;
    cognitiveDepth: number;
    analyzedAt: Date;
  }) => {
    setRecentAnalyses((prev) => {
      // Remove existing analysis for this course if it exists
      const filtered = prev.filter((a) => a.courseId !== data.courseId);

      // Add new analysis at the beginning
      const newAnalysis: RecentAnalysis = {
        id: `temp-${Date.now()}`, // Temporary ID until server refresh
        courseId: data.courseId,
        cognitiveDepth: data.cognitiveDepth,
        analyzedAt: data.analyzedAt,
        course: {
          title: data.courseTitle,
        },
      };

      // Keep only 5 most recent
      return [newAnalysis, ...filtered].slice(0, 5);
    });
  }, []);

  // Set initial values from URL params and auto-show analyzer
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
      // Auto-show analyzer when courseId is provided via URL
      setShowAnalyzer(true);
    }
  }, [initialCourseId, initialChapterId, initialSectionId]);

  // Get selected course
  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === selection.courseId);
  }, [courses, selection.courseId]);

  // Get selected chapter
  const selectedChapter = useMemo(() => {
    if (!selectedCourse || !selection.chapterId) return null;
    return selectedCourse.chapters.find((ch) => ch.id === selection.chapterId);
  }, [selectedCourse, selection.chapterId]);

  // Get selected section
  const selectedSection = useMemo(() => {
    if (!selectedChapter || !selection.sectionId) return null;
    return selectedChapter.sections.find((s) => s.id === selection.sectionId);
  }, [selectedChapter, selection.sectionId]);

  // Compute courses with/without analysis
  const coursesWithAnalysis = useMemo(() => {
    return new Set(recentAnalyses.map((a) => a.courseId));
  }, [recentAnalyses]);

  const coursesWithoutAnalysis = useMemo(() => {
    return courses.filter((c) => !coursesWithAnalysis.has(c.id));
  }, [courses, coursesWithAnalysis]);

  const lowScoreCourses = useMemo(() => {
    return recentAnalyses.filter(
      (a) => a.cognitiveDepth !== null && a.cognitiveDepth < 60
    );
  }, [recentAnalyses]);

  // Handle level change
  const handleLevelChange = (level: AnalysisLevel) => {
    setAnalysisLevel(level);
    // Reset lower-level selections when changing level
    if (level === "course") {
      setSelection((prev) => ({ ...prev, chapterId: null, sectionId: null }));
    } else if (level === "chapter") {
      setSelection((prev) => ({ ...prev, sectionId: null }));
    }
    setShowAnalyzer(false);
  };

  // Handle course selection
  const handleCourseSelect = (courseId: string) => {
    setSelection({ courseId, chapterId: null, sectionId: null });
    // Auto-show analyzer when course is selected at course level
    if (analysisLevel === "course") {
      setShowAnalyzer(true);
    } else {
      setShowAnalyzer(false);
    }
  };

  // Handle chapter selection
  const handleChapterSelect = (chapterId: string) => {
    setSelection((prev) => ({ ...prev, chapterId, sectionId: null }));
    // Auto-show analyzer when chapter is selected at chapter level
    if (analysisLevel === "chapter") {
      setShowAnalyzer(true);
    } else {
      setShowAnalyzer(false);
    }
  };

  // Handle section selection
  const handleSectionSelect = (sectionId: string) => {
    setSelection((prev) => ({ ...prev, sectionId }));
    // Auto-show analyzer when section is selected at section level
    setShowAnalyzer(true);
  };

  // Check if selection is complete for current level
  const isSelectionComplete = useMemo(() => {
    switch (analysisLevel) {
      case "course":
        return !!selection.courseId;
      case "chapter":
        return !!selection.courseId && !!selection.chapterId;
      case "section":
        return (
          !!selection.courseId &&
          !!selection.chapterId &&
          !!selection.sectionId
        );
      default:
        return false;
    }
  }, [analysisLevel, selection]);

  // Get analysis target info for display
  const getAnalysisTargetInfo = () => {
    switch (analysisLevel) {
      case "course":
        return {
          type: "Course",
          name: selectedCourse?.title || "Select a course",
          icon: BookOpen,
        };
      case "chapter":
        return {
          type: "Chapter",
          name: selectedChapter?.title || "Select a chapter",
          icon: Layers,
        };
      case "section":
        return {
          type: "Section",
          name: selectedSection?.title || "Select a section",
          icon: FileText,
        };
    }
  };

  // Prepare course data for CourseDepthAnalyzer
  const getCourseDataForAnalyzer = useCallback(() => {
    if (!selectedCourse) return null;

    // For course level, use full course data
    if (analysisLevel === "course") {
      return {
        title: selectedCourse.title,
        description: selectedCourse.description || undefined,
        whatYouWillLearn: selectedCourse.whatYouWillLearn,
        chapters: selectedCourse.chapters,
      };
    }

    // For chapter level, filter to just that chapter
    if (analysisLevel === "chapter" && selectedChapter) {
      return {
        title: `${selectedCourse.title} - ${selectedChapter.title}`,
        description: selectedChapter.description || undefined,
        whatYouWillLearn: selectedCourse.whatYouWillLearn,
        chapters: [selectedChapter],
      };
    }

    // For section level, filter to just that section
    if (analysisLevel === "section" && selectedChapter && selectedSection) {
      return {
        title: `${selectedCourse.title} - ${selectedSection.title}`,
        description: selectedSection.description || undefined,
        whatYouWillLearn: selectedCourse.whatYouWillLearn,
        chapters: [
          {
            ...selectedChapter,
            sections: [selectedSection],
          },
        ],
      };
    }

    return null;
  }, [
    selectedCourse,
    selectedChapter,
    selectedSection,
    analysisLevel,
  ]);

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Score color helper
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

  const targetInfo = getAnalysisTargetInfo();
  const courseDataForAnalyzer = getCourseDataForAnalyzer();

  // Show analyzer view
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
            <span className="font-medium text-slate-900 dark:text-white">
              {targetInfo.name}
            </span>
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen relative"
    >
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="hidden lg:block">
          <div className="absolute top-20 right-[20%] w-72 h-72 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/15 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 left-[15%] w-80 h-80 bg-gradient-to-br from-cyan-400/15 to-blue-400/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8 sm:mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl blur-xl opacity-40" />
              <div className="relative p-3 sm:p-4 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-xl">
                <Microscope className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-violet-800 to-indigo-900 dark:from-white dark:via-violet-200 dark:to-indigo-200 bg-clip-text text-transparent">
                Course Depth Analyzer
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
                AI-powered Bloom&apos;s Taxonomy and Webb&apos;s DOK analysis
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Panel - Selection */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            {/* Analysis Level Selector */}
            <Card className="p-4 sm:p-6 backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-600" />
                Analysis Level
              </h2>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                {(["course", "chapter", "section"] as AnalysisLevel[]).map(
                  (level) => {
                    const icons = {
                      course: BookOpen,
                      chapter: Layers,
                      section: FileText,
                    };
                    const Icon = icons[level];
                    const isActive = analysisLevel === level;

                    return (
                      <Button
                        key={level}
                        variant={isActive ? "default" : "outline"}
                        onClick={() => handleLevelChange(level)}
                        className={cn(
                          "flex-1 sm:flex-none transition-all duration-300",
                          isActive
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                            : "hover:border-violet-300 dark:hover:border-violet-600"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Button>
                    );
                  }
                )}
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                {analysisLevel === "course" &&
                  "Analyze the entire course including all chapters and sections"}
                {analysisLevel === "chapter" &&
                  "Analyze a specific chapter with all its sections"}
                {analysisLevel === "section" &&
                  "Analyze a single section in detail"}
              </p>
            </Card>

            {/* Cascading Selectors */}
            <Card className="p-4 sm:p-6 backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <targetInfo.icon className="h-5 w-5 text-violet-600" />
                Select {targetInfo.type}
              </h2>

              <div className="space-y-4">
                {/* Course Selector - Always Visible */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Course
                  </label>
                  <Select
                    value={selection.courseId || ""}
                    onValueChange={handleCourseSelect}
                  >
                    <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="Select a course..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-slate-400" />
                            <span>{course.title}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {course.chapters.length} chapters
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chapter Selector - Show for chapter and section levels */}
                {(analysisLevel === "chapter" || analysisLevel === "section") &&
                  selectedCourse && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        Chapter
                      </label>
                      <Select
                        value={selection.chapterId || ""}
                        onValueChange={handleChapterSelect}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <SelectValue placeholder="Select a chapter..." />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCourse.chapters.map((chapter) => (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-slate-400" />
                                <span>{chapter.title}</span>
                                <Badge
                                  variant="secondary"
                                  className="ml-2 text-xs"
                                >
                                  {chapter.sections.length} sections
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}

                {/* Section Selector - Show only for section level */}
                {analysisLevel === "section" && selectedChapter && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Section
                    </label>
                    <Select
                      value={selection.sectionId || ""}
                      onValueChange={handleSectionSelect}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
              </div>

            </Card>
          </motion.div>

          {/* Right Panel - Quick Access */}
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Recent Analyses */}
            <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 shadow-lg">
              <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20">
                    <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Recent Analyses
                  </h3>
                  {recentAnalyses.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    >
                      {recentAnalyses.length}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                {recentAnalyses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500">No recent analyses</p>
                  </div>
                ) : (
                  recentAnalyses.map((analysis) => (
                    <motion.button
                      key={analysis.id}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        handleCourseSelect(analysis.courseId);
                        setAutoLoadSaved(true);
                        setShowAnalyzer(true);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left group"
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold",
                          getScoreBg(analysis.cognitiveDepth),
                          getScoreColor(analysis.cognitiveDepth)
                        )}
                      >
                        {analysis.cognitiveDepth ?? "—"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                          {analysis.course.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(analysis.analyzedAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                    </motion.button>
                  ))
                )}
              </div>
            </Card>

            {/* Needs Improvement */}
            <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 shadow-lg">
              <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Needs Improvement
                  </h3>
                  {lowScoreCourses.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                    >
                      {lowScoreCourses.length}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-36 overflow-y-auto">
                {lowScoreCourses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <TrendingUp className="h-6 w-6 text-emerald-400 mb-2" />
                    <p className="text-sm text-slate-500">
                      All courses are performing well!
                    </p>
                  </div>
                ) : (
                  lowScoreCourses.map((analysis) => (
                    <motion.button
                      key={analysis.id}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        handleCourseSelect(analysis.courseId);
                        setShowAnalyzer(true);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        {analysis.cognitiveDepth}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                          {analysis.course.title}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </motion.button>
                  ))
                )}
              </div>
            </Card>

            {/* Not Analyzed */}
            <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 shadow-lg">
              <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-500/5 to-slate-400/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-500/20">
                    <HelpCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Not Analyzed
                  </h3>
                  {coursesWithoutAnalysis.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {coursesWithoutAnalysis.length}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-36 overflow-y-auto">
                {coursesWithoutAnalysis.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <BookOpen className="h-6 w-6 text-emerald-400 mb-2" />
                    <p className="text-sm text-slate-500">
                      All courses analyzed!
                    </p>
                  </div>
                ) : (
                  coursesWithoutAnalysis.slice(0, 5).map((course) => (
                    <motion.button
                      key={course.id}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        handleCourseSelect(course.id);
                        setShowAnalyzer(true);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700">
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                          {course.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {course.chapters.length} chapters
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </motion.button>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
