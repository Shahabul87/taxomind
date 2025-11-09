"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { logger } from '@/lib/logger';
import {
  BookOpen,
  Video,
  FileText,
  Code,
  Clock,
  Menu,
  X,
  ArrowLeft,
  Settings,
  Share2,
  Bookmark,
  Target,
  Brain,
  Sparkles,
  TrendingUp,
  Award,
  Lightbulb,
  Users,
  Zap,
  HeartHandshake,
  BarChart3,
  Palette,
  Volume2,
  Eye,
  Gamepad2,
  Timer,
  CheckCircle,
  AlertCircle,
  Info,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  Maximize2,
  Star,
  BookmarkCheck,
  Download,
  Headphones,
  Mic,
  Camera,
  FileCode,
  GraduationCap,
  Rocket
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SectionUser as User } from "./enhanced-section-learning/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { SectionUser, Section, Chapter, Course } from "./enhanced-section-learning/types";

// Personalization interfaces
interface LearningPreferences {
  contentFormat: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  pacePreference: 'slow' | 'normal' | 'fast';
  difficultyAdjustment: 'auto' | 'manual';
  interactionStyle: 'guided' | 'exploratory' | 'structured';
  notificationLevel: 'minimal' | 'moderate' | 'comprehensive';
  visualTheme: 'light' | 'dark' | 'auto' | 'high-contrast';
  fontSize: number;
  autoPlay: boolean;
  showHints: boolean;
  enableGamification: boolean;
}

interface EnterpriseSectionLearningProps {
  user: SectionUser;
  course: Course;
  currentChapter: Chapter;
  currentSection: Section;
  nextSection: Section | null;
  prevSection: Section | null;
  nextChapterSection: { section: Section; chapter: Chapter } | null;
  totalSections: number;
  completedSections: number;
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const EnterpriseSectionLearning = ({
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
}: EnterpriseSectionLearningProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"content" | "notes" | "discussion" | "assessments" | "resources">("content");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([chapterId]);

  // Personalization state
  const [learningPreferences, setLearningPreferences] = useState<LearningPreferences>({
    contentFormat: 'visual',
    pacePreference: 'normal',
    difficultyAdjustment: 'auto',
    interactionStyle: 'guided',
    notificationLevel: 'moderate',
    visualTheme: 'auto',
    fontSize: 16,
    autoPlay: true,
    showHints: true,
    enableGamification: true
  });

  // Memoize the current section completion status
  const isCurrentSectionCompleted = useMemo(() =>
    currentSection.user_progress.some(p => p.isCompleted),
    [currentSection.user_progress]
  );

  const [completedCurrentSection, setCompletedCurrentSection] = useState(isCurrentSectionCompleted);

  // Update local state when prop changes
  useEffect(() => {
    setCompletedCurrentSection(isCurrentSectionCompleted);
  }, [isCurrentSectionCompleted]);

  // Calculate estimated read time
  const getEstimatedReadTime = useMemo(() => {
    if (currentSection.duration) {
      return Math.ceil(currentSection.duration / 60);
    }
    const baseTime = currentSection.videoUrl ? 10 : 5;
    return baseTime;
  }, [currentSection.duration, currentSection.videoUrl]);

  // Handle section completion
  const handleMarkComplete = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast.success("Section marked as complete!");
        window.location.reload();
      }
    } catch (error: any) {
      logger.error('Error marking section complete:', error);
      toast.error("Failed to mark section as complete");
    }
  }, [courseId, chapterId, sectionId]);

  // Memoize expensive calculations
  const progressPercentage = useMemo(() => {
    return totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
  }, [totalSections, completedSections]);

  const getContentIcon = useCallback((type?: string | null) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-rose-500" />;
      case "article":
        return <FileText className="w-4 h-4 text-sky-500" />;
      case "code":
        return <Code className="w-4 h-4 text-emerald-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-500" />;
    }
  }, []);

  return (
    <div className={cn(
      "min-h-screen bg-slate-50 dark:bg-slate-950",
      focusModeActive && "bg-white dark:bg-slate-950"
    )}>
      {/* Enterprise Header */}
      <EnterpriseHeader
        course={course}
        currentChapter={currentChapter}
        progressPercentage={progressPercentage}
        completedSections={completedSections}
        totalSections={totalSections}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isBookmarked={isBookmarked}
        setIsBookmarked={setIsBookmarked}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        focusModeActive={focusModeActive}
        setFocusModeActive={setFocusModeActive}
        courseId={courseId}
      />

      <div className="flex h-[calc(100vh-140px)]">
        {/* Enterprise Sidebar */}
        <EnterpriseSidebar
          course={course}
          currentChapter={currentChapter}
          chaptersWithProgress={course.chapters.map(chapter => ({
            ...chapter,
            completedSections: chapter.sections.filter(s =>
              s.user_progress.some(p => p.isCompleted)
            ).length,
            progressPercentage: chapter.sections.length > 0
              ? (chapter.sections.filter(s => s.user_progress.some(p => p.isCompleted)).length / chapter.sections.length) * 100
              : 0,
            isCurrentChapter: chapter.id === chapterId
          }))}
          sidebarOpen={sidebarOpen}
          expandedChapters={expandedChapters}
          toggleChapter={(id: string) => {
            setExpandedChapters(prev =>
              prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
            );
          }}
          courseId={courseId}
          sectionId={sectionId}
          getContentIcon={getContentIcon}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section Title & Actions */}
          <div className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    {getContentIcon(currentSection.type)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-semibold">
                      Learning Section
                    </Badge>
                    <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium">
                      <Clock className="w-3 h-3 mr-1" />
                      {getEstimatedReadTime} min read
                    </Badge>
                    {completedCurrentSection && (
                      <Badge className="bg-emerald-500 dark:bg-emerald-600 text-white font-semibold">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2 leading-tight">
                  {currentSection.title}
                </h1>
                {currentSection.description && (
                  <div
                    className="text-base text-slate-700 dark:text-slate-300 leading-relaxed prose prose-slate dark:prose-invert prose-p:my-2 prose-p:text-slate-700 dark:prose-p:text-slate-300 max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentSection.description }}
                  />
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!completedCurrentSection && (
                  <Button
                    onClick={handleMarkComplete}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900">
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="h-full flex flex-col">
              <div className="px-8 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 text-slate-700 dark:text-slate-400">
                  <TabsTrigger
                    value="content"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-50"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="resources"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-50"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Resources
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger
                    value="discussion"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-50"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Discussion
                  </TabsTrigger>
                  <TabsTrigger
                    value="assessments"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-50"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Assessments
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto px-8 py-6">
                <TabsContent value="content" className="h-full m-0">
                  <EnterpriseContentView
                    currentSection={currentSection}
                    courseId={courseId}
                    chapterId={chapterId}
                    sectionId={sectionId}
                  />
                </TabsContent>

                <TabsContent value="resources" className="h-full m-0">
                  <div className="max-w-5xl mx-auto">
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
                          <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          Learning Resources
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-slate-700 dark:text-slate-300">
                          Additional resources and materials for this section.
                        </p>
                        {/* Add resource content here */}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="h-full m-0">
                  <div className="max-w-5xl mx-auto">
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
                          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          Your Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                            Note-taking Coming Soon
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Take notes while you learn and organize your thoughts.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="discussion" className="h-full m-0">
                  <div className="max-w-5xl mx-auto">
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
                          <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          Discussion Forum
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12">
                          <Users className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                            Discussions Coming Soon
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Connect with other learners and discuss this section.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="assessments" className="h-full m-0">
                  <div className="max-w-5xl mx-auto">
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
                          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          Assessments
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12">
                          <Award className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                            Assessments Coming Soon
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Test your knowledge with quizzes and assignments.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Navigation Footer */}
          <div className="px-8 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-4">
              {prevSection ? (
                <Link
                  href={`/courses/${courseId}/learn/${chapterId}/sections/${prevSection.id}`}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start group hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <div className="text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Previous</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                        {prevSection.title}
                      </p>
                    </div>
                  </Button>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {(nextSection || nextChapterSection) && (
                <Link
                  href={nextSection
                    ? `/courses/${courseId}/learn/${chapterId}/sections/${nextSection.id}`
                    : `/courses/${courseId}/learn/${nextChapterSection!.chapter.id}/sections/${nextChapterSection!.section.id}`
                  }
                  className="flex-1"
                >
                  <Button
                    className="w-full justify-end group bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl"
                  >
                    <div className="text-right">
                      <p className="text-xs opacity-90">Next</p>
                      <p className="text-sm font-semibold truncate">
                        {nextSection ? nextSection.title : nextChapterSection!.section.title}
                      </p>
                    </div>
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Focus Mode Toggle */}
      {!focusModeActive && (
        <motion.button
          onClick={() => setFocusModeActive(true)}
          className="fixed bottom-8 left-8 z-50 px-4 py-3 bg-slate-900/90 dark:bg-slate-100/90 hover:bg-slate-900 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm font-semibold flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Maximize2 className="w-4 h-4" />
          Enter Focus Mode
        </motion.button>
      )}
    </div>
  );
};

// Enterprise Header Component
const EnterpriseHeader = ({
  course,
  currentChapter,
  progressPercentage,
  completedSections,
  totalSections,
  sidebarOpen,
  setSidebarOpen,
  isBookmarked,
  setIsBookmarked,
  showSettings,
  setShowSettings,
  showSamAI,
  setShowSamAI,
  focusModeActive,
  setFocusModeActive,
  courseId
}: any) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link href={`/courses/${courseId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Course</span>
              </Button>
            </Link>

            <Separator orientation="vertical" className="h-6 bg-slate-300 dark:bg-slate-700" />

            <div className="hidden md:flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-50 leading-tight">
                  {course.title}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {currentChapter.title}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={cn(
                "transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                isBookmarked && "text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400"
              )}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm font-semibold mb-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <span>Course Progress</span>
            </div>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className="relative h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{completedSections} of {totalSections} sections completed</span>
            {progressPercentage >= 75 && (
              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 font-semibold">
                <Rocket className="w-3 h-3 mr-1" />
                Almost there!
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enterprise Sidebar Component
const EnterpriseSidebar = ({
  course,
  currentChapter,
  chaptersWithProgress,
  sidebarOpen,
  expandedChapters,
  toggleChapter,
  courseId,
  sectionId,
  getContentIcon
}: any) => {
  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-lg overflow-hidden",
      sidebarOpen ? "w-80" : "w-0"
    )}>
      <div className="h-full overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Course Content Navigation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-50">
              Course Content
            </h3>
            <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700">
              {chaptersWithProgress.length} Chapters
            </Badge>
          </div>

          {chaptersWithProgress.map((chapter: any) => {
            const isExpanded = expandedChapters.includes(chapter.id);
            const isCurrentChapter = chapter.isCurrentChapter;

            return (
              <div key={chapter.id} className="space-y-2">
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                    isCurrentChapter
                      ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-indigo-200 dark:border-indigo-700"
                      : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={cn(
                      "font-semibold text-sm mb-1 leading-tight",
                      isCurrentChapter
                        ? "text-indigo-900 dark:text-indigo-100"
                        : "text-slate-900 dark:text-slate-100"
                    )}>
                      {chapter.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span>{chapter.completedSections}/{chapter.sections.length} sections</span>
                      {chapter.progressPercentage === 100 && (
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      )}
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${chapter.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="ml-4 space-y-1 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                    {chapter.sections.map((section: any) => {
                      const isCompleted = section.user_progress.some((p: any) => p.isCompleted);
                      const isActive = section.id === sectionId;

                      return (
                        <Link
                          key={section.id}
                          href={`/courses/${courseId}/learn/${chapter.id}/sections/${section.id}`}
                        >
                          <div className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group cursor-pointer",
                            isActive
                              ? "bg-indigo-100 dark:bg-indigo-900/30 border-l-2 border-indigo-600 dark:border-indigo-400"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}>
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              ) : (
                                getContentIcon(section.type)
                              )}
                            </div>
                            <p className={cn(
                              "text-sm flex-1 min-w-0 truncate",
                              isActive
                                ? "font-semibold text-indigo-900 dark:text-indigo-100"
                                : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                            )}>
                              {section.title}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Enterprise Content View Component
const EnterpriseContentView = ({
  currentSection,
  courseId,
  chapterId,
  sectionId
}: any) => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Get all videos (main video + additional videos)
  const allVideos = useMemo(() => {
    const videos = [];
    if (currentSection.videoUrl) {
      videos.push({
        id: 'main',
        title: currentSection.title,
        url: currentSection.videoUrl,
        thumbnail: null,
        duration: currentSection.duration,
        description: 'Main Section Video',
        isMain: true
      });
    }
    if (currentSection.videos && currentSection.videos.length > 0) {
      videos.push(...currentSection.videos.map((v: any) => ({ ...v, isMain: false })));
    }
    return videos;
  }, [currentSection]);

  // Get note styles based on type
  const getNoteStyle = (type?: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-100';
      case 'tip':
        return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100';
      case 'important':
        return 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-100';
      default:
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-100';
    }
  };

  const getNoteIcon = (type?: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'important':
        return <Info className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Learning Objectives */}
      {currentSection.learningObjectives && (
        <Card className="border-indigo-200 dark:border-indigo-700 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100 text-lg">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-slate dark:prose-invert max-w-none prose-p:text-indigo-800 dark:prose-p:text-indigo-200 prose-li:text-indigo-800 dark:prose-li:text-indigo-200"
              dangerouslySetInnerHTML={{ __html: currentSection.learningObjectives }}
            />
          </CardContent>
        </Card>
      )}

      {/* Video Player Section */}
      {allVideos.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <PlayCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Video Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Video Player */}
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg">
              <iframe
                src={allVideos[activeVideoIndex].url}
                className="w-full h-full"
                allowFullScreen
                title={allVideos[activeVideoIndex].title}
              />
            </div>

            {/* Video Info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 mb-1">
                  {allVideos[activeVideoIndex].title}
                </h3>
                {allVideos[activeVideoIndex].description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {allVideos[activeVideoIndex].description}
                  </p>
                )}
              </div>
              {allVideos[activeVideoIndex].duration && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.floor(allVideos[activeVideoIndex].duration / 60)}:{String(allVideos[activeVideoIndex].duration % 60).padStart(2, '0')}
                </Badge>
              )}
            </div>

            {/* Additional Videos */}
            {allVideos.length > 1 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">More Videos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allVideos.map((video: any, index: number) => (
                    <button
                      key={video.id}
                      onClick={() => setActiveVideoIndex(index)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                        activeVideoIndex === index
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                      )}
                    >
                      <div className="flex-shrink-0 w-16 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                        <PlayCircle className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-50 truncate">
                          {video.title}
                        </p>
                        {video.duration && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Code Explanations */}
      {currentSection.codeExplanations && currentSection.codeExplanations.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <FileCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Code Examples
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentSection.codeExplanations.map((codeBlock: any) => (
              <div key={codeBlock.id} className="space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-slate-50">{codeBlock.title}</h3>
                <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto">
                  <code>{codeBlock.code}</code>
                </pre>
                {codeBlock.explanation && (
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-700 dark:prose-p:text-slate-300">
                    <div dangerouslySetInnerHTML={{ __html: codeBlock.explanation }} />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Math Explanations */}
      {currentSection.mathExplanations && currentSection.mathExplanations.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Mathematical Concepts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentSection.mathExplanations.map((math: any) => (
              <div key={math.id} className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <h3 className="font-bold text-purple-900 dark:text-purple-100">{math.title}</h3>
                {math.imageUrl && (
                  <img src={math.imageUrl} alt={math.title} className="max-w-full h-auto rounded" />
                )}
                {math.explanation && (
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-700 dark:prose-p:text-slate-300">
                    <div dangerouslySetInnerHTML={{ __html: math.explanation }} />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Blogs */}
      {currentSection.blogs && currentSection.blogs.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Related Blog Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSection.blogs.map((blog: any) => (
              <div key={blog.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-sky-400 dark:hover:border-sky-600 transition-colors">
                <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2">{blog.title}</h3>
                {blog.excerpt && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{blog.excerpt}</p>
                )}
                {blog.url && (
                  <a href={blog.url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-600 dark:text-sky-400 hover:underline">
                    Read more →
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Articles */}
      {currentSection.articles && currentSection.articles.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Recommended Articles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSection.articles.map((article: any) => (
              <div key={article.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-orange-400 dark:hover:border-orange-600 transition-colors">
                <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2">{article.title}</h3>
                {article.source && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Source: {article.source}</p>
                )}
                {article.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{article.description}</p>
                )}
                {article.url && (
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 dark:text-orange-400 hover:underline">
                    Read article →
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {currentSection.notes && currentSection.notes.length > 0 && (
        <div className="space-y-4">
          {currentSection.notes.map((note: any) => (
            <div
              key={note.id}
              className={cn(
                "p-5 border-l-4 rounded-r-lg",
                getNoteStyle(note.type)
              )}
            >
              <div className="flex items-start gap-3">
                {getNoteIcon(note.type)}
                <div className="flex-1">
                  <h3 className="font-bold mb-2">{note.title}</h3>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: note.content }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Learning Streak Indicator */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-300 dark:border-emerald-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 dark:bg-emerald-600 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-100">
                Learning Streak: 7 days
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Complete this section to maintain your streak!
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+50</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">XP for completion</p>
          </div>
        </div>
      </div>
    </div>
  );
};

