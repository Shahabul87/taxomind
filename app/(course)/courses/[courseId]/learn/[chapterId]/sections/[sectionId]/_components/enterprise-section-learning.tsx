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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f8fb] via-[#f4f6f9] to-[#f7f8fb] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Ambient blur effects - matching login page */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/12 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/12 rounded-full blur-3xl" />

      <div className="relative z-10">
      {/* Section Header */}
      <SectionHeader
        course={course}
        chapter={currentChapter}
        section={currentSection}
        progress={(completedSections / totalSections) * 100}
        isPreviewMode={isPreviewMode}
      />

      {/* Main Content Area */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative">
          {/* Main Content Column */}
          <motion.div
            className={cn(
              "space-y-6",
              sidebarOpen ? "xl:col-span-8" : "xl:col-span-12"
            )}
            layout
            transition={{ duration: 0.3 }}
          >
            {/* Section Overview Card */}
            <Card className="overflow-hidden bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900/50 dark:to-slate-800/50">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold tracking-tight mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">{currentSection.title}</CardTitle>
                    {currentSection.description && (
                      <SafeHtmlRenderer
                        html={currentSection.description}
                        className="text-base prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 mt-2"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {currentSection.duration && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.floor(currentSection.duration / 60)} min
                      </Badge>
                    )}
                    {sectionCompleted && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Learning Objectives */}
                {currentSection.learningObjectives && (
                  <div className="mt-6 p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-slate-200/60 dark:border-slate-700/50">
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-slate-900 dark:text-white">
                      <Target className="h-4 w-4 text-[#22c55e]" />
                      Learning Objectives
                    </h3>
                    <SafeHtmlRenderer
                      html={currentSection.learningObjectives}
                      className="prose prose-sm dark:prose-invert max-w-none [&>ul]:list-disc [&>ul]:ml-5 [&>ul>li]:mb-1.5 [&>ul>li]:text-sm [&>ul>li]:marker:text-[#22c55e] dark:[&>ul>li]:marker:text-[#4ade80]"
                    />
                  </div>
                )}
              </CardHeader>

              {/* Quick Stats */}
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/60 dark:border-blue-800/50">
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                      {currentSection.videos?.length || 0}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Videos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/60 dark:border-purple-800/50">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      {currentSection.blogs?.length || 0}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Articles</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border border-green-200/60 dark:border-green-800/50">
                    <div className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-cyan-400 dark:to-emerald-400 bg-clip-text text-transparent">
                      {currentSection.mathExplanations?.length || 0}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Math</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border border-orange-200/60 dark:border-orange-800/50">
                    <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                      {currentSection.codeExplanations?.length || 0}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Code</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Video Player (if videoUrl exists) */}
            {currentSection.videoUrl && (
              <Card className="bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Main Lecture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="video-container">
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
            <Card className="bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={!prevSection}
                    className="flex items-center gap-2 border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-4">
                    {canTrackProgress && !sectionCompleted && (
                      <Button
                        variant="secondary"
                        onClick={handleSectionComplete}
                        className="bg-[#22c55e] hover:bg-[#22c55e]/90 text-white dark:bg-[#4ade80] dark:hover:bg-[#4ade80]/90 dark:text-slate-900"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="default"
                    onClick={handleNext}
                    disabled={!nextSection && !nextChapterSection}
                    className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#22c55e]/90 dark:bg-[#4ade80] dark:hover:bg-[#4ade80]/90 dark:text-slate-900"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Next Section Preview */}
                {(nextSection || nextChapterSection) && (
                  <div className="mt-6 p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-200/60 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                      <Info className="h-4 w-4 text-[#22c55e] dark:text-[#4ade80]" />
                      Up Next
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {nextSection?.title || nextChapterSection?.section.title}
                    </p>
                    {!nextSection && nextChapterSection && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
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
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-6 max-w-md w-full border border-slate-200/50 dark:border-slate-700/50 shadow-xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#22c55e]/10 to-[#22c55e]/20 dark:from-[#4ade80]/20 dark:to-[#4ade80]/10 rounded-full flex items-center justify-center mb-4 border border-[#22c55e]/20 dark:border-[#4ade80]/20">
                  <Award className="h-8 w-8 text-[#16a34a] dark:text-[#4ade80]" />
                </div>
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Congratulations! 🎉</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  You&apos;ve successfully completed this section. Keep up the great work!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowCompletionModal(false)}
                    className="border-slate-200 dark:border-slate-700/50"
                  >
                    Review Section
                  </Button>
                  {(nextSection || nextChapterSection) && (
                    <Button onClick={handleNext} className="bg-[#22c55e] hover:bg-[#22c55e]/90 dark:bg-[#4ade80] dark:hover:bg-[#4ade80]/90 dark:text-slate-900">
                      Continue Learning
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
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-24 left-1/2 z-50 max-w-md w-full mx-4"
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-purple-200 dark:border-purple-800 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
                    <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        SAM AI Assistant
                      </span>
                      <Badge variant="outline" className="text-xs">
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
                          variant="secondary"
                          className="text-xs"
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
                          className="text-xs"
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
                    className="h-6 w-6 p-0"
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 right-4 z-50 max-w-sm"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Your Learning Style Detected!
                      </span>
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                      You appear to be a <strong className="text-blue-600 dark:text-blue-400 capitalize">{learningStyle.primaryStyle}</strong> learner.
                    </p>
                    <div className="bg-white/60 dark:bg-slate-900/60 rounded-lg p-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <Lightbulb className="h-3 w-3" />
                        Personalized Tips:
                      </div>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {getContentRecommendations("general").slice(0, 2).map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-blue-500">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs"
                      onClick={() => setShowLearningStyleTip(false)}
                    >
                      Got it, thanks!
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
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-40"
          >
            <Button
              onClick={() => setSidebarOpen(true)}
              size="lg"
              className="h-12 w-12 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 p-0"
              title="Show sidebar (Ctrl+B)"
            >
              <PanelLeftClose className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
