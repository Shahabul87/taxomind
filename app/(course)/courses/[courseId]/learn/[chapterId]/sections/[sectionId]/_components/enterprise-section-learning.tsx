"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLearningMode } from "../../../../_components/learning-mode-context";
import { SectionYouTubePlayer, type SectionYouTubePlayerRef } from "./section-youtube-player";
import { SectionContentTabs } from "./section-content-tabs";
import { SectionHeader } from "./section-header";
import { SectionSidebar } from "./section-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
  PanelLeftClose,
  PanelRightOpen,
  Brain,
  Heart,
  Award,
  X,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useKeyboardNavigation } from "./keyboard-navigation";
import { useAnalytics, ANALYTICS_EVENTS } from "./learning-analytics-tracker";
import { MathAwareHtmlRenderer } from "./math-aware-html-renderer";
import { DiscussionForum } from "@/components/learning/discussion-forum";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logger } from "@/lib/logger";
import { StudyGuideGenerator } from "@/components/sam/study-guide";
import { useEmotionDetection, getEmotionSupportMessage } from "@/hooks/use-emotion-detection";
import { useLearningStyle, getStyleAdaptations } from "@/hooks/use-learning-style";
import { useSAMPageContext } from "@sam-ai/react";

import type { UserWithRelations } from "@/types/learning";
import type {
  LearningPageData,
  LearningPageChapter,
  LearningPageSection,
} from "@/lib/queries/learning-queries";
import type { user_progress } from "@prisma/client";

interface EnterpriseSectionLearningProps {
  user: UserWithRelations | null;
  course: LearningPageData;
  currentChapter: LearningPageChapter;
  currentSection: LearningPageSection;
  nextSection: LearningPageSection | null;
  prevSection: LearningPageSection | null;
  nextChapterSection: { section: LearningPageSection; chapter: LearningPageChapter } | null;
  totalSections: number;
  completedSections: number;
  courseId: string;
  chapterId: string;
  sectionId: string;
  userProgress?: user_progress | null;
}

export function EnterpriseSectionLearning({
  user,
  course,
  currentChapter,
  currentSection,
  nextSection,
  prevSection,
  nextChapterSection,
  totalSections,
  completedSections,
  courseId,
  chapterId,
  sectionId,
  userProgress,
}: EnterpriseSectionLearningProps) {
  const router = useRouter();
  const { mode, isPreviewMode, canTrackProgress } = useLearningMode();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sectionCompleted, setSectionCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoPlayerRef = useRef<SectionYouTubePlayerRef | null>(null);

  // Initialize analytics tracking
  const analytics = useAnalytics({
    courseId,
    chapterId,
    sectionId,
    contentType: "section",
  });

  // Initialize SAM AI emotion detection
  const {
    emotionState,
    showNotification: showEmotionNotification,
    dismissNotification: dismissEmotionNotification,
    recordInteraction,
  } = useEmotionDetection({
    userId: user?.id,
    courseId,
    sectionId,
    autoDetect: canTrackProgress,
    onNegativeEmotion: (state) => {
      // Log emotion for analytics
      analytics.trackEvent("EMOTION_DETECTED", {
        emotion: state.currentEmotion,
        confidence: state.confidence,
      });
    },
  });

  // Initialize SAM AI learning style detection
  const {
    learningStyle,
    isDetected: isLearningStyleDetected,
    getContentRecommendations,
  } = useLearningStyle({
    userId: user?.id,
    courseId,
    autoDetect: canTrackProgress,
  });

  // SAM Page Context - Track section learning context
  const { updatePage } = useSAMPageContext();

  useEffect(() => {
    updatePage({
      type: "section-learning",
      path: `/courses/${courseId}/learn/${chapterId}/sections/${sectionId}`,
      entityId: sectionId,
      parentEntityId: chapterId,
      grandParentEntityId: courseId,
      metadata: {
        entityType: 'section',
        entityData: {
          title: currentSection.title,
          description: currentSection.description ?? null,
          contentType: currentSection.type ?? null,
          courseId,
          courseTitle: course.title,
          chapterId,
          chapterTitle: currentChapter.title,
          isCompleted: sectionCompleted,
        },
        courseId,
        courseTitle: course.title,
        chapterId,
        chapterTitle: currentChapter.title,
        sectionId,
        sectionTitle: currentSection.title,
        sectionType: currentSection.type,
        totalSections,
        completedSections,
        isCompleted: sectionCompleted,
        activeTab,
      },
    });
  }, [
    updatePage,
    courseId,
    course.title,
    chapterId,
    currentChapter.title,
    sectionId,
    currentSection.title,
    currentSection.description,
    currentSection.type,
    totalSections,
    completedSections,
    sectionCompleted,
    activeTab,
  ]);

  // State for showing learning style tips
  const [showLearningStyleTip, setShowLearningStyleTip] = useState(false);

  // Show learning style tip when first detected
  useEffect(() => {
    if (isLearningStyleDetected && learningStyle && !localStorage.getItem(`learning-style-tip-shown-${user?.id}`)) {
      setShowLearningStyleTip(true);
      localStorage.setItem(`learning-style-tip-shown-${user?.id}`, "true");
    }
  }, [isLearningStyleDetected, learningStyle, user?.id]);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('learning-sidebar-open');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
  }, []);

  // Persist sidebar state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('learning-sidebar-open', String(sidebarOpen));
    }
  }, [sidebarOpen, mounted]);

  // Check if section is already completed
  useEffect(() => {
    if (userProgress?.overallProgress && userProgress.overallProgress >= 100) {
      setSectionCompleted(true);
    }
  }, [userProgress]);

  // Keyboard navigation handlers
  const handlePlayPause = () => {
    if (videoPlayerRef.current) {
      const playerState = videoPlayerRef.current.getPlayerState();
      if (playerState === 1) { // Playing
        videoPlayerRef.current.pauseVideo();
        analytics.trackVideoEvent(ANALYTICS_EVENTS.VIDEO_PAUSED);
      } else {
        videoPlayerRef.current.playVideo();
        analytics.trackVideoEvent(ANALYTICS_EVENTS.VIDEO_RESUMED);
      }
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const videoContainer = document.querySelector('.video-container');
      if (videoContainer) {
        videoContainer.requestFullscreen().catch(err => {
          logger.error('Error attempting to enable fullscreen', err instanceof Error ? err : new Error(String(err)));
        });
      }
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Setup keyboard navigation
  useKeyboardNavigation({
    onPlayPause: handlePlayPause,
    onNextSection: () => {
      analytics.trackEvent(ANALYTICS_EVENTS.KEYBOARD_SHORTCUT_USED, { action: "next" });
      handleNext();
    },
    onPrevSection: () => {
      analytics.trackEvent(ANALYTICS_EVENTS.KEYBOARD_SHORTCUT_USED, { action: "prev" });
      handlePrevious();
    },
    onToggleSidebar: () => {
      analytics.trackEvent(ANALYTICS_EVENTS.SIDEBAR_TOGGLED);
      setSidebarOpen(!sidebarOpen);
    },
    onToggleFullscreen: handleToggleFullscreen,
    onTabSwitch: (tab: string) => {
      analytics.trackEvent(ANALYTICS_EVENTS.TAB_SWITCHED, { from: activeTab, to: tab });
      setActiveTab(tab);
    },
    tabs: ["overview", "videos", "blogs", "math", "code", "exams", "resources"],
    currentTab: ["overview", "videos", "blogs", "math", "code", "exams", "resources"].indexOf(activeTab),
  });

  // Handle section completion
  const handleSectionComplete = async () => {
    if (!canTrackProgress || !user?.id) return;

    try {
      const response = await fetch(`/api/sections/${sectionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        setSectionCompleted(true);
        setShowCompletionModal(true);
        toast.success("🎉 Congratulations! Section completed!");

        // Track section completion
        analytics.trackEvent(ANALYTICS_EVENTS.SECTION_COMPLETED, {
          courseId,
          chapterId,
          sectionId,
        });
      }
    } catch (error) {
      logger.error("Error completing section", error instanceof Error ? error : new Error(String(error)));
    }
  };

  // Navigation functions
  const navigateToSection = (section: SectionWithProgress, targetChapterId?: string) => {
    const chapterIdToUse = targetChapterId || currentChapter.id;
    router.push(`/courses/${courseId}/learn/${chapterIdToUse}/sections/${section.id}`);
  };

  const handlePrevious = () => {
    if (prevSection) {
      analytics.trackNavigation("prev", prevSection.id);
      navigateToSection(prevSection);
    }
  };

  const handleNext = () => {
    if (nextSection) {
      analytics.trackNavigation("next", nextSection.id);
      navigateToSection(nextSection);
    } else if (nextChapterSection) {
      analytics.trackNavigation("next", nextChapterSection.section.id);
      navigateToSection(nextChapterSection.section, nextChapterSection.chapter.id);
    }
  };

  // Calculate content counts for conditional rendering
  const contentCounts = {
    videos: currentSection.videos?.length || 0,
    articles: currentSection.blogs?.length || 0,
    math: currentSection.mathExplanations?.length || 0,
    code: currentSection.codeExplanations?.length || 0,
  };
  const totalContent = Object.values(contentCounts).reduce((a, b) => a + b, 0);

  // Calculate display duration: use section duration or estimate from description word count
  const durationMinutes = currentSection.duration
    ? Math.floor(currentSection.duration / 60)
    : 0;
  const estimatedReadingMinutes = currentSection.description
    ? Math.max(1, Math.ceil(currentSection.description.replace(/<[^>]*>/g, "").split(/\s+/).length / 200))
    : 0;
  const displayMinutes = durationMinutes > 0 ? durationMinutes : estimatedReadingMinutes;

  // Strip leading heading from description if it duplicates the section title
  const descriptionHtml = (() => {
    if (!currentSection.description) return null;
    const html = currentSection.description;
    const titleNormalized = currentSection.title.trim().toLowerCase().replace(/[^\w\s]/g, "");
    // Match opening h1-h3 tag at the start of the description
    const headingMatch = html.match(/^\s*<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
    if (headingMatch) {
      const headingText = headingMatch[1].replace(/<[^>]*>/g, "").trim().toLowerCase().replace(/[^\w\s]/g, "");
      if (headingText === titleNormalized) {
        return html.replace(headingMatch[0], "").trim();
      }
    }
    return html;
  })();

  return (
    <div className="min-h-screen bg-[hsl(var(--learning-surface))]">
      {/* Section Header */}
      <SectionHeader
        course={course}
        chapter={currentChapter}
        section={currentSection}
        progress={(completedSections / totalSections) * 100}
        isPreviewMode={isPreviewMode}
      />

      {/* Mobile Sidebar Drawer - visible below xl breakpoint */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="right" className="w-[340px] sm:w-[380px] p-0 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <SheetHeader className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <SheetTitle className="text-sm font-medium text-slate-900 dark:text-white">
              Course Navigation
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-57px)]">
            <div className="p-3">
              <SectionSidebar
                course={course}
                currentChapter={currentChapter}
                currentSection={currentSection}
                courseId={courseId}
                chapterId={chapterId}
                sectionId={sectionId}
                userProgress={userProgress}
                totalSections={totalSections}
                completedSections={completedSections}
                onToggle={() => setMobileSidebarOpen(false)}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 py-6 lg:py-8">
        {/* Mobile sidebar toggle - only visible below xl */}
        <div className="xl:hidden flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex items-center gap-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <PanelRightOpen className="h-4 w-4" />
            <span className="text-sm">Course Navigation</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Content Column */}
          <motion.div
            className={cn(
              "space-y-6",
              sidebarOpen ? "xl:col-span-8" : "xl:col-span-12 xl:max-w-4xl xl:mx-auto"
            )}
            layout
            transition={{ duration: 0.2 }}
          >
            {/* Section Hero — no card boxing, generous breathing room */}
            <section className="pt-2 pb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1
                    className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white"
                    style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}
                  >
                    {currentSection.title}
                  </h1>
                  {descriptionHtml && (
                    <div style={{ fontFamily: 'var(--font-body, "Source Serif 4", Charter, Georgia, serif)' }}>
                      <MathAwareHtmlRenderer
                        html={descriptionHtml}
                        className="mt-4 text-slate-600 dark:text-slate-400 prose prose-base dark:prose-invert max-w-none overflow-hidden break-words leading-relaxed"
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0 pt-1">
                  {displayMinutes > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-0">
                      <Clock className="h-3 w-3" />
                      {displayMinutes} min{durationMinutes === 0 ? " read" : ""}
                    </Badge>
                  )}
                  {sectionCompleted && (
                    <Badge className="flex items-center gap-1.5 text-xs bg-[hsl(var(--learning-accent-light))] text-[hsl(var(--learning-accent))] border border-[hsl(var(--learning-accent)/0.3)]">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content Stats — inline pills below title */}
              {totalContent > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {contentCounts.videos > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800/60 text-xs border border-slate-200/60 dark:border-slate-700/40">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{contentCounts.videos}</span>
                      <span className="text-slate-500 dark:text-slate-400">Video{contentCounts.videos !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {contentCounts.articles > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800/60 text-xs border border-slate-200/60 dark:border-slate-700/40">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{contentCounts.articles}</span>
                      <span className="text-slate-500 dark:text-slate-400">Article{contentCounts.articles !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {contentCounts.math > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800/60 text-xs border border-slate-200/60 dark:border-slate-700/40">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{contentCounts.math}</span>
                      <span className="text-slate-500 dark:text-slate-400">Math</span>
                    </div>
                  )}
                  {contentCounts.code > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800/60 text-xs border border-slate-200/60 dark:border-slate-700/40">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{contentCounts.code}</span>
                      <span className="text-slate-500 dark:text-slate-400">Code</span>
                    </div>
                  )}
                </div>
              )}

              {/* Learning Objectives — accent-bordered checklist style */}
              {currentSection.learningObjectives && (
                <div className="mt-6 pl-4 border-l-[3px] border-[hsl(var(--learning-accent))]">
                  <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-slate-900 dark:text-white">
                    <Target className="h-4 w-4 text-[hsl(var(--learning-accent))]" />
                    Learning Objectives
                  </h3>
                  <MathAwareHtmlRenderer
                    html={
                      currentSection.learningObjectives.includes("<li>")
                        ? currentSection.learningObjectives
                        : `<ul>${currentSection.learningObjectives
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .map((line) => `<li>${line}</li>`)
                            .join("")}</ul>`
                    }
                    className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 [&>ul]:list-none [&>ul]:ml-0 [&>ul]:pl-0 [&>ul>li]:mb-2 [&>ul>li]:text-sm [&>ul>li]:leading-relaxed [&>ul>li]:flex [&>ul>li]:items-start [&>ul>li]:gap-2 [&>ul>li::before]:content-[''] [&>ul>li]:pl-6 [&>ul>li]:relative [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[0.45em] [&>ul>li]:before:h-2 [&>ul>li]:before:w-2 [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-[hsl(var(--learning-accent)/0.5)]"
                  />
                </div>
              )}
            </section>

            {/* Main Video Player — no card wrapper, full-bleed feel */}
            {currentSection.videoUrl && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Main Lecture
                </h2>
                <div className="video-container rounded-xl overflow-hidden shadow-md">
                  <SectionYouTubePlayer
                    videoUrl={currentSection.videoUrl}
                    sectionId={sectionId}
                    sectionTitle={currentSection.title}
                    onComplete={handleSectionComplete}
                    ref={videoPlayerRef}
                  />
                </div>
              </section>
            )}

            {/* Navigation Controls — lightweight divider, no card */}
            <nav className="py-4 border-y border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={!prevSection}
                  className="flex items-center gap-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 dark:hover:bg-white dark:hover:text-slate-900 dark:hover:border-white text-slate-700 dark:text-slate-300 transition-all duration-200 hover:scale-[1.02] disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white disabled:hover:text-slate-400 disabled:hover:scale-100 dark:disabled:border-slate-700 dark:disabled:text-slate-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex items-center gap-3">
                  {canTrackProgress && (
                    <StudyGuideGenerator
                      courseId={courseId}
                      courseTitle={course.title}
                      sectionId={sectionId}
                      userId={user?.id}
                      variant="compact"
                    />
                  )}

                  {canTrackProgress && !sectionCompleted && (
                    <Button
                      variant="outline"
                      onClick={handleSectionComplete}
                      className="flex items-center gap-2 border-[hsl(var(--learning-accent)/0.3)] text-[hsl(var(--learning-accent))] hover:bg-[hsl(var(--learning-accent-light))] hover:text-[hsl(var(--learning-accent))] transition-all duration-200 hover:scale-[1.02]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Mark Complete</span>
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!nextSection && !nextChapterSection}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 transition-all duration-200 hover:scale-[1.02]"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Next Section Preview */}
              {(nextSection || nextChapterSection) && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--learning-accent-muted))] mb-1">
                    <Info className="h-3.5 w-3.5" />
                    Up Next
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {nextSection?.title || nextChapterSection?.section.title}
                  </p>
                  {!nextSection && nextChapterSection && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Chapter: {nextChapterSection.chapter.title}
                    </p>
                  )}
                </div>
              )}
            </nav>

            {/* Content Tabs - Learning Materials */}
            <SectionContentTabs
              section={currentSection}
              courseId={courseId}
              chapterId={chapterId}
              sectionId={sectionId}
              userProgress={userProgress}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Discussion Forum */}
            <DiscussionForum
              sectionId={sectionId}
              userId={user?.id ?? null}
              isEnrolled={canTrackProgress}
            />
          </motion.div>

          {/* Sidebar Column */}
          {sidebarOpen && (
            <motion.div
              className="hidden xl:block xl:col-span-4 relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <SectionSidebar
                course={course}
                currentChapter={currentChapter}
                currentSection={currentSection}
                courseId={courseId}
                chapterId={chapterId}
                sectionId={sectionId}
                userProgress={userProgress}
                totalSections={totalSections}
                completedSections={completedSections}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Completion Celebration Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCompletionModal(false)}
          >
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 30}%`,
                    backgroundColor: ['hsl(var(--learning-accent))', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'][i % 5],
                    animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
                    opacity: 0.9,
                  }}
                />
              ))}
            </div>

            <motion.div
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                {/* Celebration ring animation */}
                <div className="relative mx-auto w-20 h-20 mb-5">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40" cy="40" r="36"
                      fill="none"
                      stroke="hsl(var(--learning-accent) / 0.15)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="40" cy="40" r="36"
                      fill="none"
                      stroke="hsl(var(--learning-accent))"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="226"
                      style={{ animation: 'celebration-ring 1s ease-out forwards' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring", damping: 12 }}
                    >
                      <Award className="h-8 w-8 text-[hsl(var(--learning-accent))]" />
                    </motion.div>
                  </div>
                </div>

                <motion.h3
                  className="text-xl font-bold mb-2 text-slate-900 dark:text-white"
                  style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Section Complete!
                </motion.h3>
                <motion.p
                  className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  You&apos;ve completed this section. Keep up the great work!
                </motion.p>
                <motion.div
                  className="flex gap-3 justify-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCompletionModal(false)}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white hover:scale-[1.02] transition-all"
                  >
                    Review
                  </Button>
                  {(nextSection || nextChapterSection) && (
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="bg-[hsl(var(--learning-accent))] hover:bg-[hsl(var(--learning-accent)/0.9)] text-white hover:scale-[1.02] transition-transform"
                    >
                      Continue
                    </Button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts are shown in the Overview tab instead */}

      {/* SAM AI Emotion Support Notification */}
      <AnimatePresence>
        {showEmotionNotification && emotionState && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4"
          >
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    <Heart className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        SAM Assistant
                      </span>
                      <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800">
                        {emotionState.currentEmotion}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {emotionState.recommendation ?? getEmotionSupportMessage(emotionState.currentEmotion)}
                    </p>
                    {emotionState.suggestedAction && emotionState.suggestedAction.type !== "none" && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                          onClick={() => {
                            if (emotionState.suggestedAction?.type === "take_break") {
                              toast.info("Taking a 5-minute break. We will remind you to come back!");
                            } else if (emotionState.suggestedAction?.type === "show_help") {
                              setActiveTab("overview");
                            }
                            dismissEmotionNotification();
                          }}
                        >
                          {emotionState.suggestedAction.message}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                          onClick={dismissEmotionNotification}
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    onClick={dismissEmotionNotification}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SAM AI Learning Style Tip */}
      <AnimatePresence>
        {showLearningStyleTip && learningStyle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 z-50 max-w-xs"
          >
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    <Brain className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        Learning Style Detected
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      You appear to be a <span className="font-medium text-slate-900 dark:text-white capitalize">{learningStyle.primaryStyle}</span> learner.
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <Lightbulb className="h-3 w-3" />
                        Tips
                      </div>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {getContentRecommendations("general").slice(0, 2).map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-7 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                      onClick={() => setShowLearningStyleTip(false)}
                    >
                      Got it
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sidebar Toggle Button - Shows when sidebar is collapsed */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.15 }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-40"
          >
            <Button
              onClick={() => setSidebarOpen(true)}
              size="sm"
              className="h-10 w-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
              title="Show sidebar (Ctrl+B)"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SAM AI Course Learning Integration removed - cognitive load widget was cluttering the UI */}
    </div>
  );
}
