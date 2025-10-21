"use client";

import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  FileText, 
  MessageCircle,
  Video,
  Code,
  Lightbulb,
  StickyNote,
  GraduationCap,
  Brain,
  Globe,
  Sparkles,
  Shield,
} from "lucide-react";

import { ResourceIntelligenceContent } from "@/components/sam/resource-intelligence-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AdaptiveAssessmentContent } from "./adaptive-assessment-content";
import { ArticleContent } from "./article-content";
import { BlogContent } from "./blog-content";
import { CodeContent } from "./code-content";
import { ExamsContent } from "./exams-content";
import { NotesContent } from "./notes-content";
import { Section } from "./types";
import { VideoContent } from "./video-content";

type ContentSubTab = "videos" | "blogs" | "articles" | "code";
type TabType = "content" | "notes" | "discussion" | "exams" | "adaptive" | "resources";

interface ContentTabsEnhancedProps {
  currentSection: Section;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  courseId: string;
  chapterId: string;
  courseTitle?: string;
  chapterTitle?: string;
}

export const ContentTabsEnhanced = ({
  currentSection,
  activeTab,
  setActiveTab,
  courseId,
  chapterId,
  courseTitle,
  chapterTitle,
}: ContentTabsEnhancedProps): JSX.Element => {
  const [activeContentTab, setActiveContentTab] = useState<ContentSubTab>("videos");

  // Get available content types
  const availableContent = [
    {
      id: "videos",
      label: "Videos",
      icon: Video,
      count: currentSection.videos?.length || 0,
      color: "text-red-500",
      bgColor: "bg-red-50 text-red-700 border-red-200"
    },
    {
      id: "blogs",
      label: "Blogs",
      icon: BookOpen,
      count: currentSection.blogs?.length || 0,
      color: "text-green-500",
      bgColor: "bg-green-50 text-green-700 border-green-200"
    },
    {
      id: "articles",
      label: "Articles",
      icon: FileText,
      count: currentSection.articles?.length || 0,
      color: "text-blue-500",
      bgColor: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      id: "code",
      label: "Code",
      icon: Code,
      count: currentSection.codeExplanations?.length || 0,
      color: "text-purple-500",
      bgColor: "bg-purple-50 text-purple-700 border-purple-200"
    }
  ].filter(item => item.count > 0);

  // Set first available content type as default
  useEffect(() => {
    if (availableContent.length > 0) {
      setActiveContentTab(availableContent[0].id as ContentSubTab);
    }
  }, [availableContent]);

  const tabs = [
    { 
      id: "content", 
      label: "Learning Materials", 
      icon: BookOpen,
      badge: null,
    },
    { 
      id: "resources", 
      label: "AI Resources", 
      icon: Globe,
      badge: (
        <Badge className="ml-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-300 text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          New
        </Badge>
      ),
    },
    { 
      id: "notes", 
      label: "My Notes", 
      icon: StickyNote,
      badge: null,
    },
    { 
      id: "exams", 
      label: "Exams", 
      icon: GraduationCap,
      badge: null,
    },
    { 
      id: "adaptive", 
      label: "Adaptive Assessment", 
      icon: Brain,
      badge: null,
    },
    { 
      id: "discussion", 
      label: "Discussion", 
      icon: MessageCircle,
      badge: null,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/98 dark:bg-slate-900/98 rounded-2xl shadow-lg border border-gray-200/80 dark:border-slate-700/80 overflow-hidden backdrop-blur-sm"
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200/80 dark:border-slate-700/80">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-800"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === "content" && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {availableContent.length > 0 ? (
                <div className="space-y-6">
                  {/* Content Sub-Tabs */}
                  <div className="flex flex-wrap gap-2 border-b border-gray-200/80 dark:border-slate-700/80 pb-4">
                    {availableContent.map((contentType) => (
                      <button
                        key={contentType.id}
                        onClick={() => setActiveContentTab(contentType.id as ContentSubTab)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                          activeContentTab === contentType.id
                            ? `${contentType.bgColor} shadow-sm`
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <contentType.icon className={cn("w-4 h-4", 
                          activeContentTab === contentType.id ? "" : contentType.color
                        )} />
                        {contentType.label}
                        <Badge 
                          variant={activeContentTab === contentType.id ? "default" : "secondary"} 
                          className="h-5 px-1.5 text-xs"
                        >
                          {contentType.count}
                        </Badge>
                      </button>
                    ))}
                  </div>

                  {/* Content Display */}
                  <AnimatePresence mode="wait">
                    {activeContentTab === "videos" && currentSection.videos && currentSection.videos.length > 0 && (
                      <motion.div
                        key="videos"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <VideoContent videos={currentSection.videos.map(item => ({
                          id: item.id,
                          title: item.title,
                          url: '#', // Placeholder URL
                          duration: item.duration,
                          description: '',
                          thumbnail: null,
                          views: 0
                        }))} />
                      </motion.div>
                    )}

                    {activeContentTab === "blogs" && currentSection.blogs && currentSection.blogs.length > 0 && (
                      <motion.div
                        key="blogs"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <BlogContent blogs={currentSection.blogs} />
                      </motion.div>
                    )}

                    {activeContentTab === "articles" && currentSection.articles && currentSection.articles.length > 0 && (
                      <motion.div
                        key="articles"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArticleContent articles={currentSection.articles} />
                      </motion.div>
                    )}

                    {activeContentTab === "code" && currentSection.codeExplanations && currentSection.codeExplanations.length > 0 && (
                      <motion.div
                        key="code"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CodeContent codeExplanations={currentSection.codeExplanations.map(item => ({
                          ...item,
                          title: item.title ?? 'Untitled',
                          description: item.explanation
                        }))} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Content Coming Soon
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Additional learning materials will be added to this section.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "resources" && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                      SAM AI Resource Intelligence
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      Discover high-quality external resources curated by AI to complement your learning. 
                      All resources are verified for quality, relevance, and educational value.
                    </p>
                  </div>
                </div>
              </div>
              
              <ResourceIntelligenceContent
                courseId={courseId}
                chapterId={chapterId}
                sectionId={currentSection.id}
                sectionTitle={currentSection.title}
                courseTitle={courseTitle}
                chapterTitle={chapterTitle}
              />
            </motion.div>
          )}

          {activeTab === "notes" && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <NotesContent notes={currentSection.notes || []} />
            </motion.div>
          )}

          {activeTab === "exams" && (
            <motion.div
              key="exams"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ExamsContent 
                sectionId={currentSection.id}
                courseId={courseId}
                chapterId={chapterId}
              />
            </motion.div>
          )}

          {activeTab === "adaptive" && (
            <motion.div
              key="adaptive"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AdaptiveAssessmentContent 
                sectionId={currentSection.id}
                courseId={courseId}
                chapterId={chapterId}
              />
            </motion.div>
          )}

          {activeTab === "discussion" && (
            <motion.div
              key="discussion"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-12"
            >
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Join the Discussion
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ask questions and collaborate with other learners.
              </p>
              <Button>
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Discussion
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};