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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        {/* Enterprise Header with Status Bar */}
        <div className="sticky top-0 z-40 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-800/70 shadow-sm">
          <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm overflow-x-auto max-w-full">
                <Link href="/teacher/courses" className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                  Courses
                </Link>
                <span className="text-muted-foreground/50">/</span>
                <Link href={`/teacher/courses/${params.courseId}`} className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[60px] sm:max-w-[100px]">
                  {chapter.course.title}
                </Link>
                <span className="text-muted-foreground/50">/</span>
                <Link href={`/teacher/courses/${params.courseId}/chapters/${params.chapterId}`} className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[60px] sm:max-w-[100px]">
                  {chapter.title}
                </Link>
                <span className="text-muted-foreground/50">/</span>
                <span className="text-foreground font-medium truncate max-w-[80px] sm:max-w-none">{section.title || 'New Section'}</span>
              </nav>

              {/* Quick Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 h-7 sm:h-8 px-2 sm:px-3">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Preview</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview as Student (Ctrl+P)</TooltipContent>
                </Tooltip>

                <Badge variant={section.isPublished ? "default" : "secondary"} className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                  <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {section.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-0.5 sm:h-1 bg-gray-200/70 dark:bg-gray-800/70">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 with-progress-shimmer"
              initial={{ width: 0 }}
              animate={{ width: `${contentStats.completionPercentage}%` }}
              transition={{ duration: 0.5 }}
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
              className="container mx-auto px-2 sm:px-4 pt-2 sm:pt-4"
            >
              <Banner
                variant="warning"
                label="This section is unpublished and not visible to students. Complete all required fields and publish when ready."
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
          {/* Page Header with Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 md:mb-8"
          >
            <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
              <CardHeader className="p-3 sm:p-4 md:p-6 pb-3 sm:pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                      <Link
                        href={`/teacher/courses/${params.courseId}/chapters/${params.chapterId}`}
                        className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                        <span className="hidden sm:inline">Back to Chapter</span>
                        <span className="sm:hidden">Back</span>
                      </Link>
                      {section.isFree && (
                        <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                          <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          Free Preview
                        </Badge>
                      )}
                    </div>

                    <div>
                      <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        Section Configuration
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2 hidden sm:block">
                        Build comprehensive learning content with videos, code examples, and interactive materials
                      </CardDescription>
                      <CardDescription className="text-xs mt-1 sm:hidden">
                        Build learning content
                      </CardDescription>
                    </div>
                  </div>

                  {/* Completion Metrics */}
                  <div className="flex flex-col items-start sm:items-end gap-2 sm:gap-3 md:gap-4">
                    <div className="text-left sm:text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-foreground">
                        {contentStats.completionPercentage}%
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {contentStats.requiredFieldsCompleted}/{contentStats.totalRequiredFields} Required Fields
                      </div>
                    </div>

                    <SectionActions
                      disabled={contentStats.completionPercentage < 100}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                      sectionId={params.sectionId}
                      isPublished={section.isPublished}
                    />
                  </div>
                </div>

                {/* Content Metrics Dashboard */}
                <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 md:pt-6 border-t border-gray-200/70 dark:border-gray-800/70">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Content Analytics
                    </h4>
                    <div className="flex gap-1 w-full sm:w-auto">
                      <Button
                        variant={activeMetricView === 'overview' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveMetricView('overview')}
                        className="flex-1 sm:flex-none h-7 sm:h-8 text-xs sm:text-sm"
                      >
                        Overview
                      </Button>
                      <Button
                        variant={activeMetricView === 'detailed' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveMetricView('detailed')}
                        className="flex-1 sm:flex-none h-7 sm:h-8 text-xs sm:text-sm"
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
                        />
                        <MetricCard
                          icon={BookOpen}
                          label="Blogs"
                          value={contentStats.totalBlogs}
                          color="green"
                        />
                        <MetricCard
                          icon={FileQuestion}
                          label="Articles"
                          value={contentStats.totalArticles}
                          color="purple"
                        />
                        <MetricCard
                          icon={Code2}
                          label="Code"
                          value={contentStats.totalCodeBlocks}
                          color="orange"
                        />
                        <MetricCard
                          icon={Activity}
                          label="Math"
                          value={contentStats.totalMathEquations}
                          color="pink"
                        />
                        <MetricCard
                          icon={BarChart3}
                          label="Notes"
                          value={contentStats.totalNotes}
                          color="cyan"
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
            {/* Left Column - Section Title + Access Settings & Video */}
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Section Title & Access Settings Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
                  <CardHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 flex-shrink-0">
                        <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Section Title & Access
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Basic section configuration and permissions</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
                    <SectionTitleForm
                      initialData={section}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                      sectionId={params.sectionId}
                    />
                    <Separator />
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
                <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
                  <CardHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 flex-shrink-0">
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

            {/* Right Column - Learning Objectives & Description */}
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Learning Objectives Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
                  <CardHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 flex-shrink-0">
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
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Section Description Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
                  <CardHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 flex-shrink-0">
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
            <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
              <CardHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-500 shadow-lg shadow-indigo-500/20 flex-shrink-0">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent truncate">
                      Interactive Learning Materials
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Enhance learning with diverse content types</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <TabsContainer
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  sectionId={params.sectionId}
                  initialData={{
                    chapter: {
                      id: chapter.id,
                      title: chapter.title,
                      sections: []
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
}

const MetricCard = ({ icon: Icon, label, value, color }: MetricCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400',
    pink: 'bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400',
    cyan: 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
  };

  return (
    <div className={cn(
      "p-2 sm:p-3 rounded-lg backdrop-blur-sm",
      colorClasses[color],
      "transition-all duration-200 hover:scale-105 hover:shadow-lg"
    )}>
      <Icon className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
      <div className="text-xl sm:text-2xl font-bold">{value}</div>
      <div className="text-[10px] sm:text-xs opacity-70">{label}</div>
    </div>
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
