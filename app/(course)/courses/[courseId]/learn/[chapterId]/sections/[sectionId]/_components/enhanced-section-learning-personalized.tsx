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
import { User } from "next-auth";
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
      const response = await axios.post("/api/sam/personalization", {
        action: "get-learning-profile",
        data: {
          userId: user.id,
          courseId,
          sectionId,
          currentProgress: {
            completedSections,
            totalSections,
            currentChapter: chapterId,
            timeSpent: 0 // This would come from user session tracking
          }
        }
      });

      if (response.data.success) {
        setPersonalizationInsights(response.data.data.insights);
        if (response.data.data.studyBuddy) {
          setStudyBuddy(response.data.data.studyBuddy);
        }
        if (response.data.data.preferences) {
          setLearningPreferences(prev => ({ ...prev, ...response.data.data.preferences }));
        }
      }
    } catch (error: any) {
      logger.error("Failed to load personalization data:", error);
      // Use demo data as fallback
      setPersonalizationInsights(getDemoInsights());
      setStudyBuddy(getDemoStudyBuddy());
    } finally {
      setIsLoadingInsights(false);
    }
  }, [user.id, courseId, sectionId, completedSections, totalSections, chapterId]);

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
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950",
      learningPreferences.visualTheme === 'high-contrast' && "contrast-more"
    )}
    style={{ fontSize: `${learningPreferences.fontSize}px` }}
    >
      {/* Enhanced Header with Personalization */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <Link href={`/courses/${courseId}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Course
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Study Buddy Toggle */}
            {studyBuddy && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStudyBuddy(!showStudyBuddy)}
                className={cn(
                  "gap-2",
                  showStudyBuddy && "bg-purple-50 dark:bg-purple-900/20 border-purple-300"
                )}
              >
                {getPersonalityIcon(studyBuddy.personality)}
                Study Buddy
              </Button>
            )}

            {/* Personalization Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPersonalization(!showPersonalization)}
              className={cn(
                "gap-2",
                showPersonalization && "bg-blue-50 dark:bg-blue-900/20 border-blue-300"
              )}
            >
              <Brain className="h-4 w-4" />
              AI Personalization
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={isBookmarked ? "text-yellow-600" : ""}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
            <span>Course Progress</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Enhanced Sidebar with Personalization */}
        <div className={cn(
          "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-700/50 transition-all duration-300",
          sidebarOpen ? "w-80" : "w-0 overflow-hidden",
          "lg:w-80 lg:overflow-visible"
        )}>
          <div className="p-4 space-y-4 h-full overflow-y-auto">
            {/* Course Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                {course.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {currentChapter.title}
              </p>
            </div>

            <Separator />

            {/* Personalization Insights Panel */}
            <AnimatePresence>
              {showPersonalization && personalizationInsights && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        Your Learning Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Learning Style */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getLearningStyleIcon(personalizationInsights.learningStyle.type)}
                          <span className="text-sm font-medium">
                            {personalizationInsights.learningStyle.type}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {personalizationInsights.learningStyle.confidence}% confident
                        </Badge>
                      </div>

                      {/* Emotional State */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Engagement
                          </span>
                          <span>{personalizationInsights.emotionalState.engagement}%</span>
                        </div>
                        <Progress 
                          value={personalizationInsights.emotionalState.engagement} 
                          className="h-1" 
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Confidence
                          </span>
                          <span>{personalizationInsights.emotionalState.confidence}%</span>
                        </div>
                        <Progress 
                          value={personalizationInsights.emotionalState.confidence} 
                          className="h-1" 
                        />
                      </div>

                      {/* Quick Recommendations */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          AI Recommendations:
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <Lightbulb className="w-3 h-3" />
                            {personalizationInsights.recommendations.nextOptimalContent}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <Timer className="w-3 h-3" />
                            Break in {personalizationInsights.recommendations.suggestedBreakTime} min
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Study Buddy Panel */}
            <AnimatePresence>
              {showStudyBuddy && studyBuddy && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {getPersonalityIcon(studyBuddy.personality)}
                        {studyBuddy.name}
                        <Badge variant="outline" className="text-xs">
                          {studyBuddy.personality}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {studyBuddy.currentMessage}
                        </p>
                      </div>
                      
                      {studyBuddy.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Suggestions:
                          </p>
                          <div className="space-y-1">
                            {studyBuddy.suggestions.slice(0, 2).map((suggestion, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <CheckCircle className="w-3 h-3 mt-0.5 text-green-600" />
                                <span>{suggestion}</span>
                              </div>
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
    </div>
  );
};

// Adaptive Learning Content Component
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
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse text-purple-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading your personalized learning insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Adaptive Learning Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* Learning Analytics */}
          {personalizationInsights && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Learning Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {personalizationInsights.progress.streakDays}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">days</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Time</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(personalizationInsights.progress.totalTimeSpent / 60)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">hours</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Completion</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(personalizationInsights.progress.completionRate)}%
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">rate</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Avg Session</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.round(personalizationInsights.progress.averageSessionLength)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">minutes</p>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
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