"use client";

/**
 * ContentAdaptiveHub
 *
 * A unified content and adaptive learning hub that combines content generation,
 * adaptive learning profiles, Socratic dialogue, and microlearning modules
 * into a cohesive personalized learning experience.
 *
 * Phase 4 of the engine merge plan - integrating ContentGenerationEngine,
 * AdaptiveContentEngine, SocraticTeachingEngine, and MicrolearningEngine.
 *
 * @module components/sam/content-adaptive-hub
 */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Wand2,
  Sparkles,
  Zap,
  MessageCircle,
  ChevronRight,
  Activity,
  BookOpen,
  Brain,
  Target,
  Lightbulb,
  TrendingUp,
  Eye,
  RefreshCw,
  Layers,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import existing content/adaptive components
import { ContentGenerationStudio } from "@/components/sam/creator-studio/ContentGenerationStudio";
import { AdaptiveContentWidget } from "@/components/sam/AdaptiveContentWidget";
import { SocraticDialogueWidget } from "@/components/sam/SocraticDialogueWidget";
import { MicrolearningWidget } from "@/components/sam/MicrolearningWidget";

export interface ContentAdaptiveHubProps {
  userId?: string;
  courseId?: string;
  sectionId?: string;
  compact?: boolean;
  className?: string;
  defaultTab?: "overview" | "content-studio" | "adaptive" | "learning";
  onContentGenerated?: (content: { type: string; id: string }) => void;
  onModuleStart?: (moduleId: string) => void;
  onStyleDetected?: (style: string) => void;
}

interface ContentMetric {
  id: string;
  label: string;
  value: number | string;
  trend?: "up" | "down" | "stable";
  status?: "active" | "ready" | "learning";
  icon: typeof Wand2;
}

const CONTENT_TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: Activity,
    description: "Quick content and learning summary",
  },
  {
    id: "content-studio",
    label: "Create",
    icon: Wand2,
    description: "AI-powered content generation",
  },
  {
    id: "adaptive",
    label: "Adaptive",
    icon: Eye,
    description: "Learning style and personalization",
  },
  {
    id: "learning",
    label: "Learn",
    icon: GraduationCap,
    description: "Microlearning and Socratic dialogue",
  },
] as const;

type TabId = typeof CONTENT_TABS[number]["id"];

export function ContentAdaptiveHub({
  userId,
  courseId,
  sectionId,
  compact = false,
  className,
  defaultTab = "overview",
  onContentGenerated,
  onModuleStart,
  onStyleDetected,
}: ContentAdaptiveHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [contentStudioOpen, setContentStudioOpen] = useState(false);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabId);
  }, []);

  // Quick metrics for overview
  const quickMetrics: ContentMetric[] = [
    {
      id: "content-generation",
      label: "Content Studio",
      value: "Ready",
      status: "ready",
      icon: Wand2,
    },
    {
      id: "learning-style",
      label: "Learning Style",
      value: "Adaptive",
      status: "active",
      icon: Eye,
    },
    {
      id: "microlearning",
      label: "Quick Lessons",
      value: "Available",
      status: "ready",
      icon: Zap,
    },
    {
      id: "socratic",
      label: "Dialogues",
      value: "Interactive",
      status: "learning",
      icon: MessageCircle,
    },
  ];

  // Compact mode - just quick action buttons
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setContentStudioOpen(true)}
                className="gap-2"
              >
                <Wand2 className="h-4 w-4 text-violet-500" />
                Create
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Generate courses, assessments, and exercises
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("adaptive")}
                className="gap-2"
              >
                <Eye className="h-4 w-4 text-indigo-500" />
                Adaptive
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              View learning style and personalization
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("learning")}
                className="gap-2"
              >
                <Zap className="h-4 w-4 text-yellow-500" />
                Quick Learn
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Microlearning and Socratic dialogues
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Content Studio Dialog */}
        <Dialog open={contentStudioOpen} onOpenChange={setContentStudioOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <ContentGenerationStudio className="border-0 shadow-none" />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full mode - card with tabs
  return (
    <Card className={cn("overflow-hidden border-slate-200 dark:border-slate-700", className)}>
      <CardHeader className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Content &amp; Adaptive Learning Hub
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              Create personalized content and learn adaptively with AI
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-slate-50/50 dark:bg-slate-800/50 p-1 h-auto flex-wrap">
            {CONTENT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 rounded-lg px-3 py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 space-y-4">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn(
                        "h-4 w-4",
                        metric.status === "active" ? "text-violet-500" :
                        metric.status === "ready" ? "text-green-500" :
                        metric.status === "learning" ? "text-blue-500" : "text-slate-500"
                      )} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {metric.value}
                      {metric.trend && (
                        <TrendingUp className={cn(
                          "inline h-3 w-3 ml-1",
                          metric.trend === "up" ? "text-green-500" : "text-slate-400"
                        )} />
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick Access Panels */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Content Studio Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("content-studio")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Wand2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Content Generation Studio
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Create courses, assessments, exercises
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  {["Course", "Quiz", "Exercises"].map((feature) => (
                    <Badge
                      key={feature}
                      variant="outline"
                      className="text-xs bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </motion.div>

              {/* Adaptive Learning Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("adaptive")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Adaptive Learning Profile
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Personalized learning style detection
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-blue-500" />
                    <span className="text-slate-600 dark:text-slate-300">Visual</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-green-500" />
                    <span className="text-slate-500">Reading</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-orange-500" />
                    <span className="text-slate-500">Kinesthetic</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Learning Tools Quick Access */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Microlearning Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("learning")}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Quick Learning
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Bite-sized lessons, XP rewards, streaks
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    Gamified
                  </Badge>
                </div>
              </motion.div>

              {/* Socratic Dialogue Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("learning")}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Socratic Dialogue
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Learn through guided questioning
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Insights
                  </Badge>
                </div>
              </motion.div>
            </div>

            {/* Quick Start Actions */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-violet-50/50 to-indigo-50/50 dark:from-violet-900/10 dark:to-indigo-900/10 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-violet-500" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Quick Actions
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setActiveTab("content-studio")}>
                  <Wand2 className="h-4 w-4" />
                  Generate Content
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setActiveTab("adaptive")}>
                  <Eye className="h-4 w-4" />
                  Detect My Style
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setActiveTab("learning")}>
                  <Zap className="h-4 w-4" />
                  Quick Lesson
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setActiveTab("learning")}>
                  <Brain className="h-4 w-4" />
                  Start Dialogue
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Content Studio Tab */}
          <TabsContent value="content-studio" className="p-4">
            <ContentGenerationStudio
              className="border-0 shadow-none"
            />
          </TabsContent>

          {/* Adaptive Learning Tab */}
          <TabsContent value="adaptive" className="p-4">
            <AdaptiveContentWidget
              courseId={courseId}
              showTips={true}
              className="border-0 shadow-none"
            />
          </TabsContent>

          {/* Learning Tab - Microlearning + Socratic */}
          <TabsContent value="learning" className="p-0">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Microlearning Widget */}
              <div className="p-4 border-r border-slate-200 dark:border-slate-700">
                <MicrolearningWidget
                  topicId={sectionId}
                  courseId={courseId}
                  compact={false}
                  className="border-0 shadow-none"
                  onModuleStart={(module) => onModuleStart?.(module.id)}
                />
              </div>
              {/* Socratic Dialogue Widget */}
              <div className="p-4">
                <SocraticDialogueWidget
                  courseId={courseId}
                  sectionId={sectionId}
                  compact={false}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Content Studio Dialog for expanded view */}
      <Dialog open={contentStudioOpen} onOpenChange={setContentStudioOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <ContentGenerationStudio className="border-0 shadow-none" />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ContentAdaptiveHub;
