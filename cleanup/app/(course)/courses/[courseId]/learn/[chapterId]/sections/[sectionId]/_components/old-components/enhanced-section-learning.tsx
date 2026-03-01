"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Target
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  ChapterNavigation,
  SectionHeader,
  VideoPlayerSection,
  NavigationFooter,
  EnhancedSectionLearningProps,
  ChapterWithProgress
} from "./enhanced-section-learning/";
import { ContentTabsEnhanced } from "./enhanced-section-learning/content-tabs-enhanced";

export const EnhancedSectionLearning = ({
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
}: EnhancedSectionLearningProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"content" | "notes" | "discussion" | "exams" | "adaptive" | "resources">("content");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([chapterId]);
  
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

  // Memoize expensive calculations to prevent infinite re-renders
  const progressPercentage = useMemo(() => {
    return totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
  }, [totalSections, completedSections]);

  // Memoize course chapters to stabilize reference
  const courseChapters = useMemo(() => course.chapters, [course.chapters]);

  // Memoize chapter data to prevent recalculation on every render
  const chaptersWithProgress = useMemo((): ChapterWithProgress[] => {
    return courseChapters.map(chapter => {
      const completedCount = chapter.sections.reduce((count, section) => {
        return count + (section.user_progress.some(p => p.isCompleted) ? 1 : 0);
      }, 0);
      
      const progressPercentage = chapter.sections.length > 0 
        ? (completedCount / chapter.sections.length) * 100 
        : 0;
      
      return {
        ...chapter,
        completedSections: completedCount,
        progressPercentage,
        isCurrentChapter: chapter.id === chapterId,
      };
    });
  }, [courseChapters, chapterId]);

  // Memoize functions to prevent recreating on every render
  const getContentIcon = useCallback((type?: string | null) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-red-500" />;
      case "article":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "blog":
        return <BookOpen className="w-4 h-4 text-green-500" />;
      case "code":
        return <Code className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  }, []);

  const handleMarkComplete = useCallback(async () => {
    // TODO: Implement API call to mark section as complete
    setCompletedCurrentSection(true);
  }, []);

  const toggleChapter = useCallback((chapterId: string) => {
    setExpandedChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  }, []);

  const getEstimatedReadTime = useMemo(() => {
    const contentCount = 
      currentSection.videos.length + 
      currentSection.blogs.length + 
      currentSection.articles.length + 
      currentSection.notes.length + 
      currentSection.codeExplanations.length;
    
    return Math.max(5, contentCount * 3); // Estimate 3 minutes per content item, minimum 5 minutes
  }, [currentSection.videos.length, currentSection.blogs.length, currentSection.articles.length, currentSection.notes.length, currentSection.codeExplanations.length]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-slate-800 dark:to-slate-900">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 w-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-700/80 shadow-sm">
        <div className="flex items-center justify-between w-full px-6 py-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            
            <Link
              href={`/courses/${courseId}/learn`}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Course</span>
            </Link>
            
            <Separator orientation="vertical" className="h-6 bg-gray-300 dark:bg-slate-600" />
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[200px] lg:max-w-[400px]">
                  {currentSection.title}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentChapter.title}
                </p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{getEstimatedReadTime} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>{completedSections}/{totalSections}</span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={cn(
                "transition-colors hover:bg-gray-100 dark:hover:bg-slate-800",
                isBookmarked && "text-yellow-500 hover:text-yellow-600"
              )}
            >
              <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
            </Button>
            
            <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-slate-800">
              <Share2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full px-6 pb-3">
          <div className="flex items-center gap-4 w-full">
            <Progress value={progressPercentage} className="flex-1 h-2" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full">
        {/* Chapter Navigation (Sidebar) */}
        <ChapterNavigation
          course={course}
          chaptersWithProgress={chaptersWithProgress}
          progressPercentage={progressPercentage}
          courseId={courseId}
          sectionId={sectionId}
          expandedChapters={expandedChapters}
          toggleChapter={toggleChapter}
          getContentIcon={getContentIcon}
          sidebarOpen={sidebarOpen}
        />

        {/* Main Content */}
        <div className={cn(
          "flex-1 w-full transition-all duration-300",
          sidebarOpen ? "lg:ml-0" : "ml-0"
        )}>
          <div className="w-full px-6 py-6 space-y-8">
            {/* Section Header */}
            <SectionHeader
              course={course}
              currentChapter={currentChapter}
              currentSection={currentSection}
              completedCurrentSection={completedCurrentSection}
              getEstimatedReadTime={getEstimatedReadTime}
              getContentIcon={getContentIcon}
              handleMarkComplete={handleMarkComplete}
              courseId={courseId}
              chapterId={chapterId}
            />

            {/* Video Player Section */}
            <VideoPlayerSection
              currentSection={currentSection}
              currentChapter={currentChapter}
              prevSection={prevSection}
              nextSection={nextSection}
              nextChapterSection={nextChapterSection}
              courseId={courseId}
              chapterId={chapterId}
              sectionId={sectionId}
            />

            {/* Navigation Footer */}
            <NavigationFooter
              prevSection={prevSection}
              nextSection={nextSection}
              nextChapterSection={nextChapterSection}
              completedCurrentSection={completedCurrentSection}
              courseId={courseId}
              chapterId={chapterId}
            />

            {/* Enhanced Content Tabs with Resource Intelligence */}
            <ContentTabsEnhanced
              currentSection={currentSection}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              courseId={courseId}
              chapterId={chapterId}
              courseTitle={course.title}
              chapterTitle={currentChapter.title}
            />

            
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/30 dark:bg-black/40 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}; 