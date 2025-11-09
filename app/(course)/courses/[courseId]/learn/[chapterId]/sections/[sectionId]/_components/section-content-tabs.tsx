"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";

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

  // Use external tab state if provided, otherwise use internal
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = externalOnTabChange || setInternalActiveTab;

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

  // Save active tab to localStorage
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem(`section_${sectionId}_tab`, value);

    // Smooth scroll to top of tabs content to prevent jarring jumps
    const tabsElement = document.querySelector('[role="tabpanel"]');
    if (tabsElement) {
      tabsElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
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

  return (
    <Card className="w-full bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Learning Materials</CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Access additional videos, articles, code examples, and resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full scroll-smooth">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm sticky top-[73px] z-30">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>

            {contentCounts.videos > 0 && (
              <TabsTrigger value="videos" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200">
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">Videos</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {contentCounts.videos}
                </Badge>
              </TabsTrigger>
            )}

            {contentCounts.blogs > 0 && (
              <TabsTrigger value="blogs" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Articles</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {contentCounts.blogs}
                </Badge>
              </TabsTrigger>
            )}

            {contentCounts.math > 0 && (
              <TabsTrigger value="math" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Math</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {contentCounts.math}
                </Badge>
              </TabsTrigger>
            )}

            {contentCounts.code > 0 && (
              <TabsTrigger value="code" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200">
                <Code2 className="h-4 w-4" />
                <span className="hidden sm:inline">Code</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {contentCounts.code}
                </Badge>
              </TabsTrigger>
            )}

            {contentCounts.exams > 0 && (
              <TabsTrigger value="exams" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200">
                <FileQuestion className="h-4 w-4" />
                <span className="hidden sm:inline">Exams</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {contentCounts.exams}
                </Badge>
              </TabsTrigger>
            )}

            {contentCounts.resources > 0 && (
              <TabsTrigger value="resources" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Resources</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {contentCounts.resources}
                </Badge>
              </TabsTrigger>
            )}

            {mode === "learning" && userProgress?.progressPercent >= 100 && (
              <TabsTrigger value="certificate" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-amber-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Certificate</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab Content Container with min-height to prevent layout shift */}
          <div className="min-h-[400px] relative">
          {/* Overview Tab */}
          <TabsContent
            value="overview"
            className="space-y-6 animate-in fade-in-50 duration-200 slide-in-from-bottom-2"
            forceMount={activeTab === "overview" ? true : undefined}
            hidden={activeTab !== "overview"}
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

              {/* Quick Tips Section - Matching login page security badge style */}
              <div className="mt-6 p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-200/60 dark:border-slate-700/50">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
                  <AlertCircle className="h-4 w-4 text-[#22c55e] dark:text-[#4ade80]" />
                  Quick Tips
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Use keyboard shortcuts: Space to play/pause, N for next section, P for previous</li>
                  <li>• Track your progress by marking items as complete</li>
                  <li>• Download resources for offline study</li>
                  {mode === "learning" && userProgress?.progressPercent >= 100 && (
                    <li className="text-[#16a34a] dark:text-[#4ade80] font-medium">• Your certificate is available in the Certificate tab!</li>
                  )}
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Videos Tab */}
          {contentCounts.videos > 0 && (
            <TabsContent
              value="videos"
              className="space-y-4 animate-in fade-in-50 duration-200 slide-in-from-bottom-2"
              forceMount={activeTab === "videos" ? true : undefined}
              hidden={activeTab !== "videos"}
            >
              <div className="grid gap-4">
                {section.videos.map((video: any, index: number) => (
                  <Card key={video.id} className={cn(
                    "overflow-hidden transition-all bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] hover:shadow-xl",
                    completedItems.has(video.id) && "border-[#22c55e] dark:border-[#4ade80]"
                  )}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <PlayCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            {video.title || `Video ${index + 1}`}
                          </CardTitle>
                          {video.description && (
                            <CardDescription className="mt-2 text-slate-600 dark:text-slate-400">
                              {video.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {video.duration && (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {Math.floor(video.duration / 60)}m
                            </Badge>
                          )}
                          {completedItems.has(video.id) && (
                            <Badge className="bg-[#22c55e]/10 text-[#16a34a] dark:bg-[#4ade80]/20 dark:text-[#4ade80] border-[#22c55e]/20 dark:border-[#4ade80]/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {video.url && (
                      <CardContent>
                        <SectionYouTubePlayer
                          videoUrl={video.url}
                          sectionId={sectionId}
                          sectionTitle={video.title || section.title}
                          onComplete={() => markItemComplete(video.id, "video")}
                        />
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Blogs/Articles Tab */}
          {contentCounts.blogs > 0 && (
            <TabsContent
              value="blogs"
              className="space-y-4 animate-in fade-in-50 duration-200 slide-in-from-bottom-2"
              forceMount={activeTab === "blogs" ? true : undefined}
              hidden={activeTab !== "blogs"}
            >
              <div className="grid gap-4">
                {section.blogs.map((blog: any) => (
                  <Card key={blog.id} className={cn(
                    "overflow-hidden bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] hover:shadow-xl transition-all",
                    completedItems.has(blog.id) && "border-[#22c55e] dark:border-[#4ade80]"
                  )}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-slate-900 dark:text-white">{blog.title}</CardTitle>
                          {blog.description && (
                            <CardDescription className="mt-2 text-slate-600 dark:text-slate-400">
                              {blog.description}
                            </CardDescription>
                          )}
                        </div>
                        {completedItems.has(blog.id) && (
                          <Badge className="bg-[#22c55e]/10 text-[#16a34a] dark:bg-[#4ade80]/20 dark:text-[#4ade80] border-[#22c55e]/20 dark:border-[#4ade80]/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Read
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <SafeHtmlRenderer
                          html={blog.content}
                          className=""
                        />
                      </div>
                      {blog.url && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          asChild
                        >
                          <Link href={blog.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Read Full Article
                          </Link>
                        </Button>
                      )}
                      {mode === "learning" && !completedItems.has(blog.id) && (
                        <Button
                          variant="secondary"
                          className="mt-4 ml-2"
                          onClick={() => markItemComplete(blog.id, "blog")}
                        >
                          Mark as Read
                        </Button>
                      )}
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
              className="space-y-4 animate-in fade-in-50 duration-200 slide-in-from-bottom-2"
              forceMount={activeTab === "math" ? true : undefined}
              hidden={activeTab !== "math"}
            >
              <div className="grid gap-4">
                {section.mathExplanations.map((math: any) => (
                  <MathLatexRenderer
                    key={math.id}
                    math={math}
                    isCompleted={completedItems.has(math.id)}
                    canMarkComplete={mode === "learning"}
                    onMarkComplete={(id) => markItemComplete(id, "math")}
                  />
                ))}
              </div>
            </TabsContent>
          )}

          {/* Code Explanations Tab */}
          {contentCounts.code > 0 && (
            <TabsContent
              value="code"
              className="space-y-4 animate-in fade-in-50 duration-200 slide-in-from-bottom-2"
              forceMount={activeTab === "code" ? true : undefined}
              hidden={activeTab !== "code"}
            >
              <div className="grid gap-4">
                {section.codeExplanations.map((code: any) => (
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
              className="space-y-4 animate-in fade-in-50 duration-200 slide-in-from-bottom-2"
              forceMount={activeTab === "exams" ? true : undefined}
              hidden={activeTab !== "exams"}
            >
              <div className="grid gap-4">
                {section.exams.map((exam: any) => {
                  // Transform exam data to match the ExamQuizComponent format
                  const formattedExam = {
                    id: exam.id,
                    title: exam.title,
                    description: exam.description,
                    questions: exam.questions || [],
                    passingScore: exam.passingScore,
                    timeLimit: exam.timeLimit,
                    attempts: exam.attempts,
                  };

                  // Show locked state for non-enrolled users
                  if (!isEnrolled && !isTeacher) {
                    return (
                      <Card key={exam.id} className="overflow-hidden bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
                        <CardHeader>
                          <CardTitle className="text-slate-900 dark:text-white">{exam.title}</CardTitle>
                          {exam.description && (
                            <CardDescription className="text-slate-600 dark:text-slate-400">{exam.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col items-center justify-center py-8">
                            <Lock className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-3" />
                            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                              Enroll in this course to take exams
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
              className="space-y-4 animate-in fade-in-50 duration-200 slide-in-from-bottom-2"
              forceMount={activeTab === "resources" ? true : undefined}
              hidden={activeTab !== "resources"}
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
              className="space-y-4 animate-in fade-in-50 duration-200 slide-in-from-bottom-2"
              forceMount={activeTab === "certificate" ? true : undefined}
              hidden={activeTab !== "certificate"}
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
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}