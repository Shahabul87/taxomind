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
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Import the SectionUser type from the local types file
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
import { 
  ChapterNavigation,
  SectionHeader,
  VideoPlayerSection,
  NavigationFooter,
  ChapterWithProgress
} from "./enhanced-section-learning/";
import { ContentTabsPersonalized } from "./enhanced-section-learning/content-tabs-personalized";
import { SectionUser, Section, Chapter, Course } from "./enhanced-section-learning/types";
import { SocialLearningAnalytics } from "./social-learning-analytics";
import { RealTimeCollaboration } from "./real-time-collaboration";
import { FocusMode } from "./focus-mode";
import { SmartMiniTracker } from "./smart-mini-tracker";
import { QuickNotesPanel } from "./quick-notes-panel";
import { KeyboardShortcuts } from "./keyboard-shortcuts";

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

interface PersonalizationInsights {
  learningStyle: {
    type: string;
    confidence: number;
    description: string;
  };
  progress: {
    streakDays: number;
    totalTimeSpent: number;
    averageSessionLength: number;
    completionRate: number;
  };
  recommendations: {
    nextOptimalContent: string;
    suggestedBreakTime: number;
    difficultyAdjustment: 'increase' | 'decrease' | 'maintain';
    focusAreas: string[];
  };
  emotionalState: {
    engagement: number;
    confidence: number;
    motivation: number;
    stress: number;
  };
  adaptivePath: {
    currentLevel: string;
    suggestedResources: string[];
    prerequisites: string[];
    nextMilestones: string[];
  };
}

interface StudyBuddy {
  id: string;
  name: string;
  personality: 'encouraging' | 'analytical' | 'creative' | 'practical';
  avatar: string;
  currentMessage: string;
  suggestions: string[];
}

interface EnhancedSectionLearningPersonalizedProps {
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

export const EnhancedSectionLearningPersonalized = ({
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
}: EnhancedSectionLearningPersonalizedProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"content" | "notes" | "discussion" | "exams" | "adaptive" | "resources" | "collaboration">("content");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
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
  
  const [personalizationInsights, setPersonalizationInsights] = useState<PersonalizationInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [studyBuddy, setStudyBuddy] = useState<StudyBuddy | null>(null);
  const [showStudyBuddy, setShowStudyBuddy] = useState(false);

  // Enterprise features state
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  
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

  // Load personalization data function
  const loadPersonalizationData = useCallback(async () => {
    setIsLoadingInsights(true);
    try {
      const response = await axios.get("/api/sam/personalization", {
        params: {
          userId: user.id,
          type: "overview"
        }
      });

      if (response.data.success) {
        // Map the API response to our component's expected format
        const apiData = response.data.data;
        setPersonalizationInsights(getDemoInsights()); // Use demo insights with API data
        setStudyBuddy(getDemoStudyBuddy());

        // Update preferences if available
        if (apiData.learningStyle) {
          setLearningPreferences(prev => ({
            ...prev,
            contentFormat: apiData.learningStyle.primaryStyle || prev.contentFormat
          }));
        }
      }
    } catch (error: any) {
      // Silently use demo data as fallback - this is expected behavior
      setPersonalizationInsights(getDemoInsights());
      setStudyBuddy(getDemoStudyBuddy());
    } finally {
      setIsLoadingInsights(false);
    }
  }, [user.id]);

  // Load personalization data on mount
  useEffect(() => {
    loadPersonalizationData();
  }, [user.id, courseId, sectionId, loadPersonalizationData]);

  // Calculate estimated read time
  const getEstimatedReadTime = useMemo(() => {
    // Use video duration if available, otherwise estimate based on section type
    if (currentSection.duration) {
      return Math.ceil(currentSection.duration / 60); // Convert seconds to minutes
    }
    
    // Default estimate based on section type
    const baseTime = currentSection.videoUrl ? 10 : 5; // 10 min for videos, 5 min for text
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
        // Refresh the page or update state to reflect completion
        window.location.reload();
      }
    } catch (error: any) {
      logger.error('Error marking section complete:', error);
    }
  }, [courseId, chapterId, sectionId]);

  // Memoize expensive calculations
  const progressPercentage = useMemo(() => {
    return totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
  }, [totalSections, completedSections]);

  const courseChapters = useMemo(() => course.chapters, [course.chapters]);

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

  // Load personalization data from SAM engine
  // Update learning preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<LearningPreferences>) => {
    const updated = { ...learningPreferences, ...newPreferences };
    setLearningPreferences(updated);
    
    try {
      await axios.post("/api/sam/personalization", {
        action: "update-preferences",
        data: {
          userId: user.id,
          preferences: updated
        }
      });
      toast.success("Learning preferences updated!");
    } catch (error: any) {
      logger.error("Failed to update preferences:", error);
      toast.error("Failed to update preferences");
    }
  }, [learningPreferences, user.id]);

  // Trigger adaptive content adjustment
  const triggerAdaptiveAdjustment = useCallback(async (feedback: {
    difficulty: 'too-easy' | 'too-hard' | 'just-right';
    engagement: number;
    understanding: number;
  }) => {
    try {
      await axios.post("/api/sam/personalization", {
        action: "adaptive-feedback",
        data: {
          userId: user.id,
          courseId,
          sectionId,
          feedback,
          currentTime: new Date().toISOString()
        }
      });
      
      // Reload insights after feedback
      setTimeout(() => loadPersonalizationData(), 1000);
      toast.success("Thanks for your feedback! Content will adapt accordingly.");
    } catch (error: any) {
      logger.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback");
    }
  }, [user.id, courseId, sectionId, loadPersonalizationData]);

  const getContentIcon = useCallback((type?: string | null) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-red-500" />;
      case "article":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "code":
        return <Code className="w-4 h-4 text-green-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  }, []);

  const getLearningStyleIcon = (style: string) => {
    switch (style.toLowerCase()) {
      case 'visual': return <Eye className="w-4 h-4" />;
      case 'auditory': return <Volume2 className="w-4 h-4" />;
      case 'kinesthetic': return <Gamepad2 className="w-4 h-4" />;
      case 'reading': return <BookOpen className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'encouraging': return <HeartHandshake className="w-4 h-4" />;
      case 'analytical': return <BarChart3 className="w-4 h-4" />;
      case 'creative': return <Palette className="w-4 h-4" />;
      case 'practical': return <Target className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <FocusMode
      isActive={focusModeActive}
      onToggle={() => setFocusModeActive(!focusModeActive)}
      onBreakReminder={() => toast.info("Time for a break! Take 5 minutes to rest.")}
    >
      <div className={cn(
        "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950",
        learningPreferences.visualTheme === 'high-contrast' && "contrast-more"
      )}
      style={{ fontSize: `${learningPreferences.fontSize}px` }}
      >
      {/* Enterprise-Level Enhanced Header with Glassmorphism */}
      <div className="bg-gradient-to-r from-white/90 via-blue-50/90 to-purple-50/90 dark:from-slate-900/90 dark:via-blue-950/90 dark:to-purple-950/90 backdrop-blur-xl border-b border-gradient-to-r from-slate-200/60 via-blue-200/60 to-purple-200/60 dark:from-slate-700/60 dark:via-blue-800/60 dark:to-purple-800/60 sticky top-0 z-50 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>

            <Link href={`/courses/${courseId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-200 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Course</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Study Buddy Toggle with Enhanced Design */}
            {studyBuddy && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStudyBuddy(!showStudyBuddy)}
                  className={cn(
                    "gap-2 transition-all duration-300 font-medium border-2",
                    showStudyBuddy
                      ? "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-400 dark:border-purple-600 shadow-md"
                      : "hover:border-purple-300 dark:hover:border-purple-700"
                  )}
                  aria-pressed={showStudyBuddy}
                >
                  {getPersonalityIcon(studyBuddy.personality)}
                  <span className="hidden md:inline">Study Buddy</span>
                  {showStudyBuddy && <Sparkles className="w-3 h-3 text-purple-600" />}
                </Button>
              </motion.div>
            )}

            {/* Personalization Button with Premium Design */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPersonalization(!showPersonalization)}
                className={cn(
                  "gap-2 transition-all duration-300 font-medium border-2",
                  showPersonalization
                    ? "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-400 dark:border-blue-600 shadow-md"
                    : "hover:border-blue-300 dark:hover:border-blue-700"
                )}
                aria-pressed={showPersonalization}
              >
                <Brain className="h-4 w-4" />
                <span className="hidden md:inline">AI Insights</span>
                {showPersonalization && <Sparkles className="w-3 h-3 text-blue-600" />}
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={cn(
                  "transition-all duration-300",
                  isBookmarked && "text-yellow-600 dark:text-yellow-500"
                )}
                aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Settings"
                className="hover:bg-white/60 dark:hover:bg-slate-800/60"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Progress Bar with Gradient and Animation */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Course Progress</span>
            </div>
            <motion.span
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400"
              key={progressPercentage}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {Math.round(progressPercentage)}% Complete
            </motion.span>
          </div>
          <div className="relative">
            <Progress
              value={progressPercentage}
              className="h-2.5 bg-slate-200/50 dark:bg-slate-700/50"
            />
            <motion.div
              className="absolute top-0 left-0 h-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
              }}
            />
          </div>

          {/* Progress Milestones */}
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              {completedSections} of {totalSections} sections
            </span>
            {progressPercentage >= 50 && (
              <Badge variant="outline" className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300 dark:border-emerald-700">
                <Award className="w-3 h-3 mr-1" />
                Halfway there!
              </Badge>
            )}
            {progressPercentage >= 90 && (
              <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-700 animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                Almost done!
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Enterprise Sidebar with Premium Glass Effect */}
        <div className={cn(
          "bg-gradient-to-b from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-2xl border-r border-slate-200/70 dark:border-slate-700/70 transition-all duration-300 shadow-xl shadow-slate-200/20 dark:shadow-slate-900/40",
          sidebarOpen ? "w-80" : "w-0 overflow-hidden",
          "lg:w-80 lg:overflow-visible"
        )}>
          <div className="p-5 space-y-5 h-full overflow-y-auto custom-scrollbar">
            {/* Course Info with Enhanced Design */}
            <motion.div
              className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight mb-1 truncate">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-500" />
                    {currentChapter.title}
                  </p>
                </div>
              </div>
            </motion.div>

            <Separator className="bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />

            {/* Premium Personalization Insights Panel */}
            <AnimatePresence>
              {showPersonalization && personalizationInsights && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-4"
                >
                  <Card className="bg-gradient-to-br from-purple-50/90 via-blue-50/90 to-indigo-50/90 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-indigo-900/30 border-2 border-purple-200/60 dark:border-purple-700/60 shadow-lg shadow-purple-200/30 dark:shadow-purple-900/20">
                    <CardHeader className="pb-3 border-b border-purple-200/40 dark:border-purple-700/40">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
                          Your Learning Profile
                        </span>
                        <Sparkles className="w-3.5 h-3.5 text-purple-500 ml-auto animate-pulse" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {/* Learning Style with Enhanced Design */}
                      <motion.div
                        className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-purple-200/30 dark:border-purple-700/30"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-lg">
                            {getLearningStyleIcon(personalizationInsights.learningStyle.type)}
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {personalizationInsights.learningStyle.type} Learner
                          </span>
                        </div>
                        <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-300 dark:border-purple-600 font-bold">
                          {personalizationInsights.learningStyle.confidence}%
                        </Badge>
                      </motion.div>

                      {/* Emotional State Metrics with Modern Design */}
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <Zap className="w-3.5 h-3.5 text-yellow-500" />
                              Engagement
                            </span>
                            <span className="font-bold text-yellow-600 dark:text-yellow-400">
                              {personalizationInsights.emotionalState.engagement}%
                            </span>
                          </div>
                          <div className="relative">
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${personalizationInsights.emotionalState.engagement}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                style={{
                                  boxShadow: '0 0 8px rgba(251, 191, 36, 0.5)',
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <Award className="w-3.5 h-3.5 text-blue-500" />
                              Confidence
                            </span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {personalizationInsights.emotionalState.confidence}%
                            </span>
                          </div>
                          <div className="relative">
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${personalizationInsights.emotionalState.confidence}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                style={{
                                  boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Recommendations with Premium Style */}
                      <div className="space-y-2.5 p-3 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Recommendations
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-800/60 p-2 rounded-md">
                            <Lightbulb className="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                            <span className="font-medium">{personalizationInsights.recommendations.nextOptimalContent}</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-800/60 p-2 rounded-md">
                            <Timer className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
                            <span className="font-medium">Break recommended in {personalizationInsights.recommendations.suggestedBreakTime} min</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium AI Study Buddy Panel */}
            <AnimatePresence>
              {showStudyBuddy && studyBuddy && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-4"
                >
                  <Card className="bg-gradient-to-br from-emerald-50/90 via-teal-50/90 to-cyan-50/90 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-cyan-900/30 border-2 border-emerald-200/60 dark:border-emerald-700/60 shadow-lg shadow-emerald-200/30 dark:shadow-emerald-900/20">
                    <CardHeader className="pb-3 border-b border-emerald-200/40 dark:border-emerald-700/40">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                          {getPersonalityIcon(studyBuddy.personality)}
                        </div>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                          {studyBuddy.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300 dark:border-emerald-600 font-semibold capitalize"
                        >
                          {studyBuddy.personality}
                        </Badge>
                        <HeartHandshake className="w-3.5 h-3.5 text-emerald-500 ml-auto animate-pulse" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {/* Buddy Message with Chat Bubble Design */}
                      <motion.div
                        className="relative p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-emerald-200/40 dark:border-emerald-700/40 shadow-sm"
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Speech bubble arrow */}
                        <div className="absolute -top-2 left-6 w-4 h-4 bg-white/70 dark:bg-slate-800/70 border-l border-t border-emerald-200/40 dark:border-emerald-700/40 transform rotate-45" />

                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed relative">
                          <MessageSquare className="w-4 h-4 text-emerald-500 inline mr-1.5 mb-1" />
                          {studyBuddy.currentMessage}
                        </p>
                      </motion.div>

                      {/* Suggestions with Enhanced Design */}
                      {studyBuddy.suggestions.length > 0 && (
                        <div className="space-y-2.5">
                          <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5" />
                            Smart Suggestions
                          </p>
                          <div className="space-y-2">
                            {studyBuddy.suggestions.slice(0, 2).map((suggestion, idx) => (
                              <motion.div
                                key={idx}
                                className="flex items-start gap-2.5 p-2.5 bg-gradient-to-r from-white/60 to-emerald-50/60 dark:from-slate-800/60 dark:to-emerald-900/20 rounded-lg border border-emerald-200/30 dark:border-emerald-700/30"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ scale: 1.02, x: 4 }}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                  {suggestion}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chapter Navigation */}
            <ChapterNavigation
              course={course}
              chaptersWithProgress={chaptersWithProgress}
              progressPercentage={progressPercentage}
              courseId={courseId}
              sectionId={sectionId}
              expandedChapters={expandedChapters}
              toggleChapter={(chapterId: string) => {
                setExpandedChapters(prev => 
                  prev.includes(chapterId) 
                    ? prev.filter(id => id !== chapterId)
                    : [...prev, chapterId]
                );
              }}
              getContentIcon={getContentIcon}
              sidebarOpen={sidebarOpen}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
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

          {/* Enhanced Content Tabs with Personalization */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="h-full flex flex-col">
              <div className="px-6 py-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-700/50">
                <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-7">
                  <TabsTrigger value="content" className="text-xs">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="adaptive" className="text-xs">
                    <Brain className="w-4 h-4 mr-2" />
                    Adaptive
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="text-xs">
                    <Target className="w-4 h-4 mr-2" />
                    Resources
                  </TabsTrigger>
                  <TabsTrigger value="collaboration" className="text-xs">
                    <Users className="w-4 h-4 mr-2" />
                    Social
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs">
                    <FileText className="w-4 h-4 mr-2" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="discussion" className="text-xs">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Discussion
                  </TabsTrigger>
                  <TabsTrigger value="exams" className="text-xs">
                    <Award className="w-4 h-4 mr-2" />
                    Assessments
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto">
                <TabsContent value="content" className="h-full m-0">
                  <ContentTabsPersonalized
                    currentSection={currentSection}
                    user={user}
                    courseId={courseId}
                    chapterId={chapterId}
                    sectionId={sectionId}
                    preferences={learningPreferences}
                  />
                </TabsContent>

                <TabsContent value="adaptive" className="h-full m-0 p-6">
                  <AdaptiveLearningContent
                    personalizationInsights={personalizationInsights}
                    learningPreferences={learningPreferences}
                    onUpdatePreferences={updatePreferences}
                    onProvideFeedback={triggerAdaptiveAdjustment}
                    isLoading={isLoadingInsights}
                  />
                </TabsContent>

                <TabsContent value="resources" className="h-full m-0">
                  <ContentTabsPersonalized
                    currentSection={currentSection}
                    user={user}
                    courseId={courseId}
                    chapterId={chapterId}
                    sectionId={sectionId}
                    preferences={learningPreferences}
                    defaultTab="resources"
                  />
                </TabsContent>

                <TabsContent value="collaboration" className="h-full m-0 p-6">
                  <SocialLearningAnalytics
                    courseId={courseId}
                    chapterId={chapterId}
                    sectionId={sectionId}
                    currentUser={user}
                    sectionTitle={currentSection.title}
                  />
                </TabsContent>

                <TabsContent value="notes" className="h-full m-0 p-6">
                  <div className="text-center text-slate-600 dark:text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Note-taking functionality coming soon!</p>
                  </div>
                </TabsContent>

                <TabsContent value="discussion" className="h-full m-0 p-6">
                  <div className="text-center text-slate-600 dark:text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Discussion forum coming soon!</p>
                  </div>
                </TabsContent>

                <TabsContent value="exams" className="h-full m-0 p-6">
                  <div className="text-center text-slate-600 dark:text-slate-400">
                    <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Assessment center coming soon!</p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Navigation Footer */}
          <NavigationFooter
            prevSection={prevSection}
            nextSection={nextSection}
            nextChapterSection={nextChapterSection}
            courseId={courseId}
            chapterId={chapterId}
            completedCurrentSection={completedCurrentSection}
          />
        </div>
      </div>

      {/* Adaptive Feedback Overlay */}
      <AdaptiveFeedbackOverlay
        isVisible={learningPreferences.difficultyAdjustment === 'auto'}
        onFeedback={triggerAdaptiveAdjustment}
      />

        {/* Real-Time Collaboration */}
        <RealTimeCollaboration
          courseId={courseId}
          chapterId={chapterId}
          sectionId={sectionId}
          userId={user.id}
          userName={user.name || 'Student'}
          userAvatar={user.image || undefined}
        />

        {/* Enterprise Components */}
        {!focusModeActive && (
          <>
            <SmartMiniTracker
              currentSection={currentChapter.sections.findIndex(s => s.id === sectionId) + 1}
              totalSections={totalSections}
              completedSections={completedSections}
              estimatedTimePerSection={10}
              courseId={courseId}
              userId={user.id}
            />

            <QuickNotesPanel
              sectionId={sectionId}
              sectionTitle={currentSection.title}
              courseId={courseId}
              userId={user.id}
            />
          </>
        )}

        <KeyboardShortcuts
          onNavigatePrev={() => {
            if (prevSection) {
              router.push(`/courses/${courseId}/learn/${chapterId}/sections/${prevSection.id}`);
            }
          }}
          onNavigateNext={() => {
            if (nextSection) {
              router.push(`/courses/${courseId}/learn/${chapterId}/sections/${nextSection.id}`);
            } else if (nextChapterSection) {
              router.push(`/courses/${courseId}/learn/${nextChapterSection.chapter.id}/sections/${nextChapterSection.section.id}`);
            }
          }}
          onToggleFocus={() => setFocusModeActive(!focusModeActive)}
          onToggleNotes={() => setNotesOpen(!notesOpen)}
          onToggleBookmark={() => setIsBookmarked(!isBookmarked)}
        />
      </div>
    </FocusMode>
  );
};

// Enterprise-Level Adaptive Learning Content Component
const AdaptiveLearningContent = ({
  personalizationInsights,
  learningPreferences,
  onUpdatePreferences,
  onProvideFeedback,
  isLoading
}: {
  personalizationInsights: PersonalizationInsights | null;
  learningPreferences: LearningPreferences;
  onUpdatePreferences: (prefs: Partial<LearningPreferences>) => void;
  onProvideFeedback: (feedback: any) => void;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Brain className="w-16 h-16 mx-auto mb-4 text-purple-600 dark:text-purple-400" />
          </motion.div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Analyzing Your Learning Patterns
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Our AI is preparing personalized insights just for you...
          </p>
          <div className="mt-4 flex gap-1.5 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/30 border-2 border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white/50 to-transparent dark:from-slate-900/50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 font-bold">
                Adaptive Learning Dashboard
              </span>
              <Badge variant="outline" className="ml-auto bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-300 dark:border-purple-700">
                AI-Powered
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
          {/* Learning Preferences */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Learning Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Content Format Preference</Label>
                <Select
                  value={learningPreferences.contentFormat}
                  onValueChange={(value: any) => onUpdatePreferences({ contentFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visual">Visual Learning</SelectItem>
                    <SelectItem value="auditory">Auditory Learning</SelectItem>
                    <SelectItem value="kinesthetic">Hands-on Learning</SelectItem>
                    <SelectItem value="reading">Reading/Writing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Learning Pace</Label>
                <Select
                  value={learningPreferences.pacePreference}
                  onValueChange={(value: any) => onUpdatePreferences({ pacePreference: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow & Thorough</SelectItem>
                    <SelectItem value="normal">Normal Pace</SelectItem>
                    <SelectItem value="fast">Fast & Efficient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium text-sm">Auto-adjust Difficulty</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">AI adapts content difficulty</p>
                </div>
                <Switch
                  checked={learningPreferences.difficultyAdjustment === 'auto'}
                  onCheckedChange={(checked) => 
                    onUpdatePreferences({ difficultyAdjustment: checked ? 'auto' : 'manual' })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium text-sm">Show Learning Hints</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Display helpful tips</p>
                </div>
                <Switch
                  checked={learningPreferences.showHints}
                  onCheckedChange={(checked) => onUpdatePreferences({ showHints: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium text-sm">Gamification</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Points, badges, streaks</p>
                </div>
                <Switch
                  checked={learningPreferences.enableGamification}
                  onCheckedChange={(checked) => onUpdatePreferences({ enableGamification: checked })}
                />
              </div>
            </div>
          </div>

          {/* Premium Learning Analytics */}
          {personalizationInsights && (
            <motion.div
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Learning Analytics
                </h3>
                <Badge variant="outline" className="text-xs">
                  Real-time
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200/50 dark:border-emerald-700/50 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Current Streak
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                      {personalizationInsights.progress.streakDays}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                      consecutive days 🔥
                    </p>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Total Time
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                      {Math.round(personalizationInsights.progress.totalTimeSpent / 60)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                      hours invested ⏱️
                    </p>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200/50 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Completion
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                      {Math.round(personalizationInsights.progress.completionRate)}%
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                      completion rate 🎯
                    </p>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-200/50 dark:border-orange-700/50 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-md">
                        <Timer className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Avg Session
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400">
                      {Math.round(personalizationInsights.progress.averageSessionLength)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                      minutes per session ⚡
                    </p>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
};

// Adaptive Feedback Overlay Component
const AdaptiveFeedbackOverlay = ({
  isVisible,
  onFeedback
}: {
  isVisible: boolean;
  onFeedback: (feedback: any) => void;
}) => {
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShowFeedback(true);
      }, 300000); // Show after 5 minutes

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!showFeedback) return null;

  const handleFeedback = (difficulty: string, engagement: number) => {
    onFeedback({
      difficulty,
      engagement,
      understanding: engagement // Simplified for demo
    });
    setShowFeedback(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-purple-200 dark:border-purple-800 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              How&apos;s it going?
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedback(false)}
                className="ml-auto p-1 h-auto"
              >
                <X className="w-3 h-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Help us adapt the content to your learning style
            </p>
            
            <div className="space-y-2">
              <p className="text-xs font-medium">Content difficulty:</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFeedback('too-easy', 7)}
                  className="text-xs"
                >
                  Too Easy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFeedback('just-right', 8)}
                  className="text-xs"
                >
                  Just Right
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFeedback('too-hard', 5)}
                  className="text-xs"
                >
                  Too Hard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

// Demo data functions
function getDemoInsights(): PersonalizationInsights {
  return {
    learningStyle: {
      type: 'Visual',
      confidence: 87,
      description: 'Prefers visual content like diagrams, charts, and videos'
    },
    progress: {
      streakDays: 7,
      totalTimeSpent: 420, // 7 hours in minutes
      averageSessionLength: 45,
      completionRate: 78
    },
    recommendations: {
      nextOptimalContent: 'Interactive coding exercises',
      suggestedBreakTime: 15,
      difficultyAdjustment: 'increase',
      focusAreas: ['Practical applications', 'Code examples']
    },
    emotionalState: {
      engagement: 82,
      confidence: 75,
      motivation: 88,
      stress: 25
    },
    adaptivePath: {
      currentLevel: 'Intermediate',
      suggestedResources: ['Advanced tutorials', 'Practice projects'],
      prerequisites: ['Basic concepts', 'Fundamentals'],
      nextMilestones: ['Complete assessment', 'Start advanced topics']
    }
  };
}

function getDemoStudyBuddy(): StudyBuddy {
  return {
    id: 'sam-buddy-1',
    name: 'SAM',
    personality: 'encouraging',
    avatar: '🤖',
    currentMessage: "Great progress! You're maintaining a 7-day learning streak. Ready to tackle some challenging concepts?",
    suggestions: [
      'Take a 5-minute break before the next section',
      'Try the interactive coding exercise',
      'Review the key concepts from the previous section'
    ]
  };
}