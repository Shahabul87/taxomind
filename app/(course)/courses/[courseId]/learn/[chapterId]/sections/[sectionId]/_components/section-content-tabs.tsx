"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLearningMode } from "../../../../_components/learning-mode-context";
import { SectionYouTubePlayer } from "./section-youtube-player";
import { MathLatexRenderer, initMathJax } from "./math-latex-renderer";
import { CodeSyntaxHighlighter, initPrism } from "./code-syntax-highlighter";
import { ExamQuizComponent } from "./exam-quiz-component";
import { ResourceDownloads } from "./resource-downloads";
import { CompletionCertificate } from "./completion-certificate";
import { SafeHtmlRenderer } from "./safe-html-renderer";
import { SAMPracticeProblems } from "@/components/learning/sam-practice-problems";
import { SAMSocraticDialogue } from "@/components/learning/sam-socratic-dialogue";
import { InteractiveCodeViewer } from "../../../../_components/interactive-code-viewer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Video,
  BookOpen,
  Calculator,
  Code2,
  FileQuestion,
  Download,
  Lock,
  PlayCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Award,
  Brain,
  MessageCircle,
  Star,
  User,
  Globe,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface SectionContentTabsProps {
  section: any; // Will be properly typed with actual Prisma types
  courseId: string;
  chapterId: string;
  sectionId: string;
  userProgress?: any;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function SectionContentTabs({
  section,
  courseId,
  chapterId,
  sectionId,
  userProgress,
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange,
}: SectionContentTabsProps) {
  const { mode, canAccessContent, isEnrolled, isTeacher } = useLearningMode();
  const [internalActiveTab, setInternalActiveTab] = useState("overview");
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [hasMounted, setHasMounted] = useState(false);
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

  // Use external tab state if provided, otherwise use internal
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = externalOnTabChange || setInternalActiveTab;

  // Track client-side mounting for hydration-safe rendering
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Load saved tab and progress from localStorage
  useEffect(() => {
    // Only load from localStorage if not controlled externally
    if (!externalActiveTab) {
      const storageKey = `section_${sectionId}_tab`;
      const savedTab = localStorage.getItem(storageKey);
      if (savedTab) {
        setInternalActiveTab(savedTab);
      }
    }

    // Load completed items
    if (userProgress?.completedItems) {
      setCompletedItems(new Set(userProgress.completedItems));
    }
  }, [sectionId, userProgress, externalActiveTab]);

  // Save active tab to localStorage - instant switching with forceMount
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem(`section_${sectionId}_tab`, value);
  };

  // Initialize MathJax and Prism for enhanced content rendering
  useEffect(() => {
    initMathJax();
    initPrism();
  }, []);

  // Mark item as completed
  const markItemComplete = async (itemId: string, itemType: string) => {
    if (mode !== "learning") return;

    try {
      const response = await fetch(`/api/sections/${sectionId}/complete-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, itemType }),
      });

      if (response.ok) {
        setCompletedItems((prev) => new Set([...prev, itemId]));
        toast.success("Item marked as complete!");
      }
    } catch (error) {
      console.error("Error marking item complete:", error);
    }
  };

  // Count content items
  const contentCounts = {
    videos: section.videos?.length || 0,
    blogs: section.blogs?.length || 0,
    math: section.mathExplanations?.length || 0,
    code: section.codeExplanations?.length || 0,
    exams: section.exams?.length || 0,
    resources: section.notes?.length || 0,
  };

  const hasContent = Object.values(contentCounts).some((count) => count > 0);

  // Group code explanations: main code blocks with their line explanations
  const groupedCodeExplanations = useMemo(() => {
    const codeExplanations = section.codeExplanations || [];

    // Find main code blocks (those without groupId and with actual code content)
    const mainBlocks = codeExplanations.filter(
      (item: any) => !item.groupId && item.code
    );

    // Find line explanations (those with groupId pointing to a main block)
    const lineExplanations = codeExplanations.filter(
      (item: any) => item.groupId && (item.lineStart !== null || item.lineEnd !== null)
    );

    // Separate main blocks into those with explanations and those without
    const blocksWithExplanations: any[] = [];
    const blocksWithoutExplanations: any[] = [];

    mainBlocks.forEach((mainBlock: any) => {
      const blockExplanations = lineExplanations
        .filter((exp: any) => exp.groupId === mainBlock.id)
        .map((exp: any) => ({
          id: exp.id,
          title: exp.title || "Code Explanation",
          explanation: exp.explanation || "",
          lineStart: exp.lineStart || 1,
          lineEnd: exp.lineEnd || exp.lineStart || 1,
          position: exp.position || 0,
        }))
        .sort((a: any, b: any) => a.lineStart - b.lineStart);

      if (blockExplanations.length > 0) {
        // Has line explanations - use InteractiveCodeViewer
        blocksWithExplanations.push({
          id: mainBlock.id,
          title: mainBlock.title || "Code Block",
          code: mainBlock.code || "",
          language: mainBlock.language || "typescript",
          explanations: blockExplanations,
        });
      } else {
        // No line explanations - use CodeSyntaxHighlighter
        blocksWithoutExplanations.push(mainBlock);
      }
    });

    return {
      grouped: blocksWithExplanations,
      standalone: blocksWithoutExplanations,
    };
  }, [section.codeExplanations]);

  return (
    <Card className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">Learning Materials</CardTitle>
        <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
          Additional videos, articles, code examples, and resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex flex-wrap gap-1 mb-6 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg sticky top-[57px] z-30 border border-slate-100 dark:border-slate-700">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>

            {contentCounts.videos > 0 && (
              <TabsTrigger value="videos" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">Videos</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-slate-200 dark:bg-slate-700">
                  {contentCounts.videos}
                </Badge>
              </TabsTrigger>
            )}

            {contentCounts.blogs > 0 && (
              <TabsTrigger value="blogs" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Articles</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-slate-200 dark:bg-slate-700">
                  {contentCounts.blogs}
                </Badge>
              </TabsTrigger>
            )}

            {contentCounts.math > 0 && (
              <TabsTrigger value="math" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Math</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-slate-200 dark:bg-slate-700">
                  {contentCounts.math}
                </Badge>
              </TabsTrigger>
            )}

            {contentCounts.code > 0 && (
              <TabsTrigger value="code" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Code2 className="h-4 w-4" />
                <span className="hidden sm:inline">Code</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-slate-200 dark:bg-slate-700">
                  {contentCounts.code}
                </Badge>
              </TabsTrigger>
            )}

            {contentCounts.exams > 0 && (
              <TabsTrigger value="exams" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <FileQuestion className="h-4 w-4" />
                <span className="hidden sm:inline">Exams</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-slate-200 dark:bg-slate-700">
                  {contentCounts.exams}
                </Badge>
              </TabsTrigger>
            )}

            {contentCounts.resources > 0 && (
              <TabsTrigger value="resources" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Resources</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-slate-200 dark:bg-slate-700">
                  {contentCounts.resources}
                </Badge>
              </TabsTrigger>
            )}

            {mode === "learning" && userProgress?.progressPercent >= 100 && (
              <TabsTrigger value="certificate" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Certificate</span>
              </TabsTrigger>
            )}

            {/* SAM AI Practice Tab */}
            {(isEnrolled || isTeacher) && (
              <TabsTrigger value="practice" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Practice</span>
              </TabsTrigger>
            )}

            {/* SAM AI Tutor Tab */}
            {(isEnrolled || isTeacher) && (
              <TabsTrigger value="tutor" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">AI Tutor</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab Content Container with min-height to prevent layout shift */}
          <div className="min-h-[400px] relative">
          {/* Overview Tab */}
          <TabsContent
            value="overview"
            className="space-y-6 data-[state=inactive]:hidden"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {/* Content Summary - Show what's available in each tab */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Available Learning Materials</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  This section contains various learning materials to help you master the topic.
                  Navigate through the tabs above to access different types of content.
                </p>
              </div>

              {/* Content Summary Cards */}
              {hasContent && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {contentCounts.videos > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{contentCounts.videos}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Videos</p>
                      </div>
                    </div>
                  )}
                  {contentCounts.blogs > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{contentCounts.blogs}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Articles</p>
                      </div>
                    </div>
                  )}
                  {contentCounts.math > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{contentCounts.math}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Math</p>
                      </div>
                    </div>
                  )}
                  {contentCounts.code > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                      <Code2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{contentCounts.code}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Code</p>
                      </div>
                    </div>
                  )}
                  {contentCounts.exams > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <FileQuestion className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{contentCounts.exams}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Exams</p>
                      </div>
                    </div>
                  )}
                  {contentCounts.resources > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                      <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{contentCounts.resources}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Resources</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Tips Section */}
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
                  <AlertCircle className="h-4 w-4 text-slate-500" />
                  Quick Tips
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Space to play/pause, N for next, P for previous</li>
                  <li>• Track progress by marking items complete</li>
                  <li>• Download resources for offline study</li>
                  {mode === "learning" && userProgress?.progressPercent >= 100 && (
                    <li className="text-emerald-600 dark:text-emerald-400 font-medium">• Certificate available in Certificate tab</li>
                  )}
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Videos Tab */}
          {contentCounts.videos > 0 && (
            <TabsContent
              value="videos"
              className="space-y-6 data-[state=inactive]:hidden"
            >
              {/* Enterprise Section Header */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 p-[1px]">
                <div className="rounded-xl bg-white dark:bg-slate-900 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/25">
                        <Video className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Video Tutorials</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Watch and learn from curated video content</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Progress Indicator - Only render dynamic content after mount */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {hasMounted ? section.videos.filter((v: { id: string }) => completedItems.has(v.id)).length : 0}/{contentCounts.videos}
                          </span>
                        </div>
                        <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: hasMounted ? `${(section.videos.filter((v: { id: string }) => completedItems.has(v.id)).length / contentCounts.videos) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                      {/* Total Duration */}
                      <Badge variant="secondary" className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                        <Clock className="h-3 w-3 mr-1" />
                        {(() => {
                          const totalMinutes = section.videos.reduce((acc: number, v: { duration?: number | null }) => acc + (v.duration || 0), 0);
                          return totalMinutes > 60
                            ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                            : `${totalMinutes}m`;
                        })()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {section.videos.map((video: { id: string; title: string; description?: string | null; url?: string; thumbnail?: string | null; platform?: string | null; rating?: number | null; duration?: number | null; author?: string | null }, index: number) => (
                  <Card key={video.id} className={cn(
                    "group overflow-hidden bg-white dark:bg-slate-900 border-2 shadow-sm hover:shadow-lg transition-all duration-300",
                    completedItems.has(video.id)
                      ? "border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-700"
                  )}>
                    {/* Thumbnail */}
                    <div className="relative h-44 w-full bg-gradient-to-br from-red-100 via-orange-100 to-amber-100 dark:from-red-900/30 dark:via-orange-900/20 dark:to-amber-900/30 overflow-hidden">
                      {video.thumbnail ? (
                        <Image
                          src={video.thumbnail}
                          alt={video.title || `Video ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="p-6 rounded-full bg-gradient-to-br from-red-200 to-orange-200 dark:from-red-800/50 dark:to-orange-800/50">
                            <Video className="h-10 w-10 text-red-500 dark:text-red-400" />
                          </div>
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="bg-white/95 dark:bg-slate-900/95 rounded-full p-4 shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <PlayCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
                        </div>
                      </div>
                      {/* Top badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        {video.platform && (
                          <Badge className="bg-black/80 backdrop-blur-sm text-white border-0 text-xs font-medium shadow-lg">
                            {video.platform === "youtube" ? "YouTube" : video.platform === "vimeo" ? "Vimeo" : video.platform}
                          </Badge>
                        )}
                        {completedItems.has(video.id) && (
                          <Badge className="bg-emerald-500/90 backdrop-blur-sm text-white border-0 text-xs font-medium shadow-lg">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Watched
                          </Badge>
                        )}
                      </div>
                      {/* Bottom info */}
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                        {/* Video number */}
                        <Badge variant="secondary" className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 border-0 text-xs">
                          Video {index + 1}
                        </Badge>
                        {/* Duration */}
                        {video.duration && (
                          <Badge className="bg-black/80 backdrop-blur-sm text-white border-0 text-xs font-medium">
                            <Clock className="h-3 w-3 mr-1" />
                            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug">
                        {video.title || `Video ${index + 1}`}
                      </CardTitle>
                      {video.description && (
                        <CardDescription className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {video.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 space-y-3">
                      {/* Author & Rating Row */}
                      <div className="flex items-center justify-between">
                        {video.author ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate max-w-[100px]">
                              {video.author}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                            <Video className="h-3.5 w-3.5" />
                            <span>Tutorial</span>
                          </div>
                        )}
                        {/* Rating */}
                        {video.rating && video.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  star <= (video.rating || 0)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200 dark:text-slate-700"
                                )}
                              />
                            ))}
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 ml-1">
                              {video.rating}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="h-3.5 w-3.5 text-slate-200 dark:text-slate-700" />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Watch Button */}
                      {video.url && (
                        <Button
                          size="sm"
                          className={cn(
                            "w-full transition-all duration-300",
                            expandedVideoId === video.id
                              ? "bg-slate-700 hover:bg-slate-800 text-white"
                              : completedItems.has(video.id)
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                              : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg"
                          )}
                          onClick={() => {
                            setExpandedVideoId(expandedVideoId === video.id ? null : video.id);
                          }}
                        >
                          {expandedVideoId === video.id ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Close Player
                            </>
                          ) : completedItems.has(video.id) ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Watch Again
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Watch Now
                            </>
                          )}
                        </Button>
                      )}

                      {/* Inline Video Player */}
                      <AnimatePresence>
                        {expandedVideoId === video.id && video.url && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden -mx-4 -mb-4 mt-3"
                          >
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 bg-slate-50 dark:bg-slate-800/50 px-4 pb-4">
                              <div className="rounded-lg overflow-hidden shadow-lg">
                                <SectionYouTubePlayer
                                  videoUrl={video.url}
                                  sectionId={sectionId}
                                  sectionTitle={video.title || section.title}
                                  onComplete={() => markItemComplete(video.id, "video")}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                ))}
              </div>

            </TabsContent>
          )}

          {/* Blogs/Articles Tab */}
          {contentCounts.blogs > 0 && (
            <TabsContent
              value="blogs"
              className="space-y-6 data-[state=inactive]:hidden"
            >
              {/* Enterprise Section Header */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 p-[1px]">
                <div className="rounded-xl bg-white dark:bg-slate-900 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Curated Articles</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Handpicked reading materials from top sources</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Progress Indicator - Only render dynamic content after mount */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {hasMounted ? section.blogs.filter((b: { id: string }) => completedItems.has(b.id)).length : 0}/{contentCounts.blogs}
                          </span>
                        </div>
                        <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: hasMounted ? `${(section.blogs.filter((b: { id: string }) => completedItems.has(b.id)).length / contentCounts.blogs) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                      {/* Estimated Reading Time */}
                      <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        <BookOpen className="h-3 w-3 mr-1" />
                        ~{contentCounts.blogs * 5} min read
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blog Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {section.blogs.map((blog: { id: string; title: string; description?: string | null; content?: string; url?: string; thumbnail?: string | null; author?: string | null; rating?: number | null; siteName?: string | null }, index: number) => (
                  <Card key={blog.id} className={cn(
                    "group overflow-hidden bg-white dark:bg-slate-900 border-2 shadow-sm hover:shadow-lg transition-all duration-300",
                    completedItems.has(blog.id)
                      ? "border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"
                  )}>
                    {/* Thumbnail */}
                    <div className="relative h-44 w-full bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 dark:from-blue-900/30 dark:via-cyan-900/20 dark:to-teal-900/30 overflow-hidden">
                      {blog.thumbnail ? (
                        <Image
                          src={blog.thumbnail}
                          alt={blog.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="p-6 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-800/50 dark:to-cyan-800/50">
                            <BookOpen className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                          </div>
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Read more overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="bg-white/95 dark:bg-slate-900/95 rounded-full p-4 shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <ExternalLink className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                        </div>
                      </div>
                      {/* Top badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        {blog.siteName && (
                          <Badge className="bg-black/80 backdrop-blur-sm text-white border-0 text-xs font-medium shadow-lg">
                            <Globe className="h-3 w-3 mr-1" />
                            {blog.siteName}
                          </Badge>
                        )}
                        {completedItems.has(blog.id) && (
                          <Badge className="bg-emerald-500/90 backdrop-blur-sm text-white border-0 text-xs font-medium shadow-lg">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Read
                          </Badge>
                        )}
                      </div>
                      {/* Bottom info */}
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                        {/* Article number */}
                        <Badge variant="secondary" className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 border-0 text-xs">
                          Article {index + 1}
                        </Badge>
                        {/* Estimated reading time */}
                        <Badge className="bg-black/80 backdrop-blur-sm text-white border-0 text-xs font-medium">
                          <Clock className="h-3 w-3 mr-1" />
                          ~5 min
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                        {blog.title}
                      </CardTitle>
                      {blog.description && (
                        <CardDescription className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {blog.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 space-y-3">
                      {/* Author and Rating Row */}
                      <div className="flex items-center justify-between">
                        {blog.author ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate max-w-[100px]">
                              {blog.author}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                            <FileText className="h-3.5 w-3.5" />
                            <span>Article</span>
                          </div>
                        )}
                        {/* Rating */}
                        {blog.rating && blog.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  star <= (blog.rating || 0)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200 dark:text-slate-700"
                                )}
                              />
                            ))}
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 ml-1">
                              {blog.rating}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="h-3.5 w-3.5 text-slate-200 dark:text-slate-700" />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {blog.url && (
                          <Button
                            size="sm"
                            asChild
                            className={cn(
                              "flex-1 transition-all duration-300",
                              completedItems.has(blog.id)
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg"
                            )}
                          >
                            <Link href={blog.url} target="_blank" rel="noopener noreferrer">
                              {completedItems.has(blog.id) ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Read Again
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Read Article
                                </>
                              )}
                            </Link>
                          </Button>
                        )}
                        {mode === "learning" && !completedItems.has(blog.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markItemComplete(blog.id, "blog")}
                            className="border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Math Explanations Tab */}
          {contentCounts.math > 0 && (
            <TabsContent
              value="math"
              className="space-y-6 data-[state=inactive]:hidden"
            >
              {/* Enterprise Section Header */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 p-[1px]">
                <div className="rounded-xl bg-white dark:bg-slate-900 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/25">
                        <Calculator className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Mathematical Concepts</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Equations, formulas, and mathematical explanations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Progress Indicator - Only render dynamic content after mount */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {hasMounted ? section.mathExplanations.filter((m: { id: string }) => completedItems.has(m.id)).length : 0}/{contentCounts.math}
                          </span>
                        </div>
                        <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-500"
                            style={{ width: hasMounted ? `${(section.mathExplanations.filter((m: { id: string }) => completedItems.has(m.id)).length / contentCounts.math) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                      {/* Formulas Count */}
                      <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                        <Calculator className="h-3 w-3 mr-1" />
                        {contentCounts.math} formulas
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Math Cards */}
              <div className="grid gap-4">
                {section.mathExplanations.map((math: { id: string; title: string; content?: string; latex?: string; latexEquation?: string; equation?: string; explanation?: string; imageUrl?: string; mode?: string; isPublished?: boolean; position?: number }, index: number) => (
                  <div key={math.id} className="relative">
                    {/* Card Number Badge */}
                    <div className="absolute -left-2 -top-2 z-10">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-white text-xs font-bold shadow-lg shadow-purple-500/25">
                        {index + 1}
                      </div>
                    </div>
                    <MathLatexRenderer
                      math={math}
                      isCompleted={completedItems.has(math.id)}
                      canMarkComplete={mode === "learning"}
                      onMarkComplete={(id) => markItemComplete(id, "math")}
                    />
                  </div>
                ))}
              </div>

              {/* Quick Reference Footer */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                    <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">Study Tips</h4>
                    <ul className="mt-1 text-xs text-purple-700 dark:text-purple-300 space-y-0.5">
                      <li>• Click on equations to copy them to clipboard</li>
                      <li>• Expand explanations for detailed derivations</li>
                      <li>• Mark concepts as understood to track progress</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Code Explanations Tab */}
          {contentCounts.code > 0 && (
            <TabsContent
              value="code"
              className="space-y-6 min-h-[300px] data-[state=inactive]:hidden"
            >
              <div className="grid gap-6">
                {/* Grouped code blocks with line-by-line explanations */}
                {groupedCodeExplanations.grouped.map((codeBlock: any) => (
                  <InteractiveCodeViewer
                    key={codeBlock.id}
                    codeBlock={codeBlock}
                  />
                ))}

                {/* Standalone code blocks (without line explanations) */}
                {groupedCodeExplanations.standalone.map((code: any) => (
                  <CodeSyntaxHighlighter
                    key={code.id}
                    code={code}
                    isCompleted={completedItems.has(code.id)}
                    canMarkComplete={mode === "learning"}
                    onMarkComplete={(id) => markItemComplete(id, "code")}
                  />
                ))}
              </div>
            </TabsContent>
          )}

          {/* Exams Tab */}
          {contentCounts.exams > 0 && (
            <TabsContent
              value="exams"
              className="space-y-4 data-[state=inactive]:hidden"
            >
              <div className="grid gap-4">
                {section.exams.map((exam: any) => {
                  // Transform exam data to match the ExamQuizComponent format
                  // Handle both Prisma relation name (ExamQuestion) and frontend name (questions)
                  const questions = exam.questions || exam.ExamQuestion || [];
                  const formattedExam = {
                    id: exam.id,
                    title: exam.title,
                    description: exam.description,
                    questions: questions,
                    passingScore: exam.passingScore,
                    timeLimit: exam.timeLimit,
                    attempts: exam.attempts,
                  };

                  // Show locked state for non-enrolled users
                  if (!isEnrolled && !isTeacher) {
                    return (
                      <Card key={exam.id} className="overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-medium text-slate-900 dark:text-white">{exam.title}</CardTitle>
                          {exam.description && (
                            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">{exam.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col items-center justify-center py-6">
                            <Lock className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                              Enroll to access exams
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <ExamQuizComponent
                      key={exam.id}
                      exam={formattedExam}
                      sectionId={sectionId}
                      onComplete={(score) => {
                        markItemComplete(exam.id, "exam");
                        toast.success(`Exam completed with score: ${score}%`);
                      }}
                    />
                  );
                })}
              </div>
            </TabsContent>
          )}

          {/* Resources Tab */}
          {contentCounts.resources > 0 && (
            <TabsContent
              value="resources"
              className="space-y-4 data-[state=inactive]:hidden"
            >
              <ResourceDownloads
                resources={section.notes?.map((note: any) => ({
                  id: note.id,
                  title: note.title || "Resource",
                  description: note.description,
                  type: note.type || "doc",
                  url: note.url || "#",
                  size: note.size,
                  downloadCount: note.downloadCount,
                  tags: note.tags,
                  isRequired: note.isRequired,
                  category: note.category || "General",
                }))}
                sectionId={sectionId}
                courseId={courseId}
                chapterId={chapterId}
                onDownload={(resource) => {
                  markItemComplete(resource.id, "resource");
                }}
              />
            </TabsContent>
          )}

          {/* Certificate Tab - Show when section is completed */}
          {mode === "learning" && userProgress?.progressPercent >= 100 && (
            <TabsContent
              value="certificate"
              className="space-y-4 data-[state=inactive]:hidden"
            >
              <CompletionCertificate
                certificateData={{
                  recipientName: userProgress?.userName || "Student",
                  courseName: section.title,
                  completionDate: new Date(),
                  certificateId: `CERT-${sectionId}-${userProgress?.userId || "user"}`,
                  issuerName: "Taxomind",
                  issuerTitle: "Director of Education",
                  score: userProgress?.score,
                  timeSpent: userProgress?.timeSpent,
                  sectionsCompleted: 1,
                  totalSections: 1,
                  skills: section.skills || [],
                }}
                courseId={courseId}
                userId={userProgress?.userId}
              />
            </TabsContent>
          )}

          {/* SAM AI Practice Tab Content */}
          {(isEnrolled || isTeacher) && (
            <TabsContent
              value="practice"
              className="space-y-4 min-h-[400px] data-[state=inactive]:hidden"
            >
              <div className="min-h-[350px]">
                <SAMPracticeProblems
                  topic={section.title}
                  sectionId={sectionId}
                  userId={userProgress?.userId || "anonymous"}
                  bloomsLevel="APPLY"
                  difficulty="intermediate"
                  onComplete={(stats) => {
                    toast.success(`Practice complete! Score: ${Math.round(stats.score)}%`);
                    if (stats.correct === stats.total) {
                      markItemComplete(`practice_${sectionId}`, "practice");
                    }
                  }}
                />
              </div>
            </TabsContent>
          )}

          {/* SAM AI Tutor (Socratic Dialogue) Tab Content */}
          {(isEnrolled || isTeacher) && (
            <TabsContent
              value="tutor"
              className="space-y-4 min-h-[400px] data-[state=inactive]:hidden"
            >
              <div className="min-h-[350px]">
                <SAMSocraticDialogue
                  topic={section.title}
                  userId={userProgress?.userId || "anonymous"}
                  learningObjective={section.description || `Master the concepts in ${section.title}`}
                  targetBloomsLevel="ANALYZE"
                  onComplete={(performance) => {
                    toast.success(`Great dialogue! Insight rate: ${Math.round(performance.insightRate * 100)}%`);
                    if (performance.avgQuality > 0.7) {
                      markItemComplete(`dialogue_${sectionId}`, "dialogue");
                    }
                  }}
                />
              </div>
            </TabsContent>
          )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}