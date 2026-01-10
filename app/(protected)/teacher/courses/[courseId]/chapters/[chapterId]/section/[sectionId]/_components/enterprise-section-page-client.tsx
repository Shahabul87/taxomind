"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  LayoutDashboard,
  Video,
  Brain,
  Sparkles,
  Target,
  Lightbulb,
  Code2,
  FileQuestion,
  TrendingUp,
  BookOpen,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Info,
  BarChart3,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IconBadge } from "@/components/icon-badge";
import { Banner } from "@/components/banner";
import { SectionTitleForm } from "./section-title-form";
import { SectionAccessForm } from "./section-access-form";
import { SectionLearningObjectivesForm } from "./section-learning-objectives-form";
import { SectionDescriptionForm } from "./section-description-form";
import { SectionYoutubeVideoForm } from "./section-video-form";
import { SectionActions } from "./sections-actions";
import { TabsContainer } from "./TabsContainer";
import { ExamTab } from "./tabs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  type SectionPageClientProps,
  type ContentStatistics,
  type AISuggestion
} from "./enterprise-section-types";

// Enterprise-grade Section Page Client Component
export const EnterpriseSectionPageClient = ({
  section,
  chapter,
  params
}: SectionPageClientProps) => {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [activeMetricView, setActiveMetricView] = useState<'overview' | 'detailed'>('overview');

  // Create context objects for AI generation
  const courseContext = useMemo(() => ({
    title: chapter.course.title,
    description: chapter.course.description ?? null,
    whatYouWillLearn: chapter.course.whatYouWillLearn ?? [],
    courseGoals: chapter.course.courseGoals ?? null,
    difficulty: chapter.course.difficulty ?? null,
    category: chapter.course.category?.name ?? null,
  }), [chapter.course]);

  const chapterContext = useMemo(() => ({
    description: chapter.description ?? null,
    learningOutcomes: chapter.learningOutcomes ?? null,
    position: chapter.position,
  }), [chapter.description, chapter.learningOutcomes, chapter.position]);

  const sectionContext = useMemo(() => ({
    position: section.position,
    existingDescription: section.description ?? null,
    existingObjectives: section.learningObjectives ?? null,
  }), [section.position, section.description, section.learningObjectives]);

  // Calculate comprehensive content statistics
  const contentStats: ContentStatistics = useMemo(() => {
    const hasTitle = Boolean(section.title);
    const hasVideo = Boolean(section.videoUrl);
    const hasCodeExplanations = section.codeExplanations?.length > 0;
    const hasMathExplanations = section.mathExplanations?.length > 0;
    const hasResources = (section.videos?.length > 0) ||
                        (section.blogs?.length > 0) ||
                        (section.articles?.length > 0);

    const requiredFields = [hasTitle, hasVideo];
    const totalFields = requiredFields.length;
    const completedFields = requiredFields.filter(Boolean).length;

    return {
      totalVideos: section.videos?.length || 0,
      totalBlogs: section.blogs?.length || 0,
      totalArticles: section.articles?.length || 0,
      totalNotes: section.notes?.length || 0,
      totalCodeBlocks: section.codeExplanations?.length || 0,
      totalMathEquations: section.mathExplanations?.length || 0,
      completionPercentage: Math.round((completedFields / totalFields) * 100),
      requiredFieldsCompleted: completedFields,
      totalRequiredFields: totalFields
    };
  }, [section]);

  // Generate context-aware AI suggestions
  const aiSuggestions: AISuggestion[] = useMemo(() => {
    const suggestions: AISuggestion[] = [];

    // Critical: Missing required fields
    if (!section.title || !section.videoUrl) {
      suggestions.push({
        id: 'complete-basics',
        type: 'warning',
        priority: 'high',
        title: 'Complete Required Fields',
        description: `Missing: ${!section.title ? 'Section Title' : ''} ${!section.videoUrl ? 'Video Content' : ''}`,
        actions: [
          {
            label: 'Generate with AI',
            icon: Sparkles,
            onClick: () => setShowAIAssistant(true),
            variant: 'default'
          }
        ]
      });
    }

    // Enhancement: Add interactive content
    if (contentStats.totalCodeBlocks === 0 && contentStats.totalMathEquations === 0) {
      suggestions.push({
        id: 'add-interactive',
        type: 'info',
        priority: 'medium',
        title: 'Enhance with Interactive Content',
        description: 'Add code examples or mathematical equations to improve engagement',
        actions: [
          {
            label: 'Add Code',
            icon: Code2,
            variant: 'outline'
          },
          {
            label: 'Add Math',
            icon: FileQuestion,
            variant: 'outline'
          }
        ]
      });
    }

    // Success: Well-structured section
    if (contentStats.completionPercentage === 100 && contentStats.totalCodeBlocks > 0) {
      suggestions.push({
        id: 'optimize-content',
        type: 'success',
        priority: 'low',
        title: 'Excellent Progress!',
        description: 'Your section is comprehensive. Consider adding assessments for student evaluation.',
        actions: [
          {
            label: 'Create Assessment',
            icon: FileQuestion,
            variant: 'secondary'
          }
        ]
      });
    }

    return suggestions;
  }, [section, contentStats, setShowAIAssistant]);

  // Keyboard navigation handler
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch(event.key) {
        case 's':
          event.preventDefault();
          // Trigger save action
          break;
        case 'p':
          event.preventDefault();
          // Toggle preview
          break;
      }
    }
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        {/* Professional Breadcrumb Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="w-full px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12 md:h-14">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center min-w-0 flex-1 overflow-hidden">
                <ol className="flex items-center text-sm text-gray-500 dark:text-gray-400 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <li className="flex items-center flex-shrink-0">
                    <Link
                      href="/teacher/courses"
                      className="hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
                    >
                      Courses
                    </Link>
                  </li>
                  <li className="flex items-center flex-shrink-0">
                    <span className="mx-2 text-gray-300 dark:text-gray-600">/</span>
                    <Link
                      href={`/teacher/courses/${params.courseId}`}
                      className="hover:text-gray-900 dark:hover:text-white transition-colors max-w-[200px] truncate"
                      title={chapter.course.title}
                    >
                      {chapter.course.title}
                    </Link>
                  </li>
                  <li className="flex items-center flex-shrink-0">
                    <span className="mx-2 text-gray-300 dark:text-gray-600">/</span>
                    <Link
                      href={`/teacher/courses/${params.courseId}/chapters/${params.chapterId}`}
                      className="hover:text-gray-900 dark:hover:text-white transition-colors max-w-[200px] truncate"
                      title={chapter.title}
                    >
                      {chapter.title}
                    </Link>
                  </li>
                  <li className="flex items-center flex-shrink-0">
                    <span className="mx-2 text-gray-300 dark:text-gray-600">/</span>
                    <span
                      className="text-gray-900 dark:text-white font-medium max-w-[200px] truncate"
                      title={section.title || 'New Section'}
                    >
                      {section.title || 'New Section'}
                    </span>
                  </li>
                </ol>
              </nav>

              {/* Right Actions */}
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/courses/${params.courseId}/learn/${params.chapterId}/sections/${params.sectionId}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 h-9 px-3 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Preview</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Preview as Student</TooltipContent>
                </Tooltip>

                <Badge
                  variant="outline"
                  className={cn(
                    "h-7 px-2.5 text-xs font-medium border rounded-md",
                    section.isPublished
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                  )}
                >
                  {section.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-[3px] bg-gray-100 dark:bg-gray-800">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${contentStats.completionPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Warning Banner for Unpublished Content */}
        <AnimatePresence>
          {!section.isPublished && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 pt-2 sm:pt-4"
            >
              <Banner
                variant="warning"
                label="This section is unpublished and not visible to students. Complete all required fields and publish when ready."
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="w-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-4 sm:py-6">
          {/* Page Header with Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 md:mb-8"
          >
            <Card className="shadow-md rounded-lg sm:rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
              <CardHeader className="p-4 sm:p-5 md:p-6 pb-4 sm:pb-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5 md:gap-6">
                  <div className="space-y-3 sm:space-y-3.5 flex-1 min-w-0">
                    <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2.5 sm:gap-3">
                      <Link
                        href={`/teacher/courses/${params.courseId}/chapters/${params.chapterId}`}
                        className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-muted/50 hover:bg-muted transition-colors flex-shrink-0"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-1.5" />
                        <span className="hidden xs:inline sm:inline">Back to Chapter</span>
                        <span className="xs:hidden">Back</span>
                      </Link>
                      {section.isFree && (
                        <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1 flex-shrink-0">
                          <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="whitespace-nowrap">Free Preview</span>
                        </Badge>
                      )}
                    </div>

                    <div className="min-w-0">
                      <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent break-words">
                        Section Configuration
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm md:text-base mt-1.5 sm:mt-2 hidden sm:block">
                        Build comprehensive learning content with videos, code examples, and interactive materials
                      </CardDescription>
                      <CardDescription className="text-xs mt-1.5 sm:hidden">
                        Build learning content
                      </CardDescription>
                    </div>
                  </div>

                  {/* Completion Metrics */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2.5 md:gap-3 lg:gap-4 flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                        {contentStats.completionPercentage}%
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                        {contentStats.requiredFieldsCompleted}/{contentStats.totalRequiredFields} Required Fields
                      </div>
                    </div>

                    <div className="w-full sm:w-auto">
                      <SectionActions
                        disabled={contentStats.completionPercentage < 100}
                        courseId={params.courseId}
                        chapterId={params.chapterId}
                        sectionId={params.sectionId}
                        isPublished={section.isPublished}
                      />
                    </div>
                  </div>
                </div>

                {/* Content Metrics Dashboard */}
                <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 md:pt-6 border-t border-gray-200/70 dark:border-gray-800/70">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                    <h4 className="text-[10px] sm:text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Content Analytics
                    </h4>
                    <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                      <Button
                        variant={activeMetricView === 'overview' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveMetricView('overview')}
                        className="flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                      >
                        Overview
                      </Button>
                      <Button
                        variant={activeMetricView === 'detailed' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveMetricView('detailed')}
                        className="flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                      >
                        Detailed
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeMetricView === 'overview' ? (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4"
                      >
                        <MetricCard
                          icon={Video}
                          label="Videos"
                          value={contentStats.totalVideos}
                          color="blue"
                          actionHint="Add video resources to help students learn visually"
                        />
                        <MetricCard
                          icon={BookOpen}
                          label="Blogs"
                          value={contentStats.totalBlogs}
                          color="green"
                          actionHint="Link to blog posts for deeper reading"
                        />
                        <MetricCard
                          icon={FileQuestion}
                          label="Articles"
                          value={contentStats.totalArticles}
                          color="purple"
                          actionHint="Add articles to expand on concepts"
                        />
                        <MetricCard
                          icon={Code2}
                          label="Code"
                          value={contentStats.totalCodeBlocks}
                          color="orange"
                          actionHint="Add code examples with explanations"
                        />
                        <MetricCard
                          icon={Activity}
                          label="Math"
                          value={contentStats.totalMathEquations}
                          color="pink"
                          actionHint="Add mathematical equations and formulas"
                        />
                        <MetricCard
                          icon={BarChart3}
                          label="Notes"
                          value={contentStats.totalNotes}
                          color="cyan"
                          actionHint="Add study notes and key takeaways"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="detailed"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-3"
                      >
                        <DetailedMetric
                          label="Video Content"
                          current={contentStats.totalVideos}
                          recommended={3}
                          icon={Video}
                        />
                        <DetailedMetric
                          label="Interactive Code"
                          current={contentStats.totalCodeBlocks}
                          recommended={2}
                          icon={Code2}
                        />
                        <DetailedMetric
                          label="Learning Resources"
                          current={contentStats.totalBlogs + contentStats.totalArticles}
                          recommended={4}
                          icon={BookOpen}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Two-Column Section Configuration */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
            {/* Left Column - Section Title, Access Settings & Video */}
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Section Title Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Section Title
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Give your section a descriptive title</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <SectionTitleForm
                      initialData={section}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                      sectionId={params.sectionId}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Access Settings Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Access Settings
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Control who can access this section</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <SectionAccessForm
                      initialData={section}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                      sectionId={params.sectionId}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Video Content Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <Video className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Video Content
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Primary learning material for this section</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <SectionYoutubeVideoForm
                      initialData={{ videoUrl: section.videoUrl ?? null }}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                      sectionId={params.sectionId}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Description & Learning Objectives */}
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Section Description Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Section Description
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Provide a detailed overview of this section</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <SectionDescriptionForm
                      initialData={{ description: section.description ?? null, title: section.title }}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                      sectionId={params.sectionId}
                      chapterTitle={chapter.title}
                      courseContext={courseContext}
                      chapterContext={chapterContext}
                      sectionContext={sectionContext}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Learning Objectives Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-rose-50/50 to-pink-50/30 dark:from-rose-950/20 dark:to-pink-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Learning Objectives
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Define what students will learn in this section</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <SectionLearningObjectivesForm
                      initialData={{ learningObjectives: section.learningObjectives ?? null, title: section.title }}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                      sectionId={params.sectionId}
                      chapterTitle={chapter.title}
                      courseContext={courseContext}
                      chapterContext={chapterContext}
                      sectionContext={sectionContext}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Full Width Interactive Learning Materials Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-md rounded-lg sm:rounded-xl border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
              <CardHeader className="p-3 sm:p-4 md:p-5 lg:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Brain className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                      <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1 sm:mb-2">
                        Interactive Learning Materials
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                        Enrich your section with supplementary content like videos, blog posts, articles, and code examples.
                        Share the best available resources to help students grasp concepts clearly and thoroughly.
                        Quality materials make complex topics accessible and engaging.
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 md:mt-5 border-b border-slate-200/50 dark:border-slate-700/50" />
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-6">
                <TabsContainer
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  sectionId={params.sectionId}
                  initialData={{
                    chapter: {
                      id: chapter.id,
                      title: chapter.title,
                      sections: chapter.sections
                    },
                    codeExplanations: section.codeExplanations || [],
                    mathExplanations: section.mathExplanations || [],
                    videos: (section.videos || []).map(v => ({ ...v })),
                    blogs: (section.blogs || []).map(b => ({ ...b })),
                    articles: (section.articles || []).map(a => ({ ...a })),
                    notes: (section.notes || []).map(n => ({ ...n }))
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Create Exam Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 sm:mt-6 md:mt-8"
          >
            <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
              <CardHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-500 shadow-lg shadow-indigo-500/20 flex-shrink-0">
                    <FileQuestion className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent truncate">
                      Create Exam
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Design assessments to evaluate student learning</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <ExamTab
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  sectionId={params.sectionId}
                  initialData={{
                    section: {
                      title: section.title
                    },
                    chapter: {
                      title: chapter.title
                    },
                    course: {
                      title: chapter.course.title
                    }
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Helper Components

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan';
  actionHint?: string;
}

const MetricCard = ({ icon: Icon, label, value, color, actionHint }: MetricCardProps) => {
  const colorConfig = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20',
      border: 'border-blue-200/60 dark:border-blue-700/40',
      text: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500/10',
      hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-600',
      hoverShadow: 'hover:shadow-blue-500/10',
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20',
      border: 'border-emerald-200/60 dark:border-emerald-700/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-600',
      hoverShadow: 'hover:shadow-emerald-500/10',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20',
      border: 'border-purple-200/60 dark:border-purple-700/40',
      text: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500/10',
      hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-600',
      hoverShadow: 'hover:shadow-purple-500/10',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20',
      border: 'border-orange-200/60 dark:border-orange-700/40',
      text: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-500/10',
      hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-600',
      hoverShadow: 'hover:shadow-orange-500/10',
    },
    pink: {
      bg: 'bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/40 dark:to-pink-900/20',
      border: 'border-pink-200/60 dark:border-pink-700/40',
      text: 'text-pink-600 dark:text-pink-400',
      iconBg: 'bg-pink-500/10',
      hoverBorder: 'hover:border-pink-300 dark:hover:border-pink-600',
      hoverShadow: 'hover:shadow-pink-500/10',
    },
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/40 dark:to-cyan-900/20',
      border: 'border-cyan-200/60 dark:border-cyan-700/40',
      text: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      hoverBorder: 'hover:border-cyan-300 dark:hover:border-cyan-600',
      hoverShadow: 'hover:shadow-cyan-500/10',
    },
  };

  const config = colorConfig[color];
  const isEmpty = value === 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative p-3 sm:p-3.5 md:p-4 rounded-xl backdrop-blur-sm cursor-pointer",
            "border",
            config.bg,
            config.border,
            config.hoverBorder,
            "transition-all duration-300",
            "hover:shadow-lg",
            config.hoverShadow,
            "min-h-[72px] sm:min-h-[80px] md:min-h-[90px]",
            "flex flex-col justify-between",
            "group overflow-hidden"
          )}
        >
          {/* Decorative gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/40 dark:from-white/0 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Icon with background */}
          <div className={cn(
            "relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2",
            config.iconBg,
            "transition-transform duration-300 group-hover:scale-110"
          )}>
            <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", config.text)} />
          </div>

          {/* Value with empty state styling */}
          <div className="relative z-10">
            <div className={cn(
              "text-xl sm:text-2xl md:text-3xl font-bold leading-tight",
              config.text,
              isEmpty && "opacity-40"
            )}>
              {value}
            </div>
            <div className={cn(
              "text-[10px] sm:text-xs font-medium mt-0.5",
              isEmpty ? "text-muted-foreground" : config.text,
              "opacity-80"
            )}>
              {label}
            </div>
          </div>

          {/* Empty state indicator */}
          {isEmpty && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse" />
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <p className="text-xs">
          {isEmpty
            ? actionHint || `Add ${label.toLowerCase()} to enhance your section`
            : `${value} ${label.toLowerCase()} added`
          }
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

interface DetailedMetricProps {
  label: string;
  current: number;
  recommended: number;
  icon: React.ComponentType<{ className?: string }>;
}

const DetailedMetric = ({ label, current, recommended, icon: Icon }: DetailedMetricProps) => {
  const percentage = Math.min((current / recommended) * 100, 100);
  const isOptimal = current >= recommended;

  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
      <Icon className={cn(
        "h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0",
        isOptimal ? "text-green-500" : "text-muted-foreground"
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1 gap-2">
          <span className="text-xs sm:text-sm font-medium text-foreground truncate">{label}</span>
          <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
            {current}/{recommended}
          </span>
        </div>
        <Progress value={percentage} className="h-1.5 sm:h-2" />
      </div>
      {isOptimal && <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />}
    </div>
  );
};

const AISuggestionCard = ({ suggestion }: { suggestion: AISuggestion }) => {
  const typeStyles = {
    info: 'border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400',
    warning: 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400',
    success: 'border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400',
    tip: 'border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400',
  };

  const iconComponents = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle2,
    tip: Lightbulb,
  };

  const Icon = iconComponents[suggestion.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-lg border backdrop-blur-sm",
        typeStyles[suggestion.type]
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium mb-1 text-foreground">{suggestion.title}</h4>
          <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
          {suggestion.actions && suggestion.actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestion.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || 'outline'}
                  onClick={action.onClick}
                  className="gap-1.5"
                >
                  {action.icon && <action.icon className="h-3.5 w-3.5" />}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
