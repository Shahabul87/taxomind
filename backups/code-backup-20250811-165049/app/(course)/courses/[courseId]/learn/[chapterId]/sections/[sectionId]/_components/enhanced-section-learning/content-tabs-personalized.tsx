"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';
import { 
  BookOpen, 
  FileText, 
  MessageCircle,
  Video,
  Code,
  Lightbulb,
  Play,
  StickyNote,
  GraduationCap,
  Brain,
  Globe,
  Sparkles,
  Shield,
  Eye,
  Volume2,
  Gamepad2,
  Target,
  Award,
  Clock,
  TrendingUp,
  Zap,
  Info,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Section } from "./types";
import { VideoContent } from "./video-content";
import { BlogContent } from "./blog-content";
import { ArticleContent } from "./article-content";
import { CodeContent } from "./code-content";
import { NotesContent } from "./notes-content";
import { ExamsContent } from "./exams-content";
import { AdaptiveAssessmentContent } from "./adaptive-assessment-content";
import { ResourceIntelligenceContent } from "@/components/sam/resource-intelligence-content";

type ContentSubTab = "videos" | "blogs" | "articles" | "code";

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

interface ContentTabsPersonalizedProps {
  currentSection: Section;
  user: any;
  courseId: string;
  chapterId: string;
  sectionId: string;
  preferences: LearningPreferences;
  defaultTab?: "content" | "resources";
}

export const ContentTabsPersonalized = ({
  currentSection,
  user,
  courseId,
  chapterId,
  sectionId,
  preferences,
  defaultTab = "content",
}: ContentTabsPersonalizedProps) => {
  const [activeContentTab, setActiveContentTab] = useState<ContentSubTab>("videos");
  const [adaptiveRecommendations, setAdaptiveRecommendations] = useState<any>(null);
  const [showPersonalizedHints, setShowPersonalizedHints] = useState(preferences.showHints);

  // Get available content types with personalization
  const availableContent = [
    {
      id: "videos",
      label: "Videos",
      icon: Video,
      count: currentSection.videos?.length || 0,
      color: "text-red-500",
      bgColor: "bg-red-50 text-red-700 border-red-200",
      recommended: preferences.contentFormat === 'visual' || preferences.contentFormat === 'auditory',
      learningStyle: 'Visual/Auditory'
    },
    {
      id: "blogs",
      label: "Blogs",
      icon: BookOpen,
      count: currentSection.blogs?.length || 0,
      color: "text-green-500",
      bgColor: "bg-green-50 text-green-700 border-green-200",
      recommended: preferences.contentFormat === 'reading',
      learningStyle: 'Reading/Writing'
    },
    {
      id: "articles",
      label: "Articles",
      icon: FileText,
      count: currentSection.articles?.length || 0,
      color: "text-blue-500",
      bgColor: "bg-blue-50 text-blue-700 border-blue-200",
      recommended: preferences.contentFormat === 'reading',
      learningStyle: 'Reading/Writing'
    },
    {
      id: "code",
      label: "Code",
      icon: Code,
      count: currentSection.codeExplanations?.length || 0,
      color: "text-purple-500",
      bgColor: "bg-purple-50 text-purple-700 border-purple-200",
      recommended: preferences.contentFormat === 'kinesthetic',
      learningStyle: 'Hands-on/Kinesthetic'
    }
  ].filter(item => item.count > 0);

  // Set recommended content type based on learning preferences
  useEffect(() => {
    const recommendedContent = availableContent.find(item => item.recommended);
    if (recommendedContent) {
      setActiveContentTab(recommendedContent.id as ContentSubTab);
    } else if (availableContent.length > 0) {
      setActiveContentTab(availableContent[0].id as ContentSubTab);
    }
  }, [preferences.contentFormat, currentSection.id, availableContent]);

  const generateAdaptiveRecommendations = useCallback(() => {
    const baseRecommendations = {
      suggestedOrder: [] as string[],
      estimatedTime: 0,
      difficultyLevel: 'intermediate' as string,
      personalizedTips: [] as string[],
      nextActions: [] as string[]
    };

    // Customize based on preferences
    switch (preferences.contentFormat) {
      case 'visual':
        baseRecommendations.suggestedOrder = ['videos', 'articles', 'code', 'blogs'];
        baseRecommendations.personalizedTips = [
          'Start with videos for better visual understanding',
          'Use diagrams and visual aids when available',
          'Take screenshot notes of important concepts'
        ];
        break;
      case 'auditory':
        baseRecommendations.suggestedOrder = ['videos', 'articles', 'blogs', 'code'];
        baseRecommendations.personalizedTips = [
          'Listen to video explanations first',
          'Use text-to-speech for articles',
          'Discuss concepts with others'
        ];
        break;
      case 'reading':
        baseRecommendations.suggestedOrder = ['articles', 'blogs', 'code', 'videos'];
        baseRecommendations.personalizedTips = [
          'Read comprehensive articles first',
          'Take detailed written notes',
          'Use code examples to reinforce learning'
        ];
        break;
      case 'kinesthetic':
        baseRecommendations.suggestedOrder = ['code', 'videos', 'articles', 'blogs'];
        baseRecommendations.personalizedTips = [
          'Start with hands-on coding exercises',
          'Practice immediately after learning',
          'Build small projects to apply concepts'
        ];
        break;
      default:
        baseRecommendations.suggestedOrder = ['videos', 'articles', 'code', 'blogs'];
    }

    // Adjust time estimates based on pace preference
    const timeMultiplier = preferences.pacePreference === 'slow' ? 1.5 : 
                          preferences.pacePreference === 'fast' ? 0.7 : 1;
    baseRecommendations.estimatedTime = Math.round(45 * timeMultiplier);

    return baseRecommendations;
  }, [preferences.contentFormat, preferences.pacePreference]);

  const loadAdaptiveRecommendations = useCallback(async () => {
    try {
      // This would normally call the SAM personalization API
      // For now, we'll use demo data based on preferences
      const recommendations = generateAdaptiveRecommendations();
      setAdaptiveRecommendations(recommendations);
    } catch (error) {
      logger.error("Failed to load adaptive recommendations:", error);
    }
  }, [generateAdaptiveRecommendations, setAdaptiveRecommendations]);

  // Load adaptive recommendations
  useEffect(() => {
    loadAdaptiveRecommendations();
  }, [currentSection.id, preferences, loadAdaptiveRecommendations]);

  const getLearningStyleIcon = (style: string) => {
    if (style.includes('Visual')) return <Eye className="w-4 h-4" />;
    if (style.includes('Auditory')) return <Volume2 className="w-4 h-4" />;
    if (style.includes('Hands-on')) return <Gamepad2 className="w-4 h-4" />;
    if (style.includes('Reading')) return <BookOpen className="w-4 h-4" />;
    return <Brain className="w-4 h-4" />;
  };

  const renderPersonalizedHints = () => {
    if (!showPersonalizedHints || !adaptiveRecommendations) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              Personalized Learning Path
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPersonalizedHints(false)}
                className="ml-auto p-1 h-auto"
              >
                <X className="w-3 h-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Estimated time: {adaptiveRecommendations.estimatedTime} minutes</span>
              <Badge variant="outline" className="text-xs">
                {preferences.pacePreference} pace
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Recommended learning sequence:
              </p>
              <div className="flex flex-wrap gap-2">
                {adaptiveRecommendations.suggestedOrder.map((contentType: string, index: number) => {
                  const content = availableContent.find(c => c.id === contentType);
                  if (!content) return null;
                  
                  const Icon = content.icon;
                  return (
                    <Badge
                      key={contentType}
                      variant={activeContentTab === contentType ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all text-xs",
                        activeContentTab === contentType && "bg-purple-600 text-white"
                      )}
                      onClick={() => setActiveContentTab(contentType as ContentSubTab)}
                    >
                      <span className="mr-1">{index + 1}.</span>
                      <Icon className="w-3 h-3 mr-1" />
                      {content.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {adaptiveRecommendations.personalizedTips.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Tips for your learning style:
                </p>
                <div className="space-y-1">
                  {adaptiveRecommendations.personalizedTips.slice(0, 2).map((tip: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Lightbulb className="w-3 h-3 mt-0.5 text-purple-600" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderGamificationElements = () => {
    if (!preferences.enableGamification) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-4"
      >
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Award className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-green-800 dark:text-green-200">
                    Learning Streak: 7 days
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Complete this section to maintain your streak!
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">+50</p>
                <p className="text-xs text-green-600">XP for completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderContentTabs = () => {
    if (availableContent.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400">No content available for this section.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Content Type Selector */}
        <div className="flex flex-wrap gap-2">
          {availableContent.map((content) => {
            const Icon = content.icon;
            const isActive = activeContentTab === content.id;
            const isRecommended = content.recommended;
            
            return (
              <Button
                key={content.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveContentTab(content.id as ContentSubTab)}
                className={cn(
                  "gap-2 relative transition-all",
                  isActive && "bg-purple-600 hover:bg-purple-700",
                  isRecommended && !isActive && "border-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20"
                )}
              >
                <Icon className="w-4 h-4" />
                {content.label}
                <Badge variant={isActive ? "secondary" : "outline"} className="text-xs">
                  {content.count}
                </Badge>
                {isRecommended && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                  </div>
                )}
              </Button>
            );
          })}
        </div>

        {/* Learning Style Indicator */}
        {preferences.showHints && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            {getLearningStyleIcon(availableContent.find(c => c.id === activeContentTab)?.learningStyle || '')}
            <span>
              Recommended for {availableContent.find(c => c.id === activeContentTab)?.learningStyle} learners
            </span>
          </div>
        )}

        {/* Content Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeContentTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeContentTab === "videos" && (
              <VideoContentPersonalized 
                videos={currentSection.videos || []} 
                preferences={preferences}
              />
            )}
            {activeContentTab === "blogs" && (
              <BlogContent 
                blogs={currentSection.blogs || []} 
              />
            )}
            {activeContentTab === "articles" && (
              <ArticleContent 
                articles={currentSection.articles || []} 
              />
            )}
            {activeContentTab === "code" && (
              <CodeContent 
                codeExplanations={(currentSection.codeExplanations || []).map(code => ({
                  id: code.id,
                  title: code.heading || 'Code Example',
                  description: code.explanation || undefined,
                  code: undefined,
                  language: undefined,
                  difficulty: undefined,
                  concepts: undefined,
                  author: undefined,
                  explanation: code.explanation || undefined
                }))} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  if (defaultTab === "resources") {
    return (
      <div className="p-6">
        {renderGamificationElements()}
        <ResourceIntelligenceContent 
          courseId={courseId}
          chapterId={chapterId}
          sectionId={sectionId}
          sectionTitle={currentSection.title}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {renderGamificationElements()}
      {renderPersonalizedHints()}
      {renderContentTabs()}
    </div>
  );
};

// Enhanced content components would need to accept preferences
// For now, we'll extend the existing ones
const VideoContentPersonalized = ({ videos, preferences }: { videos: any[], preferences: LearningPreferences }) => {
  return (
    <div className="space-y-4">
      {preferences.showHints && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
              <Info className="w-4 h-4" />
              <span>
                {preferences.contentFormat === 'visual' ? 
                  'Perfect! Videos are ideal for visual learners.' :
                  'Videos can help reinforce concepts through visual demonstration.'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      <VideoContent videos={videos} />
    </div>
  );
};

export { ContentTabsPersonalized as ContentTabsEnhanced };