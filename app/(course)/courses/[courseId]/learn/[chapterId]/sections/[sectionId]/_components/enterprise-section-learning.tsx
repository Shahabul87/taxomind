"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLearningMode } from "../../../../_components/learning-mode-context";
import { SectionYouTubePlayer } from "./section-youtube-player";
import { SectionContentTabs } from "./section-content-tabs";
import { SectionHeader } from "./section-header";
import { SectionSidebar } from "./section-sidebar";
import { SectionProgressTracker } from "./section-progress-tracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Clock,
  Award,
  Target,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Info,
  PanelLeftClose,
  Brain,
  Heart,
  Sparkles,
  X,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useKeyboardNavigation } from "./keyboard-navigation";
import { useAnalytics, ANALYTICS_EVENTS } from "./learning-analytics-tracker";
import { SafeHtmlRenderer } from "./safe-html-renderer";
import { DiscussionForum } from "@/components/learning/discussion-forum";
import { FloatingKeyboardShortcuts } from "@/components/learning/keyboard-shortcuts-guide";
import { logger } from "@/lib/logger";
import { useEmotionDetection, getEmotionSupportMessage } from "@/hooks/use-emotion-detection";
import { useLearningStyle, getStyleAdaptations } from "@/hooks/use-learning-style";
import { useSAMPageContext } from "@sam-ai/react";

// SAM AI Course Learning Integration - Full AI mentor support during learning
import { SAMCourseLearningIntegration } from "@/components/sam/course-learning";
// Study Guide Generator - AI-powered personalized study plans
import { StudyGuideGenerator } from "@/components/sam/study-guide";
import type {
  UserWithRelations,
  CourseWithChapters,
  ChapterWithSections,
  SectionWithProgress,
  UserProgressData,
  NextChapterSection,
} from "@/types/learning";

interface EnterpriseSectionLearningProps {
  user: UserWithRelations | null;
  course: CourseWithChapters;
  currentChapter: ChapterWithSections;
  currentSection: SectionWithProgress;
  nextSection: SectionWithProgress | null;
  prevSection: SectionWithProgress | null;
  nextChapterSection: NextChapterSection | null;
  totalSections: number;
  completedSections: number;
  courseId: string;
  chapterId: string;
  sectionId: string;
  userProgress?: UserProgressData | null;
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
  const [sectionCompleted, setSectionCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoPlayerRef = useRef<{ getPlayerState: () => number; pauseVideo: () => void; playVideo: () => void } | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Section Header */}
      <SectionHeader
        course={course}
        chapter={currentChapter}
        section={currentSection}
        progress={(completedSections / totalSections) * 100}
        isPreviewMode={isPreviewMode}
      />

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Content Column */}
          <motion.div
            className={cn(
              "space-y-6",
              sidebarOpen ? "xl:col-span-8" : "xl:col-span-12"
            )}
            layout
            transition={{ duration: 0.2 }}
          >
            {/* Section Overview Card */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white leading-tight">
                      {currentSection.title}
                    </CardTitle>
                    {currentSection.description && (
                      <SafeHtmlRenderer
                        html={currentSection.description}
                        className="mt-3 text-slate-600 dark:text-slate-400 prose prose-sm dark:prose-invert max-w-none"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {currentSection.duration && (
                      <Badge variant="secondary" className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-0">
                        <Clock className="h-3 w-3" />
                        {Math.floor(currentSection.duration / 60)} min
                      </Badge>
                    )}
                    {sectionCompleted && (
                      <Badge className="flex items-center gap-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Learning Objectives */}
                {currentSection.learningObjectives && (
                  <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                    <h3 className="flex items-center gap-2 text-sm font-medium mb-3 text-slate-900 dark:text-white">
                      <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                      Learning Objectives
                    </h3>
                    <SafeHtmlRenderer
                      html={currentSection.learningObjectives}
                      className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 [&>ul]:list-disc [&>ul]:ml-5 [&>ul>li]:mb-1.5 [&>ul>li]:text-sm"
                    />
                  </div>
                )}
              </CardHeader>

              {/* Content Stats - Only show if there is content */}
              {totalContent > 0 && (
                <CardContent className="pt-0 pb-6">
                  <div className="flex flex-wrap gap-3">
                    {contentCounts.videos > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm">
                        <span className="font-medium text-slate-900 dark:text-white">{contentCounts.videos}</span>
                        <span className="text-slate-500 dark:text-slate-400">Video{contentCounts.videos !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {contentCounts.articles > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm">
                        <span className="font-medium text-slate-900 dark:text-white">{contentCounts.articles}</span>
                        <span className="text-slate-500 dark:text-slate-400">Article{contentCounts.articles !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {contentCounts.math > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm">
                        <span className="font-medium text-slate-900 dark:text-white">{contentCounts.math}</span>
                        <span className="text-slate-500 dark:text-slate-400">Math</span>
                      </div>
                    )}
                    {contentCounts.code > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm">
                        <span className="font-medium text-slate-900 dark:text-white">{contentCounts.code}</span>
                        <span className="text-slate-500 dark:text-slate-400">Code</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Main Video Player (if videoUrl exists) */}
            {currentSection.videoUrl && (
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">Main Lecture</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="video-container rounded-lg overflow-hidden">
                    <SectionYouTubePlayer
                      videoUrl={currentSection.videoUrl}
                      sectionId={sectionId}
                      sectionTitle={currentSection.title}
                      onComplete={handleSectionComplete}
                      ref={videoPlayerRef}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Controls */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={!prevSection}
                    className="flex items-center gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  <div className="flex items-center gap-3">
                    {/* Study Guide Generator Button */}
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
                        className="flex items-center gap-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Mark Complete</span>
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={!nextSection && !nextChapterSection}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Next Section Preview */}
                {(nextSection || nextChapterSection) && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
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
              </CardContent>
            </Card>

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
              className="xl:col-span-4 relative"
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

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCompletionModal(false)}
          >
            <motion.div
              className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Section Complete</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  You&apos;ve completed this section. Keep up the great work!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCompletionModal(false)}
                    className="border-slate-200 dark:border-slate-700"
                  >
                    Review
                  </Button>
                  {(nextSection || nextChapterSection) && (
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900"
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Keyboard Shortcuts Button */}
      <FloatingKeyboardShortcuts />

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
                          className="text-xs h-7"
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
                          className="text-xs h-7"
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
                    className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
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
                      className="w-full text-xs h-7"
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

      {/* SAM AI Course Learning Integration - Full AI mentor support */}
      <SAMCourseLearningIntegration
        context={{
          courseId,
          courseTitle: course.title,
          chapterId,
          chapterTitle: currentChapter.title,
          sectionId,
          sectionTitle: currentSection.title,
          sectionType: currentSection.type,
          userId: user?.id,
          isEnrolled: canTrackProgress,
          progress: (completedSections / totalSections) * 100,
        }}
        onAskSAM={(question) => {
          // Track SAM usage for analytics
          analytics.trackEvent("SAM_QUESTION_ASKED", { question: question.slice(0, 100) });
          // The SAM assistant will handle the question
          toast.info("Opening SAM Assistant...");
        }}
        onRecommendationClick={(recId) => {
          analytics.trackEvent("SAM_RECOMMENDATION_CLICKED", { recommendationId: recId });
        }}
      />
    </div>
  );
}
